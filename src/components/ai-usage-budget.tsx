import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { readUsageBudget, writeUsageBudget, type UsageBudget } from "@/lib/profile";
import { cn } from "@/lib/utils";

const MIN_CAP = 10;
const MAX_CAP = 500;
const CAP_STEP = 5;

type AlertLevel = "none" | "warn" | "critical";

function alertLevelFor(used: number, budget: UsageBudget): AlertLevel {
  if (budget.monthlyCap <= 0) return "none";
  const pct = (used / budget.monthlyCap) * 100;
  if (pct >= budget.criticalThreshold) return "critical";
  if (pct >= budget.warnThreshold) return "warn";
  return "none";
}

const LEVEL_STYLES: Record<AlertLevel, { badge: string; text: string; label: string }> = {
  none: {
    badge: "border-border bg-muted text-muted-foreground",
    text: "text-muted-foreground",
    label: "On budget",
  },
  warn: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-500",
    text: "text-amber-600 dark:text-amber-500",
    label: "Approaching budget",
  },
  critical: {
    badge: "border-destructive/30 bg-destructive/10 text-destructive",
    text: "text-destructive",
    label: "Over alert threshold",
  },
};

function ThresholdRow({
  label,
  description,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span data-testid="threshold-value" className="num text-sm font-semibold tabular-nums">
          {value}%
        </span>
      </div>
      <Slider
        className="mt-3"
        value={[value]}
        min={min}
        max={max}
        step={1}
        aria-label={label}
        onValueChange={([v]) => onChange(Math.min(max, Math.max(min, v ?? min)))}
      />
      <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

/**
 * AI Usage budget settings — monthly cap slider, alert thresholds and a
 * hard-stop toggle. Settings persist to the local `cfx-profile` store;
 * `used` comes from the caller (live counter via useSubscription).
 */
export function AiUsageBudget({ used }: { used: number }) {
  const [budget, setBudget] = useState<UsageBudget>(() => readUsageBudget());

  const update = (patch: Partial<UsageBudget>) => {
    const next = { ...budget, ...patch };
    // Keep critical >= warn so the two sliders can never invert the alerts.
    if (next.criticalThreshold < next.warnThreshold) {
      if (patch.warnThreshold !== undefined) next.criticalThreshold = next.warnThreshold;
      else next.warnThreshold = next.criticalThreshold;
    }
    writeUsageBudget(next);
    setBudget(next);
  };

  const pct = budget.monthlyCap > 0 ? (used / budget.monthlyCap) * 100 : 0;
  const level = alertLevelFor(used, budget);
  const style = LEVEL_STYLES[level];
  const remaining = Math.max(0, budget.monthlyCap - used);
  const hardStopped = budget.hardStop && used >= budget.monthlyCap;

  return (
    <div className="space-y-6" data-testid="ai-usage-budget">
      {/* Readout: used vs cap + alert state */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">AI actions this month</span>
            <Badge variant="outline" className={style.badge} data-testid="budget-alert">
              {style.label}
            </Badge>
          </div>
          <span className="num text-sm text-muted-foreground tabular-nums">
            {used.toLocaleString()}
            <span className="text-muted-foreground/60">
              {" "}
              / {budget.monthlyCap.toLocaleString()}
            </span>
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            data-testid="budget-bar"
            className={cn(
              "h-full rounded-full transition-all duration-500",
              level === "critical"
                ? "bg-destructive"
                : level === "warn"
                  ? "bg-amber-500"
                  : "bg-primary",
            )}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground" data-testid="budget-note">
          {hardStopped
            ? "Hard stop reached — AI actions are paused until next month."
            : level === "critical"
              ? `${remaining.toLocaleString()} actions left before the ${budget.monthlyCap.toLocaleString()} cap.`
              : level === "warn"
                ? `Approaching your monthly cap — ${remaining.toLocaleString()} actions left.`
                : `${remaining.toLocaleString()} actions remaining this month.`}
        </p>
      </div>

      {/* Monthly cap */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Monthly cap</span>
          <span data-testid="cap-value" className="num text-sm font-semibold tabular-nums">
            {budget.monthlyCap.toLocaleString()} actions
          </span>
        </div>
        <Slider
          className="mt-3"
          data-testid="cap-slider"
          value={[budget.monthlyCap]}
          min={MIN_CAP}
          max={MAX_CAP}
          step={CAP_STEP}
          aria-label="Monthly cap"
          onValueChange={([v]) =>
            update({ monthlyCap: Math.min(MAX_CAP, Math.max(MIN_CAP, v ?? MIN_CAP)) })
          }
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          AI actions allowed per calendar month ({MIN_CAP}–{MAX_CAP}).
        </p>
      </div>

      {/* Alert thresholds */}
      <div className="space-y-5 rounded-2xl border border-border bg-card p-4">
        <ThresholdRow
          label="Warn threshold"
          description="Show an approaching-budget alert at this share of the cap."
          value={budget.warnThreshold}
          min={10}
          max={95}
          onChange={(v) => update({ warnThreshold: v })}
        />
        <ThresholdRow
          label="Critical threshold"
          description="Show a critical alert at this share of the cap."
          value={budget.criticalThreshold}
          min={15}
          max={100}
          onChange={(v) => update({ criticalThreshold: v })}
        />
        <p className="text-xs text-muted-foreground">
          The critical threshold stays at or above the warn threshold automatically.
        </p>
      </div>

      {/* Hard stop */}
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-4">
        <div>
          <div className="text-sm font-medium">Hard stop at cap</div>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
            When on, AI actions pause entirely once the cap is reached, instead of only showing
            alerts. {level !== "none" && "Alerts still fire at your thresholds first."}
          </p>
        </div>
        <Switch
          data-testid="hardstop-switch"
          checked={budget.hardStop}
          aria-label="Hard stop at cap"
          onCheckedChange={(checked) => update({ hardStop: checked === true })}
        />
      </div>
    </div>
  );
}
