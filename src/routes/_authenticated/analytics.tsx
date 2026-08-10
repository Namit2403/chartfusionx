import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, Panel, Stat } from "@/components/shell";
import { currency, sessionPerf, stats, weekdayPerf } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Performance Analytics — ChartFusionX" },
      {
        name: "description",
        content:
          "Session, weekday, timeframe and risk distribution analytics plus a win-rate heatmap and trading calendar.",
      },
      { property: "og:title", content: "Performance Analytics — ChartFusionX" },
      { property: "og:description", content: "Slice your performance every way that matters." },
    ],
  }),
  component: Analytics,
});

const risk = [
  { name: "0.25–0.5%", value: 4 },
  { name: "0.5–0.75%", value: 5 },
  { name: "0.75–1%", value: 2 },
  { name: "1%+", value: 1 },
];
const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

const heat = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => ({
  day: d,
  cells: ["Asian", "London", "New York"].map((s, j) => ({
    session: s,
    wr: [70, 82, 44, 61, 90, 35, 55, 76, 48, 68, 88, 40, 72, 66, 52][i * 3 + j]!,
  })),
}));

function Analytics() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Module 02"
        title="Performance Analytics"
        description="Equity, strategy, asset, session, weekday, timeframe, risk distribution and heatmaps — all derived from your journal."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Average winner" value={currency(stats.avgWinner)} tone="positive" />
        <Stat label="Average loser" value={currency(stats.avgLoser)} tone="negative" />
        <Stat label="Average hold" value={stats.avgHold} />
        <Stat label="Average risk" value={`${stats.avgRiskPct.toFixed(2)}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Weekday P&L" className="lg:col-span-2">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayPerf}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} width={52} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="pnl" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Risk distribution" subtitle="Trades by risk bucket">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={risk} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {risk.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Win rate heatmap" subtitle="Day × session" className="lg:col-span-2">
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <span />
              <span>Asian</span>
              <span>London</span>
              <span>New York</span>
            </div>
            {heat.map((row) => (
              <div key={row.day} className="grid grid-cols-4 items-center gap-2">
                <span className="text-xs text-muted-foreground">{row.day}</span>
                {row.cells.map((c) => (
                  <div
                    key={c.session}
                    className="num rounded-lg border border-border py-3 text-center text-xs"
                    style={{
                      background: `color-mix(in oklab, var(--color-primary) ${c.wr}%, transparent)`,
                    }}
                  >
                    {c.wr}%
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Session performance">
          <div className="space-y-4">
            {sessionPerf.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-sm">
                  <span>{s.name}</span>
                  <span className={`num ${s.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                    {currency(s.pnl)}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${s.winRate}%` }} />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{s.winRate}% win rate</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
