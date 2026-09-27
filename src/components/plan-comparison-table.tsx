import { Check, X } from "lucide-react";

import { PLANS } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

/**
 * Feature rows for the Free / Pro / Max comparison table.
 * The value is shown under every paid tier; the Free column shows
 * `check` when free users get the feature and `check: false` otherwise.
 */
const COMPARISON_ROWS: { label: string; check: boolean }[] = [
  { label: "Dashboard & KPIs", check: true },
  { label: "Journal & Calendar", check: true },
  { label: "CSV Import", check: true },
  { label: "Sniper Score", check: true },
  { label: "AI Insights", check: false },
  { label: "AI Analyst Chat", check: false },
  { label: "Ghost Mode", check: false },
  { label: "Mistake Analytics", check: false },
  { label: "Exchange API Sync", check: false },
  { label: "PDF Export", check: false },
  { label: "Multi-Portfolio", check: false },
  { label: "Heatmaps & Hold Time", check: false },
];

const PAID_MAX_PRICE = PLANS.find((plan) => plan.priceId === "max_monthly")?.price ?? 69;

function YesIcon() {
  return <Check className="size-4 text-positive" strokeWidth={2.5} aria-label="Included" />;
}

function NoIcon() {
  return (
    <X
      className="size-4 text-muted-foreground/60"
      strokeWidth={2.5}
      aria-label="Not included"
    />
  );
}

export function PlanComparisonTable() {
  const proPrice = PLANS.find((plan) => plan.priceId === "pro_monthly")?.price ?? 29;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              Feature
            </th>
            <th
              scope="col"
              className="px-5 py-4 text-center"
              aria-label="Free — $0 per month"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Free
              </span>
            </th>
            <th scope="col" className="px-5 py-4 text-center">
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    "border-positive/30 bg-positive/10 text-positive",
                  )}
                >
                  ⚡ Pro
                </span>
                <span className="num text-3xl font-semibold tracking-tight">
                  ${proPrice}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </span>
              </div>
              <span className="sr-only">{`Pro — $${proPrice} per month`}</span>
            </th>
            <th scope="col" className="px-5 py-4 text-center">
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    "border-amber-500/30 bg-amber-500/10 text-amber-500",
                  )}
                >
                  ★ Max
                </span>
                <span className="num text-3xl font-semibold tracking-tight">
                  ${PAID_MAX_PRICE}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </span>
              </div>
              <span className="sr-only">{`Max — $${PAID_MAX_PRICE} per month`}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="px-5 py-3.5 font-medium text-foreground">Trades</td>
            <td className="px-5 py-3.5 text-center text-muted-foreground">Up to 50</td>
            <td className="px-5 py-3.5 text-center font-medium text-positive">Unlimited</td>
            <td className="px-5 py-3.5 text-center font-medium text-positive">Unlimited</td>
          </tr>
          {COMPARISON_ROWS.map((row, index) => (
            <tr
              key={row.label}
              className={cn(
                "border-b border-border last:border-b-0",
                index % 2 === 1 && "bg-muted/30",
              )}
            >
              <td className="px-5 py-3.5 font-medium text-foreground">{row.label}</td>
              <td className="px-5 py-3.5 text-center">
                {row.check ? <YesIcon /> : <NoIcon />}
              </td>
              <td className="px-5 py-3.5 text-center">
                <YesIcon />
              </td>
              <td className="px-5 py-3.5 text-center">
                <YesIcon />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
