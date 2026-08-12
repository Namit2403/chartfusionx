import { createFileRoute } from "@tanstack/react-router";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { NoTradesYet } from "@/components/no-trades-yet";
import { PageHeader, Panel, ScoreBar } from "@/components/shell";
import { useTradeData } from "@/hooks/useTradeData";
import { RiskDisclaimer } from "@/components/risk-disclaimer";


export const Route = createFileRoute("/_authenticated/trader-dna")({
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
  const { dnaScores, isEmpty } = useTradeData();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 09"
        title="Trader DNA"
        description="A behavioral profile that evolves with every trade you log."
      />

      <RiskDisclaimer />

      {isEmpty && (
        <NoTradesYet
          title="Your Trader DNA builds from your own trades"
          description="Discipline, patience and emotional control are scored from the psychology fields you fill in when logging trades."
        />
      )}

      {!isEmpty && (
        <>


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
        </>
      )}
    </div>

  );
}
