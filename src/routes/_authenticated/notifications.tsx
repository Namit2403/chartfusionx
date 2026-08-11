import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader, Panel } from "@/components/shell";
import { Switch } from "@/components/ui/switch";
import { useTradeData } from "@/hooks/useTradeData";
import { computeRuleAdherence } from "@/lib/trade-stats";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Smart Notifications — ChartFusionX" },
      {
        name: "description",
        content:
          "Behavior-aware reminders: loss streak warnings, journaling nudges and session strength alerts.",
      },
      { property: "og:title", content: "Smart Notifications — ChartFusionX" },
      { property: "og:description", content: "Reminders based on how you actually trade." },
    ],
  }),
  component: Notifications,
});

const SETTINGS = [
  "Loss streak warnings",
  "Daily journaling reminder",
  "Session strength alerts",
  "Risk limit breaches",
  "Playbook streak milestones",
  "Weekly voice summary ready",
];
const STORAGE_KEY = "cfx-notification-prefs";

function Notifications() {
  const { trades, stats, sessionPerf, isEmpty, loading } = useTradeData();
  const [off, setOff] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOff(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = (key: string) => {
    setOff((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const today = new Date().toISOString().slice(0, 10);
  const adherence = computeRuleAdherence(trades);
  const bestSession = [...sessionPerf].sort((a, b) => b.pnl - a.pnl)[0];
  const journalRule = adherence.find((a) => a.name.startsWith("Journal"));

  const feed: { icon: typeof AlertTriangle; tone: string; text: string; time: string }[] = [];

  if (stats.streakType === "losing" && stats.streak >= 3) {
    feed.push({
      icon: AlertTriangle,
      tone: "text-negative",
      text: `You are on a ${stats.streak}-trade losing streak. Consider stepping away and reviewing your last entries.`,
      time: "Now",
    });
  }
  if (!trades.some((t) => t.date === today)) {
    feed.push({
      icon: Clock,
      tone: "text-accent",
      text: "You haven't logged a trade today. Same-day journaling keeps your data accurate.",
      time: "Today",
    });
  }
  if (bestSession && bestSession.pnl > 0) {
    feed.push({
      icon: TrendingUp,
      tone: "text-positive",
      text: `${bestSession.name} is your strongest session so far with a ${bestSession.winRate.toFixed(0)}% win rate.`,
      time: "From your data",
    });
  }
  if (stats.streakType === "winning" && stats.streak >= 3) {
    feed.push({
      icon: CheckCircle2,
      tone: "text-positive",
      text: `${stats.streak} winning trades in a row — keep executing the same rules.`,
      time: "Now",
    });
  }
  if (journalRule && journalRule.progress < 100) {
    feed.push({
      icon: AlertTriangle,
      tone: "text-accent",
      text: `Only ${journalRule.detail} include journal notes. Add notes so the AI review has context.`,
      time: "From your data",
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Module 15"
        title="Smart Notifications"
        description="Alerts generated from your own logged behaviour — not generic reminders."
      />

      <Panel title="Recent">
        {loading ? (
          <p className="text-sm text-muted-foreground">Checking your activity…</p>
        ) : isEmpty || feed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No alerts yet. Once you log trades, warnings about loss streaks, risk breaches and
            missed journaling appear here.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {feed.map((n) => (
              <div key={n.text} className="flex gap-3 py-3">
                <n.icon className={`mt-0.5 size-4 shrink-0 ${n.tone}`} />
                <div className="min-w-0 flex-1 text-sm leading-relaxed">{n.text}</div>
                <div className="shrink-0 text-[11px] text-muted-foreground">{n.time}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Preferences">
        <div className="space-y-4">
          {SETTINGS.map((s) => (
            <div key={s} className="flex items-center justify-between text-sm">
              <span>{s}</span>
              <Switch checked={!off.includes(s)} onCheckedChange={() => toggle(s)} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
