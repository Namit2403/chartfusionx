import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PageHeader, Panel, Pill } from "@/components/shell";
import { NoTradesYet } from "@/components/no-trades-yet";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useTradeData } from "@/hooks/useTradeData";
import { computeRuleAdherence } from "@/lib/trade-stats";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Goals & Habit Tracking — ChartFusionX" },
      {
        name: "description",
        content:
          "Set trading rules and life habits, then let the AI connect your routines with your performance patterns.",
      },
      { property: "og:title", content: "Goals & Habit Tracking — ChartFusionX" },
      { property: "og:description", content: "Connect your habits to your trading results." },
    ],
  }),
  component: Goals,
});

const HABITS = ["Sleep 7+ hours", "Exercise", "Meditation", "Pre-market prep", "Evening review"];
const STORAGE_KEY = "cfx-habits";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function Goals() {
  const { trades, stats, sessionPerf, isEmpty, loading } = useTradeData();
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as { date: string; habits: string[] }) : null;
      if (parsed?.date === todayKey()) setChecked(parsed.habits);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = (habit: string) => {
    setChecked((prev) => {
      const next = prev.includes(habit) ? prev.filter((h) => h !== habit) : [...prev, habit];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), habits: next }));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const goals = computeRuleAdherence(trades);
  const bestSession = [...sessionPerf].sort((a, b) => b.pnl - a.pnl)[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Module 10"
        title="Goals & Habit Tracking"
        description="Your rule compliance is measured directly from the trades you log — nothing here is sample data."
      />

      {loading ? (
        <Panel>
          <p className="text-sm text-muted-foreground">Loading your goals…</p>
        </Panel>
      ) : isEmpty ? (
        <NoTradesYet
          title="No rule tracking yet"
          description="Log a trade and your rule compliance — trades per day, risk per trade, journaling, emotional control — is scored automatically."
        />
      ) : (
        <Panel title="Rule compliance" subtitle={`Across ${trades.length} logged trades`}>
          <div className="space-y-5">
            {goals.map((g) => (
              <div key={g.name}>
                <div className="flex items-center justify-between text-sm">
                  <span>{g.name}</span>
                  <span className="flex items-center gap-3">
                    <Pill tone={g.progress >= 80 ? "positive" : "negative"}>{g.detail}</Pill>
                    <span className="num text-muted-foreground">{g.progress}%</span>
                  </span>
                </div>
                <Progress value={g.progress} className="mt-2" />
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Today's habits" subtitle="Checked habits are saved for today only">
          <div className="space-y-3">
            {HABITS.map((h) => (
              <label key={h} className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox checked={checked.includes(h)} onCheckedChange={() => toggle(h)} />
                {h}
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="What your data shows">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground">
              Correlations appear once you have logged trades to compare your routine against.
            </p>
          ) : (
            <ul className="space-y-3 text-sm leading-relaxed">
              <li>
                Average result per trade:{" "}
                <span className={`num ${stats.avgR >= 0 ? "text-positive" : "text-negative"}`}>
                  {stats.avgR.toFixed(2)}R
                </span>{" "}
                across {stats.totalTrades} trades.
              </li>
              <li>
                Win rate is <span className="num">{stats.winRate.toFixed(0)}%</span> with an average
                risk of <span className="num">{stats.avgRiskPct.toFixed(2)}%</span> per trade.
              </li>
              {bestSession && (
                <li>
                  Your strongest session so far is{" "}
                  <span className="text-accent">{bestSession.name}</span> at{" "}
                  <span className={`num ${bestSession.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                    {bestSession.pnl >= 0 ? "+" : ""}
                    {bestSession.pnl.toFixed(0)}
                  </span>
                  .
                </li>
              )}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
