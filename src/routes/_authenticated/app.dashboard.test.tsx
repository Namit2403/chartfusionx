import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/* Controllable Supabase stub + light component stubs                  */
/* ------------------------------------------------------------------ */

type AuthState = "signed-out" | "signed-in";
type Session = { user: { id: string } } | null;
type AuthCallback = (event: string, session: Session) => void;

let authState: AuthState = "signed-out";
let authUser: { id: string } | null = null;
let authCallbacks: AuthCallback[] = [];
let queryRows: unknown[] = [];
let queryError: unknown = null;
let queryNeverResolves = false;
let realtimeHandlers: Array<() => void> = [];
let removedChannels = 0;

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));

vi.mock("recharts", () => {
  const Box = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  const Nothing = () => null;
  return {
    ResponsiveContainer: Box,
    AreaChart: Box,
    PieChart: Box,
    Area: Nothing,
    Pie: Nothing,
    Cell: Nothing,
    XAxis: Nothing,
    YAxis: Nothing,
    CartesianGrid: Nothing,
    Tooltip: Nothing,
  };
});

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => ({ planName: null, entitled: false, loading: false }),
}));

vi.mock("@/utils/profile.functions", () => ({
  acceptLegal: () => Promise.resolve({ ok: true }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: authState === "signed-in" ? authUser : null },
          error: null,
        }),
      onAuthStateChange: (cb: AuthCallback) => {
        authCallbacks.push(cb);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    from: () => {
      const result = () =>
        queryNeverResolves
          ? new Promise<never>(() => {})
          : Promise.resolve({ data: queryRows, error: queryError });
      const chain = {
        select: () => chain,
        order: () => chain,
        then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
          result().then(resolve, reject),
      };
      return chain;
    },
    channel: () => {
      const channel = {
        on: (_event: string, _config: unknown, cb: () => void) => {
          realtimeHandlers.push(cb);
          return channel;
        },
        subscribe: () => channel,
      };
      return channel;
    },
    removeChannel: () => {
      removedChannels += 1;
      return Promise.resolve();
    },
  },
}));

const routeModule = await import("@/routes/_authenticated/app");
const Dashboard = (routeModule.Route as unknown as { component: () => ReactNode }).component;

/** The real hook now runs on TanStack Query — fresh client per render. */
function renderDash() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(<Dashboard />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

/** A single closed trade dated today, so it lands inside the monthly window. */
function todayRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "trade-1",
    traded_at: new Date().toISOString(),
    asset: "EURUSD",
    market: "Forex",
    direction: "Long",
    strategy: "Break & Retest",
    session: "London",
    timeframe: "15m",
    entry_price: 100,
    exit_price: 102,
    stop_price: 99,
    target_price: 103,
    position_size: 1,
    risk_pct: 1,
    pnl: 200,
    r_multiple: 2,
    emotion_before: "Calm",
    emotion_after: "Calm",
    tags: [],
    entry_reason: "Clean retest of the Asian high.",
    ...overrides,
  };
}

const skeletonCount = () => document.querySelectorAll(".animate-pulse").length;
const DEMO_PNL = "+$2,404.99";

beforeEach(() => {
  authState = "signed-out";
  authUser = null;
  authCallbacks = [];
  queryRows = [];
  queryError = null;
  queryNeverResolves = false;
  realtimeHandlers = [];
  removedChannels = 0;
  // Keep the one-time welcome modal out of the way; leave the checklist visible.
  localStorage.setItem("cfx-onboarded", "1");
  localStorage.removeItem("cfx-profile");
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

/* ------------------------------------------------------------------ */

describe("dashboard data behaviour", () => {
  it("labels a losing streak as losses, not wins", async () => {
    authState = "signed-in";
    authUser = { id: "user-1" };
    // Newest-first: the trader's latest rows are losses.
    queryRows = [
      todayRow({ id: "t1", pnl: -150, r_multiple: -1 }),
      todayRow({ id: "t2", pnl: -120, r_multiple: -0.8, traded_at: new Date(Date.now() - 36e5).toISOString() }),
      todayRow({ id: "t3", pnl: 300, r_multiple: 3, traded_at: new Date(Date.now() - 72e5).toISOString() }),
    ];

    renderDash();

    await waitFor(() => expect(screen.getByText("2 losses in a row")).toBeInTheDocument());
    expect(screen.queryByText("2 wins in a row")).toBeNull();
  });

  it("signed-out visitor sees the demo journal and is told it is a demo", async () => {
    renderDash();

    await waitFor(() => expect(screen.getByText(DEMO_PNL)).toBeInTheDocument());
    expect(screen.getByText("12 trades logged")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Browsing the demo journal — these numbers are an example. Sign in and your own stats fill in here.",
      ),
    ).toBeInTheDocument();
    expect(skeletonCount()).toBe(0);
    expect(screen.queryByText(/couldn't load your trades/i)).toBeNull();
  });

  it("signed-in trader sees skeletons, never demo numbers, while their rows load", async () => {
    authState = "signed-in";
    authUser = { id: "user-1" };
    queryNeverResolves = true;

    renderDash();

    await waitFor(() => expect(skeletonCount()).toBeGreaterThan(0));
    expect(screen.getByText("Loading your journal…")).toBeInTheDocument();
    // The whole point: no sample numbers presented as this trader's results.
    expect(screen.queryByText(DEMO_PNL)).toBeNull();
    expect(screen.queryByText("12 trades logged")).toBeNull();
  });

  it("signed-in trader with no trades sees honest zeros, not the demo journal", async () => {
    authState = "signed-in";
    authUser = { id: "user-1" };
    queryRows = [];

    renderDash();

    await waitFor(() => expect(screen.getByText("Your journal starts here")).toBeInTheDocument());
    expect(screen.queryByText(DEMO_PNL)).toBeNull();
    expect(screen.queryByText("12 trades logged")).toBeNull();
    expect(skeletonCount()).toBe(0);
    expect(screen.getByText("No trades logged yet")).toBeInTheDocument();
    expect(screen.getByText("Nothing to rate yet")).toBeInTheDocument();
    expect(screen.getByText("Waiting on your first trade")).toBeInTheDocument();
    // Charts explain themselves instead of rendering an empty axis.
    expect(
      screen.getByText("Your equity curve appears once you log your first trade."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Setups are grouped from the trades you log — this fills in after your first one.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the trader's own numbers once their rows arrive", async () => {
    authState = "signed-in";
    authUser = { id: "user-1" };
    queryRows = [todayRow()];

    renderDash();

    await waitFor(() => expect(screen.getAllByText("+$200.00").length).toBeGreaterThan(0));
    expect(screen.getAllByText("100.0%").length).toBeGreaterThan(0);
    expect(screen.getByText("EURUSD")).toBeInTheDocument();
    expect(screen.queryByText(DEMO_PNL)).toBeNull();
    expect(skeletonCount()).toBe(0);
  });

  it("refreshes the numbers when a trade is logged elsewhere (realtime)", async () => {
    authState = "signed-in";
    authUser = { id: "user-1" };
    queryRows = [];

    renderDash();
    await waitFor(() => expect(screen.getByText("Your journal starts here")).toBeInTheDocument());

    queryRows = [todayRow()];
    await act(async () => {
      realtimeHandlers.forEach((handler) => handler());
    });

    await waitFor(() => expect(screen.getAllByText("+$200.00").length).toBeGreaterThan(0));
    expect(screen.queryByText("Your journal starts here")).toBeNull();
  });

  it("reports a failed load instead of claiming the journal is empty, and Retry recovers", async () => {
    authState = "signed-in";
    authUser = { id: "user-1" };
    queryRows = [];
    queryError = { message: "network unavailable" };

    renderDash();

    await waitFor(() =>
      expect(screen.getByText(/couldn't load your trades just now/i)).toBeInTheDocument(),
    );
    // It must not assert "you have no trades" — the truth is we couldn't read them.
    expect(screen.queryByText("Your journal starts here")).toBeNull();
    expect(screen.getByText("We couldn't load your trades")).toBeInTheDocument();
    expect(screen.queryByText(DEMO_PNL)).toBeNull();
    expect(skeletonCount()).toBe(0);

    queryError = null;
    queryRows = [todayRow()];
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => expect(screen.getAllByText("+$200.00").length).toBeGreaterThan(0));
    expect(screen.queryByText(/couldn't load your trades just now/i)).toBeNull();
  });

  it(
    "celebrates one-time and hides forever once every setup step completes",
    { timeout: 12000 },
    async () => {
      authState = "signed-in";
      authUser = { id: "user-1" };
      // todayRow() already carries an entry reason + both emotions: all steps done.
      queryRows = [todayRow()];

      renderDash();

      await waitFor(() => expect(screen.getByTestId("onboarding-complete")).toBeInTheDocument());
      expect(screen.getByText(/all set/i)).toBeInTheDocument();

      // The payoff is transient: the checklist vanishes for good afterwards.
      await waitFor(
        () => expect(screen.queryByTestId("onboarding-checklist")).not.toBeInTheDocument(),
        { timeout: 6500 },
      );
      const profile = JSON.parse(localStorage.getItem("cfx-profile") ?? "{}") as Record<
        string,
        unknown
      >;
      expect(profile["onboardingCompletedAt"]).toBeTruthy();
    },
  );

  it("falls back to the demo journal when the trader signs out, releasing the realtime channel", async () => {
    authState = "signed-in";
    authUser = { id: "user-1" };
    queryRows = [todayRow()];

    renderDash();

    await waitFor(() => expect(screen.getAllByText("+$200.00").length).toBeGreaterThan(0));

    await act(async () => {
      authCallbacks.forEach((cb) => cb("SIGNED_OUT", null));
    });

    await waitFor(() => expect(screen.getAllByText(DEMO_PNL).length).toBeGreaterThan(0));
    expect(screen.queryByText("+$200.00")).toBeNull();
    // The previous trader's rows must be gone AND their channel closed.
    expect(removedChannels).toBeGreaterThan(0);
  });
});
