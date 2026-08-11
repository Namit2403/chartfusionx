CREATE TABLE public.trade_log_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_trade_log_events_user_id ON public.trade_log_events(user_id);

GRANT SELECT ON public.trade_log_events TO authenticated;
GRANT ALL ON public.trade_log_events TO service_role;

ALTER TABLE public.trade_log_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade log events"
  ON public.trade_log_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages trade log events"
  ON public.trade_log_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);