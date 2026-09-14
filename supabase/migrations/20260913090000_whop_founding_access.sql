-- ============================================================================
-- Whop founding access: purchase recording, launch control, idempotency.
--
-- Founding customers pay through the separate founding presale (Whop).
-- Payment is recorded immediately, but the 365-day ChartFusionX access
-- window starts ONLY when an admin activates founding access.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Founding purchases. One row per Whop payment (unique payment id).
--    access_status: pending | active | refunded
--    Before launch: pending with access_start / access_end NULL.
-- ---------------------------------------------------------------------------
CREATE TABLE public.founding_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  whop_payment_id text NOT NULL UNIQUE,
  whop_event_id text NOT NULL,
  whop_plan_id text NOT NULL,
  whop_membership_id text,
  whop_product_id text,
  whop_product_title text,
  whop_user_id text,
  plan_name text NOT NULL CHECK (plan_name IN ('Pro', 'Max')),
  amount_cents integer,
  currency text NOT NULL DEFAULT 'USD',
  paid_at timestamptz NOT NULL,
  access_status text NOT NULL DEFAULT 'pending'
    CHECK (access_status IN ('pending', 'active', 'refunded')),
  access_start timestamptz,
  access_end timestamptz,
  activated_at timestamptz,
  refunded_at timestamptz,
  refund_whop_refund_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- A payment can only ever produce one entitlement (belt-and-braces on top of
-- the unique payment id): an entitlement id can be reused by later events for
-- the same payment, but two events for DIFFERENT payments must not merge.
CREATE UNIQUE INDEX idx_founding_entitlements_payment
  ON public.founding_entitlements (whop_payment_id);
CREATE INDEX idx_founding_entitlements_email
  ON public.founding_entitlements (lower(customer_email));
CREATE INDEX idx_founding_entitlements_status
  ON public.founding_entitlements (access_status)
  WHERE access_status = 'pending';

-- Webhook-only writes (service role); signed-in users may read their own rows
-- so the UI can show founding status without leaking anyone else's.
GRANT SELECT, INSERT, UPDATE ON public.founding_entitlements TO service_role;
GRANT SELECT ON public.founding_entitlements TO authenticated;
ALTER TABLE public.founding_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own founding entitlement"
  ON public.founding_entitlements FOR SELECT
  TO authenticated
  USING (lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE POLICY "Service role manages founding entitlements"
  ON public.founding_entitlements FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_founding_entitlements_updated_at
  BEFORE UPDATE ON public.founding_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 2. Launch control. Admin-only writes through the server function below.
--    The launch date is intentionally NULL until configured; never hard-code.
-- ---------------------------------------------------------------------------
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO service_role;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
-- No policy for authenticated: launch settings are server-only.

INSERT INTO public.app_settings (key, value)
VALUES
  ('founding_access_launched', 'false'::jsonb),
  ('founding_access_start_date', 'null'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 3. Webhook event log. Delivery-level idempotency: one row per Whop
--    webhook-id; duplicates are detected before any processing.
-- ---------------------------------------------------------------------------
CREATE TABLE public.whop_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  status text NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'ignored')),
  detail text
);

GRANT ALL ON public.whop_webhook_events TO service_role;
ALTER TABLE public.whop_webhook_events ENABLE ROW LEVEL SECURITY;
-- No authenticated policy: delivery log is server-only.

-- ---------------------------------------------------------------------------
-- 4. Activation. Called by the admin server function once launch is set.
--    Atomic + idempotent: pending -> active exactly once, per-purchase plan,
--    access window = launch date .. launch date + 365 days. Rows that are
--    already active or refunded are never touched.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_founding_entitlements(_launch_at timestamptz)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.founding_entitlements
  SET access_status = 'active',
      access_start = _launch_at,
      access_end = _launch_at + INTERVAL '365 days',
      activated_at = now()
  WHERE access_status = 'pending';

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Refund (SQL side). Marks pending/active rows refunded. Refund of a
--    PENDING purchase keeps access_start/end NULL forever; refund of an
--    ACTIVE purchase clears the window so it can never reactivate.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refund_founding_entitlements(
  _payment_id text,
  _refund_id text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.founding_entitlements
  SET access_status = 'refunded',
      access_start = NULL,
      access_end = NULL,
      refunded_at = now(),
      refund_whop_refund_id = _refund_id
  WHERE whop_payment_id = _payment_id
    AND access_status IN ('pending', 'active');

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_founding_entitlements(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_founding_entitlements(text, text) TO service_role;
REVOKE ALL ON FUNCTION public.activate_founding_entitlements(timestamptz) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_founding_entitlements(text, text) FROM public, anon, authenticated;
