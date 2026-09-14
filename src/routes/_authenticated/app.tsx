import { createFileRoute, Link } from "@tanstack/react-router";
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
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Quote,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { NoTradesYet } from "@/components/no-trades-yet";
import { OnboardingModal } from "@/components/onboarding-modal";
import { RiskDisclaimer } from "@/components/risk-disclaimer";
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

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)]",
        className,
      )}
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

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tile,
}: {
  label: string;
  value: string;
  delta: string;
  icon: typeof Flame;
  tile: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="num mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="mt-2 text-xs font-medium text-violet-300">{delta}</p>
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg",
            tile,
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </Card>
  );
}

function gradeTone(grade: string) {
  if (grade.startsWith("A")) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (grade.startsWith("B")) return "bg-sky-500/15 text-sky-300 border-sky-500/30";
  if (grade.startsWith("C")) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-rose-500/15 text-rose-300 border-rose-500/30";
}

function RecentTradeCard({ trade }: { trade: Trade }) {
  const win = trade.pnl >= 0;
  const barPct = Math.min(100, (Math.abs(trade.r) / 3.5) * 100);
  return (
    <div className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-4 transition hover:border-violet-500/40">
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
            style={{ width: `${Math.max(8, barPct)}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="num text-[11px] text-muted-foreground">
            {trade.r >= 0 ? "+" : ""}
            {trade.r.toFixed(1)}R · {trade.session}
          </span>
          <span
            className={cn("num text-sm font-semibold", win ? "text-emerald-300" : "text-rose-300")}
          >
            {currency(trade.pnl)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Right rail widgets                                                  */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function MiniCalendar({ markedDates }: { markedDates: Set<string> }) {
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
    <Card className="p-4">
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

function SessionCountdowns() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card className="p-4">
      <SectionHeader title="Session opens" />
      <ul className="space-y-3">
        {SESSIONS.map((s) => {
          const open = nextOpenUtc(s.openUtcHours, now);
          return (
            <li key={s.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <span className={cn("size-2 rounded-full", s.color)} />
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
  const { user, loading: authLoading } = useAuthUser();
  const { trades, stats, equityCurve, strategyPerf, isEmpty } = useTradeData();
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

  return (
    <div className="flex w-full gap-6">
      <OnboardingModal />

      {/* ------------------------------ Main column ------------------------------ */}
      <div className="min-w-0 flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Welcome back{name ? `, ${name}` : ""}! <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {authLoading
              ? "Loading your journal…"
              : isEmpty && !user
                ? "Browsing the demo journal — sign in to log your own trades."
                : "Here's what your trading data says today."}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <StatCard
            label="Net P&L (month)"
            value={currency(stats.monthlyPnl)}
            delta={`↑ ${stats.accountGrowth.toFixed(2)}% account growth`}
            icon={TrendingUp}
            tile="bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/30"
          />
          <StatCard
            label="Win rate"
            value={`${stats.winRate.toFixed(1)}%`}
            delta={`${stats.totalTrades} trades logged`}
            icon={Target}
            tile="bg-gradient-to-br from-sky-500 to-cyan-400 shadow-sky-500/30"
          />
          <StatCard
            label="Win streak"
            value={`${stats.streak}`}
            delta={stats.streak === 1 ? "current win" : "current wins in a row"}
            icon={Flame}
            tile="bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30"
          />
          <StatCard
            label="Avg R / trade"
            value={`${stats.avgR >= 0 ? "+" : ""}${stats.avgR.toFixed(2)}R`}
            delta={`profit factor ${stats.profitFactor.toFixed(2)}`}
            icon={Zap}
            tile="bg-gradient-to-br from-emerald-500 to-teal-400 shadow-emerald-500/30"
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
          {isEmpty ? (
            <Card>
              <NoTradesYet
                title="Your dashboard is waiting on your first trade"
                description="Equity curve, win rate, expectancy and AI insight all come from the trades you log — nothing here is sample data."
              />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {recentTrades.map((t) => (
                <RecentTradeCard key={t.id} trade={t} />
              ))}
            </div>
          )}
        </section>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <SectionHeader
              title="Equity progress"
              action={
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Cumulative
                </span>
              }
            />
            <div className="h-64">
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
          </Card>

          <Card>
            <SectionHeader title="Top setups" />
            <div className="flex items-center gap-4">
              <div className="relative size-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topSetups}
                      dataKey="trades"
                      nameKey="name"
                      innerRadius={44}
                      outerRadius={68}
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
                  <span className="num text-xl font-semibold text-foreground">
                    {strategyPerf.length}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    setups
                  </span>
                </div>
              </div>
              <ul className="min-w-0 flex-1 space-y-2">
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
          </Card>
        </div>

        {/* Quote + AI coach */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="relative overflow-hidden lg:col-span-2">
            <div className="pointer-events-none absolute -left-8 -top-8 size-32 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
                <Quote className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium italic leading-relaxed text-foreground">
                  "It's not whether you're right or wrong that matters, but how much money you make
                  when you're right and how much you lose when you're wrong."
                </p>
                <p className="mt-2 text-xs text-muted-foreground">— George Soros</p>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
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
      <aside className="hidden w-72 shrink-0 space-y-4 lg:block">
        {/* Trader card */}
        <Card className="flex items-center gap-3 p-4">
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

        <MiniCalendar markedDates={markedDates} />

        {/* Daily goal */}
        <Card className="p-4">
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

        <SessionCountdowns />
      </aside>
    </div>
  );
}
