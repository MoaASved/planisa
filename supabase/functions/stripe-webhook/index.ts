import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function updateUserStatus(customerId: string, status: string): Promise<void> {
  console.log(`[webhook] updateUserStatus — customer=${customerId} status=${status}`);

  // First verify the user exists with this customer ID
  const lookupUrl = `${supabaseUrl}/rest/v1/users?stripe_customer_id=eq.${encodeURIComponent(customerId)}&select=id,email,subscription_status`;
  console.log(`[webhook] looking up user at: ${lookupUrl}`);

  const lookupRes = await fetch(lookupUrl, {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
  });
  const lookupBody = await lookupRes.json();
  console.log(`[webhook] lookup response status=${lookupRes.status}`, JSON.stringify(lookupBody));

  if (!Array.isArray(lookupBody) || lookupBody.length === 0) {
    console.error(`[webhook] no user found for stripe_customer_id=${customerId}`);
    return;
  }

  const user = lookupBody[0];
  console.log(`[webhook] found user id=${user.id} email=${user.email} current_status=${user.subscription_status}`);

  const patchUrl = `${supabaseUrl}/rest/v1/users?stripe_customer_id=eq.${encodeURIComponent(customerId)}`;
  const patchRes = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ subscription_status: status }),
  });
  const patchBody = await patchRes.json();
  console.log(`[webhook] PATCH response status=${patchRes.status}`, JSON.stringify(patchBody));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let body: string;
  try {
    body = await req.text();
  } catch (err) {
    console.error('[webhook] failed to read request body', err);
    return new Response(JSON.stringify({ error: 'Could not read body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let event: Stripe.Event;
  try {
    // Signature verification skipped — add STRIPE_WEBHOOK_SECRET and verify here when ready
    event = JSON.parse(body) as Stripe.Event;
    console.log(`[webhook] received event type=${event.type} id=${event.id}`);
  } catch (err) {
    console.error('[webhook] failed to parse event body', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // Most reliable signal: payment confirmed at checkout
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[webhook] checkout.session.completed — customer=${session.customer} payment_status=${session.payment_status}`);
        if (session.customer && session.payment_status === 'paid') {
          await updateUserStatus(session.customer as string, 'active');
        } else {
          console.log(`[webhook] skipping — payment_status is not 'paid': ${session.payment_status}`);
        }
        break;
      }
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[webhook] customer.subscription.created — customer=${sub.customer} sub_status=${sub.status}`);
        if (sub.status === 'active') {
          await updateUserStatus(sub.customer as string, 'active');
        } else {
          console.log(`[webhook] skipping — sub.status is not 'active': ${sub.status}`);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const newStatus = sub.status === 'active' ? 'active' : 'expired';
        console.log(`[webhook] customer.subscription.updated — customer=${sub.customer} sub_status=${sub.status} → app_status=${newStatus}`);
        await updateUserStatus(sub.customer as string, newStatus);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        console.log(`[webhook] customer.subscription.deleted — customer=${sub.customer}`);
        await updateUserStatus(sub.customer as string, 'expired');
        break;
      }
      default:
        console.log(`[webhook] unhandled event type=${event.type} — ignoring`);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[webhook] unhandled error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
