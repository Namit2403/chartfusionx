ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_used_at timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS canceled_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_payment_transactions_txid ON public.payment_transactions(paddle_transaction_id);