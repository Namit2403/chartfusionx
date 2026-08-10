-- 1. Missing grants on subscriptions (critical: without these the app cannot read plans
-- and the webhook cannot write them).
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 2. Payment history (real charges from the provider).
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_transaction_id text NOT NULL UNIQUE,
  paddle_subscription_id text,
  paddle_customer_id text,
  product_id text,
  price_id text,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'completed',
  description text,
  billed_at timestamptz NOT NULL DEFAULT now(),
  refunded_cents integer NOT NULL DEFAULT 0,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_tx_user ON public.payment_transactions(user_id, environment, billed_at);

GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages payments"
  ON public.payment_transactions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. AI usage metering (Starter is capped per month, Pro is unlimited).
CREATE TABLE public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_user_created ON public.ai_usage_events(user_id, created_at);

GRANT SELECT ON public.ai_usage_events TO authenticated;
GRANT ALL ON public.ai_usage_events TO service_role;

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai usage"
  ON public.ai_usage_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages ai usage"
  ON public.ai_usage_events FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.ai_usage_this_period(_user_id uuid, _since timestamptz)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.ai_usage_events
  WHERE user_id = _user_id AND created_at >= _since;
$$;

-- 4. Legal acceptance recorded on the profile instead of browser storage.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legal_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS legal_accepted_version text;