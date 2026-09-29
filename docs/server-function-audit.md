# Server-function security audit

Audit date: 2026-09-29 (post `resolvePaddlePrice` hardening in `264b691`).
Scope: every `createServerFn` in the repo (5 files, 17 functions) and every
API route handler (2 webhooks). Question for each: does it authenticate, and
does it restrict its inputs to values the app actually owns?

## Coverage model

- **Server functions** (`createServerFn`) that touch user data or money use
  `requireSupabaseAuth` — exactly one had none and was fixed.
- **Webhooks** (`/api/public/payments/webhook` for Paddle,
  `/api/webhooks/whop` for Whop) accept unauthenticated POSTs **by design**
  (the caller is the payment provider) and verify provider signatures
  instead: Paddle via `verifyWebhook` (`paddle.server.ts`), Whop via
  HMAC verification in the route handler. Signature failure ⇒ delivery
  rejected.

## Per-function matrix

| Function | File | Auth | Input restriction | Action |
| --- | --- | --- | audit-only? | |
| `resolvePaddlePrice` | payments.functions.ts | ✅ | ✅ plan allow-list | fixed in `264b691` |
| `getBillingOverview` | payments.functions.ts | ✅ | env only | none needed |
| `recordTradeLog` | payments.functions.ts | ✅ | env only | none needed |
| `recordAiUsage` | payments.functions.ts | ✅ | env + typed `AiFeature` validator | fixed this audit |
| `changePlan` | payments.functions.ts | ✅ | ✅ plan allow-list | fixed this audit |
| `createCheckoutIntent` | payments.functions.ts | ✅ | ✅ plan allow-list | fixed this audit |
| `cancelSubscription` | payments.functions.ts | ✅ | env only | none needed |
| `resumeSubscription` | payments.functions.ts | ✅ | env only | none needed |
| `createPortalSession` | payments.functions.ts | ✅ | env only | none needed |
| `updateAccountProfile` | account.functions.ts | ✅ | validated fields | none needed |
| `deleteAccount` | account.functions.ts | ✅ | n/a | none needed |
| `getLegalAcceptance` | account.functions.ts → profile.functions.ts | ✅ | n/a | none needed |
| `acceptLegal` | profile.functions.ts | ✅ | validated fields | none needed |
| `getFoundingLaunchStatus` | whop-admin.functions.ts | ✅ + admin role | n/a | none needed |
| `launchFoundingAccess` | whop-admin.functions.ts | ✅ + admin role | date validated | none needed |
| `synthesizeSummary` | tts.functions.ts | **❌ → ✅** | zod (text ≤ 4000 chars) | **fixed this audit** |
| webhooks (2) | api routes | signature-verified | provider-parsed | none needed |

## Fixes applied in this audit

1. **`synthesizeSummary` (TTS) — added `requireSupabaseAuth`.** The function
   had no auth middleware at all, and it calls the Lovable AI gateway
   (`gpt-4o-mini-tts`) with the server's API key — an unauthenticated caller
   could burn paid AI credits for free. It has no callers in the app yet
   (unwired), so the fix breaks nothing; when the voice-summary feature is
   wired up, the user will already be signed in.
2. **`changePlan` / `createCheckoutIntent` — plan allow-list on `priceId`.**
   Same class of gap as the original `resolvePaddlePrice` bug: arbitrary
   external price ids could be resolved against the Paddle gateway.
   Authenticated callers only, so exposure was smaller, but the check now
   rejects anything that is not one of our plan price ids before the gateway
   is contacted. `createCheckoutIntent` returns the structured
   `{ ok: false, message: "Unknown plan", … }` shape its callers already
   handle instead of throwing.
3. **`recordAiUsage` — narrowed the `feature` validator from
   `AiFeature | string` to `AiFeature`.** Previously any string could be
   written into `ai_usage_events.feature`; now only the app's declared AI
   features pass validation, and the insert writes the typed value directly
   instead of `String(...)`.
