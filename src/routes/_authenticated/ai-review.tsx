import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";

import { PageHeader, Panel, Pill, ScoreBar } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { currency, trades } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/ai-review")({
  head: () => ({
    meta: [
      { title: "AI Trade Review — ChartFusionX" },
      {
        name: "description",
        content:
          "Your AI trading coach grades entry quality, risk management, execution and psychology after every trade.",
      },
      { property: "og:title", content: "AI Trade Review — ChartFusionX" },
      {
        property: "og:description",
        content: "A graded, personalized review of every trade you take.",
      },
    ],
  }),
  component: AiReview,
});

const strengths = [
  "Strong setup selection — matched your playbook's Break & Retest criteria",
  "Risk sized at 0.50%, consistent with your last 20 trades",
  "Stop placed behind structure, not at an arbitrary distance",
];
const mistakes = [
  "Entered before the confirmation candle closed",
  "Took profit at 1.4R when your average winner runs to 2.3R",
  "Ignored higher timeframe resistance 12 pips above entry",
];

export default function AiReview() {
  const trade = trades[0]!;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 03 · Core feature"
        title="AI Trade Review"
        description="After every trade, the AI reads your data, notes, emotions, screenshots, playbook rules and full history — then reviews your execution like a coach would."
        action={<Button>Review latest trade</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title={`${trade.asset} · ${trade.strategy}`} subtitle={`${trade.date} · ${trade.session} session · ${trade.timeframe}`}>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ["P&L", currency(trade.pnl)],
              ["R multiple", `${trade.r.toFixed(2)}R`],
              ["Risk", `${trade.riskPct.toFixed(2)}%`],
              ["Duration", `${Math.round(trade.durationMin / 60)}h ${trade.durationMin % 60}m`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-background/40 p-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{k}</div>
                <div className="num mt-1 text-sm font-semibold">{v}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{trade.note}</p>
        </Panel>

        <Panel title="Trade grade" subtitle="Weighted across four review dimensions">
          <div className="flex items-center gap-4">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/15 text-3xl font-semibold text-primary">
              A-
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Entry quality · 8.6</div>
              <div>Risk management · 9.1</div>
              <div>Execution · 7.2</div>
              <div>Psychology · 8.0</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Strengths">
          <ul className="space-y-3">
            {strengths.map((s) => (
              <li key={s} className="flex gap-3 text-sm text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-positive" />
                {s}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Mistakes">
          <ul className="space-y-3">
            {mistakes.map((s) => (
              <li key={s} className="flex gap-3 text-sm text-foreground">
                <X className="mt-0.5 size-4 shrink-0 text-negative" />
                {s}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Review dimensions" className="lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <ScoreBar label="Entry quality" value={86} />
            <ScoreBar label="Risk management" value={91} />
            <ScoreBar label="Rule adherence" value={78} />
            <ScoreBar label="Exit timing" value={64} />
            <ScoreBar label="Patience" value={72} />
            <ScoreBar label="Emotional control" value={80} />
          </div>
        </Panel>

        <Panel title="Psychology flags">
          <div className="flex flex-wrap gap-2">
            <Pill tone="positive">No FOMO detected</Pill>
            <Pill tone="positive">No revenge pattern</Pill>
            <Pill tone="accent">Mild impatience at entry</Pill>
            <Pill tone="negative">Early profit-taking</Pill>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground">
            Your last 40 trades show that waiting for confirmation improves your average result by{" "}
            <span className="text-accent">0.7R</span>.
          </p>
        </Panel>
      </div>
    </div>
  );
}
