import { Link } from "@tanstack/react-router";

import {
  FOUNDER_CTA_LABEL,
  FOUNDER_CTA_LIVE,
  FOUNDER_PLANS,
  type FounderPlanId,
} from "@/lib/whop-founding";
import { cn } from "@/lib/utils";

/**
 * CTA for the Pro/Max founding tiers. Exactly one monetization destination is
 * live at a time: the Whop Founding Access checkout (while FOUNDER_CTA_LIVE)
 * or the waitlist (default). The external checkout opens in a new tab.
 */
export function FounderTierCta({
  planId,
  className,
}: {
  planId: FounderPlanId;
  className?: string;
}) {
  const plan = FOUNDER_PLANS[planId];

  if (FOUNDER_CTA_LIVE) {
    return (
      <a
        href={plan.checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${FOUNDER_CTA_LABEL} — ${plan.plan}: ${plan.priceLabel}`}
        className={cn(className)}
      >
        {FOUNDER_CTA_LABEL}
      </a>
    );
  }

  return (
    <Link to="/whats-coming" className={cn(className)}>
      Join the waitlist
    </Link>
  );
}
