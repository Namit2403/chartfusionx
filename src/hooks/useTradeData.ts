import { useEffect, useMemo, useState } from "react";

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

/**
 * Signed-in traders always see their OWN data — which is empty until they log
 * their first trade. Signed-out visitors browsing the product see the demo set
 * so the pages aren't blank shells.
 */
export function useTradeData() {
  const { user, loading: authLoading } = useAuthUser();
  const [rows, setRows] = useState<Trade[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (authLoading) return;
    if (!user) {
      setRows(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void supabase
      .from("trades")
      .select("*")
      .order("traded_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setRows((data ?? []).map((d) => toTrade(d as Row)));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, authLoading]);

  return useMemo(() => {
    const isDemo = !user;
    const trades = isDemo ? demoTrades : (rows ?? []);
    const isEmpty = trades.length === 0;

    if (isDemo) {
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
        loading: authLoading,
      };
    }

    return {
      trades,
      stats: computeStats(trades),
      equityCurve: computeEquityCurve(trades),
      strategyPerf: computeStrategyPerf(trades),
      sessionPerf: computeSessionPerf(trades),
      weekdayPerf: computeWeekdayPerf(trades),
      dnaScores: computeDnaScores(trades),
      isDemo: false,
      isEmpty,
      loading: authLoading || loading,
    };
  }, [user, rows, authLoading, loading]);
}
