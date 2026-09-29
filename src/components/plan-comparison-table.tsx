import { Check } from "lucide-react";

import { FREE_TRADE_LIMIT, PLANS } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

/**
 * Feature rows for the Free / Pro / Max comparison table.
 *
 * `status` reflects what the product actually ships today:
 * - "shipped": live in the app and free for everyone during the beta.
 * - "soon": not built yet — shown with a "coming soon" chip in every
 *   column instead of a check, so no tier claims a feature that
 *   does not exist.
 */
const COMPARISON_ROWS: { label: string; status: "shipped" | "soon" }[] = [
  { label: "Dashboard & KPIs", status: "shipped" },
  { label: "Journal & Calendar", status: "shipped" },
  { label: "CSV Import", status: "soon" },
  { label: "Sniper Score", status: "soon" },
  { label: "AI Insights", status: "soon" },
  { label: "AI Analyst Chat", status: "soon" },
  { label: "Ghost Mode", status: "soon" },
  { label: "Mistake Analytics", status: "shipped" },
  { label: "Exchange API Sync", status: "soon" },
  { label: "PDF Export", status: "soon" },
  { label: "Multi-Portfolio", status: "soon" },
  { label: "Heatmaps & Hold Time", status: "shipped" },
];

const PAID_MAX_PRICE = PLANS.find((plan) => plan.priceId === "max_monthly")?.price ?? 69;

function YesIcon() {
  // mx-auto: the svg is display:block (Tailwind preflight), which ignores the
  // cell's text-align:center — without auto margins the check hugs the left
  // content edge while text and chips center.
  return <Check className="mx-auto size-4 text-positive" strokeWidth={2.5} aria-label="Included" />;
}

/** Compact table-cell variant of the ComingSoonBadge styling. */
function ComingSoonChip() {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
      Coming soon
    </span>
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
            <td className="px-5 py-3.5 text-center text-muted-foreground">
              Up to {FREE_TRADE_LIMIT}
            </td>
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
                {row.status === "shipped" ? <YesIcon /> : <ComingSoonChip />}
              </td>
              <td className="px-5 py-3.5 text-center">
                {row.status === "shipped" ? <YesIcon /> : <ComingSoonChip />}
              </td>
              <td className="px-5 py-3.5 text-center">
                {row.status === "shipped" ? <YesIcon /> : <ComingSoonChip />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
