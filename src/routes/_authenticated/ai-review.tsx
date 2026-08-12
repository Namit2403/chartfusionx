import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";

import { NoTradesYet } from "@/components/no-trades-yet";
import { useAiAction } from "@/hooks/useAiAction";
import { useTradeData } from "@/hooks/useTradeData";
import { PageHeader, Panel, Pill, ScoreBar } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/mock-data";
import { RiskDisclaimer } from "@/components/risk-disclaimer";

export const Route = createFileRoute("/_authenticated/ai-review")({
  head: () => ({
    meta: [
      { title: "AI Trade Review — ChartFusionX" },
      {
        name: "description",
        content:
          "Your AI trading coach grades entry quality, risk management, execution and psychology after every trade.",
      },
      { property: "og:title", content: "AI Trade Review — ChartFusionX" },
      {
        property: "og:description",
        content: "A graded, personalized review of every trade you take.",
      },
    ],
  }),
  component: AiReview,
});

export default function AiReview() {
  const { trades, stats, isEmpty } = useTradeData();
  const { run: spendAiAction, checking: reviewing } = useAiAction("ai-review");
  const trade = trades[0];

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const dimensions = trade
    ? [
        { label: "Entry quality", value: clamp(50 + trade.r * 18) },
        { label: "Risk management", value: clamp(100 - Math.abs(trade.riskPct - 0.5) * 60) },
        { label: "Rule adherence", value: clamp(50 + trade.r * 15) },
        { label: "Exit timing", value: clamp(50 + (trade.r - stats.avgR) * 20) },
      ]
    : [];

  const strengths = trade
    ? [
        trade.r > 0 ? `Closed positive at ${trade.r.toFixed(2)}R on ${trade.asset}` : null,
        trade.riskPct <= 1
          ? `Risk sized at ${trade.riskPct.toFixed(2)}%, inside a sane per-trade limit`
          : null,
        trade.stop ? "Stop level was defined before entry" : null,
      ].filter(Boolean as unknown as (v: string | null) => v is string)
    : [];

  const mistakes = trade
    ? [
        trade.r < 0 ? `Trade closed at ${trade.r.toFixed(2)}R — review the invalidation` : null,
        trade.riskPct > 1
          ? `Risked ${trade.riskPct.toFixed(2)}%, above your usual ${stats.avgRiskPct.toFixed(2)}%`
          : null,
        trade.r > 0 && trade.r < stats.avgR
          ? `Took profit at ${trade.r.toFixed(2)}R while your average winner runs to ${stats.avgR.toFixed(2)}R`
          : null,
      ].filter(Boolean as unknown as (v: string | null) => v is string)
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 03 · Core feature"
        title="AI Trade Review"
        description="After every trade, the AI reads your data, notes, emotions, screenshots, playbook rules and full history — then reviews your execution like a coach would."
        action={
          <Button onClick={() => void spendAiAction()} disabled={reviewing || isEmpty}>
            Review latest trade
          </Button>
        }
      />

      <RiskDisclaimer />

      {isEmpty || !trade ? (
        <NoTradesYet
          title="Nothing to review yet"
          description="Log a trade and the AI will grade its entry, risk, execution and psychology against your own history."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel
              className="lg:col-span-2"
              title={`${trade.asset} · ${trade.strategy}`}
              subtitle={`${trade.date} · ${trade.session} session · ${trade.timeframe}`}
            >
              <div className="grid gap-4 sm:grid-cols-4">
                {[
                  ["P&L", currency(trade.pnl)],
                  ["R multiple", `${trade.r.toFixed(2)}R`],
                  ["Risk", `${trade.riskPct.toFixed(2)}%`],
                  ["Direction", trade.direction],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border bg-background/40 p-3">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      {k}
                    </div>
                    <div className="num mt-1 text-sm font-semibold">{v}</div>
                  </div>
                ))}
              </div>
              {trade.note ? (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{trade.note}</p>
              ) : null}
            </Panel>

            <Panel title="Trade grade" subtitle="Derived from this trade's outcome and risk">
              <div className="flex items-center gap-4">
                <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/15 text-3xl font-semibold text-primary">
                  {trade.grade}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {dimensions.map((d) => (
                    <div key={d.label}>
                      {d.label} · {(d.value / 10).toFixed(1)}
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Strengths">
              {strengths.length ? (
                <ul className="space-y-3">
                  {strengths.map((s) => (
                    <li key={s} className="flex gap-3 text-sm text-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-positive" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run the review to get AI-written strengths for this trade.
                </p>
              )}
            </Panel>
            <Panel title="Mistakes">
              {mistakes.length ? (
                <ul className="space-y-3">
                  {mistakes.map((s) => (
                    <li key={s} className="flex gap-3 text-sm text-foreground">
                      <X className="mt-0.5 size-4 shrink-0 text-negative" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No rule breaks detected from the data you logged.
                </p>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Review dimensions" className="lg:col-span-2">
              <div className="grid gap-5 sm:grid-cols-2">
                {dimensions.map((d) => (
                  <ScoreBar key={d.label} label={d.label} value={d.value} />
                ))}
              </div>
            </Panel>

            <Panel title="Psychology flags">
              <div className="flex flex-wrap gap-2">
                <Pill tone={trade.emotionBefore === "—" ? "accent" : "positive"}>
                  Before: {trade.emotionBefore}
                </Pill>
                <Pill tone={trade.emotionAfter === "—" ? "accent" : "positive"}>
                  After: {trade.emotionAfter}
                </Pill>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Across {trades.length} logged {trades.length === 1 ? "trade" : "trades"} your win
                rate is <span className="num">{stats.winRate.toFixed(1)}%</span> at an average of{" "}
                <span className="num">{stats.avgR.toFixed(2)}R</span>.
              </p>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
