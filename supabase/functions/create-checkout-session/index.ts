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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, userId } = await req.json();

    if (!plan || !userId) {
      return new Response(JSON.stringify({ error: 'plan and userId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve price ID from Supabase Secrets — never trust client-supplied price IDs
    const priceId = plan === 'yearly'
      ? Deno.env.get('STRIPE_PRICE_YEARLY')
      : Deno.env.get('STRIPE_PRICE_MONTHLY');

    if (!priceId) {
      console.error(`[create-checkout-session] No price secret configured for plan: ${plan}`);
      return new Response(JSON.stringify({ error: `No price configured for plan: ${plan}. Set STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY in Supabase Secrets.` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[create-checkout-session] plan=${plan} priceId=${priceId} userId=${userId}`);

    // Fetch user from public.users
    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(userId)}&select=id,email,stripe_customer_id,trial_start_date,trial_ends_at`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      },
    );
    const users = await userRes.json();
    const user = users[0];

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let customerId: string = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;

      await fetch(
        `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ stripe_customer_id: customerId }),
        },
      );
    }

    // Calculate trial end — use trial_ends_at if set, otherwise trial_start_date + 14 days
    const trialEndDate = user.trial_ends_at
      ? new Date(user.trial_ends_at)
      : new Date(new Date(user.trial_start_date).getTime() + 14 * 24 * 60 * 60 * 1000);
    const trialStillActive = trialEndDate.getTime() > Date.now();

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: 'https://my.planisa.app/upgrade-success',
      cancel_url: 'https://my.planisa.app/',
      ...(trialStillActive && {
        subscription_data: {
          trial_end: Math.floor(trialEndDate.getTime() / 1000),
        },
      }),
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[create-checkout-session] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
