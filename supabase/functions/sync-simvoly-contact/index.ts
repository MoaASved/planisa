// Supabase Edge Function: sync-simvoly-contact
//
// Syftet: Håller Simvoly-CRM:et i synk med Planisas användare.
// - Ny signup (public.users INSERT) -> skapar kontakt i Simvoly
// - Statusändring (public.users UPDATE, subscription_status ändras) -> uppdaterar status-property
// - Språkändring (public.users UPDATE, language_preference ändras) -> uppdaterar language-property
// - Namn satt/ändrat (auth.users UPDATE, display_name ändras i user_metadata) -> uppdaterar namnet
//
// Funktionen hämtar alltid FÄRSKASTE data direkt från källan (public.users
// för status/språk, auth.users-metadata för namn) oavsett vilken av
// händelserna som triggade den. Det gör den robust även om något event
// missas - nästa synk hämtar ändå korrekt nuvarande state.
//
// Status och språk lagras i Simvolys "properties" (custom fields "status" och
// "language" i Simvoly-dashboarden), INTE som taggar. Anledningen: Simvolys
// POST/PUT-kontaktendpoints SLÅR IHOP (merge) tags-arrayen istället för att
// ersätta den - en tagg som togs bort lokalt kom alltså aldrig bort på riktigt,
// den bara låg kvar bredvid den nya. "properties" (keyed by name) ERSÄTTER
// däremot värdet för en given property-name, bekräftat empiriskt mot Simvolys
// API. Gamla "Status: X"- och "lang:x"-taggar tas fortfarande bort från
// preserved (så de slutar dyka upp igen om de redan saknas) men nya sådana
// taggar läggs aldrig till längre - Simvoly kan inte ta bort en tagg som
// redan finns på en kontakt (POST/PUT slår bara ihop/merge:ar tags-arrayen),
// så befintliga dubbletter kräver manuell borttagning i Simvoly-dashboarden.
//
// Bevarar alltid kontaktens befintliga taggar (t.ex. "väntelista") och övriga
// properties utöver status/language.
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
    language_preference?: string;
    raw_user_meta_data?: { display_name?: string };
  };
  old_record?: {
    subscription_status?: string;
    language_preference?: string;
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

const LANGUAGE_TAGS: Record<string, string> = {
  en: "lang:en",
  sv: "lang:sv",
};

const ALL_LANGUAGE_TAG_VALUES = Object.values(LANGUAGE_TAGS);

// Custom fields skapade i Simvoly-dashboarden (Website Settings > Contacts).
// Värdena skickas rakt av (t.ex. "trialing", "sv") - ingen omvandling till
// en läsbar etikett som de gamla taggarna hade.
const STATUS_PROPERTY_NAME = "status";
const LANGUAGE_PROPERTY_NAME = "language";

type ContactProperty = { name: string; value: string };

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
): Promise<{ id: number; tags: string[]; properties: ContactProperty[] } | null> {
  const url = `https://${domain}/api/site/contacts/search-by-email?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, { headers: simvolyHeaders(apiKey) });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Simvoly search-by-email failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return { id: data.id, tags: data.tags ?? [], properties: data.properties ?? [] };
}

// Tar bara bort gamla Planisa-ägda taggar (kontotagg + de utgångna
// status-/lang-taggarna). Lägger ALDRIG till nya status-/lang-taggar -
// de källorna är nu properties (se buildPropertySet), eftersom Simvoly
// slår ihop (merge) tags-arrayen istället för att ersätta den.
function buildTagSet(existingTags: string[]): string[] {
  const preserved = existingTags.filter(
    (t) =>
      t !== PLANISA_ACCOUNT_TAG &&
      !ALL_STATUS_TAG_VALUES.includes(t) &&
      !ALL_LANGUAGE_TAG_VALUES.includes(t),
  );

  return [...preserved, PLANISA_ACCOUNT_TAG];
}

// Till skillnad från tags ERSÄTTER Simvoly värdet för en given property-name
// vid upsert (bekräftat med diagnostiktest), så det här är den korrekta
// platsen att sätta status/språk. Bevarar alla andra properties orörda.
function buildPropertySet(
  existingProperties: ContactProperty[],
  newStatus: string | undefined,
  newLanguage: string | undefined,
): ContactProperty[] {
  const preserved = existingProperties.filter(
    (p) => p.name !== STATUS_PROPERTY_NAME && p.name !== LANGUAGE_PROPERTY_NAME,
  );

  return [
    ...preserved,
    ...(newStatus ? [{ name: STATUS_PROPERTY_NAME, value: newStatus }] : []),
    ...(newLanguage ? [{ name: LANGUAGE_PROPERTY_NAME, value: newLanguage }] : []),
  ];
}

async function upsertSimvolyContact(
  domain: string,
  apiKey: string,
  email: string,
  name: string | undefined,
  status: string | undefined,
  language: string | undefined,
): Promise<void> {
  const existing = await findContactByEmail(domain, apiKey, email);
  const tags = buildTagSet(existing?.tags ?? []);
  const properties = buildPropertySet(existing?.properties ?? [], status, language);

  const body: Record<string, unknown> = { email, tags, properties };
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

  console.log(
    `[simvoly-sync] upserted contact email=${email} name=${name ?? "(none)"} tags=${JSON.stringify(tags)} properties=${JSON.stringify(properties)}`,
  );
}

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

  const publicRes = await fetch(
    `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=email,subscription_status,language_preference`,
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
  const { email, subscription_status, language_preference } = publicRows[0];
  if (!email) {
    console.log(`[simvoly-sync] no email for id=${userId}, skipping`);
    return;
  }

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

  await upsertSimvolyContact(domain, apiKey, email, displayName, subscription_status, language_preference);
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

    if (payload.schema === "public" && payload.table === "users") {
      if (payload.type === "UPDATE") {
        const statusUnchanged =
          payload.old_record?.subscription_status === payload.record.subscription_status;
        const languageUnchanged =
          payload.old_record?.language_preference === payload.record.language_preference;
        if (statusUnchanged && languageUnchanged) {
          return new Response(
            JSON.stringify({ skipped: true, reason: "status and language unchanged" }),
            { status: 200 },
          );
        }
      }
      await syncUserById(userId, domain, apiKey);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

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
