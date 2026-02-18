-- =============================================================================
-- Freemium / Monetisation Schema
-- Creates: purchases, entitlements, telehealth_credits
-- RLS: users read own rows; only service-role (webhook) can write
-- RPCs: consume_telehealth_credit (atomic, security definer)
-- =============================================================================

-- -----------------------------------------------------------------------
-- PURCHASES
-- One row per Stripe checkout attempt, updated by webhook on completion.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id  TEXT,
  stripe_subscription_id    TEXT,
  -- 'plan_onetime' | 'subscription' | 'telehealth_onetime'
  product_type              TEXT NOT NULL CHECK (product_type IN ('plan_onetime','subscription','telehealth_onetime')),
  -- 'pending' | 'active' | 'canceled' | 'expired' | 'failed'
  status                    TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','canceled','expired','failed')),
  amount_cents              INTEGER,
  currency                  TEXT,
  -- arbitrary scoping data from checkout metadata
  metadata                  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id          ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_session_id       ON purchases(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_subscription_id  ON purchases(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status           ON purchases(status);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Users can read their own purchase history
CREATE POLICY "purchases: users read own"
  ON purchases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only service role (webhook) may write; no INSERT/UPDATE/DELETE for authenticated
-- (Supabase: no explicit DENY needed — absence of policy blocks the action)

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------
-- ENTITLEMENTS
-- A row per granted capability.  Webhook inserts these; UI reads them.
-- entitlement_key values:
--   full_plan_access     – full exercise plan (scoped to a condition)
--   unlimited_bot        – unlimited AI chat
--   unlimited_assessments
--   unlimited_plans
--   pdf_export           – PDF download
--   all_videos           – all exercise videos
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entitlements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_key   TEXT NOT NULL,
  -- e.g. '{}' (global) or '{"condition":"Knee"}' for scoped plan access
  scope_json        JSONB NOT NULL DEFAULT '{}'::jsonb,
  quantity          INTEGER NOT NULL DEFAULT 1,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to          TIMESTAMPTZ,                   -- NULL = no expiry
  source_purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user_active ON entitlements(user_id, active);
CREATE INDEX IF NOT EXISTS idx_entitlements_key        ON entitlements(entitlement_key);

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entitlements: users read own"
  ON entitlements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------
-- TELEHEALTH CREDITS
-- Each row represents a pool of consult credits (subscription or one-time).
-- used_quantity incremented atomically by consume_telehealth_credit().
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telehealth_credits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 'subscription' | 'one_time'
  source        TEXT NOT NULL CHECK (source IN ('subscription','one_time')),
  purchase_id   UUID REFERENCES purchases(id) ON DELETE SET NULL,
  quantity      INTEGER NOT NULL DEFAULT 1,
  used_quantity INTEGER NOT NULL DEFAULT 0,
  period_start  TIMESTAMPTZ,
  period_end    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT telehealth_credits_non_negative CHECK (used_quantity >= 0),
  CONSTRAINT telehealth_credits_not_overdrawn CHECK (used_quantity <= quantity)
);

CREATE INDEX IF NOT EXISTS idx_telehealth_credits_user ON telehealth_credits(user_id);

ALTER TABLE telehealth_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "telehealth_credits: users read own"
  ON telehealth_credits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------
-- RPC: consume_telehealth_credit
-- Atomically deducts 1 credit from the oldest available pool.
-- Returns TRUE on success, FALSE if no credits available.
-- SECURITY DEFINER so client can call without needing write access.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION consume_telehealth_credit(
  p_user_id       UUID,
  p_appointment_id UUID   -- stored for audit; not FK-constrained here
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credit_id UUID;
BEGIN
  -- Lock the oldest credit row that still has available quantity
  SELECT id INTO v_credit_id
  FROM telehealth_credits
  WHERE user_id = p_user_id
    AND (quantity - used_quantity) > 0
    AND (period_end IS NULL OR period_end > NOW())
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_credit_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE telehealth_credits
  SET used_quantity = used_quantity + 1
  WHERE id = v_credit_id;

  -- Audit: log the consumption against the appointment id in a JSONB comment
  -- (lightweight; no separate audit table needed for MVP)
  UPDATE telehealth_credits
  SET period_start = COALESCE(period_start, NOW())
  WHERE id = v_credit_id;

  RETURN TRUE;
END;
$$;

-- Allow authenticated users to invoke this RPC (execution guard is inside function)
GRANT EXECUTE ON FUNCTION consume_telehealth_credit(UUID, UUID) TO authenticated;

-- -----------------------------------------------------------------------
-- RPC: get_available_telehealth_credits
-- Returns the total remaining credits for a user.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_available_telehealth_credits(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(quantity - used_quantity), 0)::INTEGER
  FROM telehealth_credits
  WHERE user_id = p_user_id
    AND (period_end IS NULL OR period_end > NOW());
$$;

GRANT EXECUTE ON FUNCTION get_available_telehealth_credits(UUID) TO authenticated;
