import { createFileRoute, Link } from "@tanstack/react-router";

import { PageHeader, Panel } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/waitlist-form";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Your plan — ChartFusionX Free Beta" },
      {
        name: "description",
        content:
          "ChartFusionX is free during the beta. There are no plans, no card and nothing to pay while we build the AI modules.",
      },
      { property: "og:title", content: "Your plan — ChartFusionX Free Beta" },
      {
        property: "og:description",
        content: "Free during beta — no plans, no card, nothing to pay.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BetaPlanPage,
});

function BetaPlanPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Free beta"
        title="Your plan"
        description="ChartFusionX is completely free while it's in beta. There are no paid plans, no checkout and no card on file."
      />

      <Panel title="Current access" subtitle="Everything that's live today, at no cost.">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Unlimited trade journaling, attachments and gallery</li>
          <li>Performance dashboard, analytics and reports</li>
          <li>Playbook, goals, habits and notifications</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/journal/new">Log a trade</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link to="/whats-coming">See what's coming</Link>
          </Button>
        </div>
      </Panel>

      <Panel
        title="Be first to know"
        subtitle="We'll email you when the AI modules and the next generation of ChartFusionX are ready."
      >
        <WaitlistForm source="billing" />
      </Panel>
    </div>
  );
}
