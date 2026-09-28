/**
 * Whop founding-access constants that are safe to ship to the browser:
 * plan IDs, prices and the canonical purchase destination. SERVER-ONLY values
 * and logic (webhook secret, service-role client, entitlement writes) live in
 * `whop-founding.server.ts`, which imports the plan records from here so the
 * two can never drift.
 *
 * Payment CTAs send people to the founding-access presale page, where the
 * tier is chosen and payment is taken. Purchases reach this app through the
 * verified webhook (`/api/webhooks/whop`) and are recorded in
 * `founding_entitlements` (see docs/whop-founding-webhook.md) — until that
 * webhook is configured, presale buyers get their access through the presale
 * flow itself, not this app's entitlements.
 */

export type FounderPlanId = "pro_founding" | "max_founding";

export type FounderPlan = {
  /** Plan tier this founding purchase grants. */
  plan: "Pro" | "Max";
  /**
   * Where the plan's payment CTA sends people. Currently the shared
   * founding-access presale page for both tiers; direct per-plan Whop
   * checkout links (whop.com/checkout/plan_…) may return once the webhook
   * go-live checklist in docs/whop-founding-webhook.md is complete.
   */
  checkoutUrl: string;
  /** One-time founding price, in USD. */
  price: number;
  /** Human label used on CTAs, e.g. "$199 founding year". */
  priceLabel: string;
};

/**
 * Founding-access presale. Both founding tiers funnel through this page.
 */
export const FOUNDER_PRESALE_URL =
  "https://chartfusionx-foundingaccess.lovable.app/presale";

export const FOUNDER_PLANS: Record<FounderPlanId, FounderPlan> = {
  pro_founding: {
    plan: "Pro",
    checkoutUrl: FOUNDER_PRESALE_URL,
    price: 199,
    priceLabel: "$199 founding year",
  },
  max_founding: {
    plan: "Max",
    checkoutUrl: FOUNDER_PRESALE_URL,
    price: 399,
    priceLabel: "$399 founding year",
  },
};

/** Label for the founding-access CTA. */
export const FOUNDER_CTA_LABEL = "Get Founding Access";

/**
 * Go-live switch for the founding CTAs. Default (no variable set): live —
 * Pro/Max CTAs open the founding-access presale page. Set
 * `VITE_FOUNDER_CTA_LIVE=false` to fall back to the waitlist (kill switch
 * for when the presale is down or closed). Direct Whop checkout must not be
 * re-linked until the webhook go-live checklist in
 * docs/whop-founding-webhook.md is complete.
 */
export const FOUNDER_CTA_LIVE = import.meta.env["VITE_FOUNDER_CTA_LIVE"] !== "false";
