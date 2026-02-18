/**
 * stripe-checkout – create a Stripe Checkout Session for any PTBot product.
 *
 * POST body:
 *   product_type  'plan_onetime' | 'subscription' | 'telehealth_onetime'
 *   success_url   string
 *   cancel_url    string
 *   condition?    string  (pain location – used for plan_onetime scoping)
 *
 * Returns: { sessionId, url }
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  appInfo: { name: 'PTBot', version: '2.0.0' },
});

/** Map product_type → Stripe Price ID from Supabase secrets. */
function priceIdForProduct(productType: string): string {
  const map: Record<string, string | undefined> = {
    plan_onetime:       Deno.env.get('STRIPE_PRICE_PLAN_ONETIME'),
    subscription:       Deno.env.get('STRIPE_PRICE_SUB_MONTHLY'),
    telehealth_onetime: Deno.env.get('STRIPE_PRICE_TELEHEALTH_ONETIME'),
  };
  const id = map[productType];
  if (!id) throw new Error(`No Stripe price configured for product_type="${productType}"`);
  return id;
}

function corsResponse(body: unknown, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
  if (status === 204) return new Response(null, { status, headers });
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse(null, 204);
  if (req.method !== 'POST') return corsResponse({ error: 'Method not allowed' }, 405);

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return corsResponse({ error: 'Missing Authorization header' }, 401);

    const { data: { user }, error: authErr } =
      await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) return corsResponse({ error: 'Unauthorized' }, 401);

    // ── Parse body ────────────────────────────────────────────────────────
    let body: Record<string, string>;
    try { body = await req.json(); }
    catch { return corsResponse({ error: 'Invalid JSON body' }, 400); }

    const { product_type, success_url, cancel_url, condition } = body;

    if (!product_type || !success_url || !cancel_url) {
      return corsResponse({ error: 'Missing required fields: product_type, success_url, cancel_url' }, 400);
    }
    const validTypes = ['plan_onetime', 'subscription', 'telehealth_onetime'];
    if (!validTypes.includes(product_type)) {
      return corsResponse({ error: `Unknown product_type: ${product_type}` }, 400);
    }

    const stripeMode: 'payment' | 'subscription' =
      product_type === 'subscription' ? 'subscription' : 'payment';

    // ── Stripe customer: get or create ────────────────────────────────────
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    let customerId: string;

    if (existingCustomer?.customer_id) {
      customerId = existingCustomer.customer_id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      const { error: insertErr } = await supabase
        .from('stripe_customers')
        .insert({ user_id: user.id, customer_id: newCustomer.id });
      if (insertErr) {
        await stripe.customers.del(newCustomer.id).catch(() => {});
        return corsResponse({ error: 'Failed to persist Stripe customer' }, 500);
      }
      customerId = newCustomer.id;
    }

    // ── Create pending purchase record ────────────────────────────────────
    const purchaseMeta: Record<string, string> = { product_type };
    if (condition) purchaseMeta.condition = condition;

    const { data: purchase, error: purchaseErr } = await supabase
      .from('purchases')
      .insert({
        user_id:      user.id,
        product_type,
        status:       'pending',
        metadata:     purchaseMeta,
      })
      .select('id')
      .single();

    if (purchaseErr || !purchase) {
      console.error('[stripe-checkout] purchase insert:', purchaseErr);
      return corsResponse({ error: 'Failed to create purchase record' }, 500);
    }

    // ── Stripe Checkout Session ───────────────────────────────────────────
    let priceId: string;
    try { priceId = priceIdForProduct(product_type); }
    catch (e: unknown) { return corsResponse({ error: (e as Error).message }, 500); }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: stripeMode,
      success_url,
      cancel_url,
      metadata: {
        user_id:     user.id,
        product_type,
        purchase_id: purchase.id,
        ...(condition ? { condition } : {}),
      },
    });

    // Attach session id to purchase row for idempotency in webhook
    await supabase
      .from('purchases')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', purchase.id);

    console.log(`[stripe-checkout] session=${session.id} product=${product_type} user=${user.id.slice(0, 8)}`);
    return corsResponse({ sessionId: session.id, url: session.url });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[stripe-checkout] Unhandled: ${msg}`);
    return corsResponse({ error: msg }, 500);
  }
});
