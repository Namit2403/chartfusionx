CREATE TABLE public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  traded_at timestamp with time zone NOT NULL DEFAULT now(),
  market text,
  asset text,
  broker text,
  account_type text,
  account_size numeric,
  setup text,
  strategy text,
  direction text,
  timeframe text,
  entry_price numeric,
  exit_price numeric,
  stop_price numeric,
  target_price numeric,
  position_size numeric,
  risk_pct numeric,
  reward_pct numeric,
  fees numeric,
  duration text,
  session text,
  day_of_week text,
  market_conditions text,
  confidence integer,
  emotion_before text,
  emotion_after text,
  entry_reason text,
  mistakes text,
  lessons text,
  tags text[] NOT NULL DEFAULT '{}',
  pnl numeric NOT NULL DEFAULT 0,
  r_multiple numeric NOT NULL DEFAULT 0,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades" ON public.trades
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON public.trades
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON public.trades
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own trades" ON public.trades
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX trades_user_traded_at_idx ON public.trades (user_id, traded_at DESC);

CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();