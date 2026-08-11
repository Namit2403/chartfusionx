import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { NoTradesYet } from "@/components/no-trades-yet";
import { PageHeader, Panel, Pill } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTradeData } from "@/hooks/useTradeData";
import { currency } from "@/lib/mock-data";


export const Route = createFileRoute("/_authenticated/journal/")({
  head: () => ({
    meta: [
      { title: "Smart Trading Journal — ChartFusionX" },
      {
        name: "description",
        content:
          "Log entries, exits, risk, psychology and attachments for every trade. The foundation ChartFusionX AI learns from.",
      },
      { property: "og:title", content: "Smart Trading Journal — ChartFusionX" },
      {
        property: "og:description",
        content: "Every detail of your trading process, in one searchable journal.",
      },
    ],
  }),
  component: Journal,
});

function Journal() {
  const { trades, isEmpty } = useTradeData();
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return trades;
    return trades.filter((t) =>
      [t.asset, t.strategy, t.session, t.direction, t.grade, ...t.tags]
        .join(" ")
        .toLowerCase()
        .includes(s),
    );
  }, [q, trades]);


  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Module 01"
        title="Smart Trading Journal"
        description="Every feature in ChartFusionX learns from the data you record here. The more trades you log, the more personalized the AI becomes."
        action={
          <Button asChild>
            <Link to="/journal/new">New trade</Link>
          </Button>
        }
      />

      {isEmpty && (
        <NoTradesYet
          title="Your journal is empty"
          description="Log your first trade to start building the history every AI feature learns from."
        />
      )}

      <div className={isEmpty ? "hidden" : "flex flex-wrap items-center gap-3"}>

        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by asset, strategy, session, tag…"
          className="max-w-sm"
        />
        <div className="text-xs text-muted-foreground">
          {filtered.length} of {trades.length} trades
        </div>
      </div>

      <Panel className={isEmpty ? "hidden" : "overflow-x-auto p-0"}>
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Strategy</th>
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">Dir</th>
              <th className="px-4 py-3 font-medium">Risk</th>
              <th className="px-4 py-3 font-medium">R</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 text-right font-medium">P&amp;L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-muted/50">
                <td className="num px-4 py-3 text-muted-foreground">{t.date}</td>
                <td className="px-4 py-3 font-medium">{t.asset}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.strategy}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.session}</td>
                <td className="px-4 py-3">
                  <Pill tone={t.direction === "Long" ? "positive" : "negative"}>{t.direction}</Pill>
                </td>
                <td className="num px-4 py-3 text-muted-foreground">{t.riskPct.toFixed(2)}%</td>
                <td className={`num px-4 py-3 ${t.r >= 0 ? "text-positive" : "text-negative"}`}>
                  {t.r.toFixed(2)}R
                </td>
                <td className="px-4 py-3">
                  <Pill tone={t.grade.startsWith("A") ? "positive" : t.grade.startsWith("B") ? "accent" : "negative"}>
                    {t.grade}
                  </Pill>
                </td>
                <td className={`num px-4 py-3 text-right font-semibold ${t.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                  {currency(t.pnl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
