import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { PLANS, getPaddleEnvironment } from "@/lib/paddle";
import {
  cancelSubscription,
  changePlan,
  createPortalSession,
  resumeSubscription,
} from "@/utils/payments.functions";

type Search = { checkout?: string | undefined };

export const Route = createFileRoute("/_authenticated/billing")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    checkout: typeof search["checkout"] === "string" ? search["checkout"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Plans & billing — ChartFusionX" },
      {
        name: "description",
        content:
          "Choose the ChartFusionX Starter or Pro plan, start a 7-day free trial and manage your subscription, usage and invoices.",
      },
      { property: "og:title", content: "Plans & billing — ChartFusionX" },
      {
        property: "og:description",
        content: "Starter $29/mo or Pro $69/mo, both with a 7-day free trial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BillingPage,
});

const STATUS_LABEL: Record<string, string> = {
  trialing: "Free trial",
  active: "Active",
  past_due: "Payment failed",
  paused: "Paused",
  canceled: "Canceled",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function BillingPage() {
  const { checkout } = useSearch({ from: "/_authenticated/billing" });
  const navigate = useNavigate();
  const {
    subscription,
    userId,
    email,
    isActive,
    planId,
    planName,
    aiUsed,
    aiLimit,
    transactions,
    loading,
    refresh,
  } = useSubscription();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const openPortal = useServerFn(createPortalSession);
  const switchPlan = useServerFn(changePlan);
  const cancelAtPeriodEnd = useServerFn(cancelSubscription);
  const resumePlan = useServerFn(resumeSubscription);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (checkout !== "success") return;
    toast.success("You're all set — your plan is activating.");
    const timer = setTimeout(() => void refresh(), 2500);
    void navigate({ to: "/billing", search: {}, replace: true });
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout]);

  const startTrial = async (priceId: string) => {
    if (!userId) {
      toast.error("Sign in to start your trial.");
      return;
    }
    try {
      const result = await openCheckout({
        priceId,
        customerEmail: email ?? undefined,
        customData: { userId },
      });
      if (!result.ok) {
        toast.error(result.message ?? "Checkout could not be opened. Please try again.");
      }
    } catch {
      toast.error("Checkout could not be opened. Please try again.");
    }
  };

  const handleSwitch = async (priceId: string) => {
    setBusy(priceId);
    try {
      await switchPlan({ data: { priceId, environment: getPaddleEnvironment() } });
      toast.success("Plan updated. The difference is charged pro rata today.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change your plan");
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    setBusy("cancel");
    try {
      const result = await cancelAtPeriodEnd({ data: { environment: getPaddleEnvironment() } });
      if (!result.ok) {
        toast.error(result.message ?? "Could not cancel your subscription");
        return;
      }
      toast.success(
        result.endsAt
          ? `Canceled. You keep full access until ${formatDate(result.endsAt)}.`
          : "Canceled. You keep access until the end of your paid period.",
      );
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel your subscription");
    } finally {
      setBusy(null);
      setConfirmCancel(false);
    }
  };

  const handleResume = async () => {
    setBusy("resume");
    try {
      const result = await resumePlan({ data: { environment: getPaddleEnvironment() } });
      if (!result.ok) {
        toast.error(result.message ?? "Could not resume your subscription");
        return;
      }
      toast.success("Your plan will renew as normal.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resume your subscription");
    } finally {
      setBusy(null);
    }
  };

  const manage = async () => {
    setBusy("portal");
    try {
      const result = await openPortal({ data: { environment: getPaddleEnvironment() } });
      if (!result.ok || !result.overviewUrl) {
        toast.error(result.message ?? "Could not open the billing portal");
        return;
      }
      window.open(result.overviewUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the billing portal");
    } finally {
      setBusy(null);
    }
  };


  const usagePct = aiLimit ? Math.min(100, Math.round((aiUsed / aiLimit) * 100)) : 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <PaymentTestModeBanner />

      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Plans & billing</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Every plan starts with a 7-day free trial. A card is required upfront — cancel before the
          trial ends and you won't be charged.
        </p>
      </header>

      {subscription && (
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Your subscription</h2>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {STATUS_LABEL[subscription.status] ?? subscription.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {planName ?? subscription.product_id} plan ·{" "}
                {subscription.status === "canceled"
                  ? `Access ends ${formatDate(subscription.current_period_end)}`
                  : subscription.cancel_at_period_end
                    ? `Cancels ${formatDate(subscription.current_period_end)} — full access until then`
                    : `${subscription.status === "trialing" ? "Trial ends" : "Renews"} ${formatDate(
                        subscription.current_period_end,
                      )}`}
              </p>
              {subscription.status === "past_due" && (
                <p className="mt-2 flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  Your last payment failed. Update your payment method to keep your access.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={manage} disabled={busy !== null} variant="secondary" size="sm">
                {busy === "portal" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 size-4" />
                )}
                Payment method & invoices
              </Button>
              {isActive && subscription.cancel_at_period_end && (
                <Button onClick={() => void handleResume()} disabled={busy !== null} size="sm">
                  {busy === "resume" && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Resume plan
                </Button>
              )}
              {isActive && !subscription.cancel_at_period_end && (
                <Button
                  onClick={() => setConfirmCancel(true)}
                  disabled={busy !== null}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  Cancel plan
                </Button>
              )}
            </div>
          </div>

          {isActive && (
            <div className="mt-5 border-t border-border/60 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">AI actions this period</span>
                <span className="num font-medium">
                  {aiLimit === null ? `${aiUsed} · unlimited` : `${aiUsed} / ${aiLimit}`}
                </span>
              </div>
              {aiLimit !== null && (
                <>
                  <Progress value={usagePct} className="mt-2 h-1.5" />
                  {aiUsed >= aiLimit && (
                    <p className="mt-2 text-xs text-destructive">
                      You've used your monthly AI actions. Upgrade to Pro for unlimited.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = isActive && planId === plan.priceId;
          const canSwitch = isActive && !isCurrent;
          return (
            <div
              key={plan.priceId}
              className={`flex flex-col rounded-xl border bg-card p-6 ${
                plan.priceId === "pro_monthly" ? "border-primary/60" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                {plan.priceId === "pro_monthly" && (
                  <Badge className="gap-1">
                    <Sparkles className="size-3" /> Unlimited AI
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <p className="mt-4">
                <span className="num text-3xl font-semibold">${plan.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                7-day free trial · card required upfront
              </p>

              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6"
                disabled={loading || checkoutLoading || busy !== null || isCurrent}
                variant={plan.priceId === "pro_monthly" ? "default" : "secondary"}
                onClick={() =>
                  canSwitch ? void handleSwitch(plan.priceId) : void startTrial(plan.priceId)
                }
              >
                {busy === plan.priceId && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isCurrent
                  ? "Current plan"
                  : canSwitch
                    ? `Switch to ${plan.name}`
                    : "Start 7-day free trial"}
              </Button>
              {canSwitch && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Charged pro rata today
                </p>
              )}
            </div>
          );
        })}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Billing history</h2>
        {transactions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No charges yet. Your first charge happens when the free trial ends.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-border/60">
                    <td className="num py-2 text-muted-foreground">{formatDate(tx.billed_at)}</td>
                    <td className="py-2">{tx.description ?? "Subscription"}</td>
                    <td className="num py-2">
                      {money(tx.amount_cents, tx.currency)}
                      {tx.refunded_cents > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          −{money(tx.refunded_cents, tx.currency)} refunded
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className={
                          tx.status === "completed" ? "text-positive" : "text-muted-foreground"
                        }
                      >
                        {tx.status === "completed"
                          ? "Paid"
                          : tx.status === "refunded"
                            ? "Refunded"
                            : "Failed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You keep full access until the end of the period you've already paid for, and you
              won't be billed again. Your trades and journal stay saved, and you can resume or
              restart a plan at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my plan</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleCancel();
              }}
            >
              {busy === "cancel" && <Loader2 className="mr-2 size-4 animate-spin" />}
              Cancel at period end
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
