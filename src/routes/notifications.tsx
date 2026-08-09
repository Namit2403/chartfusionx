import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

import { PageHeader, Panel } from "@/components/shell";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/notifications")({
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

const feed = [
  { icon: AlertTriangle, tone: "text-negative", text: "You usually perform worse after 3 consecutive losses. Consider stopping for the day.", time: "12m ago" },
  { icon: Clock, tone: "text-accent", text: "You haven't completed your trade journal today.", time: "1h ago" },
  { icon: TrendingUp, tone: "text-positive", text: "Your London session has historically been your strongest — it opens in 40 minutes.", time: "3h ago" },
  { icon: CheckCircle2, tone: "text-positive", text: "You followed your playbook for 15 trades straight.", time: "Yesterday" },
];

const settings = [
  "Loss streak warnings",
  "Daily journaling reminder",
  "Session strength alerts",
  "Risk limit breaches",
  "Playbook streak milestones",
  "Weekly voice summary ready",
];

function Notifications() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Module 15"
        title="Smart Notifications"
        description="AI-powered reminders driven by your own behavioral patterns, not generic alerts."
      />

      <Panel title="Recent">
        <div className="divide-y divide-border">
          {feed.map((n) => (
            <div key={n.text} className="flex gap-3 py-3">
              <n.icon className={`mt-0.5 size-4 shrink-0 ${n.tone}`} />
              <div className="min-w-0 flex-1 text-sm leading-relaxed">{n.text}</div>
              <div className="shrink-0 text-[11px] text-muted-foreground">{n.time}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Preferences">
        <div className="space-y-4">
          {settings.map((s, i) => (
            <div key={s} className="flex items-center justify-between text-sm">
              <span>{s}</span>
              <Switch defaultChecked={i !== 4} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
