import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";

import { NoTradesYet } from "@/components/no-trades-yet";
import { PageHeader, Panel, Pill } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { useTradeData } from "@/hooks/useTradeData";
import { currency } from "@/lib/mock-data";


export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — ChartFusionX" },
      {
        name: "description",
        content:
          "Generate weekly, monthly, quarterly and yearly trading reviews and export them to PDF, CSV or Excel.",
      },
      { property: "og:title", content: "Reports & Analytics — ChartFusionX" },
      { property: "og:description", content: "Professional trading reviews, generated for you." },
    ],
  }),
  component: Reports,
});

const periods = ["Weekly review", "Monthly review", "Quarterly review", "Yearly review"];
const contents = [
  "Performance",
  "Strategy analysis",
  "Risk analysis",
  "Mistake patterns",
  "Emotional trends",
  "Improvement areas",
];

function Reports() {
  const { trades, stats, strategyPerf, sessionPerf, isEmpty } = useTradeData();
  const monthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const bestStrategy = [...strategyPerf].sort((a, b) => b.pnl - a.pnl)[0];
  const bestSession = [...sessionPerf].sort((a, b) => b.pnl - a.pnl)[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Module 13"
        title="Reports & Analytics"
        description="Professional reviews built from your journal, ready to export or share with a mentor."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={isEmpty}>
              <Download className="mr-2 size-4" /> PDF
            </Button>
            <Button variant="secondary" size="sm" disabled={isEmpty}>CSV</Button>
            <Button variant="secondary" size="sm" disabled={isEmpty}>Excel</Button>
          </div>
        }
      />

      {isEmpty && (
        <NoTradesYet
          title="No reports yet"
          description="Weekly, monthly and yearly reviews generate automatically once your journal has trades in it."
        />
      )}

      {!isEmpty && (
        <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {periods.map((p) => (
          <button key={p} className="panel p-4 text-left transition-colors hover:border-primary">
            <div className="text-sm font-medium">{p}</div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              Built from {trades.length} logged {trades.length === 1 ? "trade" : "trades"}
            </div>
          </button>
        ))}
      </div>

      <Panel
        title={`Monthly review — ${monthLabel}`}
        subtitle={`Auto-generated from ${trades.length} logged ${trades.length === 1 ? "trade" : "trades"}`}
      >
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ["Net P&L", currency(stats.monthlyPnl)],
            ["Win rate", `${stats.winRate.toFixed(1)}%`],
            ["Expectancy", `${stats.expectancy.toFixed(2)}R`],
            ["Max drawdown", currency(stats.maxDrawdown)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border bg-background/40 p-3">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{k}</div>
              <div className="num mt-1 text-sm font-semibold">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {contents.map((c) => (
            <Pill key={c}>{c}</Pill>
          ))}
        </div>

        <div className="mt-5 space-y-3 text-sm leading-relaxed">
          <p>
            <span className="text-accent">Performance.</span> Net P&L of{" "}
            <span className="num">{currency(stats.monthlyPnl)}</span> across {trades.length}{" "}
            {trades.length === 1 ? "trade" : "trades"}
            {bestStrategy ? `, led by ${bestStrategy.name}` : ""}
            {bestSession ? ` in the ${bestSession.name} session.` : "."}
          </p>
          <p>
            <span className="text-accent">Risk.</span> Average risk per trade was{" "}
            <span className="num">{stats.avgRiskPct.toFixed(2)}%</span> with a max drawdown of{" "}
            <span className="num">{currency(stats.maxDrawdown)}</span>.
          </p>
          <p>
            <span className="text-accent">Behavior.</span> Average winner{" "}
            <span className="num">{currency(stats.avgWinner)}</span> versus average loser{" "}
            <span className="num">{currency(stats.avgLoser)}</span>.
          </p>
        </div>
      </Panel>
        </>
      )}
    </div>

  );
}
