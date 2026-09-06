import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { ComingSoonBadge } from "@/components/coming-soon";
import { PageHeader, Panel } from "@/components/shell";
import { WaitlistForm } from "@/components/waitlist-form";
import { AVAILABLE_NOW, COMING_SOON_FEATURES } from "@/lib/beta";

export const Route = createFileRoute("/whats-coming")({
  head: () => ({
    meta: [
      { title: "What's Coming — ChartFusionX Free Beta" },
      {
        name: "description",
        content:
          "ChartFusionX is free during beta. See what's live today and the AI modules in development — AI Trade Review, Chart Critique, Strategy Discovery, Trader DNA and Voice Summary.",
      },
      { property: "og:title", content: "What's Coming — ChartFusionX" },
      {
        property: "og:description",
        content:
          "The trading journal is live and free. The AI modules are in development — join the waitlist.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WhatsComing,
});

function WhatsComing() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Free beta"
        title="What's coming to ChartFusionX"
        description="The journal and analytics side of ChartFusionX is live and free to use today. The AI modules below are still being built — nothing here pretends to work before it does."
      />

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Available now
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE_NOW.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/60"
            >
              <div className="flex items-center gap-2">
                <Check className="size-4 text-positive" />
                <span className="text-sm font-semibold">{item.name}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          In development
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {COMING_SOON_FEATURES.map((feature) => (
            <div key={feature.slug} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold">{feature.name}</div>
                <ComingSoonBadge />
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
              <Link
                to={feature.path}
                className="mt-4 text-xs font-medium text-foreground underline underline-offset-4"
              >
                Preview this module
              </Link>
            </div>
          ))}
        </div>
      </section>

      <Panel
        title="Join the waitlist"
        subtitle="We'll notify you when the next generation of ChartFusionX is ready."
      >
        <WaitlistForm source="whats-coming" />
      </Panel>
    </div>
  );
}
