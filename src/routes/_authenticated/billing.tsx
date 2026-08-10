import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { PLANS, getPaddleEnvironment } from "@/lib/paddle";
import { createPortalSession } from "@/utils/payments.functions";

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
          "Choose the ChartFusionX Starter or Pro plan, start a 7-day free trial and manage your subscription and invoices.",
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

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function BillingPage() {
  const { checkout } = useSearch({ from: "/_authenticated/billing" });
  const navigate = useNavigate();
  const { subscription, userId, email, isActive, loading, refresh } = useSubscription();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const openPortal = useServerFn(createPortalSession);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    if (checkout !== "success") return;
    toast.success("You're all set — your plan is activating.");
    const timer = setTimeout(() => void refresh(), 2500);
    void navigate({ to: "/billing", search: {}, replace: true });
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout]);

  const subscribe = async (priceId: string) => {
    if (!userId) {
      toast.error("Sign in to start your trial.");
      return;
    }
    try {
      await openCheckout({
        priceId,
        customerEmail: email ?? undefined,
        customData: { userId },
      });
    } catch {
      toast.error("Checkout could not be opened. Please try again.");
    }
  };

  const manage = async () => {
    setPortalBusy(true);
    try {
      const result = await openPortal({ data: { environment: getPaddleEnvironment() } });
      window.open(result.overviewUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the billing portal");
    } finally {
      setPortalBusy(false);
    }
  };

  const currentPriceId = isActive ? subscription?.price_id : undefined;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <PaymentTestModeBanner />

      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Plans & billing</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Every plan starts with a 7-day free trial. Card required upfront, cancel anytime before
          the trial ends and you won't be charged.
        </p>
      </header>

      {subscription && (
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Your subscription</h2>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {STATUS_LABEL[subscription.status] ?? subscription.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {PLANS.find((p) => p.priceId === subscription.price_id)?.name ??
                  subscription.product_id}{" "}
                plan ·{" "}
                {subscription.cancel_at_period_end
                  ? `Ends ${formatDate(subscription.current_period_end)}`
                  : `${subscription.status === "trialing" ? "Trial ends" : "Renews"} ${formatDate(
                      subscription.current_period_end,
                    )}`}
              </p>
              {subscription.status === "past_due" && (
                <p className="mt-2 text-sm text-destructive">
                  Your last payment failed. Update your payment method to keep your access.
                </p>
              )}
            </div>
            <Button onClick={manage} disabled={portalBusy} variant="secondary">
              {portalBusy ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 size-4" />
              )}
              Manage subscription
            </Button>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = currentPriceId === plan.priceId;
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
                    <Sparkles className="size-3" /> Most complete
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <p className="mt-4">
                <span className="font-mono text-3xl font-semibold">${plan.price}</span>
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
                disabled={loading || checkoutLoading || isCurrent}
                variant={plan.priceId === "pro_monthly" ? "default" : "secondary"}
                onClick={() => void subscribe(plan.priceId)}
              >
                {isCurrent
                  ? "Current plan"
                  : isActive
                    ? `Switch to ${plan.name}`
                    : "Start 7-day free trial"}
              </Button>
            </div>
          );
        })}
      </section>

      <p className="text-xs text-muted-foreground">
        Payments, invoices and refunds are handled by our payment provider. See our refund policy
        for the 7-day first-payment refund window.
      </p>
    </div>
  );
}
