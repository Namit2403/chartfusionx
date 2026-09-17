# Whop founding-access webhook — setup & operations

Founding purchases happen on the **separate founding presale site** (Whop).
This document covers how the main ChartFusionX app records them and how the
365-day access clock is controlled. The presale site itself is untouched.

## Production endpoint

```
POST https://chartfusionx.app/api/webhooks/whop
```

Route: `src/routes/api/webhooks/whop.ts` (server-only TanStack Start server
handler — no client bundle ever contains this code).

## Environment variables (server-only)

| Variable | Purpose | Status |
|---|---|---|
| `WHOP_WEBHOOK_SECRET` | Signing secret (`ws_…`) from the Whop webhook. Used to verify every delivery's `webhook-signature` header. | **Placeholder — must be set before the webhook can verify anything.** Until it is set the endpoint returns HTTP 500 so Whop retries. |
| `WHOP_API_KEY` | Whop API key, only if the app later needs to call the Whop REST API (not required for webhook processing today). | **Placeholder — leave unset until needed. Never exposed to the client.** |

Do not commit real values. Configure them in the deployment host's secret
store (Lovable Cloud env / production env). Values never reach the browser:
both are read exclusively inside `*.server.ts`/server-handler code paths.

## Whop dashboard configuration

1. Company: `biz_9w4gyExnEat48S` (Founder Access, product `prod_PjjTLlXzGV6hQ`).
2. Create a webhook in the Whop dashboard pointing at the production URL.
3. Subscribe to these events:
   - `payment.succeeded`
   - `membership.activated`
   - `refund.created`
   - `refund.updated`
4. Copy the signing secret into `WHOP_WEBHOOK_SECRET` exactly as issued
   (keep the `ws_` prefix — the official `unwrapWebhook` helper expects it).

## Verification & idempotency

- **Signature**: the raw request body is read with `request.text()` *before*
  any parsing and verified with `unwrapWebhook` from `@whop/sdk/helpers`
  (Standard Webhooks HMAC-SHA256, constant-time compare, 5-minute replay
  window). Invalid signatures get **401** and are never processed.
- **Event-level idempotency**: every verified delivery's `webhook-id` is
  inserted into `whop_webhook_events` (primary key). Replays short-circuit
  with `200 {"duplicate": true}` before touching entitlements.
- **Payment-level idempotency**: `founding_entitlements.whop_payment_id` is
  UNIQUE. `payment.succeeded` and `membership.activated` for the same
  payment converge on one row — the first insert wins; later events for an
  existing payment return without modifying `access_status`,
  `access_start`, or `access_end`. **One payment ⇒ exactly one entitlement.**

## Plan mapping

| Whop plan | Plan recorded | Founding price | Access window |
|---|---|---|---|
| `plan_8ljFtIGCyybJb` | Pro | $199/year | 365 days from launch |
| `plan_w4Hiq9mjM33aQ` | Max | $399/year | 365 days from launch |

Events for any other plan are verified, logged as `ignored`, and dropped.

## Access clock (critical invariant)

`paid_at`, Whop membership dates, and Whop product data are recorded for
audit only. While founding access is not launched:

- `access_status = 'pending'`
- `access_start = NULL`
- `access_end = NULL`
- No Pro/Max SaaS access is granted, regardless of payment.

The 365-day window starts only when an admin activates founding access:
`access_start = founding_access_start_date`, `access_end = access_start +
365 days`. Launch-date changes before activation simply stay pending; after
an entitlement is active it is never reset or extended by later events or
config changes.

## Launch control (admin-only)

Settings live in `app_settings`:

- `founding_access_launched` → `false` initially
- `founding_access_start_date` → `NULL` initially

No launch date is hard-coded. The canonical timezone for choosing the
launch wall time is **America/New_York**; the admin UI/host converts the
chosen wall time to a UTC instant and passes it as `launchDateIso`.

Activation path: `launchFoundingAccess` server function
(`src/utils/whop-admin.functions.ts`).

- Requires a valid Supabase session (`requireSupabaseAuth`) **and** the
  `admin` role via the existing `has_role()` database function.
- There is no public endpoint; URL/query params, browser callbacks, client
  state, or success pages can never activate access.
- Activation persists the config, then atomically flips every `pending`
  purchase to `active` with the 365-day window (SQL function
  `activate_founding_entitlements`, re-runnable — already active or refunded
  rows are never touched).

Read-only monitoring: `getFoundingLaunchStatus` (same admin guard) returns
launched/startDate plus pending/active/refunded counts.

## Users with / without accounts

The entitlement row is keyed by the buyer's verified Whop email, not by user
id. Billing gates (`getBillingOverview`, `recordTradeLog`, `recordAiUsage`)
resolve the signed-in account's **verified JWT email** (falling back to the
profile email) and match it against active founding entitlements with
`access_status = 'active'` and `access_end > now()`:

- Existing account + launched → Pro/Max access applies automatically.
- No account yet → the row waits; when the customer later signs up **with
  the same email**, the entitlement is found and applied. No repurchase.
- Free Beta behavior is unchanged: no founding row ⇒ exactly the old logic.

## Refunds

Whop events `refund.created` / `refund.updated` (signature-verified,
idempotent like everything else):

- **Refund before launch** → `access_status = 'refunded'`,
  `access_start = NULL`, `access_end = NULL`. The SQL function only flips
  `pending`/`active` rows, and activation only flips `pending` rows, so a
  refunded purchase can never be activated.
- **Refund after activation** → `access_status = 'refunded'`,
  `access_start/end` cleared — revoked immediately; billing gates re-check
  the row on every request, so access stops at once.

## Expected database states

| Scenario | paid_at | plan | access_status | access_start | access_end |
|---|---|---|---|---|---|
| Valid founder, pre-launch | Whop timestamp | Pro/Max | `pending` | NULL | NULL |
| Refunded founder, pre-launch | Whop timestamp | Pro/Max | `refunded` | NULL | NULL |
| Active founder, post-launch | Whop timestamp | Pro/Max | `active` | launch date | launch + 365d |

## Migration

`supabase/migrations/20260913090000_whop_founding_access.sql` creates:

- `founding_entitlements` (RLS: users read own by email; service-role writes)
- `app_settings` (service-role only)
- `whop_webhook_events` (service-role only)
- `activate_founding_entitlements(timestamptz)` — SECURITY DEFINER, admin
  path only, `REVOKE`d from anon/authenticated/public
- `refund_founding_entitlements(text, text)` — same

Apply via the usual `supabase db push` (Lovable Cloud applies it on deploy).

## CTA go-live switch (founder checkout links)

The marketing pages (`/` and `/pricing`) read `VITE_FOUNDER_CTA_LIVE`:

- **Unset / anything but `true`** → Pro/Max CTAs link to the waitlist
  (`/whats-coming`) as before. The Whop checkout is never linked.
- **`VITE_FOUNDER_CTA_LIVE=true`** (a build-time `import.meta.env` variable —
  the `VITE_` prefix is required for Vite to expose it to client code) →
  Pro/Max CTAs link to the canonical Whop checkout for each plan
  (`whop.com/checkout/<plan_id>`) and the cards show founding pricing
  ($199 Pro / $399 Max, one payment for a founding year).

Shared constants: `src/lib/whop-founding.ts` (checkout URLs, prices, label);
the server module re-derives its webhook plan map from it so the two cannot
drift.

**Go-live order (do not reorder):**

1. Configure `WHOP_WEBHOOK_SECRET` in the production environment (below).
2. Create and verify the Whop webhook (steps 2–3 below) — send a test event
   and confirm it lands in `whop_webhook_events`.
3. Only then set `FOUNDER_CTA_LIVE=true` and redeploy. If the webhook is not
   yet verified, a customer could pay on Whop while the app records nothing.

To stop offering founding access later, remove the flag and redeploy — CTAs
fall back to the waitlist automatically.

## Operational runbook

**Set up (once credentials exist):**

1. Configure `WHOP_WEBHOOK_SECRET` in the production environment.
2. Create the Whop webhook at the production URL subscribed to the four
   events above; store the secret.
3. Use Whop's "Send test event" and confirm a row appears in
   `whop_webhook_events` (and `founding_entitlements` for a real payment).

**Launch day:**

1. Decide the moment in America/New_York.
2. As an admin, call `launchFoundingAccess` with that instant
   (`launchDateIso`, UTC). This flips the setting and activates all pending
   purchases atomically.
3. Verify `getFoundingLaunchStatus` counts.

**After launch:** the setting is immutable through the server function (it
refuses to re-launch); individual rows are never reset by any path.
