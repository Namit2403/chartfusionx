import { createFileRoute, Link } from "@tanstack/react-router";

import { PricingCards, PRODUCT_MODULES } from "@/components/marketing-landing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ChartFusionX AI Trading Journal" },
      {
        name: "description",
        content:
          "ChartFusionX pricing: Starter $29/month and Pro $69/month, billed monthly in USD with a 7-day free trial and a 30-day money-back guarantee.",
      },
      { property: "og:title", content: "Pricing — ChartFusionX" },
      {
        property: "og:description",
        content:
          "Starter $29/mo and Pro $69/mo. Full AI trading journal, cancel any time, 30-day money-back guarantee.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ChartFusionX" },
      { property: "og:url", content: "https://chartfusionx.app/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Pricing — ChartFusionX" },
      {
        name: "twitter:description",
        content: "Starter $29/mo and Pro $69/mo for the full ChartFusionX AI trading journal.",
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
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Pricing
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Simple monthly pricing for the full platform
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          ChartFusionX is a subscription trading journal and AI review platform operated by Antonio
          Hernandez (trading as ChartFusionX). Both plans include every feature — they differ only
          in how many AI actions you can run each month. Prices are in USD, billed monthly, and you
          can cancel any time from Plans &amp; billing.
        </p>
      </header>

      <PricingCards />

      <section>
        <h2 className="text-xl font-semibold tracking-tight">What every plan includes</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_MODULES.map((module) => (
            <div key={module.title} className="rounded-xl border border-border bg-card p-5">
              <div className="text-sm font-semibold">{module.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{module.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">Billing, tax and refunds</h2>
        <p className="mt-2">
          Our order process is conducted by our online reseller Paddle.com. Paddle.com is the
          Merchant of Record for all our orders. Paddle provides all customer service inquiries and
          handles returns. Sales tax or VAT is calculated and added at checkout based on your
          location.
        </p>
        <p className="mt-2">
          New accounts get a 7-day free trial (one per account). After the trial, your card is
          charged monthly until you cancel. We offer a 30-day money-back guarantee on your first
          payment — see our{" "}
          <Link to="/refund-policy" className="text-foreground underline underline-offset-4">
            Refund Policy
          </Link>
          ,{" "}
          <Link to="/terms" className="text-foreground underline underline-offset-4">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-foreground underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section className="text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">Custom / enterprise pricing</h2>
        <p className="mt-2">
          We do not publish a custom or enterprise price sheet. Desks, prop firms and educators
          needing multi-seat access can email{" "}
          <span className="text-foreground">sales@chartfusionx.com</span> for an individual quote,
          billed through Paddle on the same terms.
        </p>
      </section>
    </div>
  );
}
