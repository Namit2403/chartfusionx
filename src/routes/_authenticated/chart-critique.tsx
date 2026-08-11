import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X } from "lucide-react";

import { ChartUpload, type UploadedChart } from "@/components/chart-upload";
import { useAiAction } from "@/hooks/useAiAction";
import { EmptyHint, PageHeader, Panel, ScoreBar } from "@/components/shell";
import { Button } from "@/components/ui/button";


export const Route = createFileRoute("/_authenticated/chart-critique")({
  head: () => ({
    meta: [
      { title: "AI Chart Critique — ChartFusionX" },
      {
        name: "description",
        content:
          "Before you enter, upload the setup and the AI scores it against your own strategy rules and trading history.",
      },
      { property: "og:title", content: "AI Chart Critique — ChartFusionX" },
      {
        property: "og:description",
        content: "Pre-trade setup scoring based on your own rules, not market predictions.",
      },
    ],
  }),
  component: ChartCritique,
});

const passed = ["Trend aligned with 4h structure", "Risk-reward 1:2.8", "Confirmation candle closed"];
const failed = ["Resistance 12 pips above entry", "Entry timing 8 min late vs your average"];

function ChartCritique() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 06"
        title="AI Chart Critique"
        description="The AI does not predict the market. It evaluates whether the trade in front of you follows your own strategy and your historical behavior."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Pre-trade setup">
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/40 text-center">
            <Upload className="size-5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Upload the chart you're about to trade</div>
            <Button size="sm" variant="secondary">Choose file</Button>
          </div>
        </Panel>

        <Panel title="Execution score">
          <div className="flex items-baseline gap-2">
            <span className="num text-4xl font-semibold text-primary">8.4</span>
            <span className="text-sm text-muted-foreground">/ 10 setup quality</span>
          </div>
          <div className="mt-5 space-y-4">
            <ScoreBar label="Market direction" value={88} />
            <ScoreBar label="Structure quality" value={81} />
            <ScoreBar label="Trend strength" value={76} />
            <ScoreBar label="Setup quality" value={84} />
          </div>
        </Panel>
      </div>

      <Panel title="Strategy checklist" subtitle="Measured against your Break & Retest playbook">
        <div className="grid gap-3 sm:grid-cols-2">
          {passed.map((p) => (
            <div key={p} className="flex gap-3 rounded-lg border border-positive/25 bg-positive/5 p-3 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-positive" />
              {p}
            </div>
          ))}
          {failed.map((p) => (
            <div key={p} className="flex gap-3 rounded-lg border border-negative/25 bg-negative/5 p-3 text-sm">
              <X className="mt-0.5 size-4 shrink-0 text-negative" />
              {p}
            </div>
          ))}
        </div>
        <EmptyHint>
          When resistance sits within 15 pips of entry, your historical win rate drops from 68% to
          44%. Consider reducing size or waiting for the level to clear.
        </EmptyHint>
      </Panel>
    </div>
  );
}
