import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PageHeader, Panel, Pill } from "@/components/shell";
import { currency, trades } from "@/lib/mock-data";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Trade Gallery — ChartFusionX" },
      {
        name: "description",
        content:
          "A searchable visual library of every trade, filterable by strategy, session, emotion, AI grade and outcome.",
      },
      { property: "og:title", content: "Trade Gallery — ChartFusionX" },
      { property: "og:description", content: "Show all A+ London session trades. Show every FOMO loss." },
    ],
  }),
  component: Gallery,
});

const filters = ["All", "Wins", "Losses", "A+ Setup", "FOMO", "London", "Asian", "New York"] as const;

function Gallery() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");

  const shown = useMemo(() => {
    switch (active) {
      case "Wins":
        return trades.filter((t) => t.pnl > 0);
      case "Losses":
        return trades.filter((t) => t.pnl <= 0);
      case "All":
        return trades;
      default:
        return trades.filter((t) => t.session === active || t.tags.includes(active));
    }
  }, [active]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Module 12"
        title="Trade Gallery"
        description="Every trade with its charts, notes and AI grade — filterable the way you actually think about your trading."
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={
              active === f
                ? "rounded-full border border-primary bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary"
                : "rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <article key={t.id} className="panel overflow-hidden">
            <div className="grid-lines flex h-32 items-center justify-center border-b border-border bg-background/40 text-xs text-muted-foreground">
              chart snapshot · {t.timeframe}
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{t.asset}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t.date} · {t.session}
                  </div>
                </div>
                <Pill tone={t.grade.startsWith("A") ? "positive" : t.grade.startsWith("B") ? "accent" : "negative"}>
                  {t.grade}
                </Pill>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{t.note}</p>
              <div className="flex flex-wrap gap-1.5">
                {t.tags.map((tag) => (
                  <Pill key={tag}>{tag}</Pill>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="num text-xs text-muted-foreground">{t.r.toFixed(2)}R</span>
                <span className={`num text-sm font-semibold ${t.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                  {currency(t.pnl)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
