// Supabase Edge Function: sync-simvoly-contact
//
// Syftet: Håller Simvoly-CRM:et i synk med Planisas användare.
// - Ny signup -> skapar/uppdaterar kontakt i Simvoly, sätter "Planisa-konto"-tagg + statustagg
// - Statusändring (trial -> free, active -> downgraded, etc.) -> uppdaterar statustaggen
//
// Bevarar alltid kontaktens befintliga taggar (t.ex. "väntelista") - tar bara bort
// gamla Planisa-statustaggar och lägger till den nya.
//
// TRIGGAS AV: Två Database Webhooks i Supabase (Database > Webhooks):
//   1. INSERT på public.users
//   2. UPDATE på public.users (när subscription_status ändras)
//
// SECRETS som behövs (sätts med: supabase secrets set NAMN=värde):
//   SIMVOLY_DOMAIN   -> planisa.webbskap.se
//   SIMVOLY_API_KEY  -> din riktiga nyckel från Website Settings > Applications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    id: string;
    email?: string;
    name?: string;
    subscription_status?: string;
  };
  old_record?: {
    subscription_status?: string;
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
    method: "POST",
    headers: simvolyHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Simvoly upsert contact failed: ${res.status} ${errBody}`);
  }

  console.log(`[simvoly-sync] upserted contact email=${email} tags=${JSON.stringify(tags)}`);
}

async function runBackfill(domain: string, apiKey: string): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const listUrl = `${supabaseUrl}/rest/v1/users?select=id,email,subscription_status`;
  const res = await fetch(listUrl, {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to list users: ${res.status} ${body}`);
  }

  const users: Array<{ id: string; email?: string; subscription_status?: string }> =
    await res.json();

  const results: Array<{ email: string; status: "ok" | "error"; detail?: string }> = [];

  for (const user of users) {
    if (!user.email) continue;
    try {
      await upsertSimvolyContact(domain, apiKey, user.email, undefined, user.subscription_status);
      results.push({ email: user.email, status: "ok" });
    } catch (err) {
      results.push({ email: user.email, status: "error", detail: String(err) });
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return new Response(
    JSON.stringify({ totalUsers: users.length, synced: okCount, failed: errorCount, results }, null, 2),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

serve(async (req) => {
  try {
    const domain = Deno.env.get("SIMVOLY_DOMAIN");
    const apiKey = Deno.env.get("SIMVOLY_API_KEY");

    if (!domain || !apiKey) {
      throw new Error("SIMVOLY_DOMAIN eller SIMVOLY_API_KEY saknas som secret");
    }

    // GET = manuell engångs-backfill, skyddad av ett hemligt nyckel-värde
    // i URL:en (?key=...) som måste matcha BACKFILL_SECRET. Utan rätt
    // nyckel exponeras ingen användardata.
    if (req.method === "GET") {
      const backfillSecret = Deno.env.get("BACKFILL_SECRET");
      const providedKey = new URL(req.url).searchParams.get("key");

      if (!backfillSecret || providedKey !== backfillSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      return await runBackfill(domain, apiKey);
    }

    const payload: WebhookPayload = await req.json();

    if (payload.type !== "INSERT" && payload.type !== "UPDATE") {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const { email, name, subscription_status } = payload.record;

    if (!email) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "no email on record" }),
        { status: 200 },
      );
    }

    if (payload.type === "UPDATE") {
      const oldStatus = payload.old_record?.subscription_status;
      if (oldStatus === subscription_status) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "status unchanged" }),
          { status: 200 },
        );
      }
    }

    await upsertSimvolyContact(domain, apiKey, email, name, subscription_status);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("[simvoly-sync] error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
