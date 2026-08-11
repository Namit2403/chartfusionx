import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/* Module mocks                                                        */
/* ------------------------------------------------------------------ */

let currentPathname = "/";
let currentUser: { id: string } | null = null;

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: currentPathname } }),
  Outlet: () => <div data-testid="protected-content">protected content</div>,
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));

vi.mock("@/components/paywall-dialog", () => ({
  PaywallDialog: () => null,
  openPaywall: () => {},
  openSignInPrompt: () => {},
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({ data: { user: currentUser }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}));

const routeModule = await import("@/routes/_authenticated/route");
const AuthenticatedLayout = (routeModule.Route as unknown as { component: () => ReactNode })
  .component;

/* ------------------------------------------------------------------ */
/* Route discovery — every file under src/routes/_authenticated        */
/* ------------------------------------------------------------------ */

const ROUTES_DIR = path.resolve(process.cwd(), "src/routes/_authenticated");

function fileToPath(file: string): string {
  const base = file.replace(/\.tsx?$/, "");
  if (base === "index") return "/";
  const segments = base.split(".").filter((s) => s !== "index");
  return `/${segments.join("/")}`;
}

const protectedFiles = readdirSync(ROUTES_DIR).filter(
  (f) => f.endsWith(".tsx") && f !== "route.tsx",
);
const protectedPaths = protectedFiles.map(fileToPath);

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

beforeEach(() => {
  currentUser = null;
  currentPathname = "/";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("route discovery", () => {
  it("finds every app route file", () => {
    expect(protectedPaths.length).toBeGreaterThanOrEqual(17);
    expect(protectedPaths).toContain("/");
    expect(protectedPaths).toContain("/journal");
    expect(protectedPaths).toContain("/journal/new");
    expect(protectedPaths).toContain("/ai-review");
  });
});

describe.each(protectedPaths)("logged-out visit to %s", (routePath) => {
  it("lets visitors browse the page instead of blocking it", async () => {
    currentPathname = routePath;
    render(<AuthenticatedLayout />);
    await waitFor(() => expect(screen.getByTestId("protected-content")).toBeInTheDocument());
    expect(screen.queryByRole("heading", { name: /^Sign in to access / })).toBeNull();
  });
});

describe("authenticated visits", () => {
  it("renders app content for a signed-in user", async () => {
    currentUser = { id: "user-1" };
    currentPathname = "/journal";
    render(<AuthenticatedLayout />);
    await waitFor(() => expect(screen.getByTestId("protected-content")).toBeInTheDocument());
  });
});

describe("action gating", () => {
  it("gates trade logging behind sign-in and the free trade limit", () => {
    const src = readFileSync(path.join(ROUTES_DIR, "journal.new.tsx"), "utf8");
    expect(src).toMatch(/openSignInPrompt/);
    expect(src).toMatch(/consumeTradeLog/);
    expect(src).toMatch(/openPaywall/);
  });

  it("keeps the free trade limit at 10", async () => {
    const { FREE_TRADE_LIMIT } = await import("@/lib/entitlements");
    expect(FREE_TRADE_LIMIT).toBe(10);
  });

  it("gates every AI action behind sign-in and an active plan", () => {
    const src = readFileSync(path.resolve(process.cwd(), "src/hooks/useAiAction.ts"), "utf8");
    expect(src).toMatch(/openSignInPrompt/);
    expect(src).toMatch(/consumeAiAction/);
    expect(src).toMatch(/openPaywall/);
  });
});

describe("source hygiene", () => {
  const sources = [
    ...protectedFiles.map((f) => path.join(ROUTES_DIR, f)),
    path.resolve(process.cwd(), "src/components/account-menu.tsx"),
  ];

  it.each(sources)("%s contains no hardcoded demo account identifiers", (file) => {
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/FX-\d{4,}/);
    expect(src).not.toMatch(/12,405\.99/);
  });
});
