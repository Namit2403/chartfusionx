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

describe("protected routes discovery", () => {
  it("finds every protected route file", () => {
    expect(protectedPaths.length).toBeGreaterThanOrEqual(17);
    expect(protectedPaths).toContain("/");
    expect(protectedPaths).toContain("/journal");
    expect(protectedPaths).toContain("/journal/new");
    expect(protectedPaths).toContain("/ai-review");
  });
});

describe.each(protectedPaths)("logged-out visit to %s", (routePath) => {
  it("renders the sign-in gate, not a blank page", async () => {
    currentPathname = routePath;
    const { container } = render(<AuthenticatedLayout />);

    const heading = await screen.findByRole("heading", { name: /^Sign in to access / });
    expect(heading).toBeInTheDocument();
    expect(container.textContent?.trim().length ?? 0).toBeGreaterThan(50);
  });

  it("names the page in the gate headline instead of a generic fallback", async () => {
    currentPathname = routePath;
    render(<AuthenticatedLayout />);
    const heading = await screen.findByRole("heading", { name: /^Sign in to access / });
    expect(heading.textContent).not.toMatch(/this page$/);
  });

  it("offers both sign-up and sign-in actions", async () => {
    currentPathname = routePath;
    render(<AuthenticatedLayout />);
    expect(await screen.findByRole("link", { name: "Create free account" })).toHaveAttribute(
      "href",
      "/signup",
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth");
    expect(screen.getByText(/No credit card required/i)).toBeInTheDocument();
  });

  it("never renders protected content or demo account data", async () => {
    currentPathname = routePath;
    const { container } = render(<AuthenticatedLayout />);
    await screen.findByRole("heading", { name: /^Sign in to access / });

    expect(screen.queryByTestId("protected-content")).toBeNull();
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/FX-\d{4,}/);
    expect(text).not.toMatch(/\$\s?\d[\d,]*\.\d{2}/);
  });
});

describe("authenticated visits", () => {
  it("renders protected content once a user is present", async () => {
    currentUser = { id: "user-1" };
    currentPathname = "/journal";
    render(<AuthenticatedLayout />);
    await waitFor(() => expect(screen.getByTestId("protected-content")).toBeInTheDocument());
    expect(screen.queryByRole("heading", { name: /^Sign in to access / })).toBeNull();
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
