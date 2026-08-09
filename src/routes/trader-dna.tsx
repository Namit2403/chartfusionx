import { createFileRoute } from "@tanstack/react-router";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { PageHeader, Panel, ScoreBar } from "@/components/shell";
import { dnaScores } from "@/lib/mock-data";

export const Route = createFileRoute("/trader-dna")({
  head: () => ({
    meta: [
      { title: "Trader DNA — ChartFusionX" },
      {
        name: "description",
        content:
          "A personal trader profile scoring discipline, patience, risk management and emotional control as it evolves.",
      },
      { property: "og:title", content: "Trader DNA — ChartFusionX" },
      { property: "og:description", content: "Your evolving behavioral trading profile." },
    ],
  }),
  component: TraderDna,
});

function TraderDna() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 09"
        title="Trader DNA"
        description="A behavioral profile that evolves with every trade you log. Your discipline score improved from 71 to 82 this month."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Profile shape">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={dnaScores.map((d) => ({ subject: d.label, value: d.value }))}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                />
                <Radar
                  dataKey="value"
                  stroke="var(--color-primary)"
                  fill="var(--color-primary)"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Scores" subtitle="Change vs last month">
          <div className="space-y-5">
            {dnaScores.map((d) => (
              <ScoreBar key={d.label} label={d.label} value={d.value} delta={d.delta} />
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="What changed">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Discipline +11", "You stopped trading after your daily loss limit on 4 of 5 days."],
            ["Emotional control -4", "Two entries logged with FOMO after missing an initial move."],
            ["Consistency +6", "Risk per trade stayed within 0.5–0.75% on 11 of 12 trades."],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-background/40 p-4">
              <div className="text-sm font-semibold">{k}</div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{v}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
