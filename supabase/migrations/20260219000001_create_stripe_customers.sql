-- =============================================================================
-- stripe_customers
-- Maps Supabase users to their Stripe Customer IDs.
-- Written by the stripe-checkout edge function (service role); read by edge
-- functions only.  Soft-delete via deleted_at so the FK is preserved.
-- =============================================================================

CREATE TABLE IF NOT EXISTS stripe_customers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT        NOT NULL UNIQUE,          -- Stripe cus_xxx
  deleted_at  TIMESTAMPTZ,                          -- NULL = active
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id     ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_customer_id ON stripe_customers(customer_id);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- Users can read their own record (handy for debugging in Studio)
CREATE POLICY "stripe_customers: users read own"
  ON stripe_customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only service role (edge functions) may INSERT / UPDATE / DELETE
-- (absence of policy = deny for non-service-role callers)
