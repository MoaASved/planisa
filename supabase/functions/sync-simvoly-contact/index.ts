// Supabase Edge Function: sync-simvoly-contact
//
// Syftet: Håller Simvoly-CRM:et i synk med Planisas användare.
// - Ny signup (public.users INSERT) -> skapar kontakt i Simvoly
// - Statusändring (public.users UPDATE, subscription_status ändras) -> uppdaterar statustagg
// - Namn satt/ändrat (auth.users UPDATE, display_name ändras i user_metadata) -> uppdaterar namnet
//
// Funktionen hämtar alltid FÄRSKASTE data direkt från källan (public.users
// för status, auth.users-metadata för namn) oavsett vilken av de tre
// händelserna som triggade den. Det gör den robust även om något event
// missas - nästa synk hämtar ändå korrekt nuvarande state.
//
// Bevarar alltid kontaktens befintliga taggar (t.ex. "väntelista") - tar
// bara bort gamla Planisa-statustaggar och lägger till den nya.
//
// TRIGGAS AV: Tre Database Webhooks i Supabase (Database > Webhooks):
//   1. INSERT på public.users
//   2. UPDATE på public.users
//   3. UPDATE på auth.users
//
// SECRETS som behövs (sätts med: supabase secrets set NAMN=värde):
//   SIMVOLY_DOMAIN   -> planisa.webbskap.se
//   SIMVOLY_API_KEY  -> din riktiga nyckel från Website Settings > Applications
// (SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY finns redan automatiskt i alla Edge Functions)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  schema: string;
  table: string;
  record: {
    id: string;
    email?: string;
    subscription_status?: string;
    raw_user_meta_data?: { display_name?: string };
  };
  old_record?: {
    subscription_status?: string;
    raw_user_meta_data?: { display_name?: string };
  };
}

const PLANISA_ACCOUNT_TAG = "Planisa Account";

const STATUS_TAGS: Record<string, string> = {
  trialing: "Status: Trialing",
  free: "Status: Free",
  downgraded: "Status: Downgraded",
  active: "Status: Active",
  beta: "Status: Beta",
  lifetime: "Status: Lifetime",
};

const ALL_STATUS_TAG_VALUES = Object.values(STATUS_TAGS);

function simvolyHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "User-Agent": "Planisa/1.0",
  };
}

async function findContactByEmail(
  domain: string,
  apiKey: string,
  email: string,
): Promise<{ id: number; tags: string[] } | null> {
  const url = `https://${domain}/api/site/contacts/search-by-email?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, { headers: simvolyHeaders(apiKey) });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Simvoly search-by-email failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return { id: data.id, tags: data.tags ?? [] };
}

function buildTagSet(existingTags: string[], newStatus: string | undefined): string[] {
  const preserved = existingTags.filter(
    (t) => t !== PLANISA_ACCOUNT_TAG && !ALL_STATUS_TAG_VALUES.includes(t),
  );

  const statusTag = newStatus ? STATUS_TAGS[newStatus] : undefined;

  return [
    ...preserved,
    PLANISA_ACCOUNT_TAG,
    ...(statusTag ? [statusTag] : []),
  ];
}

async function upsertSimvolyContact(
  domain: string,
  apiKey: string,
  email: string,
  name: string | undefined,
  status: string | undefined,
): Promise<void> {
  const existing = await findContactByEmail(domain, apiKey, email);
  const tags = buildTagSet(existing?.tags ?? [], status);

  const body: Record<string, unknown> = { email, tags };
  if (name) body.name = name;

  const url = `https://${domain}/api/site/contacts`;
  const res = await fetch(url, {
    method: "POST", // creates OR updates by email, per Simvoly docs
    headers: simvolyHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Simvoly upsert contact failed: ${res.status} ${errBody}`);
  }

  console.log(`[simvoly-sync] upserted contact email=${email} name=${name ?? "(none)"} tags=${JSON.stringify(tags)}`);
}

// Hämtar nuvarande status från public.users och nuvarande namn från
// auth.users-metadata, oavsett vilken tabell som triggade synken.
async function syncUserById(
  userId: string,
  domain: string,
  apiKey: string,
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const restHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  // 1. Hämta email + subscription_status från public.users
  const publicRes = await fetch(
    `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=email,subscription_status`,
    { headers: restHeaders },
  );
  if (!publicRes.ok) {
    throw new Error(`Failed to fetch public.users row: ${publicRes.status}`);
  }
  const publicRows = await publicRes.json();
  if (!Array.isArray(publicRows) || publicRows.length === 0) {
    console.log(`[simvoly-sync] no public.users row for id=${userId}, skipping`);
    return;
  }
  const { email, subscription_status } = publicRows[0];
  if (!email) {
    console.log(`[simvoly-sync] no email for id=${userId}, skipping`);
    return;
  }

  // 2. Hämta display_name från auth.users-metadata (admin API)
  let displayName: string | undefined;
  const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    headers: restHeaders,
  });
  if (authRes.ok) {
    const authUser = await authRes.json();
    displayName = authUser?.user_metadata?.display_name;
  } else {
    console.log(`[simvoly-sync] could not fetch auth user for id=${userId} (status ${authRes.status})`);
  }

  await upsertSimvolyContact(domain, apiKey, email, displayName, subscription_status);
}

serve(async (req) => {
  try {
    const domain = Deno.env.get("SIMVOLY_DOMAIN");
    const apiKey = Deno.env.get("SIMVOLY_API_KEY");

    if (!domain || !apiKey) {
      throw new Error("SIMVOLY_DOMAIN eller SIMVOLY_API_KEY saknas som secret");
    }

    const payload: WebhookPayload = await req.json();

    if (payload.type !== "INSERT" && payload.type !== "UPDATE") {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const userId = payload.record.id;
    if (!userId) {
      return new Response(JSON.stringify({ skipped: true, reason: "no id" }), { status: 200 });
    }

    // public.users: INSERT (ny signup) alltid relevant.
    // public.users: UPDATE bara relevant om subscription_status faktiskt ändrades.
    if (payload.schema === "public" && payload.table === "users") {
      if (payload.type === "UPDATE") {
        const oldStatus = payload.old_record?.subscription_status;
        if (oldStatus === payload.record.subscription_status) {
          return new Response(
            JSON.stringify({ skipped: true, reason: "status unchanged" }),
            { status: 200 },
          );
        }
      }
      await syncUserById(userId, domain, apiKey);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // auth.users: bara relevant om display_name faktiskt ändrades.
    if (payload.schema === "auth" && payload.table === "users" && payload.type === "UPDATE") {
      const oldName = payload.old_record?.raw_user_meta_data?.display_name;
      const newName = payload.record?.raw_user_meta_data?.display_name;
      if (oldName === newName) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "name unchanged" }),
          { status: 200 },
        );
      }
      await syncUserById(userId, domain, apiKey);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ skipped: true, reason: "unhandled table" }), { status: 200 });
  } catch (err) {
    console.error("[simvoly-sync] error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
