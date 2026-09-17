/**
 * Whop founding-access constants that are safe to ship to the browser:
 * plan IDs, prices and canonical checkout URLs. SERVER-ONLY values and
 * logic (webhook secret, service-role client, entitlement writes) live in
 * `whop-founding.server.ts`, which imports the plan records from here so
 * the two can never drift.
 *
 * The founding presale is processed by Whop on these plan IDs; purchases
 * reach this app through the verified webhook (`/api/webhooks/whop`) and
 * are recorded in `founding_entitlements` (see docs/whop-founding-webhook.md).
 */

export type FounderPlanId = "pro_founding" | "max_founding";

export type FounderPlan = {
  /** Plan tier this founding purchase grants. */
  plan: "Pro" | "Max";
  /** Canonical public Whop checkout link for the plan. */
  checkoutUrl: string;
  /** One-time founding price, in USD. */
  price: number;
  /** Human label used on CTAs, e.g. "$199 founding year". */
  priceLabel: string;
};

export const FOUNDER_PLANS: Record<FounderPlanId, FounderPlan> = {
  pro_founding: {
    plan: "Pro",
    checkoutUrl: "https://whop.com/checkout/plan_8ljFtIGCyybJb",
    price: 199,
    priceLabel: "$199 founding year",
  },
  max_founding: {
    plan: "Max",
    checkoutUrl: "https://whop.com/checkout/plan_w4Hiq9mjM33aQ",
    price: 399,
    priceLabel: "$399 founding year",
  },
};

/** Label for the founding-access CTA while checkout is live. */
export const FOUNDER_CTA_LABEL = "Get Founding Access";

/**
 * Go-live switch. When false (default), Pro/Max CTAs point at the waitlist
 * and the Whop checkout is never linked — the webhook is not configured for
 * production yet, so a purchase could not be recorded. Flip to true ONLY
 * after the go-live checklist in docs/whop-founding-webhook.md is complete
 * (WHOP_WEBHOOK_SECRET set in production + Whop webhook verified end-to-end).
 */
export const FOUNDER_CTA_LIVE = import.meta.env["VITE_FOUNDER_CTA_LIVE"] === "true";
