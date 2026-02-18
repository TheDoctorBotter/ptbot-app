/**
 * Stripe product configuration for PTBot freemium model.
 *
 * Price IDs are read from environment variables so they can differ
 * between test and live Stripe accounts without code changes.
 *
 * Set these in your .env / Supabase secrets:
 *   STRIPE_PRICE_PLAN_ONETIME       – one-time "Full Exercise Plan"
 *   STRIPE_PRICE_SUB_MONTHLY        – monthly "PTBot Membership" subscription
 *   STRIPE_PRICE_TELEHEALTH_ONETIME – one-time "Telehealth Consult"
 *
 * The edge functions read STRIPE_PRICE_* from Deno.env.
 * The client only needs the human-readable metadata below.
 */

export type ProductType = 'plan_onetime' | 'subscription' | 'telehealth_onetime';

export interface PtbotProduct {
  type: ProductType;
  name: string;
  tagline: string;
  price: string;          // display string, e.g. "$49" or "$29/mo"
  mode: 'payment' | 'subscription';
  features: string[];
  ctaLabel: string;
  highlightColor: string;
}

export const PTBOT_PRODUCTS: Record<ProductType, PtbotProduct> = {
  plan_onetime: {
    type: 'plan_onetime',
    name: 'Full Exercise Plan',
    tagline: 'Unlock your complete personalised plan',
    price: '$2.99',
    mode: 'payment',
    features: [
      'All exercises for your condition',
      'Video demonstrations for every exercise',
      'Dosage, safety notes & progression tips',
      'Export your plan as a PDF',
    ],
    ctaLabel: 'Unlock Full Plan',
    highlightColor: '#2563EB',
  },

  subscription: {
    type: 'subscription',
    name: 'PTBot Membership',
    tagline: 'Unlimited access to everything',
    price: '$30/mo',
    mode: 'subscription',
    features: [
      'Unlimited AI chat & assessments',
      'Full exercise plans for any condition',
      'PDF export for all plans',
      'All exercise videos',
      '1 telehealth consult credit per month',
    ],
    ctaLabel: 'Become a Member',
    highlightColor: '#7C3AED',
  },

  telehealth_onetime: {
    type: 'telehealth_onetime',
    name: 'Telehealth Consult',
    tagline: 'One-on-one video session with Dr. Lemmo',
    price: '$75',
    mode: 'payment',
    features: [
      '30-minute video consultation',
      'Personalised treatment review',
      'Exercise form & technique guidance',
      'Written session summary',
    ],
    ctaLabel: 'Book a Consult',
    highlightColor: '#059669',
  },
};

/** Entitlement keys granted per product type (mirrors the webhook logic). */
export const ENTITLEMENT_KEYS = {
  FULL_PLAN_ACCESS: 'full_plan_access',
  UNLIMITED_BOT: 'unlimited_bot',
  UNLIMITED_ASSESSMENTS: 'unlimited_assessments',
  UNLIMITED_PLANS: 'unlimited_plans',
  PDF_EXPORT: 'pdf_export',
  ALL_VIDEOS: 'all_videos',
} as const;

export type EntitlementKey = typeof ENTITLEMENT_KEYS[keyof typeof ENTITLEMENT_KEYS];

/** Number of free exercises shown before the paywall. */
export const FREE_EXERCISE_PREVIEW_COUNT = 2;
