/**
 * stripe-webhook – receive Stripe events and update purchases + entitlements.
 *
 * Events handled:
 *   checkout.session.completed  → activate purchase, grant entitlements
 *   invoice.paid                → renew subscription credit each billing period
 *   customer.subscription.updated  → reflect plan changes
 *   customer.subscription.deleted  → revoke subscription entitlements
 *
 * Idempotency: all upserts key on stripe_checkout_session_id / subscription_id
 * so replayed webhooks are safe.
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  appInfo: { name: 'PTBot', version: '2.0.0' },
});
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('Missing stripe-signature', { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[stripe-webhook] Signature verification failed: ${msg}`);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  EdgeRuntime.waitUntil(handleEvent(event));
  return Response.json({ received: true });
});

// ---------------------------------------------------------------------------
// Event dispatcher
// ---------------------------------------------------------------------------
async function handleEvent(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.paid':
        await onInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await onSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`[stripe-webhook] Ignored event: ${event.type}`);
    }
  } catch (err: unknown) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err);
  }
}

// ---------------------------------------------------------------------------
// checkout.session.completed
// ---------------------------------------------------------------------------
async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { id: sessionId, metadata, mode, payment_status, amount_total, currency } = session;

  if (payment_status !== 'paid' && mode !== 'subscription') {
    console.log(`[stripe-webhook] Session ${sessionId} not paid yet, skipping`);
    return;
  }

  const userId      = metadata?.user_id;
  const productType = metadata?.product_type as string | undefined;
  const purchaseId  = metadata?.purchase_id;
  const condition   = metadata?.condition;

  if (!userId || !productType) {
    console.error(`[stripe-webhook] Missing metadata on session ${sessionId}`);
    return;
  }

  // Idempotency: check if we already processed this session
  const { data: existing } = await supabase
    .from('purchases')
    .select('id, status')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();

  if (existing?.status === 'active') {
    console.log(`[stripe-webhook] Session ${sessionId} already processed`);
    return;
  }

  // Update or create the purchase record
  if (purchaseId) {
    await supabase
      .from('purchases')
      .update({
        status:                   'active',
        stripe_checkout_session_id: sessionId,
        stripe_payment_intent_id:  typeof session.payment_intent === 'string'
                                     ? session.payment_intent : undefined,
        stripe_subscription_id:    typeof session.subscription === 'string'
                                     ? session.subscription : undefined,
        amount_cents:              amount_total ?? undefined,
        currency:                  currency ?? undefined,
      })
      .eq('id', purchaseId);
  } else {
    // Fallback: create from webhook data (e.g. session created outside our flow)
    await supabase.from('purchases').insert({
      user_id:                   userId,
      product_type:              productType,
      status:                    'active',
      stripe_checkout_session_id: sessionId,
      stripe_payment_intent_id:  typeof session.payment_intent === 'string'
                                   ? session.payment_intent : undefined,
      stripe_subscription_id:    typeof session.subscription === 'string'
                                   ? session.subscription : undefined,
      amount_cents:              amount_total ?? undefined,
      currency:                  currency ?? undefined,
      metadata:                  { product_type: productType, ...(condition ? { condition } : {}) },
    });
  }

  // Grant entitlements based on product type
  const resolvedPurchaseId = purchaseId ?? (await getPurchaseIdBySession(sessionId));

  switch (productType) {
    case 'plan_onetime':
      await grantPlanOnetimeEntitlements(userId, resolvedPurchaseId, condition);
      break;
    case 'subscription':
      await grantSubscriptionEntitlements(userId, resolvedPurchaseId);
      await grantMonthlyTelehealthCredit(userId, resolvedPurchaseId, session.subscription as string | null);
      break;
    case 'telehealth_onetime':
      await grantTelehealthOnetimeCredit(userId, resolvedPurchaseId);
      break;
    default:
      console.warn(`[stripe-webhook] Unknown product_type: ${productType}`);
  }

  console.log(`[stripe-webhook] Processed ${productType} for user ${userId.slice(0, 8)}`);
}

// ---------------------------------------------------------------------------
// invoice.paid  (subscription renewals → fresh monthly telehealth credit)
// ---------------------------------------------------------------------------
async function onInvoicePaid(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== 'subscription_cycle') return;

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const userId = await userIdFromCustomer(customerId);
  if (!userId) return;

  // Locate the active subscription purchase
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription : (invoice.subscription as Stripe.Subscription)?.id;

  const { data: purchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .eq('status', 'active')
    .maybeSingle();

  // Extend subscription entitlements valid_to to new period end
  const periodEnd = invoice.lines?.data?.[0]?.period?.end;
  if (periodEnd) {
    await supabase
      .from('entitlements')
      .update({ valid_to: new Date(periodEnd * 1000).toISOString() })
      .eq('user_id', userId)
      .in('entitlement_key', [
        'unlimited_bot', 'unlimited_assessments', 'unlimited_plans',
        'pdf_export', 'all_videos',
      ])
      .is('valid_to', null); // only update entitlements that have no expiry yet

    // Add a fresh monthly telehealth credit (idempotent on subscription_id + period)
    await grantMonthlyTelehealthCredit(userId, purchase?.id ?? null, subscriptionId ?? null, {
      periodStart: invoice.lines?.data?.[0]?.period?.start,
      periodEnd,
    });
  }

  console.log(`[stripe-webhook] Renewed subscription for user ${userId.slice(0, 8)}`);
}

// ---------------------------------------------------------------------------
// customer.subscription.updated
// ---------------------------------------------------------------------------
async function onSubscriptionUpdated(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const userId = await userIdFromCustomer(customerId);
  if (!userId) return;

  if (sub.status === 'active' || sub.status === 'trialing') {
    // Ensure entitlements exist (re-grant if somehow missing)
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('stripe_subscription_id', sub.id)
      .maybeSingle();
    await grantSubscriptionEntitlements(userId, purchase?.id ?? null);
  } else if (sub.status === 'canceled' || sub.status === 'unpaid') {
    await revokeSubscriptionEntitlements(userId);
  }
}

// ---------------------------------------------------------------------------
// customer.subscription.deleted  (hard cancel)
// ---------------------------------------------------------------------------
async function onSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const userId = await userIdFromCustomer(customerId);
  if (!userId) return;

  await revokeSubscriptionEntitlements(userId);

  await supabase
    .from('purchases')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', sub.id);

  console.log(`[stripe-webhook] Subscription canceled for user ${userId.slice(0, 8)}`);
}

// ---------------------------------------------------------------------------
// Entitlement helpers
// ---------------------------------------------------------------------------

async function grantPlanOnetimeEntitlements(
  userId: string,
  purchaseId: string | null,
  condition?: string
) {
  const scope = condition ? { condition } : {};
  // Idempotent upsert: if user already has full_plan_access for this condition, skip
  const { data: existing } = await supabase
    .from('entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('entitlement_key', 'full_plan_access')
    .eq('scope_json', JSON.stringify(scope))
    .eq('active', true)
    .maybeSingle();

  if (!existing) {
    await supabase.from('entitlements').insert({
      user_id:           userId,
      entitlement_key:   'full_plan_access',
      scope_json:        scope,
      source_purchase_id: purchaseId,
    });
    // Also grant pdf_export scoped to same condition
    await supabase.from('entitlements').insert({
      user_id:           userId,
      entitlement_key:   'pdf_export',
      scope_json:        scope,
      source_purchase_id: purchaseId,
    });
  }
}

const SUBSCRIPTION_ENTITLEMENT_KEYS = [
  'unlimited_bot',
  'unlimited_assessments',
  'unlimited_plans',
  'pdf_export',
  'all_videos',
];

async function grantSubscriptionEntitlements(userId: string, purchaseId: string | null) {
  for (const key of SUBSCRIPTION_ENTITLEMENT_KEYS) {
    const { data: existing } = await supabase
      .from('entitlements')
      .select('id')
      .eq('user_id', userId)
      .eq('entitlement_key', key)
      .eq('active', true)
      .maybeSingle();

    if (!existing) {
      await supabase.from('entitlements').insert({
        user_id:           userId,
        entitlement_key:   key,
        scope_json:        {},
        source_purchase_id: purchaseId,
      });
    }
  }
}

async function revokeSubscriptionEntitlements(userId: string) {
  await supabase
    .from('entitlements')
    .update({ active: false })
    .eq('user_id', userId)
    .in('entitlement_key', SUBSCRIPTION_ENTITLEMENT_KEYS);
}

async function grantMonthlyTelehealthCredit(
  userId: string,
  purchaseId: string | null,
  subscriptionId: string | null,
  period?: { periodStart?: number; periodEnd?: number }
) {
  // Idempotency: one credit per billing period (keyed on subscription + period_start)
  const periodStart = period?.periodStart
    ? new Date(period.periodStart * 1000).toISOString()
    : new Date().toISOString();
  const periodEnd = period?.periodEnd
    ? new Date(period.periodEnd * 1000).toISOString()
    : null;

  const { data: existing } = await supabase
    .from('telehealth_credits')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'subscription')
    .eq('period_start', periodStart)
    .maybeSingle();

  if (!existing) {
    await supabase.from('telehealth_credits').insert({
      user_id:     userId,
      source:      'subscription',
      purchase_id: purchaseId,
      quantity:    1,
      period_start: periodStart,
      period_end:   periodEnd,
    });
  }
}

async function grantTelehealthOnetimeCredit(userId: string, purchaseId: string | null) {
  // One credit per purchase — idempotent on purchase_id
  const { data: existing } = await supabase
    .from('telehealth_credits')
    .select('id')
    .eq('purchase_id', purchaseId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('telehealth_credits').insert({
      user_id:     userId,
      source:      'one_time',
      purchase_id: purchaseId,
      quantity:    1,
    });
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

async function userIdFromCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function getPurchaseIdBySession(sessionId: string): Promise<string | null> {
  const { data } = await supabase
    .from('purchases')
    .select('id')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();
  return data?.id ?? null;
}
