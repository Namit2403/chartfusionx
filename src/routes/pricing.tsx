import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ComingSoonBadge } from "@/components/coming-soon";
import { FounderTierCta } from "@/components/founder-tier-cta";
import { WaitlistForm } from "@/components/waitlist-form";
import { AVAILABLE_NOW, COMING_SOON_FEATURES } from "@/lib/beta";
import { PLANS, type PlanId } from "@/lib/entitlements";
import { FOUNDER_CTA_LIVE, FOUNDER_PLANS, type FounderPlanId } from "@/lib/whop-founding";

const FOUNDER_PLAN_BY_TIER: Record<PlanId, FounderPlanId> = {
  pro_monthly: "pro_founding",
  max_monthly: "max_founding",
};

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ChartFusionX is Free in Beta" },
      {
        name: "description",
        content: FOUNDER_CTA_LIVE
          ? "ChartFusionX is free during the beta. Founding Access: one payment of $199 (Pro) or $399 (Max) for a year of access after launch. Monthly pricing applies after the founding year."
          : "ChartFusionX is free during the beta. After the beta: Pro at $29/month and Max at $69/month — journal your trades today and join the waitlist for the AI modules.",
      },
      { property: "og:title", content: "Pricing — ChartFusionX is Free in Beta" },
      {
        property: "og:description",
        content: FOUNDER_CTA_LIVE
          ? "Free during beta. Founding Access: $199 (Pro) or $399 (Max), one payment for a year."
          : "Free during beta. After the beta: Pro $29/mo, Max $69/mo.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ChartFusionX" },
      { property: "og:url", content: "https://chartfusionx.app/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Pricing — ChartFusionX is Free in Beta" },
      {
        name: "twitter:description",
        content: FOUNDER_CTA_LIVE
          ? "ChartFusionX is free while in beta. Founding Access is open — one payment for a year of Pro or Max."
          : "ChartFusionX is free while in beta. Join the waitlist for the AI modules.",
      },
    ],
    links: [{ rel: "canonical", href: "https://chartfusionx.app/pricing" }],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Free beta
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          ChartFusionX is free while it's in beta
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          There are no paid plans, no checkout and no card required. ChartFusionX is a trading
          journal and analytics platform operated by Antonio Hernandez (trading as ChartFusionX).
          Everything listed below is available to you at no cost today; the AI modules are still in
          development.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">
          {FOUNDER_CTA_LIVE ? "Founding access" : "Plans after the beta"}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {FOUNDER_CTA_LIVE
            ? "Founding Access locks in a full year of Pro or Max with one payment, before launch. Monthly pricing ($29 Pro, $69 Max) applies after the founding year ends."
            : "Today everything below the waitlist is free. When the beta ends, two paid tiers take over — the free tier keeps its core journal and analytics."}
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Free Beta</span>
              <span className="rounded-full border border-positive/30 bg-positive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-positive">
                Live now
              </span>
            </div>
            <p className="num mt-3 text-3xl font-semibold tracking-tight">$0</p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <li>Unlimited trades during the beta</li>
              <li>Dashboard, analytics &amp; reports</li>
              <li>Playbook, goals &amp; gallery</li>
            </ul>
            <Button asChild size="sm" variant="secondary" className="mt-5 w-full">
              <Link to="/app">Open the app</Link>
            </Button>
          </div>
          {PLANS.map((plan) => {
            const founderPlanId = FOUNDER_PLAN_BY_TIER[plan.priceId];
            const founderPlan = FOUNDER_PLANS[founderPlanId];
            return (
              <div key={plan.priceId} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{plan.name}</span>
                  {FOUNDER_CTA_LIVE ? (
                    <span className="rounded-full border border-positive/30 bg-positive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-positive">
                      Founding access
                    </span>
                  ) : (
                    <ComingSoonBadge />
                  )}
                </div>
                {FOUNDER_CTA_LIVE ? (
                  <p className="num mt-3 text-3xl font-semibold tracking-tight">
                    ${founderPlan.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      founding year
                    </span>
                  </p>
                ) : (
                  <p className="num mt-3 text-3xl font-semibold tracking-tight">
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground"> / month</span>
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {FOUNDER_CTA_LIVE && (
                  <FounderTierCta
                    planId={founderPlanId}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Available now — free</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE_NOW.map((item) => (
            <div key={item.name} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-positive" />
                <span className="text-sm font-semibold">{item.name}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">In development</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMING_SOON_FEATURES.map((feature) => (
            <div key={feature.slug} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold">{feature.name}</span>
                <ComingSoonBadge />
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {feature.short}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Join the waitlist</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          We'll notify you when the next generation of ChartFusionX is ready.
        </p>
        <div className="mt-4">
          <WaitlistForm source="pricing" />
        </div>
      </section>

      <section className="border-t border-border pt-6 text-sm text-muted-foreground">
        <h2 className="text-sm font-semibold text-foreground">Policies</h2>
        <p className="mt-1.5 leading-relaxed">
          Read our{" "}
          <Link to="/terms" className="text-foreground underline underline-offset-4">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-foreground underline underline-offset-4">
            Privacy Policy
          </Link>
          . Support: <span className="text-foreground">support@chartfusionx.com</span>.
        </p>
      </section>
    </div>
  );
}
