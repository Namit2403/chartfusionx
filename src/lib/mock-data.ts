export type Direction = "Long" | "Short";
export type Session = "Asian" | "London" | "New York";

export interface Trade {
  id: string;
  date: string;
  asset: string;
  market: "Forex" | "Crypto" | "Stocks" | "Futures" | "Options";
  direction: Direction;
  strategy: string;
  session: Session;
  timeframe: string;
  entry: number;
  exit: number;
  stop: number;
  target: number;
  size: number;
  riskPct: number;
  pnl: number;
  r: number;
  durationMin: number;
  emotionBefore: string;
  emotionAfter: string;
  grade: string;
  tags: string[];
  note: string;
}

const raw: Array<[string, string, Trade["market"], Direction, string, Session, string, number, number, string, string, string, string[], string]> = [
  ["2026-08-07", "EURUSD", "Forex", "Long", "Break & Retest", "London", "15m", 428.5, 2.1, "Calm", "Satisfied", "A", ["A+ Setup", "Breakout"], "Clean retest of the Asian high, waited for the 15m close."],
  ["2026-08-07", "BTCUSD", "Crypto", "Short", "Momentum", "New York", "5m", -186.0, -1.0, "FOMO", "Frustrated", "C-", ["FOMO", "Scalping"], "Chased the move after missing the first leg."],
  ["2026-08-06", "NAS100", "Futures", "Long", "Break & Retest", "New York", "5m", 612.25, 2.8, "Confident", "Calm", "A", ["A+ Setup", "High Confidence"], "Textbook opening range break with volume."],
  ["2026-08-06", "GBPJPY", "Forex", "Short", "Reversal", "London", "1h", -240.0, -1.0, "Calm", "Neutral", "B", ["Reversal"], "Valid setup, structure just kept pushing."],
  ["2026-08-05", "ETHUSD", "Crypto", "Long", "Break & Retest", "Asian", "1h", 318.75, 1.6, "Calm", "Calm", "B+", ["Swing"], "Partial at 1R, trailed the rest."],
  ["2026-08-05", "AAPL", "Stocks", "Long", "News Play", "New York", "15m", -155.4, -0.9, "Greed", "Regret", "D", ["News Trade"], "Held through earnings volatility with no plan."],
  ["2026-08-04", "XAUUSD", "Forex", "Long", "Break & Retest", "London", "15m", 505.0, 2.4, "Calm", "Satisfied", "A-", ["A+ Setup"], "Cut short of full target but process was clean."],
  ["2026-08-04", "SOLUSD", "Crypto", "Short", "Momentum", "New York", "5m", -212.6, -1.2, "Revenge", "Angry", "F", ["Revenge Trade"], "Immediately re-entered after a loss. No setup."],
  ["2026-08-03", "USDJPY", "Forex", "Short", "Reversal", "Asian", "30m", 264.0, 1.3, "Calm", "Calm", "B+", ["Reversal"], "Liquidity sweep of session high then CHoCH."],
  ["2026-08-02", "NAS100", "Futures", "Short", "Break & Retest", "New York", "5m", 398.1, 1.9, "Confident", "Calm", "A-", ["A+ Setup", "Breakout"], "Followed the playbook exactly."],
  ["2026-08-01", "EURUSD", "Forex", "Long", "Momentum", "London", "5m", -198.0, -1.0, "FOMO", "Frustrated", "C", ["FOMO"], "Entered before confirmation candle closed."],
  ["2026-07-31", "BTCUSD", "Crypto", "Long", "Swing Continuation", "Asian", "4h", 890.4, 3.4, "Calm", "Proud", "A+", ["Swing", "High Confidence"], "Best trade of the month. Full plan followed."],
];

export const trades: Trade[] = raw.map((t, i) => {
  const [date, asset, market, direction, strategy, session, timeframe, pnl, r, emotionBefore, emotionAfter, grade, tags, note] = t;
  const entry = 100 + i * 3.17;
  return {
    id: `T-${(1000 + i).toString()}`,
    date,
    asset,
    market,
    direction,
    strategy,
    session,
    timeframe,
    entry: Number(entry.toFixed(2)),
    exit: Number((entry + (pnl > 0 ? 2.4 : -1.1)).toFixed(2)),
    stop: Number((entry - 1.2).toFixed(2)),
    target: Number((entry + 3.6).toFixed(2)),
    size: 1 + (i % 4) * 0.5,
    riskPct: 0.5 + (i % 3) * 0.25,
    pnl,
    r,
    durationMin: 25 + i * 17,
    emotionBefore,
    emotionAfter,
    grade,
    tags,
    note,
  };
});

const wins = trades.filter((t) => t.pnl > 0);
const losses = trades.filter((t) => t.pnl <= 0);
const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

export const stats = {
  totalPnl: trades.reduce((s, t) => s + t.pnl, 0),
  weeklyPnl: 614.75,
  monthlyPnl: 2404.99,
  dailyPnl: 242.5,
  accountGrowth: 24.05,
  winRate: (wins.length / trades.length) * 100,
  avgR: trades.reduce((s, t) => s + t.r, 0) / trades.length,
  totalTrades: trades.length,
  streak: 2,
  streakType: "winning" as const,
  maxDrawdown: -612.4,
  profitFactor: grossWin / grossLoss,
  avgWinner: grossWin / wins.length,
  avgLoser: -grossLoss / losses.length,
  expectancy: trades.reduce((s, t) => s + t.r, 0) / trades.length,
  avgHold: "2h 14m",
  largestWin: Math.max(...trades.map((t) => t.pnl)),
  largestLoss: Math.min(...trades.map((t) => t.pnl)),
  consecutiveWins: 4,
  consecutiveLosses: 2,
  avgRiskPct: trades.reduce((s, t) => s + t.riskPct, 0) / trades.length,
};

export const equityCurve = trades
  .slice()
  .reverse()
  .reduce<Array<{ date: string; equity: number }>>((acc, t) => {
    const prev = acc.length ? acc[acc.length - 1]!.equity : 10000;
    acc.push({ date: t.date.slice(5), equity: Number((prev + t.pnl).toFixed(2)) });
    return acc;
  }, []);

export const strategyPerf = [
  { name: "Break & Retest", trades: 5, winRate: 100, expectancy: 2.16, pnl: 2262.35 },
  { name: "Swing Continuation", trades: 1, winRate: 100, expectancy: 3.4, pnl: 890.4 },
  { name: "Reversal", trades: 2, winRate: 50, expectancy: 0.15, pnl: 24.0 },
  { name: "Momentum", trades: 3, winRate: 0, expectancy: -1.07, pnl: -596.6 },
  { name: "News Play", trades: 1, winRate: 0, expectancy: -0.9, pnl: -155.4 },
];

export const sessionPerf = [
  { name: "London", pnl: 1055.5, winRate: 75 },
  { name: "New York", pnl: 456.35, winRate: 50 },
  { name: "Asian", pnl: 1473.15, winRate: 100 },
];

export const weekdayPerf = [
  { name: "Mon", pnl: 398.1 },
  { name: "Tue", pnl: 264.0 },
  { name: "Wed", pnl: 292.4 },
  { name: "Thu", pnl: 163.35 },
  { name: "Fri", pnl: 242.5 },
];

export const dnaScores = [
  { label: "Discipline", value: 82, delta: 11 },
  { label: "Patience", value: 74, delta: 5 },
  { label: "Risk Management", value: 88, delta: 3 },
  { label: "Emotional Control", value: 66, delta: -4 },
  { label: "Strategy Adherence", value: 79, delta: 8 },
  { label: "Execution Quality", value: 71, delta: 2 },
  { label: "Consistency", value: 68, delta: 6 },
  { label: "Adaptability", value: 63, delta: -1 },
];

export const currency = (n: number) =>
  `${n < 0 ? "-" : "+"}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
