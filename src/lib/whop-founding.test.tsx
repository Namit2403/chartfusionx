import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FOUNDER_PLANS as CHECKOUT_PLANS, FOUNDER_PRESALE_URL } from "@/lib/whop-founding";
import { FOUNDER_PLANS as SERVER_PLANS } from "@/lib/whop-founding.server";

vi.mock("@tanstack/react-router", () => ({
  Link: (props: { to: string; children: ReactNode; className?: string }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.resetModules();
});

/**
 * Re-import the component (and its `import.meta.env` reads) with the flag
 * set to the given value; restores the previous value afterwards.
 */
async function loadCta(flagValue: string | undefined) {
  vi.resetModules();
  const key = "VITE_FOUNDER_CTA_LIVE";
  const prev = import.meta.env[key];
  try {
    if (flagValue === undefined) delete import.meta.env[key];
    else import.meta.env[key] = flagValue;
    return await import("@/components/founder-tier-cta");
  } finally {
    if (flagValue === undefined) delete import.meta.env[key];
    else if (prev !== undefined) import.meta.env[key] = prev;
  }
}

describe("FounderTierCta", () => {
  it("opens the founding-access presale in a new tab by default (no flag set)", async () => {
    const { FounderTierCta } = await loadCta(undefined);
    render(<FounderTierCta planId="pro_founding" className="cta-class" />);
    const link = screen.getByRole("link", {
      name: "Get Founding Access — Pro: $199 founding year",
    });
    expect(link).toHaveAttribute("href", FOUNDER_PRESALE_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.className).toContain("cta-class");
  });

  it("falls back to the waitlist when the kill switch is set (VITE_FOUNDER_CTA_LIVE=false)", async () => {
    const { FounderTierCta } = await loadCta("false");
    render(<FounderTierCta planId="max_founding" className="cta-class" />);
    const link = screen.getByRole("link", { name: "Join the waitlist" });
    expect(link).toHaveAttribute("href", "/whats-coming");
    expect(link.className).toContain("cta-class");
  });
});

describe("founding plan contract (shared vs server)", () => {
  it("webhook plan map matches the checkout plans exactly", () => {
    expect(SERVER_PLANS.plan_8ljFtIGCyybJb).toEqual({
      plan: CHECKOUT_PLANS.pro_founding.plan,
      priceCents: CHECKOUT_PLANS.pro_founding.price * 100,
    });
    expect(SERVER_PLANS.plan_w4Hiq9mjM33aQ).toEqual({
      plan: CHECKOUT_PLANS.max_founding.plan,
      priceCents: CHECKOUT_PLANS.max_founding.price * 100,
    });
  });

  it("payment CTAs send both founding tiers to the shared presale URL", () => {
    expect(FOUNDER_PRESALE_URL).toBe(
      "https://chartfusionx-foundingaccess.lovable.app/presale",
    );
    expect(CHECKOUT_PLANS.pro_founding.checkoutUrl).toBe(FOUNDER_PRESALE_URL);
    expect(CHECKOUT_PLANS.max_founding.checkoutUrl).toBe(FOUNDER_PRESALE_URL);
  });
});
