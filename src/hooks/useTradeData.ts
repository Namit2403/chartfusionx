import { useCallback, useEffect, useMemo } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthUser } from "@/hooks/useAuthUser";
import { supabase } from "@/integrations/supabase/client";
import {
  computeDnaScores,
  computeEquityCurve,
  computeSessionPerf,
  computeStats,
  computeStrategyPerf,
  computeWeekdayPerf,
} from "@/lib/trade-stats";
import type { Trade } from "@/lib/mock-data";
import {
  dnaScores as demoDna,
  equityCurve as demoEquity,
  sessionPerf as demoSessions,
  stats as demoStats,
  strategyPerf as demoStrategies,
  trades as demoTrades,
  weekdayPerf as demoWeekdays,
} from "@/lib/mock-data";

type Row = Record<string, unknown>;

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function gradeFor(r: number) {
  if (r >= 2.5) return "A+";
  if (r >= 1.5) return "A";
  if (r >= 0.5) return "B";
  if (r >= 0) return "C";
  if (r >= -1) return "D";
  return "F";
}

function toTrade(row: Row): Trade {
  const r = num(row["r_multiple"]);
  return {
    id: String(row["id"]),
    date: String(row["traded_at"] ?? "").slice(0, 10),
    asset: (row["asset"] as string) || "—",
    market: ((row["market"] as Trade["market"]) || "Forex") as Trade["market"],
    direction: (row["direction"] as Trade["direction"]) || "Long",
    strategy: (row["strategy"] as string) || "Unspecified",
    session: (row["session"] as Trade["session"]) || "London",
    timeframe: (row["timeframe"] as string) || "—",
    entry: num(row["entry_price"]),
    exit: num(row["exit_price"]),
    stop: num(row["stop_price"]),
    target: num(row["target_price"]),
    size: num(row["position_size"]),
    riskPct: num(row["risk_pct"]),
    pnl: num(row["pnl"]),
    r,
    durationMin: 0,
    emotionBefore: (row["emotion_before"] as string) || "—",
    emotionAfter: (row["emotion_after"] as string) || "—",
    grade: gradeFor(r),
    tags: (row["tags"] as string[]) ?? [],
    note: (row["entry_reason"] as string) || "",
  };
}

const NO_TRADES: Trade[] = [];

/** The one query key for the signed-in trader's trades. */
export const tradesQueryKey = (userId: string) => ["trades", userId] as const;

async function fetchTrades(userId: string): Promise<Trade[]> {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("traded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => toTrade(d as Row));
}

/**
 * Trade data for every data surface.
 *
 * Demo numbers are a fallback for confirmed signed-out visitors ONLY. While the
 * session is still resolving — or when a fetch fails — this reports `loading`
 * (or `error`) with empty data, so a signed-in trader never sees sample numbers
 * presented as their own. Fetching, caching, retries and cross-route sharing are
 * TanStack Query's job: all routes asking at once share one fetch and one cache
 * entry per user.
 */
export function useTradeData() {
  const { user, loading: authLoading } = useAuthUser();
  const queryClient = useQueryClient();

  const userId = user?.id ?? null;
  const signedOut = !authLoading && !userId;

  const query = useQuery({
    queryKey: tradesQueryKey(userId ?? "anonymous"),
    queryFn: () => fetchTrades(userId!),
    enabled: Boolean(userId),
    // Realtime events mark the query stale and refetch active observers; focus
    // refetch covers tabs that missed them. Cached rows stay on screen during
    // background refetches instead of blanking to skeletons.
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  // Realtime: a trade logged in the journal (or another tab) updates these numbers.
  const refresh = useCallback(() => {
    if (userId) void queryClient.invalidateQueries({ queryKey: tradesQueryKey(userId) });
  }, [queryClient, userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`trades:${userId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trades",
          filter: `user_id=eq.${userId}`,
        },
        refresh,
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  // Returning to the tab should never show numbers that went stale meanwhile.
  useEffect(() => {
    if (!userId) return;
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [userId, refresh]);

  return useMemo(() => {
    if (signedOut) {
      return {
        trades: demoTrades,
        stats: demoStats,
        equityCurve: demoEquity,
        strategyPerf: demoStrategies,
        sessionPerf: demoSessions,
        weekdayPerf: demoWeekdays,
        dnaScores: demoDna,
        isDemo: true,
        isEmpty: false,
        error: false,
        loading: false,
        refresh,
      };
    }

    // The query key includes the user id, so cached rows can never be
    // attributed to another user mid-handshake.
    const current = query.data ?? NO_TRADES;
    const error = Boolean(userId && query.isError);
    // First load of this user (no cache yet) blocks rendering; background
    // refetches and user switches keep the screen stable.
    const loading = authLoading || (!error && !current.length && query.isPending);

    return {
      trades: current,
      stats: computeStats(current),
      equityCurve: computeEquityCurve(current),
      strategyPerf: computeStrategyPerf(current),
      sessionPerf: computeSessionPerf(current),
      weekdayPerf: computeWeekdayPerf(current),
      dnaScores: computeDnaScores(current),
      isDemo: false,
      isEmpty: current.length === 0,
      error,
      loading,
      refresh,
    };
  }, [signedOut, userId, query.data, query.isError, query.isPending, authLoading, refresh]);
}
