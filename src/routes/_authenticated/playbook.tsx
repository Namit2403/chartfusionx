import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

import { PageHeader, Panel, Pill } from "@/components/shell";
import { NoTradesYet } from "@/components/no-trades-yet";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTradeData } from "@/hooks/useTradeData";
import { computeRuleAdherence } from "@/lib/trade-stats";
import type { Trade } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/playbook")({
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

function avg(nums: number[]) {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

function score(trades: Trade[]) {
  const rules = computeRuleAdherence(trades);
  return rules.length ? Math.round(avg(rules.map((r) => r.progress))) : 0;
}

function Playbook() {
  const { trades, strategyPerf, isEmpty, loading } = useTradeData();

  const plays = strategyPerf
    .map((s) => {
      const list = trades.filter((t) => t.strategy === s.name);
      return {
        name: s.name,
        stats: `${s.trades} trade${s.trades === 1 ? "" : "s"} · ${s.winRate.toFixed(0)}% WR · ${
          s.expectancy >= 0 ? "+" : ""
        }${s.expectancy.toFixed(2)}R`,
        positive: s.expectancy >= 0,
        reasons: [...new Set(list.map((t) => t.note.trim()).filter(Boolean))].slice(0, 4),
        tags: [...new Set(list.flatMap((t) => t.tags))].slice(0, 8),
        sessions: [...new Set(list.map((t) => t.session))],
        avgRisk: avg(list.map((t) => t.riskPct)),
        avgTarget: avg(list.map((t) => Math.abs(t.r))),
      };
    })
    .sort((a, b) => b.reasons.length - a.reasons.length);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString().slice(0, 10);
  const monthAgo = new Date(now.getTime() - 30 * 864e5).toISOString().slice(0, 10);
  const adherence: [string, string][] = [
    ["Last 7 days", `${score(trades.filter((t) => t.date >= weekAgo))}%`],
    ["Last 30 days", `${score(trades.filter((t) => t.date >= monthAgo))}%`],
    ["All time", `${score(trades)}%`],
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Module 11"
        title="Playbook Builder"
        description="Every strategy here is built from the trades you logged — rules, tags and stats come straight from your own journal."
        action={
          <Button asChild>
            <Link to="/journal/new">Log a trade</Link>
          </Button>
        }
      />

      {loading ? (
        <Panel>
          <p className="text-sm text-muted-foreground">Loading your playbook…</p>
        </Panel>
      ) : isEmpty || plays.length === 0 ? (
        <NoTradesYet
          title="Your playbook is empty"
          description="Log trades with a strategy name and your playbook builds itself — grouped setups, real win rates and expectancy per strategy."
        />
      ) : (
        <>
          <Panel className="p-2">
            <Accordion type="single" collapsible defaultValue={plays[0]?.name ?? ""}>
              {plays.map((p) => (
                <AccordionItem key={p.name} value={p.name} className="border-border px-3">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex flex-1 flex-wrap items-center gap-3 pr-3 text-left">
                      <span className="font-medium">{p.name}</span>
                      <Pill tone={p.positive ? "positive" : "negative"}>{p.stats}</Pill>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-5 pb-2 sm:grid-cols-2">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          Entry reasons you logged
                        </div>
                        <ul className="mt-2 space-y-1.5 text-sm">
                          {p.reasons.length ? (
                            p.reasons.map((r) => (
                              <li key={r} className="text-muted-foreground">
                                — {r}
                              </li>
                            ))
                          ) : (
                            <li className="text-muted-foreground">
                              — No entry reasons written yet
                            </li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                          Risk profile
                        </div>
                        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                          <li>— Average risk {p.avgRisk.toFixed(2)}% per trade</li>
                          <li>— Average outcome {p.avgTarget.toFixed(2)}R in absolute terms</li>
                          <li>— Sessions traded: {p.sessions.join(", ") || "—"}</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {p.tags.length ? (
                        p.tags.map((t) => <Pill key={t}>{t}</Pill>)
                      ) : (
                        <Pill>No tags yet</Pill>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Panel>

          <Panel title="Playbook adherence" subtitle="Average rule compliance across your trades">
            <div className="grid gap-4 sm:grid-cols-3">
              {adherence.map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-background/40 p-4">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {k}
                  </div>
                  <div className="num mt-1 text-2xl font-semibold text-primary">{v}</div>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
