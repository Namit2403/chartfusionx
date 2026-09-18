import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  Flame,
  LineChart,
  Plus,
  Quote,
  RotateCcw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Zap,
} from "lucide-react";

import { NoTradesYet } from "@/components/no-trades-yet";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { OnboardingModal } from "@/components/onboarding-modal";
import { RiskDisclaimer } from "@/components/risk-disclaimer";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useSubscription } from "@/hooks/useSubscription";
import { useTradeData } from "@/hooks/useTradeData";
import { currency, type Trade } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Performance Dashboard — ChartFusionX" },
      {
        name: "description",
        content:
          "Equity curve, win rate, expectancy and behavioral insight across every trade you log in ChartFusionX.",
      },
      { property: "og:title", content: "Performance Dashboard — ChartFusionX" },
      {
        property: "og:description",
        content: "Turn raw trade data into clear performance insight.",
      },
    ],
  }),
  component: Dashboard,
});

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

/** Gloss tint as [from, to, glow] RGB triplets for the `.gloss` surface. */
type Gloss = [from: string, to: string, glow: string];

const GLOSS_VIOLET: Gloss = ["139 92 246", "217 70 239", "139 92 246"];
const GLOSS_SKY: Gloss = ["56 189 248", "34 211 238", "56 189 248"];
const GLOSS_AMBER: Gloss = ["245 158 11", "249 115 22", "245 158 11"];
const GLOSS_EMERALD: Gloss = ["16 185 129", "20 184 166", "16 185 129"];
const GLOSS_NEUTRAL: Gloss = ["129 140 248", "56 189 248", "99 102 241"];

function Card({
  className,
  reveal,
  gloss,
  children,
  ...rest
}: {
  className?: string;
  reveal?: number | undefined;
  gloss?: Gloss | undefined;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={
        {
          ...(reveal !== undefined ? { "--reveal-delay": reveal } : undefined),
          ...(gloss
            ? { "--gloss-from": gloss[0], "--gloss-to": gloss[1], "--gloss-glow": gloss[2] }
            : undefined),
        } as React.CSSProperties
      }
      className={cn("glass fade-rise rounded-2xl p-5", gloss && "gloss", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      {action}
    </div>
  );
}

/**
 * Placeholder for a data surface that has no numbers to show yet. Used while a
 * signed-in trader's trades are still loading, and once they load empty — a new
 * trader must never be shown sample numbers as their own results.
 */ function ChartPlaceholder({
  message,
  className,
}: {
  message: string;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "glass flex flex-col items-center justify-center gap-2 rounded-xl px-6 text-center",
        className,
      )}
    >
      <LineChart className="size-5 text-muted-foreground" />
      <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{message}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tile,
  reveal,
  loading,
  muted,
  spark,
  gloss,
}: {
  label: string;
  value: string;
  delta: string;
  icon: typeof Flame;
  tile: string;
  reveal?: number | undefined;
  loading?: boolean | undefined;
  muted?: boolean | undefined;
  spark?: number[] | undefined;
  gloss?: Gloss | undefined;
}) {
  return (
    <Card className="relative overflow-hidden" reveal={reveal} gloss={gloss}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <>
              <Skeleton className="mt-2 h-7 w-28 xl:h-8" />
              <Skeleton className="mt-2.5 h-3 w-36" />
            </>
          ) : (
            <>
              <p className="num mt-2 text-2xl font-semibold tracking-tight text-foreground xl:text-3xl">
                {value}
              </p>
              <p
                className={cn(
                  "mt-2 text-xs font-medium",
                  muted ? "text-muted-foreground" : "text-violet-300",
                )}
              >
                {delta}
              </p>
            </>
          )}
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-lg xl:size-10",
            tile,
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      {!loading && spark && <PnlSpark points={spark} />}
    </Card>
  );
}

/** Mini cumulative-P&L line for the Net P&L card. Pure SVG — no data, no line. */
function PnlSpark({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = 120 / (points.length - 1);
  const coords = points.map(
    (p, i) => `${(i * step).toFixed(1)},${(28 - ((p - min) / span) * 24).toFixed(1)}`,
  );
  const up = (points[points.length - 1] ?? 0) >= (points[0] ?? 0);
  return (
    <svg viewBox="0 0 120 32" preserveAspectRatio="none" className="mt-3 h-8 w-full" aria-hidden>
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={up ? "#34d399" : "#fb7185"}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Compact whole-dollar money for tight tiles — precision lives in `title`. */
const shortMoney = (n: number) =>
  `${n < 0 ? "-" : "+"}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

/* ------------------------------------------------------------------ */
/* Right rail widgets                                                  */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function MiniCalendar({
  markedDates,
  reveal,
}: {
  markedDates: Set<string>;
  reveal?: number | undefined;
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const leadCells = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: leadCells }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  const iso = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <Card className="p-4" reveal={reveal}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d.slice(0, 2)}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1 text-center">
        {cells.map((day, i) => (
          <span key={i} className="relative mx-auto flex size-6 items-center justify-center">
            {day !== null && (
              <>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[11px]",
                    isToday(day)
                      ? "bg-violet-500 font-semibold text-white"
                      : "text-muted-foreground",
                  )}
                >
                  {day}
                </span>
                {markedDates.has(iso(day)) && !isToday(day) && (
                  <span className="absolute -bottom-0.5 size-1 rounded-full bg-violet-400" />
                )}
              </>
            )}
          </span>
        ))}
      </div>
    </Card>
  );
}

function GoalRing({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <svg viewBox="0 0 84 84" className="size-24 -rotate-90">
      <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
      <circle
        cx="42"
        cy="42"
        r={r}
        fill="none"
        stroke="url(#goal-grad)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${c * clamped} ${c}`}
      />
      <defs>
        <linearGradient id="goal-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const SESSIONS = [
  { name: "London", openUtcHours: 8, color: "bg-amber-400" },
  { name: "New York", openUtcHours: 13.5, color: "bg-emerald-400" },
  { name: "Asian", openUtcHours: 0, color: "bg-violet-400" },
];

function formatIn(ms: number) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
}

function nextOpenUtc(openUtcHours: number, now: Date) {
  const h = Math.floor(openUtcHours);
  const m = Math.round((openUtcHours - h) * 60);
  const target = new Date(now);
  target.setUTCHours(h, m, 0, 0);
  if (target.getTime() <= now.getTime()) target.setUTCDate(target.getUTCDate() + 1);
  return target;
}

function SessionCountdowns({ reveal }: { reveal?: number | undefined }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="p-4" reveal={reveal}>
      <SectionHeader title="Session opens" />
      <ul className="space-y-3">
        {SESSIONS.map((s) => {
          const open = nextOpenUtc(s.openUtcHours, now);
          return (
            <li key={s.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <span
                  className={cn(
                    "size-2 rounded-full transition-opacity",
                    open.getTime() - now.getTime() <= 0 ? s.color : "opacity-40",
                  )}
                />
                {s.name}
              </span>
              <span className="num text-xs text-muted-foreground">
                {formatIn(open.getTime() - now.getTime())}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Quick-stats tile — icon above a big value above its label. */
function QuickTile({
  label,
  value,
  icon: Icon,
  title,
  reveal,
}: {
  label: string;
  value: string;
  icon: typeof Flame;
  title?: string | undefined;
  reveal?: number | undefined;
}) {
  return (
    <Card
      className="flex min-w-0 flex-col items-center gap-1 p-3.5 text-center"
      reveal={reveal}
      gloss={GLOSS_NEUTRAL}
    >
      <Icon className="size-4 text-violet-300" />
      <p
        className="num w-full truncate text-lg font-semibold tracking-tight text-foreground"
        title={title}
      >
        {value}
      </p>
      <p className="w-full text-[11px] leading-tight text-muted-foreground">{label}</p>
    </Card>
  );
}

function gradeTone(grade: string) {
  if (grade.startsWith("A")) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (grade.startsWith("B")) return "bg-sky-500/15 text-sky-300 border-sky-500/30";
  if (grade.startsWith("C")) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-rose-500/15 text-rose-300 border-rose-500/30";
}

const TRADING_QUOTES: Array<{ text: string; author: string }> = [
  {
    text: "It's not whether you're right or wrong that matters, but how much money you make when you're right and how much you lose when you're wrong.",
    author: "George Soros",
  },
  {
    text: "The goal of a successful trader is to make the best trades. Money is secondary.",
    author: "Alexander Elder",
  },
  {
    text: "Plan the trade and trade the plan.",
    author: "Trading proverb",
  },
  {
    text: "Amateurs want to be right. Professionals want to know.",
    author: "Tom Hougaard",
  },
  {
    text: "The markets can remain irrational longer than you can remain solvent.",
    author: "attributed to John Maynard Keynes",
  },
  {
    text: "Cut your losses quickly, without hesitation. It's like a thief in your house — you don't negotiate, you throw him out.",
    author: "Alexander Elder",
  },
];

/** Rotating trading wisdom — picks up where the stats leave off. */
function TradingQuotesCard({ reveal }: { reveal?: number | undefined }) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * TRADING_QUOTES.length));
  const [paused, setPaused] = useState(false);
  const quote = TRADING_QUOTES[index]!;

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % TRADING_QUOTES.length), 8000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <Card
      className="relative overflow-hidden lg:col-span-2"
      reveal={reveal}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute -left-8 -top-8 size-32 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="relative flex h-full items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
          <Quote className="size-4" />
        </span>
        <div className="min-w-0 flex-1" aria-live="polite">
          <p
            key={index}
            className="fade-rise text-sm font-medium italic leading-relaxed text-foreground"
          >
            "{quote.text}"
          </p>
          <p key={`a-${index}`} className="fade-rise mt-2 text-xs text-muted-foreground" style={{ animationDelay: "80ms" }}>
            — {quote.author}
          </p>
          <div className="mt-3 flex items-center gap-1.5" aria-hidden>
            {TRADING_QUOTES.map((q, i) => (
              <button
                key={q.author + i}
                type="button"
                aria-label={`Quote ${i + 1} of ${TRADING_QUOTES.length}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "size-1.5 rounded-full transition-all",
                  i === index
                    ? "w-4 bg-violet-600 dark:bg-violet-400"
                    : "bg-black/25 hover:bg-black/45 dark:bg-white/20 dark:hover:bg-white/40",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function RecentTradeCard({ trade, reveal }: { trade: Trade; reveal?: number | undefined }) {
  const win = trade.pnl >= 0;
  const barPct = Math.min(100, (Math.abs(trade.r) / 3.5) * 100);
  return (
    <div
      style={
        reveal !== undefined ? ({ "--reveal-delay": reveal } as React.CSSProperties) : undefined
      }
      className="glass fade-rise rounded-2xl p-4 transition hover:border-violet-500/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{trade.asset}</p>
          <p className="truncate text-xs text-muted-foreground">{trade.strategy}</p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            gradeTone(trade.grade),
          )}
        >
          {trade.grade}
        </span>
      </div>
      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r",
              win ? "from-violet-500 to-fuchsia-400" : "from-rose-500 to-orange-400",
            )}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span
          className={cn("num text-sm font-semibold", win ? "text-emerald-300" : "text-rose-300")}
        >
          {currency(trade.pnl)}
        </span>
        <span className={cn("num text-xs", win ? "text-emerald-300" : "text-rose-300")}>
          {trade.r >= 0 ? "+" : ""}
          {trade.r.toFixed(1)}R
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

const SETUPS_COLORS = ["#8b5cf6", "#38bdf8", "#34d399", "#fbbf24", "#fb7185"];

function displayName(
  user: { email?: string | null; user_metadata?: Record<string, unknown> } | null,
): { name: string; initial: string } {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const raw =
    (typeof meta["display_name"] === "string" && meta["display_name"].trim()) ||
    (typeof meta["full_name"] === "string" && meta["full_name"].trim()) ||
    user?.email?.split("@")[0] ||
    "Trader";
  const name = raw.split(/\s+/)[0] ?? raw;
  return { name, initial: (name[0] ?? "T").toUpperCase() };
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthUser();
  const { trades, stats, equityCurve, strategyPerf, isEmpty, isDemo, error, loading, refresh } =
    useTradeData();
  const { planName, entitled } = useSubscription();

  const { name, initial } = displayName(user ?? null);

  const topSetups = useMemo(
    () => [...strategyPerf].sort((a, b) => b.trades - a.trades).slice(0, 5),
    [strategyPerf],
  );
  const totalSetupTrades = topSetups.reduce((s, t) => s + t.trades, 0) || 1;

  const markedDates = useMemo(() => new Set(trades.map((t) => t.date)), [trades]);

  // Journaling goal: trades journaled on the most recent active day, target 3.
  const goalPerDay = 3;
  const lastActiveDay = useMemo(
    () => trades.reduce<string | null>((max, t) => (!max || t.date > max ? t.date : max), null),
    [trades],
  );
  const journaledLastDay = useMemo(
    () => trades.filter((t) => t.date === lastActiveDay).length,
    [trades, lastActiveDay],
  );
  const goalPct = journaledLastDay / goalPerDay;

  const recentTrades = trades.slice(0, 4);

  // Cumulative P&L trend for the Net P&L card's spark. Trades arrive
  // newest-first, so accumulate over a reversed copy. Primary window is the
  // card's own 30-day scope; if the journal has no trades that recent, fall
  // back to the latest 30 trades so the trend line still says something.
  const pnlSpark = useMemo(() => {
    if (trades.length === 0) return [];
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const start = monthAgo.toISOString().slice(0, 10);
    const accumulate = (list: Trade[]) => {
      const series: number[] = [];
      let sum = 0;
      for (const t of list) {
        sum += t.pnl;
        series.push(Number(sum.toFixed(2)));
      }
      return series;
    };
    const monthTrades = [...trades].reverse().filter((t) => t.date >= start);
    if (monthTrades.length > 0) return accumulate(monthTrades);
    return accumulate(trades.slice(0, 30).reverse());
  }, [trades]);

  // With an empty journal the deltas have no meaning yet, so they say so
  // instead of reading like results ("↑ 0.00% account growth"). A failed fetch
  // is not an empty journal though — never claim the trader has no trades when
  // we simply couldn't read them.
  const noTradesYet = !loading && !isDemo && isEmpty && !error;
  const statHint = error ? "Not available right now" : null;
  const mutedStats = statHint !== null || noTradesYet;

  return (
    <div className="flex w-full gap-6">
      <OnboardingModal />

      {/* ------------------------------ Main column ------------------------------ */}
      <div className="min-w-0 flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
            Welcome back{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {name}
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {authLoading || (loading && !isDemo)
              ? "Loading your journal…"
              : isDemo
                ? "Browsing the demo journal — these numbers are an example. Sign in and your own stats fill in here."
                : isEmpty
                  ? "Your dashboard is ready — it fills in the moment you log your first trade."
                  : "Here's what your trading data says today."}
          </p>
        </div>

        {/* Demo banner — shows what this page becomes once you sign in */}
        {isDemo && !authLoading && (
          <div className="glass fade-rise flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-2.5">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="size-4 shrink-0 text-violet-300" />
              This is a sample trader's journal. Sign in and every number here becomes yours.
            </p>
            <button
              type="button"
              onClick={() => void navigate({ to: "/auth" })}
              className="rounded-lg border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold text-violet-200 transition hover:bg-violet-500/25 hover:text-violet-100"
            >
              Sign in to make it yours
            </button>
          </div>
        )}

        {/* First-run checklist — signed-in traders only, auto-completes as data arrives */}
        {user && <OnboardingChecklist trades={trades} />}

        {/* The fetch failed — say so instead of showing zeros as if they were results */}
        {error && !isDemo && (
          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-2.5">
            <p className="flex items-center gap-2 text-xs text-amber-200">
              <TriangleAlert className="size-4 shrink-0" />
              We couldn't load your trades just now — these numbers may be out of date.
            </p>
            <button
              type="button"
              onClick={refresh}
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200 transition hover:bg-amber-500/20"
            >
              <RotateCcw className="mr-1 inline size-3" />
              Retry
            </button>
          </div>
        )}

        <div className="glass-btn flex w-fit flex-wrap items-center gap-2 rounded-full px-1.5 py-1.5">
          <Link
            to="/journal/new"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3.5 text-xs font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90"
          >
            <Plus className="size-3.5" />
            Log trade
          </Link>
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
          >
            <Bell className="size-4" />
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <StatCard
            label="Net P&L (30 days)"
            value={currency(stats.monthlyPnl)}
            delta={
              statHint ??
              (noTradesYet
                ? "No trades logged yet"
                : `↑ ${stats.accountGrowth.toFixed(2)}% account growth`)
            }
            muted={mutedStats}
            icon={TrendingUp}
            tile="bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/30"
            reveal={0}
            loading={loading}
            spark={statHint === null && !noTradesYet ? pnlSpark : undefined}
            gloss={GLOSS_VIOLET}
          />
          <StatCard
            label="Win rate"
            value={`${stats.winRate.toFixed(1)}%`}
            delta={
              statHint ??
              (noTradesYet ? "Nothing to rate yet" : `${stats.totalTrades} trades logged`)
            }
            muted={mutedStats}
            icon={Target}
            tile="bg-gradient-to-br from-sky-500 to-cyan-400 shadow-sky-500/30"
            reveal={1}
            loading={loading}
            gloss={GLOSS_SKY}
          />
          <StatCard
            label="Win streak"
            value={`${stats.streak}`}
            delta={
              statHint ??
              (noTradesYet
                ? "Log a trade to start a streak"
                : stats.streakType === "winning"
                  ? stats.streak === 1
                    ? "1 win in a row"
                    : `${stats.streak} wins in a row`
                  : stats.streak === 1
                    ? "1 loss in a row"
                    : `${stats.streak} losses in a row`)
            }
            muted={mutedStats}
            icon={Flame}
            tile="bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30"
            reveal={2}
            loading={loading}
            gloss={GLOSS_AMBER}
          />
          <StatCard
            label="Avg R / trade"
            value={`${stats.avgR >= 0 ? "+" : ""}${stats.avgR.toFixed(2)}R`}
            delta={
              statHint ??
              (noTradesYet
                ? "Waiting on your first trade"
                : `profit factor ${stats.profitFactor.toFixed(2)}`)
            }
            muted={mutedStats}
            icon={Zap}
            tile="bg-gradient-to-br from-emerald-500 to-teal-400 shadow-emerald-500/30"
            reveal={3}
            loading={loading}
            gloss={GLOSS_EMERALD}
          />
        </div>

        {/* Quick stats — the metrics the top cards don't show */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <QuickTile
            label="Trades logged"
            value={loading ? "" : mutedStats ? "—" : String(stats.totalTrades)}
            icon={Target}
            reveal={13}
          />
          <QuickTile
            label="Profit factor"
            value={loading ? "" : mutedStats ? "—" : stats.profitFactor.toFixed(2)}
            icon={TrendingUp}
            reveal={14}
          />
          <QuickTile
            label="Expectancy"
            value={
              loading
                ? ""
                : mutedStats
                  ? "—"
                  : `${stats.expectancy >= 0 ? "+" : ""}${stats.expectancy.toFixed(2)}R`
            }
            icon={Zap}
            reveal={15}
          />
          <QuickTile
            label="Avg win"
            value={loading ? "" : mutedStats ? "—" : shortMoney(stats.avgWinner)}
            title={loading ? undefined : currency(stats.avgWinner)}
            icon={TrendingUp}
            reveal={16}
          />
          <QuickTile
            label="Best trade"
            value={loading ? "" : mutedStats ? "—" : shortMoney(stats.largestWin)}
            title={loading ? undefined : currency(stats.largestWin)}
            icon={Sparkles}
            reveal={17}
          />
          <QuickTile
            label="Max drawdown"
            value={loading ? "" : mutedStats ? "—" : currency(stats.maxDrawdown)}
            icon={TrendingDown}
            reveal={18}
          />
        </div>

        {/* Recent trades */}
        <section>
          <SectionHeader
            title="Recent trades"
            action={
              <Link
                to="/journal"
                className="text-xs font-medium text-violet-300 transition hover:text-violet-200"
              >
                View all
              </Link>
            }
          />
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : isEmpty ? (
            <Card>
              <NoTradesYet
                title={error ? "We couldn't load your trades" : "Your journal starts here"}
                description={
                  error
                    ? "Your journal is safe on the server — retry above to pull it back in."
                    : "Log your first trade and this grid fills with your entries — every stat, curve and score on this page is computed from them."
                }
              />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {recentTrades.map((t, i) => (
                <RecentTradeCard key={t.id} trade={t} reveal={4 + i} />
              ))}
            </div>
          )}
        </section>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2" reveal={8}>
            <SectionHeader
              title="Equity progress"
              action={
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Cumulative
                </span>
              }
            />
            {loading ? (
              <Skeleton className="h-52 w-full rounded-xl" />
            ) : isEmpty ? (
              <ChartPlaceholder
                className="h-52"
                message="Your equity curve appears once you log your first trade."
              />
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurve} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(255,255,255,0.35)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.35)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      domain={["dataMin - 200", "dataMax + 200"]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15,15,30,0.95)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke="#a855f7"
                      strokeWidth={2}
                      fill="url(#eq)"
                      dot={{ r: 3, fill: "#a855f7", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card reveal={9}>
            <SectionHeader title="Top setups" />
            {loading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : isEmpty ? (
              <ChartPlaceholder
                className="h-40"
                message="Setups are grouped from the trades you log — this fills in after your first one."
              />
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3 xl:justify-start">
                <div className="relative size-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topSetups}
                        dataKey="trades"
                        nameKey="name"
                        innerRadius={34}
                        outerRadius={54}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {topSetups.map((_, i) => (
                          <Cell key={i} fill={SETUPS_COLORS[i % SETUPS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15,15,30,0.95)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          fontSize: 12,
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="num text-lg font-semibold text-foreground">
                      {strategyPerf.length}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      setups
                    </span>
                  </div>
                </div>
                <ul className="min-w-[7rem] flex-1 space-y-2">
                  {topSetups.map((s, i) => (
                    <li key={s.name} className="flex items-center gap-2 text-xs">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: SETUPS_COLORS[i % SETUPS_COLORS.length] }}
                      />
                      <span className="min-w-0 flex-1 truncate text-foreground">{s.name}</span>
                      <span className="num text-muted-foreground">
                        {Math.round((s.trades / totalSetupTrades) * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        {/* Quote + AI coach */}
        <div className="grid gap-4 lg:grid-cols-3">
          <TradingQuotesCard reveal={10} />

          <Card className="relative overflow-hidden" reveal={11}>
            <div className="pointer-events-none absolute -right-6 -top-10 size-28 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="relative">
              <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300">
                New
              </span>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/30">
                  <Bot className="size-5" />
                </span>
                <p className="text-sm font-semibold text-foreground">AI Coach</p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Get started with AI trade reviews, chart critiques and voice summaries — trained on
                your own journal.
              </p>
              <Link
                to="/whats-coming"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90"
              >
                <Sparkles className="size-3.5" />
                See what's coming
              </Link>
            </div>
          </Card>
        </div>

        <RiskDisclaimer />
      </div>

      {/* ------------------------------ Right rail ------------------------------ */}
      <aside className="hidden w-72 shrink-0 space-y-4 xl:block">
        {/* Trader card */}
        <Card className="flex items-center gap-3 p-4" reveal={12}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-violet-500/30">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {planName ?? "Free Beta"} member
            </p>
          </div>
          {entitled && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-300">
              Pro
            </span>
          )}
        </Card>

        <MiniCalendar markedDates={markedDates} reveal={13} />

        {/* Daily goal */}
        <Card className="p-4" reveal={14}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Journaling goal</p>
            <Link
              to="/goals"
              className="text-[10px] font-medium uppercase tracking-[0.12em] text-violet-300 hover:text-violet-200"
            >
              Edit goal
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <GoalRing pct={goalPct} />
              <span className="num absolute inset-0 flex items-center justify-center text-lg font-semibold text-foreground">
                {Math.round(Math.min(1, goalPct) * 100)}%
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {goalPct >= 1
                  ? "Goal met — great discipline!"
                  : journaledLastDay > 0
                    ? "Keep the streak alive"
                    : "Nothing journaled yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lastActiveDay
                  ? `${journaledLastDay} of ${goalPerDay} trades journaled on your last active day.`
                  : "Log your first trade to start the goal."}
              </p>
            </div>
          </div>
        </Card>

        <SessionCountdowns reveal={15} />
      </aside>
    </div>
  );
}
