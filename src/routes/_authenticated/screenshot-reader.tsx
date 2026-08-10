import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";

import { EmptyHint, PageHeader, Panel, Pill } from "@/components/shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/screenshot-reader")({
  head: () => ({
    meta: [
      { title: "AI Screenshot Reader — ChartFusionX" },
      {
        name: "description",
        content:
          "Upload chart screenshots from TradingView, MetaTrader or any broker and let the AI read structure, liquidity and setup quality.",
      },
      { property: "og:title", content: "AI Screenshot Reader — ChartFusionX" },
      { property: "og:description", content: "The AI reads your charts, whatever platform you use." },
    ],
  }),
  component: ScreenshotReader,
});

const detections = [
  ["Market trend", "Bullish, higher-timeframe aligned"],
  ["Support & resistance", "3 levels mapped, 1 within 12 pips"],
  ["Break of structure", "Confirmed at 09:45"],
  ["Change of character", "None on current timeframe"],
  ["Liquidity zones", "Equal highs above entry"],
  ["Supply & demand", "Demand base at 1.0821"],
  ["Fair value gaps", "One unfilled FVG below price"],
  ["Order blocks", "Bullish OB tested once"],
  ["Trendlines", "Ascending, respected 4 times"],
  ["Entry area", "Retest of broken resistance"],
  ["Stop placement", "Below demand base"],
  ["Target area", "Prior swing high"],
];

function ScreenshotReader() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 05"
        title="AI Screenshot Reader"
        description="ChartFusionX doesn't replace your charting platform. Upload a screenshot from TradingView, MetaTrader or your broker and the AI explains what it sees."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-2" title="Upload chart">
          <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/40 text-center">
            <Upload className="size-5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Drop a screenshot or click to browse</div>
            <Button size="sm" variant="secondary">Choose file</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>TradingView</Pill>
            <Pill>MetaTrader</Pill>
            <Pill>Broker platforms</Pill>
            <Pill>Other tools</Pill>
          </div>
        </Panel>

        <Panel className="lg:col-span-3" title="Detected on chart" subtitle="Sample output from your last upload">
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {detections.map(([k, v]) => (
              <div key={k} className="border-b border-border pb-2">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{k}</div>
                <div className="mt-0.5 text-sm">{v}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="AI explanation">
        <p className="text-sm leading-relaxed">
          Price broke the London range high, retraced into the demand base and held. The structure
          matches your <span className="text-accent">Break &amp; Retest</span> playbook entry
          criteria, but equal highs sit directly above your target — the same condition present in 3
          of your last 5 trades that gave back more than 1R before reaching target.
        </p>
        <EmptyHint>
          Historical similarity: 82% match with T-1006 (XAUUSD, London, +2.4R) and 71% match with
          T-1010 (EURUSD, London, -1.0R).
        </EmptyHint>
      </Panel>
    </div>
  );
}
