/**
 * Single source of truth for what each plan allows.
 *
 * Two paid tiers: Pro ($29/mo, capped AI actions) and Max ($69/mo,
 * unlimited AI actions). Both plans expose every feature.
 */

export type PlanId = "pro_monthly" | "max_monthly";

export type PlanConfig = {
  priceId: PlanId;
  productId: string;
  name: string;
  price: number;
  tagline: string;
  /** Null means unlimited. */
  aiActionsPerPeriod: number | null;
  features: string[];
};

export const AI_FEATURES = [
  "ai-review",
  "strategy-discovery",
  "screenshot-reader",
  "chart-critique",
  "voice-summary",
  "trader-dna",
  "reports",
] as const;

export type AiFeature = (typeof AI_FEATURES)[number];

export const PLANS: PlanConfig[] = [
  {
    priceId: "pro_monthly",
    productId: "pro_plan",
    name: "Pro",
    price: 29,
    tagline: "For traders building the habit.",
    aiActionsPerPeriod: 50,
    features: [
      "Unlimited trade journaling & gallery",
      "Performance dashboard & equity curve",
      "Every AI tool included",
      "50 AI actions per month",
      "Trader DNA, goals & habit tracking",
    ],
  },
  {
    priceId: "max_monthly",
    productId: "max_plan",
    name: "Max",
    price: 69,
    tagline: "For traders reviewing at higher volume.",
    aiActionsPerPeriod: null,
    features: [
      "Everything in Pro",
      "Unlimited AI actions",
      "AI reviews, voice summaries & strategy analytics",
      "Advanced reports, analytics & exports",
      "Full trade gallery & attachments",
      "Priority AI processing",
    ],
  },
];

export function getPlan(priceId: string | null | undefined): PlanConfig | null {
  return PLANS.find((plan) => plan.priceId === priceId) ?? null;
}

export const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

/** How many trades a signed-in user can log before a plan is required. */
export const FREE_TRADE_LIMIT = 10;

/** Routes that stay reachable while signed in without an active subscription. */
export const PAYWALL_EXEMPT_PATHS = [
  "/billing",
  "/pricing",
  "/privacy",
  "/terms",
  "/refund-policy",
];

export function isPaywallExempt(pathname: string) {
  return PAYWALL_EXEMPT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function aiLimitLabel(limit: number | null) {
  return limit === null ? "Unlimited" : `${limit} / month`;
}
