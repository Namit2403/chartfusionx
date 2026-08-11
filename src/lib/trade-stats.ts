import type { Trade } from "@/lib/mock-data";

export type TradeStats = {
  totalPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  dailyPnl: number;
  accountGrowth: number;
  winRate: number;
  avgR: number;
  totalTrades: number;
  streak: number;
  streakType: "winning" | "losing";
  maxDrawdown: number;
  profitFactor: number;
  avgWinner: number;
  avgLoser: number;
  expectancy: number;
  avgHold: string;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  avgRiskPct: number;
};

const EMPTY_STATS: TradeStats = {
  totalPnl: 0,
  weeklyPnl: 0,
  monthlyPnl: 0,
  dailyPnl: 0,
  accountGrowth: 0,
  winRate: 0,
  avgR: 0,
  totalTrades: 0,
  streak: 0,
  streakType: "winning",
  maxDrawdown: 0,
  profitFactor: 0,
  avgWinner: 0,
  avgLoser: 0,
  expectancy: 0,
  avgHold: "—",
  largestWin: 0,
  largestLoss: 0,
  consecutiveWins: 0,
  consecutiveLosses: 0,
  avgRiskPct: 0,
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

/** Derives every dashboard/analytics number from a list of trades. */
export function computeStats(trades: Trade[]): TradeStats {
  if (trades.length === 0) return EMPTY_STATS;

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const sum = (list: Trade[]) => list.reduce((s, t) => s + t.pnl, 0);

  const week = daysAgo(7);
  const month = daysAgo(30);
  const today = new Date().toISOString().slice(0, 10);

  // Running equity to find the deepest peak-to-trough move.
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const t of trades.slice().reverse()) {
    equity += t.pnl;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.min(maxDrawdown, equity - peak);
  }

  let bestWinRun = 0;
  let bestLossRun = 0;
  let runWin = 0;
  let runLoss = 0;
  for (const t of trades.slice().reverse()) {
    if (t.pnl > 0) {
      runWin += 1;
      runLoss = 0;
    } else {
      runLoss += 1;
      runWin = 0;
    }
    bestWinRun = Math.max(bestWinRun, runWin);
    bestLossRun = Math.max(bestLossRun, runLoss);
  }

  let streak = 0;
  const streakType: "winning" | "losing" = trades[0]!.pnl > 0 ? "winning" : "losing";
  for (const t of trades) {
    if (streakType === "winning" ? t.pnl > 0 : t.pnl <= 0) streak += 1;
    else break;
  }

  const avgMinutes = trades.reduce((s, t) => s + t.durationMin, 0) / trades.length;

  return {
    totalPnl: sum(trades),
    weeklyPnl: sum(trades.filter((t) => new Date(t.date) >= week)),
    monthlyPnl: sum(trades.filter((t) => new Date(t.date) >= month)),
    dailyPnl: sum(trades.filter((t) => t.date === today)),
    accountGrowth: 0,
    winRate: (wins.length / trades.length) * 100,
    avgR: trades.reduce((s, t) => s + t.r, 0) / trades.length,
    totalTrades: trades.length,
    streak,
    streakType,
    maxDrawdown,
    profitFactor: grossLoss ? grossWin / grossLoss : grossWin,
    avgWinner: wins.length ? grossWin / wins.length : 0,
    avgLoser: losses.length ? -grossLoss / losses.length : 0,
    expectancy: trades.reduce((s, t) => s + t.r, 0) / trades.length,
    avgHold: `${Math.floor(avgMinutes / 60)}h ${Math.round(avgMinutes % 60)}m`,
    largestWin: Math.max(...trades.map((t) => t.pnl)),
    largestLoss: Math.min(...trades.map((t) => t.pnl)),
    consecutiveWins: bestWinRun,
    consecutiveLosses: bestLossRun,
    avgRiskPct: trades.reduce((s, t) => s + t.riskPct, 0) / trades.length,
  };
}

export function computeEquityCurve(trades: Trade[], starting = 10000) {
  return trades
    .slice()
    .reverse()
    .reduce<Array<{ date: string; equity: number }>>((acc, t) => {
      const prev = acc.length ? acc[acc.length - 1]!.equity : starting;
      acc.push({ date: t.date.slice(5), equity: Number((prev + t.pnl).toFixed(2)) });
      return acc;
    }, []);
}

function groupBy(trades: Trade[], key: (t: Trade) => string) {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    const k = key(t) || "Unspecified";
    map.set(k, [...(map.get(k) ?? []), t]);
  }
  return map;
}

export function computeStrategyPerf(trades: Trade[]) {
  return [...groupBy(trades, (t) => t.strategy)].map(([name, list]) => ({
    name,
    trades: list.length,
    winRate: (list.filter((t) => t.pnl > 0).length / list.length) * 100,
    expectancy: list.reduce((s, t) => s + t.r, 0) / list.length,
    pnl: list.reduce((s, t) => s + t.pnl, 0),
  }));
}

export function computeSessionPerf(trades: Trade[]) {
  return [...groupBy(trades, (t) => t.session)].map(([name, list]) => ({
    name,
    pnl: list.reduce((s, t) => s + t.pnl, 0),
    winRate: (list.filter((t) => t.pnl > 0).length / list.length) * 100,
  }));
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function computeWeekdayPerf(trades: Trade[]) {
  if (trades.length === 0) return [];
  const byDay = groupBy(trades, (t) => WEEKDAYS[(new Date(t.date).getDay() + 6) % 7] ?? "Sat");
  return WEEKDAYS.filter((d) => byDay.has(d)).map((name) => ({
    name,
    pnl: (byDay.get(name) ?? []).reduce((s, t) => s + t.pnl, 0),
  }));
}

/** Behavioural scores derived from logged psychology + execution data. */
export function computeDnaScores(trades: Trade[]) {
  if (trades.length === 0) return [];
  const pct = (n: number) => Math.round(Math.max(0, Math.min(100, n)));
  const stats = computeStats(trades);
  const calm = trades.filter((t) => ["Calm", "Confident"].includes(t.emotionBefore)).length / trades.length;
  const tilt = trades.filter((t) => ["FOMO", "Revenge", "Greed", "Fear"].includes(t.emotionBefore)).length / trades.length;
  const graded = trades.filter((t) => t.grade.startsWith("A") || t.grade.startsWith("B")).length / trades.length;
  const riskSpread =
    trades.reduce((s, t) => s + Math.abs(t.riskPct - stats.avgRiskPct), 0) / trades.length;

  return [
    { label: "Discipline", value: pct(calm * 100), delta: 0 },
    { label: "Patience", value: pct((1 - tilt) * 100), delta: 0 },
    { label: "Risk Management", value: pct(100 - riskSpread * 40), delta: 0 },
    { label: "Emotional Control", value: pct((1 - tilt) * 90), delta: 0 },
    { label: "Strategy Adherence", value: pct(graded * 100), delta: 0 },
    { label: "Execution Quality", value: pct(stats.winRate), delta: 0 },
    { label: "Consistency", value: pct(100 - riskSpread * 30), delta: 0 },
    { label: "Adaptability", value: pct(new Set(trades.map((t) => t.strategy)).size * 20), delta: 0 },
  ];
}

export type RuleAdherence = { name: string; progress: number; detail: string };

/** Rule compliance derived purely from the trades the user actually logged. */
export function computeRuleAdherence(trades: Trade[]): RuleAdherence[] {
  if (trades.length === 0) return [];
  const pct = (n: number) => Math.round(n * 100);
  const byDay = groupBy(trades, (t) => t.date);
  const days = [...byDay.values()];
  const okDays = days.filter((d) => d.length <= 3).length;
  const lowRisk = trades.filter((t) => t.riskPct > 0 && t.riskPct <= 2).length;
  const journaled = trades.filter((t) => t.note.trim().length > 0).length;
  const calm = trades.filter((t) => !["FOMO", "Revenge", "Greed"].includes(t.emotionBefore)).length;
  const planned = trades.filter((t) => t.strategy && t.strategy !== "Unspecified").length;

  return [
    {
      name: "Maximum 3 trades per day",
      progress: pct(okDays / days.length),
      detail: `${okDays}/${days.length} trading days`,
    },
    {
      name: "Maximum 2% risk per trade",
      progress: pct(lowRisk / trades.length),
      detail: `${lowRisk}/${trades.length} trades`,
    },
    {
      name: "Journal notes on every trade",
      progress: pct(journaled / trades.length),
      detail: `${journaled}/${trades.length} trades`,
    },
    {
      name: "No revenge / FOMO entries",
      progress: pct(calm / trades.length),
      detail: `${calm}/${trades.length} trades`,
    },
    {
      name: "Trade tied to a playbook strategy",
      progress: pct(planned / trades.length),
      detail: `${planned}/${trades.length} trades`,
    },
  ];
}
