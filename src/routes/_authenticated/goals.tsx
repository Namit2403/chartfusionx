import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, Panel, Pill } from "@/components/shell";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

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

const goals = [
  { name: "Maximum 3 trades per day", progress: 86, streak: "12 days" },
  { name: "Maximum 2% daily risk", progress: 94, streak: "21 days" },
  { name: "Journal every trade same day", progress: 71, streak: "5 days" },
  { name: "No revenge trading", progress: 92, streak: "15 days" },
  { name: "Follow playbook rules", progress: 78, streak: "8 days" },
];

const habits = ["Sleep 7+ hours", "Exercise", "Meditation", "Pre-market prep", "Evening review"];

function Goals() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Module 10"
        title="Goals & Habit Tracking"
        description="Improvement goals and daily habits, correlated against your performance by the AI."
        action={<Button variant="secondary">New goal</Button>}
      />

      <Panel title="Active goals">
        <div className="space-y-5">
          {goals.map((g) => (
            <div key={g.name}>
              <div className="flex items-center justify-between text-sm">
                <span>{g.name}</span>
                <span className="flex items-center gap-3">
                  <Pill tone="accent">{g.streak}</Pill>
                  <span className="num text-muted-foreground">{g.progress}%</span>
                </span>
              </div>
              <Progress value={g.progress} className="mt-2" />
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Today's habits">
          <div className="space-y-3">
            {habits.map((h, i) => (
              <label key={h} className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox defaultChecked={i < 3} />
                {h}
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="AI habit correlation">
          <ul className="space-y-3 text-sm leading-relaxed">
            <li>
              Days with <span className="text-accent">7+ hours sleep</span> average{" "}
              <span className="num text-positive">+0.9R</span> vs{" "}
              <span className="num text-negative">-0.3R</span> otherwise.
            </li>
            <li>
              Skipping pre-market prep raises your rule-break rate from 9% to{" "}
              <span className="text-negative">34%</span>.
            </li>
            <li>
              Your best month coincided with 18 consecutive days of same-day journaling.
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
