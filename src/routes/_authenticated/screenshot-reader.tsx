import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ChartUpload, type UploadedChart } from "@/components/chart-upload";
import { useAiAction } from "@/hooks/useAiAction";
import { EmptyHint, PageHeader, Panel, Pill } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { RiskDisclaimer } from "@/components/risk-disclaimer";


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
  const [chart, setChart] = useState<UploadedChart | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const { run, checking } = useAiAction("screenshot-reader");

  async function analyze() {
    const ok = await run();
    if (ok) setAnalyzed(true);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 05"
        title="AI Screenshot Reader"
        description="ChartFusionX doesn't replace your charting platform. Upload a screenshot from TradingView, MetaTrader or your broker and the AI explains what it sees."
      />

      <RiskDisclaimer />

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-2" title="Upload chart">
          <ChartUpload
            value={chart}
            onChange={(c) => {
              setChart(c);
              setAnalyzed(false);
            }}
          />
          <Button className="mt-3 w-full" disabled={!chart || checking} onClick={() => void analyze()}>
            {checking ? "Checking…" : "Read this chart"}
          </Button>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>TradingView</Pill>
            <Pill>MetaTrader</Pill>
            <Pill>Broker platforms</Pill>
            <Pill>Other tools</Pill>
          </div>
        </Panel>

        <Panel className="lg:col-span-3" title="Detected on chart" subtitle={analyzed ? "From your upload" : "Upload a chart to run the reader"}>
          {analyzed ? (
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {detections.map(([k, v]) => (
                <div key={k} className="border-b border-border pb-2">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{k}</div>
                  <div className="mt-0.5 text-sm">{v}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint>
              Nothing read yet. Drop in a chart screenshot and run the reader to see structure,
              liquidity, entry and target detection.
            </EmptyHint>
          )}
        </Panel>
      </div>

      {analyzed && (
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
      )}
    </div>
  );

}
