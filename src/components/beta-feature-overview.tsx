import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { ComingSoonBadge } from "@/components/coming-soon";
import { Panel } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { AVAILABLE_NOW, COMING_SOON_FEATURES } from "@/lib/beta";

/** Dashboard split of what's live in the beta vs what's still being built. */
export function BetaFeatureOverview() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Available now" subtitle="Live and free during the beta.">
        <div className="grid gap-2 sm:grid-cols-2">
          {AVAILABLE_NOW.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2 text-sm transition-colors hover:bg-muted/60"
            >
              <Check className="size-3.5 shrink-0 text-positive" />
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel
        title="Coming soon"
        subtitle="AI modules in development — not live yet."
        action={
          <Button asChild size="sm" variant="ghost">
            <Link to="/whats-coming">Details</Link>
          </Button>
        }
      >
        <div className="space-y-2">
          {COMING_SOON_FEATURES.map((feature) => (
            <Link
              key={feature.slug}
              to={feature.path}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-3 py-2 text-sm transition-colors hover:bg-muted/60"
            >
              <span className="truncate">{feature.name}</span>
              <ComingSoonBadge />
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
