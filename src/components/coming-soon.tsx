import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

import { PageHeader, Panel } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/waitlist-form";
import { COMING_SOON_FEATURES, type ComingSoonFeature } from "@/lib/beta";

export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground ${className ?? ""}`}
    >
      <Clock className="size-3" />
      Coming soon
    </span>
  );
}

/** Polished placeholder for an AI module that is not implemented yet. */
export function ComingSoonPage({ feature }: { feature: ComingSoonFeature }) {
  const others = COMING_SOON_FEATURES.filter((f) => f.slug !== feature.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="In development"
        title={feature.name}
        description={feature.description}
        action={<ComingSoonBadge />}
      />

      <Panel title="Join the waitlist" subtitle="We'll email you the moment this module goes live.">
        <WaitlistForm source={feature.slug} />
      </Panel>

      <Panel title="Available right now" subtitle="The rest of ChartFusionX is free to use during the beta.">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your trade journal, gallery, playbook, analytics, reports and goals are all live. Every
          trade you log now will be there when the AI modules arrive.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/journal/new">Log a trade</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link to="/whats-coming">See what's coming</Link>
          </Button>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        {others.map((other) => (
          <Link
            key={other.slug}
            to={other.path}
            className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/60"
          >
            <div className="text-sm font-semibold">{other.name}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{other.short}</p>
            <div className="mt-3">
              <ComingSoonBadge />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
