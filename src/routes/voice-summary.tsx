import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";
import { useState } from "react";

import { PageHeader, Panel, Pill } from "@/components/shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/voice-summary")({
  head: () => ({
    meta: [
      { title: "AI Voice Trading Summary — ChartFusionX" },
      {
        name: "description",
        content:
          "Listen to a weekly or monthly spoken recap of your trading performance, mistakes and goals.",
      },
      { property: "og:title", content: "AI Voice Trading Summary — ChartFusionX" },
      { property: "og:description", content: "Listen to your trading week instead of reading it." },
    ],
  }),
  component: VoiceSummary,
});

const sections = [
  ["Trades completed", "27 trades, 6 more than last week"],
  ["Performance change", "+$614.75, a 5.2% account gain"],
  ["Biggest improvement", "Zero revenge trades — down from 4"],
  ["Biggest mistake", "Entering breakouts before confirmation"],
  ["Strategy performance", "Break & Retest carried the week at +2.16R expectancy"],
  ["Psychological pattern", "Confidence drops sharply after two losses"],
  ["Goal for next period", "Cap daily trades at 3 and log every entry reason"],
];

function VoiceSummary() {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Module 07"
        title="AI Voice Trading Summary"
        description="A personal assistant that narrates your weekly and monthly performance so you can review on the move."
      />

      <Panel className="panel-hero">
        <div className="flex flex-wrap items-center gap-5">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
            aria-label={playing ? "Pause summary" : "Play summary"}
          >
            {playing ? <Pause className="size-6" /> : <Play className="size-6" />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">Week of Aug 3 – Aug 9, 2026</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={playing ? "h-full w-1/3 rounded-full bg-primary" : "h-full w-0 bg-primary"} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">4 min 12 sec · generated this morning</div>
          </div>
          <div className="flex gap-2">
            <Pill tone="accent">Weekly</Pill>
            <Pill>Monthly</Pill>
          </div>
        </div>
      </Panel>

      <Panel title="Transcript">
        <p className="text-sm leading-relaxed">
          "This week you completed 27 trades. Your discipline improved because you avoided revenge
          trading entirely. Your biggest weakness was entering too early on breakout setups — five of
          your seven losses came from entries taken before a confirmation close."
        </p>
        <div className="mt-5 divide-y divide-border">
          {sections.map(([k, v]) => (
            <div key={k} className="flex flex-wrap gap-2 py-3 text-sm">
              <span className="w-48 shrink-0 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {k}
              </span>
              <span className="min-w-0 flex-1">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" size="sm">Download audio</Button>
          <Button variant="ghost" size="sm">Regenerate</Button>
        </div>
      </Panel>
    </div>
  );
}
