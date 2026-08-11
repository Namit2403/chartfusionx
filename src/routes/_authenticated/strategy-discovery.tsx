import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { NoTradesYet } from "@/components/no-trades-yet";
import { PageHeader, Panel, Pill } from "@/components/shell";
import { useTradeData } from "@/hooks/useTradeData";
import { currency } from "@/lib/mock-data";


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
  const { trades, strategyPerf, sessionPerf, stats, isEmpty } = useTradeData();

  const best = [...strategyPerf].sort((a, b) => b.expectancy - a.expectancy)[0];
  const worst = [...strategyPerf].sort((a, b) => a.expectancy - b.expectancy)[0];
  const bestSession = [...sessionPerf].sort((a, b) => b.pnl - a.pnl)[0];
  const mode = (values: string[]) =>
    values.length
      ? [...values.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map<string, number>())].sort(
          (a, b) => b[1] - a[1],
        )[0]![0]
      : "—";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 04"
        title="AI Strategy Discovery"
        description="The AI recalculates which of your strategies, sessions and risk levels actually work as your sample grows."
      />

      {isEmpty && (
        <NoTradesYet
          title="Nothing to analyse yet"
          description="Strategy discovery needs logged trades before it can tell you where your edge is."
        />
      )}

      {!isEmpty && (
        <>


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
                ["Best session", bestSession?.name ?? "—"],
                ["Best market", mode(trades.map((t) => t.market))],
                ["Best timeframe", mode(trades.filter((t) => t.pnl > 0).map((t) => t.timeframe))],
                ["Average risk", `${stats.avgRiskPct.toFixed(2)}%`],
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
            {best
              ? `${best.name} is your strongest setup — ${best.winRate}% win rate and ${best.expectancy.toFixed(2)}R expectancy over ${best.trades} trades, best in the ${bestSession?.name ?? "—"} session.`
              : "Not enough data yet."}
          </div>
          <div className="rounded-xl border border-negative/25 bg-negative/5 p-4 text-sm leading-relaxed">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-negative">
              Losing conditions
            </div>
            {worst
              ? `${worst.name} is costing you the most — ${worst.winRate}% win rate and ${worst.expectancy.toFixed(2)}R expectancy over ${worst.trades} trades.`
              : "Not enough data yet."}
          </div>
        </div>
      </Panel>
        </>
      )}
    </div>

  );
}
