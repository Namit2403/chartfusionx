import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { stats as demoStats, trades as demoTrades } from "@/lib/mock-data";

/* ------------------------------------------------------------------ */
/* Controllable Supabase stub                                          */
/*                                                                     */
/* `authState = "pending"` holds the session handshake open so we can  */
/* assert what a signed-in trader sees before their session resolves.  */
/* ------------------------------------------------------------------ */

type AuthState = "pending" | "signed-out" | "signed-in";

let authState: AuthState = "signed-out";
let authUser: { id: string } | null = null;
let releaseAuth: (() => void) | null = null;
let queryRows: unknown[] = [];
let queryError: unknown = null;
let realtimeHandlers: Array<() => void> = [];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: () => {
        if (authState === "pending") {
          return new Promise((resolve) => {
            releaseAuth = () => resolve({ data: { user: authUser }, error: null });
          });
        }
        return Promise.resolve({ data: { user: authUser }, error: null });
      },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => {
      const result = () => Promise.resolve({ data: queryRows, error: queryError });
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
    removeChannel: () => Promise.resolve(),
  },
}));

const { useTradeData } = await import("@/hooks/useTradeData");

/** Fresh client per test: no cache leakage between cases, no retry noise. */
function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "trade-1",
    traded_at: "2026-08-07T10:00:00Z",
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

beforeEach(() => {
  authState = "signed-out";
  authUser = null;
  releaseAuth = null;
  queryRows = [];
  queryError = null;
  realtimeHandlers = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useTradeData — demo vs real data", () => {
  it("shows nothing at all while the session is still resolving", async () => {
    authState = "pending";
    authUser = { id: "user-1" };

    const { result } = renderHook(() => useTradeData(), { wrapper: makeWrapper() });

    // A signed-in trader must never be shown sample numbers as their own.
    expect(result.current.isDemo).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(result.current.trades).toEqual([]);
    expect(result.current.trades).not.toBe(demoTrades);
    expect(result.current.stats.totalTrades).toBe(0);
    expect(result.current.stats.totalPnl).toBe(0);

    await act(async () => {
      releaseAuth?.();
    });
  });

  it("loads the signed-in trader's own rows into the stats and charts", async () => {
    authState = "signed-in";
    authUser = { id: "user-1" };
    queryRows = [row()];

    const { result } = renderHook(() => useTradeData(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isDemo).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.trades).toHaveLength(1);
    expect(result.current.trades[0]?.asset).toBe("EURUSD");
    expect(result.current.stats.totalTrades).toBe(1);
    expect(result.current.stats.totalPnl).toBe(200);
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.equityCurve).toHaveLength(1);
    expect(result.current.equityCurve[0]?.equity).toBe(10200);
    expect(result.current.strategyPerf[0]?.name).toBe("Break & Retest");
  });

  it("reports an empty journal rather than demo numbers for a signed-in trader with no trades", async () => {
    authState = "signed-in";
    authUser = { id: "user-1" };
    queryRows = [];

    const { result } = renderHook(() => useTradeData(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isDemo).toBe(false);
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.trades).toEqual([]);
    expect(result.current.stats.totalTrades).toBe(0);
    expect(result.current.stats.monthlyPnl).toBe(0);
    expect(result.current.equityCurve).toEqual([]);
    expect(result.current.strategyPerf).toEqual([]);
  });

  it("surfaces a failed fetch instead of quietly falling back to demo data", async () => {
    authState = "signed-in";
    authUser = { id: "user-1" };
    queryRows = [row()];
    queryError = { message: "network unavailable" };

    const { result } = renderHook(() => useTradeData(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(result.current.isDemo).toBe(false);
    expect(result.current.trades).toEqual([]);
    expect(result.current.stats.totalTrades).toBe(0);
  });

  it("recovers when the trader retries after a failed fetch", async () => {
    authState = "signed-in";
    authUser = { id: "user-1" };
    queryRows = [row()];
    queryError = { message: "network unavailable" };

    const { result } = renderHook(() => useTradeData(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.error).toBe(true));
    // A failed load must not leave the dashboard stuck in a loading state.
    expect(result.current.loading).toBe(false);

    queryError = null;
    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.error).toBe(false));
    expect(result.current.loading).toBe(false);
    expect(result.current.stats.totalTrades).toBe(1);
    expect(result.current.trades).toHaveLength(1);
  });

  it("keeps the demo journal for confirmed signed-out visitors", async () => {
    authState = "signed-out";
    authUser = null;

    const { result } = renderHook(() => useTradeData(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isDemo).toBe(true);
    expect(result.current.trades).toBe(demoTrades);
    expect(result.current.stats).toBe(demoStats);
  });

  it("picks up a trade logged elsewhere through the realtime subscription", async () => {
    authState = "signed-in";
    authUser = { id: "user-1" };
    queryRows = [];

    const { result } = renderHook(() => useTradeData(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isEmpty).toBe(true);

    // The journal inserts a trade → realtime fires → the dashboard refetches.
    queryRows = [row()];
    await act(async () => {
      realtimeHandlers.forEach((handler) => handler());
    });

    await waitFor(() => expect(result.current.stats.totalTrades).toBe(1));
    expect(result.current.stats.totalPnl).toBe(200);
    expect(result.current.isEmpty).toBe(false);
  });
});
