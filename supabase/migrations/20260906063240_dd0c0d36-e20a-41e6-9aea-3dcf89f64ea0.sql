CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  source text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX waitlist_email_unique ON public.waitlist (lower(email));
GRANT INSERT ON public.waitlist TO anon;
GRANT INSERT ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join the waitlist" ON public.waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);