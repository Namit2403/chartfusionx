import { Info } from "lucide-react";
import { Link } from "@tanstack/react-router";

/**
 * Standing disclosure: ChartFusionX is an analytics and journaling tool.
 * It never provides financial advice or regulated professional services.
 */
export function RiskDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground ${className}`}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-medium text-foreground">Not financial advice.</span> ChartFusionX is a
        self-review and analytics tool. Outputs are generated from your own logged trades and rules,
        may be inaccurate, and are not recommendations to buy, sell, or hold any instrument. We are
        not a broker, adviser, or regulated financial firm, and we provide no regulated professional
        services. Trading involves substantial risk of loss — all decisions are your own.{" "}
        <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
          Terms
        </Link>
        .
      </p>
    </div>
  );
}

export function RiskDisclaimerLine() {
  return (
    <p className="max-w-3xl leading-relaxed">
      ChartFusionX provides analytics and journaling tools only. Nothing on this site or produced by
      its AI features is financial, investment, tax, or legal advice, a recommendation to buy or
      sell, or a regulated professional service. Trading involves substantial risk of loss.
    </p>
  );
}
