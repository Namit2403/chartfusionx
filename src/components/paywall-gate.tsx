import { Link, useRouterState } from "@tanstack/react-router";
import { Lock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { isPaywallExempt } from "@/lib/entitlements";

/**
 * Hard paywall: signed-in users without an active subscription can only reach
 * billing and the legal pages. Server functions re-check entitlement, so this
 * is UX, not the security boundary.
 */
export function PaywallGate({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isActive, loading } = useSubscription();

  if (isPaywallExempt(pathname)) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isActive) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Lock className="size-5 text-primary" />
      </div>
      <h1 className="mt-5 font-display text-xl font-semibold tracking-tight">
        Start your free trial to continue
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        ChartFusionX needs an active plan. Both plans include a 7-day free trial — you won't be
        charged if you cancel before it ends.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to="/billing">See plans</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/refund-policy">Refund policy</Link>
        </Button>
      </div>
    </div>
  );
}
