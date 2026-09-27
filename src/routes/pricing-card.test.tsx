import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FREE_AI_FEATURE_LIMIT, FREE_TRADE_LIMIT } from "@/lib/entitlements";

/* ------------------------------------------------------------------ */
/* Light stubs: router Link + the two CTA/form components              */
/* ------------------------------------------------------------------ */

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/founder-tier-cta", () => ({
  FounderTierCta: ({ planId, className }: { planId: string; className?: string }) => (
    <a href={`#checkout-${planId}`} className={className}>
      Get Founding Access — {planId}
    </a>
  ),
}));

vi.mock("@/components/waitlist-form", () => ({
  WaitlistForm: ({ source }: { source: string }) => <div data-testid={`waitlist-${source}`} />,
}));

afterEach(() => {
  cleanup();
});

const landingModule = await import("@/routes/index");
const Landing = (landingModule.Route as unknown as { component: () => ReactNode }).component;

const pricingModule = await import("@/routes/pricing");
const PricingPage = (pricingModule.Route as unknown as { component: () => ReactNode }).component;

/* ------------------------------------------------------------------ */
/* Regression pins for the honest-copy guardrails                      */
/* ------------------------------------------------------------------ */

describe("Free Beta card copy (honest-copy regression pins)", () => {
  it("landing card lists exactly 15 trades and 2 AI features, with no unlimited claim", () => {
    render(<Landing />);
    const card = screen.getByText("Free Beta", { selector: "h3" }).closest(".lp-card");
    expect(card).not.toBeNull();

    // Exact list — additions or edits to the Free Beta card must be
    // deliberate, not silent.
    expect(
      within(card as HTMLElement)
        .getAllByRole("listitem")
        .map((li) => li.textContent?.trim()),
    ).toEqual([
      "✓ 15 trades with attachments",
      "✓ 2 AI features",
      "✓ Performance dashboard & analytics",
      "✓ Playbook, goals & reports",
      "✓ Demo mode — try it without an account",
    ]);

    expect(within(card as HTMLElement).getByText("$0")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByRole("link", { name: "Try Now" })).toHaveAttribute(
      "href",
      "/app",
    );
    expect(/unlimited/i.test((card as HTMLElement).textContent ?? "")).toBe(false);
  });

  it("pricing page card lists exactly 15 trades and 2 AI features, with no unlimited-trades claim", () => {
    render(<PricingPage />);
    const card = screen.getByText("Free Beta", { selector: "span" }).closest(".rounded-2xl");
    expect(card).not.toBeNull();

    expect(
      within(card as HTMLElement)
        .getAllByRole("listitem")
        .map((li) => li.textContent?.trim()),
    ).toEqual([
      "15 trades with attachments",
      "2 AI features",
      "Dashboard, analytics & reports",
      "Playbook, goals & gallery",
    ]);

    expect(/unlimited trades/i.test((card as HTMLElement).textContent ?? "")).toBe(false);
  });

  it("no 'unlimited trades' claim survives anywhere on the landing page", () => {
    render(<Landing />);
    expect(/unlimited trades/i.test(document.body.textContent ?? "")).toBe(false);
  });

  it("no 'unlimited trades' claim survives anywhere on the pricing page", () => {
    render(<PricingPage />);
    expect(/unlimited trades/i.test(document.body.textContent ?? "")).toBe(false);
  });

  it("enforced entitlement constants match the published copy", () => {
    expect(FREE_TRADE_LIMIT).toBe(15);
    expect(FREE_AI_FEATURE_LIMIT).toBe(2);
  });

  it("comparison table advertises the enforced free trade limit, not more", () => {
    render(<PricingPage />);
    const table = screen.getByRole("table");

    // Free column: the enforced limit, derived from the same constant the app
    // enforces — a mismatch here would over-promise.
    const rows = within(table as HTMLElement).getAllByRole("row");
    const tradesRow = rows[1]!;
    expect(tradesRow.textContent).toContain(`Up to ${FREE_TRADE_LIMIT}`);
    expect(tradesRow.textContent).not.toContain("Up to 50");

    // Three plan columns with the right badges and prices.
    expect(within(table as HTMLElement).getByText("⚡ Pro")).toBeInTheDocument();
    expect(within(table as HTMLElement).getByText("★ Max")).toBeInTheDocument();
    expect(
      within(table as HTMLElement).getByLabelText("Free — $0 per month"),
    ).toBeInTheDocument();
    const headerText = (table as HTMLElement).querySelector("thead")?.textContent ?? "";
    expect(headerText).toContain("$29/mo");
    expect(headerText).toContain("$69/mo");

    // Row pattern: exact labels and order.
    const featureLabels = rows
      .slice(1)
      .map((row) => row.querySelector("td")?.textContent?.trim());
    expect(featureLabels).toEqual([
      "Trades",
      "Dashboard & KPIs",
      "Journal & Calendar",
      "CSV Import",
      "Sniper Score",
      "AI Insights",
      "AI Analyst Chat",
      "Ghost Mode",
      "Mistake Analytics",
      "Exchange API Sync",
      "PDF Export",
      "Multi-Portfolio",
      "Heatmaps & Hold Time",
    ]);
    // Shipped features are included in every tier; unbuilt ones carry a
    // coming-soon chip in all three columns instead of a check — no tier
    // may claim a feature that does not exist.
    expect(within(table as HTMLElement).getAllByLabelText("Included")).toHaveLength(12);
    expect(within(table as HTMLElement).getAllByText("Coming soon")).toHaveLength(24);
    expect(within(table as HTMLElement).queryByLabelText("Not included")).toBeNull();
  });
});
