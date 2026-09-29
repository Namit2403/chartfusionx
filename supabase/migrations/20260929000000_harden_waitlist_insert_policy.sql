-- ============================================================================
-- Harden the waitlist INSERT policy.
--
-- The original policy was `WITH CHECK (true)` for both anon and authenticated
-- callers, which let ANY caller set `user_id` to an arbitrary UUID — not just
-- their own — since nothing tied the inserted row back to the caller's own
-- session. In practice this means any signed-in (or anonymous, since Supabase's
-- anon key is public in the client bundle) caller could attribute a waitlist
-- signup to someone else's account by guessing/knowing their user id.
--
-- There is no SELECT policy on this table for anon/authenticated, so no PII
-- was ever readable back out through this hole — the exposure was limited to
-- writing bogus attribution, not reading anyone else's data. This migration
-- closes that by requiring `user_id` to be either NULL or the caller's own
-- auth.uid(). `auth.uid()` is NULL for anon requests, so anon callers can
-- still join the waitlist (as before) but can only ever write user_id = NULL.
--
-- Deliberately NOT addressed here (separate, larger decisions — flagging for
-- awareness, not fixing unasked):
--   - No format validation on `email` (any non-empty text is accepted).
--   - No rate limiting on inserts (only the per-email unique index caps
--     duplicates from the SAME email; a flood of distinct bogus emails is
--     still possible from this table's policy alone).
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.waitlist;

CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
