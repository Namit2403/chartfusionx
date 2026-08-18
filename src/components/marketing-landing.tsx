import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PLANS, aiLimitLabel } from "@/lib/entitlements";
import { RiskDisclaimer } from "@/components/risk-disclaimer";

export const PRODUCT_MODULES = [
  {
    title: "Smart Trading Journal",
    body: "Log every trade with entries, exits, size, risk, strategy tags, notes and chart screenshots.",
  },
  {
    title: "Performance Dashboard",
    body: "Equity curve, win rate, expectancy, profit factor and drawdown computed from your own trades.",
  },
  {
    title: "AI Trade Review",
    body: "Automated review of each trade against your plan, with a grade and written breakdown.",
  },
  {
    title: "AI Strategy Discovery",
    body: "Surfaces which setups, sessions and instruments actually carry your results.",
  },
  {
    title: "AI Screenshot Reader",
    body: "Upload a chart screenshot and get the trade details extracted into your journal.",
  },
  {
    title: "AI Chart Critique",
    body: "Structured critique of your marked-up charts: structure, entry location and management.",
  },
  {
    title: "AI Voice Trading Summary",
    body: "A spoken end-of-session summary of what you traded and how you executed.",
  },
  {
    title: "Trader DNA",
    body: "A behavioural profile built from your logged trades: discipline, patience and risk habits.",
  },
  {
    title: "Goals & Habit Tracking",
    body: "Set process goals and track daily habits alongside your results.",
  },
  {
    title: "Playbook Builder",
    body: "Document your setups and rules, then measure adherence against real trades.",
  },
  {
    title: "Trade Gallery",
    body: "Every chart attachment in one searchable visual library.",
  },
  {
    title: "Reports & Analytics",
    body: "Deeper breakdowns and exportable reports across any period you choose.",
  },
];

export function PricingCards({ showTrial = true }: { showTrial?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {PLANS.map((plan) => (
        <div
          key={plan.priceId}
          className="flex flex-col rounded-xl border border-border bg-card p-6"
        >
          <div className="text-sm font-semibold">{plan.name}</div>
          <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="num text-3xl font-semibold">${plan.price}</span>
            <span className="text-sm text-muted-foreground">USD / month</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Billed monthly, cancel any time. {showTrial ? "7-day free trial for new accounts." : null}
          </p>
          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-positive" />
                <span>{feature}</span>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-positive" />
              <span>AI actions included: {aiLimitLabel(plan.aiActionsPerPeriod)}</span>
            </li>
          </ul>
          <div className="mt-6">
            <Button asChild className="w-full">
              <Link to="/billing">Start with {plan.name}</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Public, signed-out marketing view: what the product is, what you get, what it costs. */
export function MarketingLanding() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <section className="panel-hero grid-lines overflow-hidden p-6 sm:p-10">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          ChartFusionX — AI trading journal software
        </div>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
          A web-based trading journal with AI review, built for traders who want to understand
          their own execution.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          ChartFusionX is a subscription SaaS product operated by Antonio Hernandez (trading as
          ChartFusionX). You log your trades and upload your charts; the platform turns them into a
          performance dashboard, a behavioural profile and AI-written reviews of your own
          decisions. It is an analytics and self-review tool — it does not place trades, connect to
          a broker, or tell you what to buy or sell.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/signup">Create your account</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/pricing">See pricing</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </section>

      <RiskDisclaimer />

      <section>
        <h2 className="text-xl font-semibold tracking-tight">What's included with your purchase</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every paid plan unlocks the full platform below; plans differ only in how many AI actions
          you can run each month.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_MODULES.map((module) => (
            <div key={module.title} className="rounded-xl border border-border bg-card p-5">
              <div className="text-sm font-semibold">{module.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{module.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Pricing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Simple monthly subscriptions in USD. No setup fee, no contract, cancel any time from
          Plans &amp; billing.
        </p>
        <div className="mt-5">
          <PricingCards />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Our order process is conducted by our online reseller Paddle.com. Paddle.com is the
          Merchant of Record for all our orders. Paddle provides all customer service inquiries and
          handles returns. Applicable sales tax or VAT is added at checkout.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Enterprise &amp; team pricing</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          We do not currently sell custom or enterprise plans. Prop firms, trading desks and
          educators who need multi-seat access can email{" "}
          <span className="text-foreground">sales@chartfusionx.com</span> and we will quote
          individually; any such agreement is billed through Paddle on the same terms as our
          standard plans.
        </p>
      </section>

      <section className="border-t border-border pt-6 text-sm text-muted-foreground">
        <h2 className="text-sm font-semibold text-foreground">Policies</h2>
        <p className="mt-1.5 leading-relaxed">
          Read our{" "}
          <Link to="/terms" className="text-foreground underline underline-offset-4">
            Terms &amp; Conditions
          </Link>
          ,{" "}
          <Link to="/refund-policy" className="text-foreground underline underline-offset-4">
            Refund Policy
          </Link>{" "}
          (30-day money-back guarantee on your first payment) and{" "}
          <Link to="/privacy" className="text-foreground underline underline-offset-4">
            Privacy Policy
          </Link>
          . Support: <span className="text-foreground">support@chartfusionx.com</span>.
        </p>
      </section>
    </div>
  );
}
