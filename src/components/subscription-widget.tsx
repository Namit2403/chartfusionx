import { Link } from "@tanstack/react-router";
import { Check, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { aiLimitLabel, getPlan } from "@/lib/entitlements";

function daysLeft(iso: string | null | undefined) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

function Allowance({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={allowed ? "flex items-center gap-1 text-positive" : "flex items-center gap-1 text-muted-foreground"}>
        {allowed ? <Check className="size-3.5" /> : <X className="size-3.5" />}
        {allowed ? "Allowed" : "Locked"}
      </span>
    </div>
  );
}

/** Compact plan / trial / entitlement summary for the account dropdown. */
export function SubscriptionWidget() {
  const { loading, isActive, subscription, planName, priceIdPlan, aiUsed, aiLimit, aiRemaining } =
    useSubscriptionWidgetData();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Checking your plan…
      </div>
    );
  }

  const trialing = subscription?.status === "trialing";
  const trialDays = trialing ? daysLeft(subscription?.current_period_end) : null;
  const canUseAi = isActive && (aiRemaining === null || (aiRemaining ?? 0) > 0);

  return (
    <div className="space-y-1.5 px-2 py-2 text-sm">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Subscription</div>
      <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">Plan</span>
        <span className="font-medium">{planName ?? priceIdPlan ?? "No plan"}</span>
      </div>
      {trialing && (
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Free trial</span>
          <span className="num text-accent">
            {trialDays === null ? "Active" : `${trialDays} day${trialDays === 1 ? "" : "s"} left`}
          </span>
        </div>
      )}
      {isActive && !trialing && subscription?.status && (
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Status</span>
          <span className="capitalize">{subscription.status.replace("_", " ")}</span>
        </div>
      )}
      {isActive && (
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">AI actions</span>
          <span className="num text-xs">
            {aiLimit === null ? `${aiUsed} used · ${aiLimitLabel(null)}` : `${aiUsed} / ${aiLimit}`}
          </span>
        </div>
      )}
      <Allowance label="Save trades" allowed={isActive} />
      <Allowance label="AI features" allowed={canUseAi} />
      {!isActive && (
        <Button asChild size="sm" className="mt-2 w-full">
          <Link to="/billing">Start free trial</Link>
        </Button>
      )}
      {isActive && (
        <Button asChild size="sm" variant="secondary" className="mt-2 w-full">
          <Link to="/billing">Manage plan</Link>
        </Button>
      )}
    </div>
  );
}

function useSubscriptionWidgetData() {
  const sub = useSubscription();
  const plan = getPlan(sub.subscription?.price_id);
  return {
    loading: sub.loading,
    isActive: sub.isActive,
    subscription: sub.subscription,
    planName: sub.planName ?? plan?.name ?? null,
    priceIdPlan: plan?.name ?? null,
    aiUsed: sub.aiUsed,
    aiLimit: sub.aiLimit,
    aiRemaining: sub.aiRemaining,
  };
}
