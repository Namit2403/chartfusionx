import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader, Panel, Pill } from "@/components/shell";
import { currency, sessionPerf, strategyPerf } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/strategy-discovery")({
  head: () => ({
    meta: [
      { title: "AI Strategy Discovery — ChartFusionX" },
      {
        name: "description",
        content:
          "The AI studies every trade you log and surfaces which strategies, sessions, markets and risk levels actually work for you.",
      },
      { property: "og:title", content: "AI Strategy Discovery — ChartFusionX" },
      { property: "og:description", content: "Find out what actually works in your trading." },
    ],
  }),
  component: StrategyDiscovery,
});

function StrategyDiscovery() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 04"
        title="AI Strategy Discovery"
        description="Your Break & Retest strategy has a 100% win rate over 5 trades, while Momentum sits at 0% over 3. The AI keeps recalculating as your sample grows."
      />

      <Panel title="Strategy performance" subtitle="Expectancy in R, ranked by net P&L">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strategyPerf} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="name" width={130} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
              <Tooltip
                cursor={{ fill: "var(--color-muted)" }}
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="pnl" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Per-strategy breakdown">
          <div className="divide-y divide-border">
            {strategyPerf.map((s) => (
              <div key={s.name} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground">{s.trades} trades</div>
                </div>
                <Pill tone={s.winRate >= 60 ? "positive" : s.winRate >= 40 ? "accent" : "negative"}>
                  {s.winRate}% WR
                </Pill>
                <div className={`num w-20 text-right text-sm ${s.expectancy >= 0 ? "text-positive" : "text-negative"}`}>
                  {s.expectancy.toFixed(2)}R
                </div>
                <div className={`num w-24 text-right text-sm font-semibold ${s.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                  {currency(s.pnl)}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Optimal conditions" subtitle="Where your edge concentrates">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Best session", "Asian"],
                ["Best day", "Monday"],
                ["Best market", "Futures"],
                ["Best timeframe", "15m"],
                ["Ideal risk", "0.75%"],
                ["Best hold time", "1–3 hours"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{k}</dt>
                  <dd className="mt-1 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Session performance">
            <div className="space-y-3">
              {sessionPerf.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className="flex items-center gap-3">
                    <Pill>{s.winRate}% WR</Pill>
                    <span className={`num ${s.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                      {currency(s.pnl)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="What the AI concluded">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-positive/25 bg-positive/5 p-4 text-sm leading-relaxed">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-positive">
              Winning conditions
            </div>
            Trend-aligned entries taken after a confirmed retest, risked at 0.5–0.75%, held longer
            than 60 minutes.
          </div>
          <div className="rounded-xl border border-negative/25 bg-negative/5 p-4 text-sm leading-relaxed">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-negative">
              Losing conditions
            </div>
            5m momentum entries during the New York open, taken within 10 minutes of a prior loss,
            with confidence logged below 5.
          </div>
        </div>
      </Panel>
    </div>
  );
}
