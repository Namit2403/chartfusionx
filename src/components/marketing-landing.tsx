import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { ComingSoonBadge } from "@/components/coming-soon";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/waitlist-form";
import { AVAILABLE_NOW, COMING_SOON_FEATURES } from "@/lib/beta";
import { RiskDisclaimer } from "@/components/risk-disclaimer";

export const PRODUCT_MODULES = AVAILABLE_NOW.map((item) => ({
  title: item.name,
  body: item.body,
}));

/** Public, signed-out landing view: what the product is and what's still coming. */
export function MarketingLanding() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <section className="panel-hero grid-lines overflow-hidden p-6 sm:p-10">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            ChartFusionX
          </span>
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Free beta
          </span>
        </div>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
          A trading journal and performance dashboard — free while we build the next generation.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          ChartFusionX is operated by Antonio Hernandez (trading as ChartFusionX). Log your trades
          and upload your charts, and the platform turns them into an equity curve, win rate,
          expectancy and behavioural breakdowns of your own execution. It does not place trades,
          connect to a broker, or tell you what to buy or sell.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/signup">Create your free account</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/whats-coming">What's coming</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </section>

      <RiskDisclaimer />

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Available now — free</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything below is live today and costs nothing during the beta.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <h2 className="text-xl font-semibold tracking-tight">Coming soon</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These AI modules are in development. They are not live yet, and nothing in the product
          pretends otherwise.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <h2 className="text-lg font-semibold tracking-tight">Join the waitlist</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          We'll notify you when the next generation of ChartFusionX is ready.
        </p>
        <div className="mt-4">
          <WaitlistForm source="landing" />
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
