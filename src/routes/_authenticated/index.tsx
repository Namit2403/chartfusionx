import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { OnboardingModal } from "@/components/onboarding-modal";
import { Panel, Pill, Stat } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { currency, equityCurve, stats, trades, weekdayPerf } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Performance Dashboard — ChartFusionX" },
      {
        name: "description",
        content:
          "Equity curve, win rate, expectancy and behavioral insight across every trade you log in ChartFusionX.",
      },
      { property: "og:title", content: "Performance Dashboard — ChartFusionX" },
      {
        property: "og:description",
        content: "Turn raw trade data into clear performance insight.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <OnboardingModal />
      <section className="panel-hero grid-lines overflow-hidden p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              The AI trading coach built for traders who are still learning.
            </div>
            <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
              Log your trades. Get AI feedback. Understand exactly why you win and lose.
            </h1>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/journal/new">Log your first trade</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/ai-review">Get AI feedback</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Net P&L (month)
            </div>
            <div className="num mt-1 text-3xl font-semibold text-positive">
              {currency(stats.monthlyPnl)}
            </div>
            <div className="mt-2 flex gap-2">
              <Pill tone="positive">+{stats.accountGrowth.toFixed(2)}% growth</Pill>
              <Pill tone="accent">{stats.streak} win streak</Pill>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Total profit" value={currency(stats.totalPnl)} tone="positive" />
        <Stat label="Win rate" value={`${stats.winRate.toFixed(1)}%`} delta={`${stats.totalTrades} trades`} />
        <Stat label="Average R" value={`${stats.avgR.toFixed(2)}R`} tone="positive" />
        <Stat label="Profit factor" value={stats.profitFactor.toFixed(2)} />
        <Stat label="Max drawdown" value={currency(stats.maxDrawdown)} tone="negative" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Equity curve" subtitle="Cumulative account balance" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} width={60} domain={["dataMin - 200", "dataMax + 200"]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#eq)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Weekday performance" subtitle="Net P&L by day of week">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayPerf}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} width={48} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="pnl" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Recent trades"
          subtitle="Last five entries in your journal"
          className="lg:col-span-2"
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/journal">View all</Link>
            </Button>
          }
        >
          <div className="divide-y divide-border">
            {trades.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-4 py-3">
                <div className="w-20 shrink-0">
                  <div className="text-sm font-medium">{t.asset}</div>
                  <div className="text-[11px] text-muted-foreground">{t.date}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-muted-foreground">{t.strategy}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Pill>{t.session}</Pill>
                    <Pill>{t.direction}</Pill>
                  </div>
                </div>
                <Pill tone={t.grade.startsWith("A") ? "positive" : t.grade.startsWith("B") ? "accent" : "negative"}>
                  {t.grade}
                </Pill>
                <div className={`num w-24 text-right text-sm font-semibold ${t.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                  {currency(t.pnl)}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="AI insight of the day" subtitle="Generated from your last 40 trades">
          <p className="text-sm leading-relaxed text-foreground">
            Waiting for a confirmation close improves your average result by{" "}
            <span className="text-accent">0.7R</span>. Every Momentum entry you took without
            confirmation this month closed negative.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Break &amp; Retest expectancy: <span className="num text-positive">+2.16R</span></li>
            <li>Momentum expectancy: <span className="num text-negative">-1.07R</span></li>
            <li>Revenge trades this month: <span className="num text-negative">1</span></li>
          </ul>
          <Button asChild className="mt-5 w-full" variant="secondary">
            {user ? (
              <Link to="/strategy-discovery">See strategy discovery</Link>
            ) : (
              <Link to="/signup">Unlock strategy discovery</Link>
            )}
          </Button>
        </Panel>
      </div>
    </div>
  );
}
