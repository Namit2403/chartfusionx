import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, Panel, Pill } from "@/components/shell";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/playbook")({
  head: () => ({
    meta: [
      { title: "Playbook Builder — ChartFusionX" },
      {
        name: "description",
        content:
          "Build your personal trading system: entry rules, exit rules, risk rules and invalidations the AI checks every trade against.",
      },
      { property: "og:title", content: "Playbook Builder — ChartFusionX" },
      { property: "og:description", content: "Codify your system, then hold yourself to it." },
    ],
  }),
  component: Playbook,
});

const plays = [
  {
    name: "Break & Retest",
    stats: "5 trades · 100% WR · +2.16R",
    entry: ["Session high/low broken with momentum", "Retest holds on lower timeframe", "Confirmation candle closes"],
    exit: ["Partial at 1R", "Runner to prior swing", "Full exit on CHoCH against position"],
    risk: ["0.5–0.75% per trade", "Stop behind structure", "Never move stop wider"],
    invalidations: ["Retest fails twice", "News within 15 minutes", "Range-bound higher timeframe"],
  },
  {
    name: "Momentum",
    stats: "3 trades · 0% WR · -1.07R",
    entry: ["Impulse leg with volume", "Enter on first pullback"],
    exit: ["Fixed 2R target"],
    risk: ["0.5% per trade"],
    invalidations: ["No pullback within 3 candles", "Entry taken after missing first leg"],
  },
  {
    name: "Swing Continuation",
    stats: "1 trade · 100% WR · +3.40R",
    entry: ["4h trend intact", "Daily demand zone tap"],
    exit: ["Trail below 4h structure"],
    risk: ["1% per trade, max 2 open swings"],
    invalidations: ["Daily close below zone"],
  },
];

function Playbook() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Module 11"
        title="Playbook Builder"
        description="Your personal trading system. Every logged trade is compared against these rules automatically."
        action={<Button>New strategy</Button>}
      />

      <Panel className="p-2">
        <Accordion type="single" collapsible defaultValue="Break & Retest">
          {plays.map((p) => (
            <AccordionItem key={p.name} value={p.name} className="border-border px-3">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex flex-1 flex-wrap items-center gap-3 pr-3 text-left">
                  <span className="font-medium">{p.name}</span>
                  <Pill tone={p.stats.includes("-") ? "negative" : "positive"}>{p.stats}</Pill>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-5 pb-2 sm:grid-cols-2">
                  {[
                    ["Entry rules", p.entry],
                    ["Exit rules", p.exit],
                    ["Risk rules", p.risk],
                    ["Invalidations", p.invalidations],
                  ].map(([title, items]) => (
                    <div key={title as string}>
                      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        {title as string}
                      </div>
                      <ul className="mt-2 space-y-1.5 text-sm">
                        {(items as string[]).map((i) => (
                          <li key={i} className="text-muted-foreground">
                            — {i}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Pill>3 example charts</Pill>
                  <Pill>1 video</Pill>
                  <Pill>Notes</Pill>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Panel>

      <Panel title="Playbook adherence" subtitle="How closely your trades matched their strategy">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["This week", "91%"],
            ["This month", "78%"],
            ["All time", "74%"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-background/40 p-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{k}</div>
              <div className="num mt-1 text-2xl font-semibold text-primary">{v}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
