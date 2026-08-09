import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";

import { PageHeader, Panel, Pill } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { currency, stats } from "@/lib/mock-data";

export const Route = createFileRoute("/reports")({
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
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Module 13"
        title="Reports & Analytics"
        description="Professional reviews built from your journal, ready to export or share with a mentor."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Download className="mr-2 size-4" /> PDF
            </Button>
            <Button variant="secondary" size="sm">CSV</Button>
            <Button variant="secondary" size="sm">Excel</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {periods.map((p, i) => (
          <button key={p} className="panel p-4 text-left transition-colors hover:border-primary">
            <div className="text-sm font-medium">{p}</div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              {i === 0 ? "Ready · Aug 3–9" : i === 1 ? "Ready · August" : "Generates at period end"}
            </div>
          </button>
        ))}
      </div>

      <Panel title="Monthly review — August 2026" subtitle="Auto-generated from 12 logged trades">
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
            <span className="text-accent">Performance.</span> August is your strongest month on
            record, driven almost entirely by Break &amp; Retest setups in the London and Asian
            sessions.
          </p>
          <p>
            <span className="text-accent">Risk.</span> Average risk stayed at{" "}
            <span className="num">{stats.avgRiskPct.toFixed(2)}%</span>, but you doubled size twice
            after winners — both trades lost.
          </p>
          <p>
            <span className="text-accent">Behavior.</span> One revenge trade, down from four in July.
            Early entries remain the single largest source of loss.
          </p>
        </div>
      </Panel>
    </div>
  );
}
