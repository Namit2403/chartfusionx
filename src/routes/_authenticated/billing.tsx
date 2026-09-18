import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CreditCard, Sparkles } from "lucide-react";

import { PageHeader, Panel } from "@/components/shell";
import { AiUsageBudget } from "@/components/ai-usage-budget";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/waitlist-form";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Your plan — ChartFusionX Free Beta" },
      {
        name: "description",
        content:
          "ChartFusionX is free during the beta. There are no plans, no card and nothing to pay while we build the AI modules.",
      },
      { property: "og:title", content: "Your plan — ChartFusionX Free Beta" },
      {
        property: "og:description",
        content: "Free during beta — no plans, no card, nothing to pay.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BetaPlanPage,
});

function UsageRow({
  label,
  used,
  limit,
  icon,
}: {
  label: string;
  used: number;
  limit: number | null;
  icon: React.ReactNode;
}) {
  const unlimited = limit === null;
  const pct = unlimited ? 100 : Math.min(100, limit > 0 ? (used / limit) * 100 : 100);
  const nearLimit = !unlimited && pct >= 90;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </span>
        <span className="num text-sm text-muted-foreground">
          {used.toLocaleString()}
          <span className="text-muted-foreground/60">
            {unlimited ? " / unlimited" : ` / ${limit.toLocaleString()}`}
          </span>
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            nearLimit ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${unlimited ? 100 : pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {unlimited
          ? "No cap during the free beta."
          : nearLimit
            ? "You're close to the limit for this period."
            : `${Math.max(0, limit - used).toLocaleString()} remaining this period.`}
      </p>
    </div>
  );
}

function BetaPlanPage() {
  const { loading, entitled, planName, subscription, aiUsed, aiLimit, tradesUsed, tradeLimit } =
    useSubscription();

  const renewsOn = subscription?.current_period_end
    ? format(new Date(subscription.current_period_end), "d MMM yyyy")
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Plans & usage"
        title="Your plan"
        description="Track what you're on and how much of it you've used. ChartFusionX is free while it's in beta — no card on file, nothing to pay."
      />

      <Panel title="Current plan" subtitle="Your access level and billing state.">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your plan…</p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-1.5 text-sm font-semibold">
              <CreditCard className="size-4 text-muted-foreground" />
              {planName ?? "Free Beta"}
            </span>
            {entitled ? (
              <span className="rounded-full border border-positive/30 bg-positive/10 px-2.5 py-0.5 text-[11px] font-medium text-positive">
                Active
              </span>
            ) : (
              <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                Free beta
              </span>
            )}
            {entitled && renewsOn ? (
              <span className="text-sm text-muted-foreground">Renews {renewsOn}</span>
            ) : null}
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/journal/new">Log a trade</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link to="/pricing">See plans</Link>
          </Button>
        </div>
      </Panel>

      <Panel title="Usage" subtitle="Live counters against your plan's limits.">
        <div className="grid gap-3 sm:grid-cols-2">
          <UsageRow
            label="Trades logged"
            used={tradesUsed}
            limit={tradeLimit}
            icon={<CreditCard className="size-4 text-muted-foreground" />}
          />
          <UsageRow
            label="AI actions"
            used={aiUsed}
            limit={aiLimit}
            icon={<Sparkles className="size-4 text-muted-foreground" />}
          />
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-semibold">AI budget settings</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Set how many AI actions you allow yourself per month and when to be warned. Stored on
            this device — enforcement arrives with the AI modules.
          </p>
          <div className="mt-4">
            <AiUsageBudget used={aiUsed} />
          </div>
        </div>
      </Panel>

      <Panel
        title="Be first to know"
        subtitle="We'll email you when the AI modules and the next generation of ChartFusionX are ready."
      >
        <WaitlistForm source="billing" />
      </Panel>
    </div>
  );
}
