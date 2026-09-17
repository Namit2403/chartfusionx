import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Camera,
  Check,
  LineChart,
  Mic,
  NotebookPen,
  Plus,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FounderTierCta } from "@/components/founder-tier-cta";
import { FOUNDER_CTA_LABEL, FOUNDER_CTA_LIVE, FOUNDER_PLANS } from "@/lib/whop-founding";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChartFusionX — The Trading Journal for Serious Traders" },
      {
        name: "description",
        content:
          "Log every trade. Understand your behavior. Improve your execution. ChartFusionX turns your journal into an equity curve, a win rate, and a clear read on your trading behavior — with AI coaching on every trade arriving soon.",
      },
      {
        property: "og:title",
        content: "ChartFusionX — The Trading Journal for Serious Traders",
      },
      {
        property: "og:description",
        content: "Track every trade. Understand your behavior. Improve your execution.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://chartfusionx.app/landing" }],
  }),
  component: LandingPage,
});

const MARQUEE_ITEMS = [
  "Free while in beta",
  "No card required",
  "Equity curve",
  "Win rate",
  "Expectancy",
  "AI trade review",
  "Trader DNA",
  "Playbook adherence",
];

type StickerFeature = {
  name: string;
  body: string;
  icon: LucideIcon;
  fill: string;
  text: string;
  rotate: string;
  status: "live" | "soon";
  intro: string;
  points: string[];
  steps: string[];
};

const STICKER_FEATURES: StickerFeature[] = [
  {
    name: "Trade Journal",
    body: "Log entries, exits, size, risk, tags, emotions and chart screenshots. Every detail becomes searchable data.",
    fill: "bg-mint-pop",
    text: "text-carbon",
    rotate: "-rotate-2",
    status: "live",
    icon: NotebookPen,
    intro:
      "The journal is the foundation the whole platform stands on: every screenshot, emotion, rule check and risk number you record becomes structured, searchable data that the dashboard, analytics and — later — the AI modules all reason over. Instead of maintaining a spreadsheet of P&L, you build a complete record of every decision you made, why you made it, and what happened next.",
    points: [
      "Full trade lifecycle in one entry: plan, entry, management, exit and post-trade review",
      "Attach before and after chart screenshots — annotated images live with the trade forever",
      "Tag setups, sessions, instruments, emotions and mistakes using your own vocabulary",
      "A rule checklist confirms the trade followed your playbook before it counts as a clean entry",
      "Risk fields — position size, stop distance, planned R and realised R — captured on every trade",
      "Instant search and filters: surface every revenge trade, B-grade entry or over-sized position in seconds",
    ],
    steps: [
      "Write the plan before you enter — thesis, invalidation level and position size.",
      "Attach the pre-entry chart screenshot so the context is never lost.",
      "After the close, one screen captures exit price, grade and emotional state.",
      "The entry feeds the dashboard, analytics and reports the second you save it.",
    ],
  },
  {
    name: "Performance Dashboard",
    body: "Equity curve, win rate, expectancy, profit factor and drawdown — computed from your own logged trades.",
    fill: "bg-electric-blue",
    text: "text-carbon",
    rotate: "rotate-1",
    status: "live",
    icon: BarChart3,
    intro:
      "Every field you log compounds into a live performance picture: equity curve, win rate, expectancy, profit factor, average R and drawdown — all computed directly from your journal entries, never hand-maintained. Open the dashboard after any session and your entire history of discipline is already on one screen, current to the trade you logged two minutes ago.",
    points: [
      "Equity curve with drawdown context — see the account's story, not just the ending balance",
      "Win rate, expectancy and profit factor measured in R as well as dollars, so results survive position-size noise",
      "Streak tracking: current win and loss runs, plus your longest revenge-trading chain",
      "Monthly and weekly P&L cards with growth percentages and best/worst day callouts",
      "Grades roll up: verify that your A-entries genuinely outperform your C-entries",
      "Zero spreadsheet maintenance — if you logged it, the dashboard already knows",
    ],
    steps: [
      "Journal trades as usual — no number is ever entered manually twice.",
      "Open the dashboard: equity, streaks and risk stats are already current.",
      "Drill into any week or month to see exactly what drove the result.",
      "Let expectancy and grade roll-ups tell you what to repeat tomorrow.",
    ],
  },
  {
    name: "Playbook",
    body: "Write down your setups and rules, then measure real trades against them.",
    fill: "bg-lavender",
    text: "text-carbon",
    rotate: "-rotate-1",
    status: "live",
    icon: BookOpen,
    intro:
      "Your playbook is the contract between you and your future self. Write each setup once — thesis, entry trigger, invalidation, targets and the market conditions it needs — then hold every real trade against the version of you that wrote the plan with a clear head. Adherence, not opinion, decides which setups survive.",
    points: [
      "One page per setup: trigger, timeframe, session, risk model and an example screenshot",
      "Link journal entries to the playbook setup they followed — or the rule they broke",
      "Adherence scoring shows what share of your trading actually followed a written plan",
      "Per-setup expectancy surfaces automatically as linked trades accumulate",
      "Promote or retire setups on evidence — the data settles the argument",
    ],
    steps: [
      "Write each setup once: trigger, timeframe, session and risk model.",
      "Attach an example screenshot so the setup is never ambiguous.",
      "Link every journal entry to the playbook rule it followed.",
      "Review the evidence monthly and promote or retire setups accordingly.",
    ],
  },
  {
    name: "Analytics",
    body: "Breakdowns by setup, session, instrument and weekday. Find out where your edge actually lives.",
    fill: "bg-sunburst",
    text: "text-carbon",
    rotate: "rotate-2",
    status: "live",
    icon: LineChart,
    intro:
      "Analytics slices your journal along every axis you record — setup, session, instrument, weekday, grade, even emotion — and shows you where the edge actually lives. Most traders discover their most-traded setup is not their best one; this is where that becomes impossible to ignore. No configuration either: every breakdown works the moment you journal.",
    points: [
      "Breakdowns by setup, session, instrument, weekday and trade grade",
      "Net P&L, win rate and expectancy computed per slice, ranked by what pays",
      "Emotion tags mapped to outcomes — put a number on what frustration costs you",
      "Session and weekday heat maps: find out if your London edge is real or folklore",
      "Any slice exports cleanly for mentor reviews or coaching groups",
    ],
    steps: [
      "Journal normally — analytics reads the same data, no extra input required.",
      "Slice performance by setup, session, instrument, weekday or grade.",
      "Spot the slices that pay and the ones that quietly leak.",
      "Export the view that matters and review it with a mentor.",
    ],
  },
  {
    name: "Goals & Habits",
    body: "Set process goals and track the habits behind them — daily risk, revenge-trade streaks, journaling.",
    fill: "bg-paper-white",
    text: "text-carbon",
    rotate: "-rotate-2",
    status: "live",
    icon: Target,
    intro:
      "Outcomes lag behind process. Goals & Habits lets you commit to things you fully control — maximum daily risk, no trades outside the playbook, journal every session — and then tracks the streaks, breaches and trends behind them automatically. When a red week strikes, the process record is what tells you whether it was bad luck or bad behaviour.",
    points: [
      "Process goals: daily risk caps, maximum trades per session, mandatory journal time",
      "Habit streaks for journaling, rule adherence and screenshot discipline",
      "Revenge-trade detection: flagged the moment you re-enter too soon after a loss",
      "Breach history shows whether rules erode gradually or snap on one bad day",
      "Weekly process review keeps the focus on behaviour before P&L",
    ],
    steps: [
      "Set process goals: risk caps, trade limits and journaling commitments.",
      "Trade the day — streaks and breaches update automatically from your journal.",
      "Get flagged when behaviour drifts: revenge entries, oversizing, skipped reviews.",
      "Close the week reviewing process first and P&L second.",
    ],
  },
  {
    name: "Reports",
    body: "Weekly, monthly and yearly reviews you can export and share with a mentor.",
    fill: "bg-sky-wash",
    text: "text-carbon",
    rotate: "rotate-1",
    status: "live",
    icon: Activity,
    intro:
      "Lessons only count if they are written down and revisited. Reports turns your journal into weekly, monthly and yearly reviews — equity narrative, best and worst trades, rule adherence, emotional patterns and what changed — generated automatically and formatted to share with a mentor or an accountability group.",
    points: [
      "One-click weekly, monthly and yearly reviews generated from logged data",
      "Highlights reel: best and worst trades, biggest adherence win, costliest emotion",
      "Period-over-period comparison as your history grows",
      "Mentor-ready export: hand over a complete, honest account of the period",
    ],
    steps: [
      "Pick the period: week, month or year.",
      "ChartFusionX drafts the review from your journal automatically.",
      "Add your own notes on what changes next period.",
      "Export and send it — or file it as your personal trading archive.",
    ],
  },
];

const AI_MODULES: StickerFeature[] = [
  {
    name: "AI Trade Review",
    body: "A personal coach reviews every trade you log.",
    fill: "bg-voltage-violet",
    text: "text-white",
    rotate: "rotate-1",
    status: "soon",
    icon: Sparkles,
    intro:
      "Imagine a coach who watches every trade you log and leaves structured notes before you have closed the tab. AI Trade Review reads the full context — plan, screenshots, execution, emotional tags — and responds with specifics: where your entry was early, where your management contradicted your own plan, and which single fix would most likely have changed the outcome. Not a lecture — one adjustment at a time, then it checks whether you made it.",
    points: [
      "A written review on every logged trade, cross-referenced against your playbook",
      "Flags the drift between what you planned and what you actually executed",
      "Detects emotional patterns across trades: FOMO entries, revenge sequences, oversizing after wins",
      "Prescribes exactly one concrete adjustment at a time — then follows up on it",
      "Trained on your history alone: your data never becomes someone else's advice",
    ],
    steps: [
      "Log a trade as usual — screenshots, grades and emotions included.",
      "The reviewer reads the full context against your playbook.",
      "Structured notes appear on the trade within moments.",
      "It prescribes one adjustment, then checks whether you made it next time.",
    ],
  },
  {
    name: "AI Chart Critique",
    body: "Structured critique of a marked-up chart, before you enter.",
    fill: "bg-ember",
    text: "text-white",
    rotate: "-rotate-1",
    status: "soon",
    icon: Camera,
    intro:
      "Before you enter, hand your marked-up chart to a second pair of eyes. AI Chart Critique reads your annotations together with the raw price action and challenges the trade the way a disciplined mentor would: is this level obvious or already crowded? Is your stop beyond real structure or just beyond a round number? Is this genuinely your setup, or a lookalike that happens to resemble it?",
    points: [
      "Upload a marked-up screenshot pre-entry and receive structured critique in seconds",
      "Checks the thesis against what the chart actually shows: trend, structure, volatility context",
      "Interrogates stop placement against real swing structure and volatility, not round numbers",
      "Compares the trade to your playbook: valid trigger or convincing imitation?",
      "The whole exchange attaches to the journal entry for post-trade review",
    ],
    steps: [
      "Mark up your chart and upload it before you enter.",
      "The critique examines thesis, structure, volatility and stop placement.",
      "You get pointed questions rather than a verdict — the decision stays yours.",
      "The exchange is saved with the trade for later review.",
    ],
  },
  {
    name: "Screenshot Reader",
    body: "Turn a chart screenshot into journal fields.",
    fill: "bg-mint-pop",
    text: "text-carbon",
    rotate: "rotate-1",
    status: "soon",
    icon: BrainCircuit,
    intro:
      "Typing trade data is the quiet tax every journal charges — and the reason most journals die in week three. Screenshot Reader abolishes it: drop in any chart screenshot from any platform and the module reads the instrument, timeframe, direction and key levels straight from the pixels, pre-filling your journal entry. You just confirm. Logging drops from minutes to seconds, which is exactly why the journal finally sticks.",
    points: [
      "Reads instrument, timeframe, direction and key levels from a raw screenshot",
      "Pre-fills the journal entry — nothing is saved until you approve it",
      "Platform-agnostic: works with any broker or charting software, because it only needs pixels",
      "Handles marked-up charts, ignoring your drawings and reading the price action underneath",
      "The last excuse for not journaling, removed",
    ],
    steps: [
      "Drop in any chart screenshot from any platform.",
      "Instrument, timeframe, direction and key levels are read from the image.",
      "Your journal entry pre-fills — confirm or correct, then save.",
      "Log a full trade in seconds instead of minutes.",
    ],
  },
  {
    name: "Strategy Discovery",
    body: "Find which setups actually carry your results.",
    fill: "bg-lavender",
    text: "text-carbon",
    rotate: "-rotate-1",
    status: "soon",
    icon: LineChart,
    intro:
      "You don't have one strategy — you have a dozen overlapping behaviours that feel like one. Strategy Discovery clusters your logged trades into the strategies you actually trade, then scores every cluster on expectancy, drawdown and adherence. The result is uncomfortably honest: which behaviour deserves more of your capital, and which one has been quietly paying your account away.",
    points: [
      "Clusters trades by setup, market conditions and behaviour — no manual re-tagging required",
      "Ranks each cluster by expectancy, profit factor and stability over time",
      "Strategy decay alerts: flagged when an edge that carried you starts fading",
      "Shows the cost of your worst cluster in plain dollars and R",
      "Suggests where time and capital should shift next",
    ],
    steps: [
      "Keep journaling — discovery runs on the history you already have.",
      "Trades are clustered into the strategies you actually trade.",
      "Each cluster is scored on expectancy, drawdown and adherence.",
      "Attention and capital shift toward what demonstrably works.",
    ],
  },
  {
    name: "Trader DNA",
    body: "A behavioural profile that evolves with your history.",
    fill: "bg-sunburst",
    text: "text-carbon",
    rotate: "rotate-1",
    status: "soon",
    icon: Activity,
    intro:
      "After a few hundred journal entries, patterns stop being trades and become a profile — your behavioural fingerprint. Trader DNA builds it: risk tolerance, patience under drawdown, session bias, over-trading triggers, reaction to streaks. Then it shows how the fingerprint shifts as you mature, and compares the trader you are today with the trader who produced your best months.",
    points: [
      "A behavioural profile built continuously from your full logged history",
      "Traits scored and tracked over time: patience, discipline, aggression, consistency",
      "Compares your current profile against your best-performing periods",
      "Longitudinal view: who were you 500 trades ago versus today?",
      "Becomes the training ground for every other AI module on this page",
    ],
    steps: [
      "Your logged history gradually becomes a behavioural profile.",
      "Traits like patience, discipline and aggression are scored and tracked.",
      "Today's profile is compared against your best-performing periods.",
      "Watch the fingerprint evolve as your trading matures.",
    ],
  },
  {
    name: "Voice Summary",
    body: "A spoken end-of-session recap while you eat dinner.",
    fill: "bg-paper-white",
    text: "text-carbon",
    rotate: "-rotate-1",
    status: "soon",
    icon: Mic,
    intro:
      "The review that happens when you're too tired to write one. At the end of each session, Voice Summary reads your day back to you — trades logged, rules kept or broken, P&L, notable patterns — as a two-minute spoken recap. Play it on the commute or the walk after a red day. Reflection stops depending on how much energy you have left at 10pm.",
    points: [
      "End-of-session spoken recap: trades, adherence, P&L and patterns",
      "Weekly audio reviews surface trends and repeated rule breaches",
      "Completely hands-free — built for the commute or the post-session walk",
      "A consistency engine: the recap happens whether you feel like it or not",
      "Pairs with Reports: listen to the week before you write the review",
    ],
    steps: [
      "At day's end the recap is generated automatically from your journal.",
      "Play it anywhere: trades, adherence, P&L and patterns in two minutes.",
      "Weekly audio reviews highlight trends and repeated breaches.",
      "Reflection survives even your most exhausting sessions.",
    ],
  },
];

const ALL_FEATURES = [...STICKER_FEATURES, ...AI_MODULES];

function Marquee() {
  const row = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="slush-marquee slush-ui w-full">
      <div className="slush-marquee-track">
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="mono-label mx-4 inline-flex items-center gap-4 text-[11px]"
          >
            {item}
            <span className="tape-sep" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}

function StickerBadge({
  label,
  fill,
  className = "",
}: {
  label: string;
  fill: string;
  className?: string;
}) {
  return (
    <span
      className={`slush-sticker slush-pill-label ${fill} ${className} px-3 py-1.5 text-[11px] text-carbon`}
    >
      {label}
    </span>
  );
}

function StickerCard({ feature, onOpen }: { feature: StickerFeature; onOpen: () => void }) {
  const isLive = feature.status === "live";
  // Touch vs pointer copy: exactly one span renders (the other is display:none,
  // so screen readers also read only one). See .detail-hint-* in styles.css.
  const status = isLive ? "Live now" : "Coming soon";
  const pillTouch = `${status} — tap for details`;
  const pillPointer = `${status} — click for details`;
  const statusTag = (
    <span className={isLive ? "tag-solid" : "tag-stamp"}>
      {isLive && <Check className="size-3 text-up" strokeWidth={3} aria-hidden />}
      <span className="mono-label">{status}</span>
      <span className="detail-hint-touch"> — {"tap"} for details</span>
      <span className="detail-hint-pointer"> — {"click"} for details</span>
    </span>
  );
  return (
    <div>
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className={`group relative h-full w-full cursor-pointer p-6 text-left ${
          isLive ? "card-live" : "card-soon"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <feature.icon className="size-7" strokeWidth={2.2} aria-hidden />
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full border border-current transition-transform duration-200 group-hover:rotate-90"
            aria-hidden
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </span>
        </div>
        <h3 className="mt-4 text-xl font-bold tracking-tight">{feature.name}</h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-current/80">{feature.body}</p>
        <span className="mt-4 inline-block">{statusTag}</span>
      </button>
    </div>
  );
}

function FeatureDetailDialog({
  feature,
  open,
  onOpenChange,
}: {
  feature: StickerFeature | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dark = feature?.text === "text-white";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="slush-ui max-h-[85dvh] max-w-2xl gap-0 overflow-y-auto rounded-[32px] border-carbon bg-paper-white p-0 text-carbon sm:rounded-[32px]">
        {feature && (
          <>
            <div
              className={`${feature.fill} ${feature.text} rounded-t-[32px] border-b border-carbon p-6 sm:p-8`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="slush-sticker bg-paper-white p-2.5">
                  <feature.icon className="size-6 text-carbon" strokeWidth={2.2} />
                </span>
                <span className="slush-pill-label w-fit rounded-full border border-carbon bg-paper-white px-3 py-1 text-[10px] text-carbon">
                  {feature.status === "live" ? "Live now" : "Coming soon"}
                </span>
              </div>
              <DialogTitle
                className="slush-display mt-4 text-3xl sm:text-4xl"
                style={dark ? { color: "#ffffff" } : undefined}
              >
                {feature.name}
              </DialogTitle>
            </div>
            <div className="p-6 sm:p-8">
              <DialogDescription className="text-base font-medium leading-relaxed text-carbon/85">
                {feature.intro}
              </DialogDescription>

              <h4 className="slush-pill-label mt-7 text-xs">What you can do</h4>
              <ul className="mt-3 space-y-2.5">
                {feature.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 text-sm font-medium leading-relaxed text-carbon/80"
                  >
                    <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-sunburst" />
                    {point}
                  </li>
                ))}
              </ul>

              <h4 className="slush-pill-label mt-7 text-xs">
                {feature.status === "live" ? "How it fits your day" : "How it will work"}
              </h4>
              <ol className="mt-3 space-y-2.5">
                {feature.steps.map((step, i) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 text-sm font-medium leading-relaxed text-carbon/80"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-carbon bg-paper-white text-[11px] font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-carbon pt-6">
                {feature.status === "live" ? (
                  <Link
                    to="/app"
                    className="slush-cta px-6 py-3 text-sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Open it in the app
                  </Link>
                ) : (
                  <Link
                    to="/whats-coming"
                    className="slush-cta px-6 py-3 text-sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Join the waitlist
                  </Link>
                )}
                <span className="mono-label text-carbon/60">
                  <span>Free while in beta</span>
                  <span aria-hidden>—</span>
                  <span>No card required</span>
                </span>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LandingPage() {
  const [active, setActive] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const openDetail = (name: string) => {
    setActive(name);
    setDetailOpen(true);
  };
  return (
    <div className="slush-ui min-h-screen bg-paper-white text-carbon">
      <Marquee />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-carbon bg-paper-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="slush-sticker flex size-9 rounded-full bg-paper-white">
              <span className="slush-display text-base">X</span>
            </span>
            <span className="slush-display text-lg">ChartFusionX</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <a href="#features" className="slush-sticker-btn px-4 py-2 text-xs">
              Features
            </a>
            <a href="#ai" className="slush-sticker-btn px-4 py-2 text-xs">
              AI Modules
            </a>
            <a href="#pricing" className="slush-sticker-btn px-4 py-2 text-xs">
              Pricing
            </a>
            <a href="#get-started" className="slush-sticker-btn px-4 py-2 text-xs">
              Sign in
            </a>
          </nav>
          <Link to="/app" className="slush-cta px-5 py-2.5 text-xs">
            Start Journaling
          </Link>
        </div>
      </header>

      {/* Hero — ledger paper with graph ruling */}
      <section className="ledger-grid relative overflow-hidden bg-paper-white">
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-16 pt-16 text-center sm:px-6 md:pt-24">
          <h1 className="slush-display text-[72px] sm:text-[110px] md:text-[150px]">
            Chart
            <br />
            Fusion
            <span className="text-blueprint">X</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-carbon sm:text-2xl">
            Log every trade, understand your behavior, improve your execution. The AI operating
            system for serious traders — in development, arriving soon.
          </p>
          {/* TODO(social-proof): when a real, verifiable trader count exists, insert the line
              below directly after this comment (replace N — never an estimate or round-up).
              <p className="mt-6 text-sm font-medium text-carbon/60">
                Join <span className="num">N</span> traders already journaling on ChartFusionX.
              </p>
          */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/app" className="slush-cta px-8 py-4 text-sm">
              Try Now — it's free
            </Link>
            <a href="#pricing" className="slush-sticker-btn px-8 py-4 text-sm">
              See pricing
            </a>
          </div>
          <div className="meta-row mt-4 text-carbon/60">
            <span className="mono-label">Free while in beta</span>
            <span className="mono-label">No card required</span>
          </div>

          {/* The one loud element: an illustrative session chart that draws
              itself in on load. Explicitly labeled — not real data. */}
          <figure
            className="session-strip mt-12 w-full max-w-3xl px-4 pb-3 pt-4 text-left sm:px-6"
            aria-label="Illustrative trading session chart"
          >
            <svg viewBox="0 0 560 150" className="h-auto w-full" aria-hidden focusable="false">
              {[
                { x: 20, o: 92, c: 116 },
                { x: 60, o: 118, c: 104 },
                { x: 100, o: 102, c: 126 },
                { x: 140, o: 124, c: 110 },
                { x: 180, o: 108, c: 96 },
                { x: 220, o: 94, c: 112 },
                { x: 260, o: 114, c: 138 },
                { x: 300, o: 136, c: 118 },
                { x: 340, o: 116, c: 134 },
                { x: 380, o: 132, c: 108 },
                { x: 420, o: 106, c: 128 },
                { x: 460, o: 126, c: 146 },
              ].map((c, i) => (
                <g key={c.x} className="strip-bar" style={{ "--bar-i": i } as React.CSSProperties}>
                  <rect
                    x={c.x - 4}
                    y={Math.min(c.o, c.c) - 3}
                    width={8}
                    height={Math.abs(c.o - c.c) + 6}
                    rx={1}
                    fill={c.c >= c.o ? "var(--color-up)" : "var(--color-down)"}
                  />
                  <line
                    x1={c.x}
                    x2={c.x}
                    y1={c.o - 12}
                    y2={c.c + 12}
                    stroke="var(--color-carbon)"
                    strokeWidth={1.5}
                  />
                </g>
              ))}
              <path
                className="strip-line"
                d="M20 96 L60 104 L100 88 L140 94 L180 108 L220 92 L260 76 L300 88 L340 72 L380 84 L420 62 L460 48 L520 40"
                fill="none"
                stroke="var(--color-blueprint)"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
            <figcaption className="mono-label mt-2 text-carbon/55">
              Illustrative session — not real data
            </figcaption>
          </figure>
        </div>

        {/* inflated ribbon band */}
        <div className="relative h-16 bg-blueprint sm:h-20" aria-hidden />
      </section>

      {/* Features — ledger paper band */}
      <section id="features" className="ledger-grid bg-paper-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="slush-display text-[40px] sm:text-[70px]">
            Every trade,
            <br />
            on the record
          </h2>
          <p className="mt-4 max-w-2xl text-base font-medium text-carbon/70 sm:text-xl">
            The journal is the foundation — every AI feature learns from what you log.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STICKER_FEATURES.map((f) => (
              <StickerCard key={f.name} feature={f} onOpen={() => openDetail(f.name)} />
            ))}
          </div>
        </div>
      </section>

      {/* AI modules — draft band: bare ledger ground, dashed cards */}
      <section id="ai" className="bg-paper-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="slush-display text-[40px] sm:text-[70px]">
              The AI
              <br />
              systems
            </h2>
            <div className="max-w-md pb-2">
              <p className="text-base font-medium text-carbon/70 sm:text-lg">
                Six AI modules in development, trained on your own trading history — not on the
                market.
              </p>
            </div>
          </div>
          <div className="mt-14 grid gap-8 border-t border-dashed border-carbon/30 pt-12 sm:grid-cols-2 lg:grid-cols-3">
            {AI_MODULES.map((f) => (
              <StickerCard key={f.name} feature={f} onOpen={() => openDetail(f.name)} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — white band */}
      <section id="pricing" className="scroll-mt-20 bg-paper-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="slush-display text-[40px] sm:text-[70px]">
            Free while
            <br />
            it's in beta
          </h2>
          <p className="mt-4 max-w-2xl text-base font-medium text-carbon/70 sm:text-xl">
            No card, no checkout, no trial clock. Pro is $29/mo and Max is $69/mo once the beta ends
            — waitlist members get first pick.
          </p>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <div className="card-live flex flex-col p-6">
              <span className="tag-solid w-fit">
                <Check className="size-3 text-up" strokeWidth={3} aria-hidden />
                <span className="mono-label">Live now</span>
              </span>
              <h3 className="slush-display mt-4 text-3xl">Free Beta</h3>
              <p className="slush-display mt-1 text-5xl">$0</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm font-medium text-carbon/80">
                <li>✓ Unlimited trades &amp; attachments</li>
                <li>✓ Performance dashboard &amp; analytics</li>
                <li>✓ Playbook, goals &amp; reports</li>
                <li>✓ Demo mode — try it without an account</li>
              </ul>
              <Link to="/app" className="slush-cta mt-6 px-6 py-3 text-center text-sm">
                Try Now
              </Link>
            </div>
            <div className="card-live flex flex-col p-6">
              <span className="tag-stamp w-fit">
                <span className="mono-label">
                  {FOUNDER_CTA_LIVE ? "Founding access" : "After beta"}
                </span>
              </span>
              <h3 className="slush-display mt-4 text-3xl">Pro</h3>
              <p className="slush-display mt-1 text-5xl">
                {FOUNDER_CTA_LIVE ? (
                  <>
                    ${FOUNDER_PLANS.pro_founding.price}
                    <span className="mono-label mt-1 block text-carbon/50">
                      One-time — founding year
                    </span>
                  </>
                ) : (
                  <>
                    $29
                    <span className="mono-label mt-1 block text-carbon/50">
                      Per month — after beta
                    </span>
                  </>
                )}
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm font-medium text-carbon/80">
                <li>✓ Everything in Free Beta</li>
                <li>✓ All six AI modules</li>
                <li>✓ 50 AI actions per month</li>
                <li>✓ Priority support</li>
              </ul>
              <FounderTierCta
                planId="pro_founding"
                className="slush-sticker-btn mt-6 px-6 py-3 text-center text-sm"
              />
            </div>
            <div className="card-live flex flex-col p-6">
              <span className="tag-stamp w-fit">
                <span className="mono-label">Best for heavy reviewers</span>
              </span>
              <h3 className="slush-display mt-4 text-3xl">Max</h3>
              <p className="slush-display mt-1 text-5xl">
                {FOUNDER_CTA_LIVE ? (
                  <>
                    ${FOUNDER_PLANS.max_founding.price}
                    <span className="mono-label mt-1 block text-carbon/50">
                      One-time — founding year
                    </span>
                  </>
                ) : (
                  <>
                    $69
                    <span className="mono-label mt-1 block text-carbon/50">
                      Per month — after beta
                    </span>
                  </>
                )}
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm font-medium text-carbon/80">
                <li>✓ Everything in Pro</li>
                <li>✓ All six AI modules</li>
                <li>✓ Unlimited AI actions</li>
                <li>✓ Priority AI processing</li>
              </ul>
              <FounderTierCta
                planId="max_founding"
                className="slush-sticker-btn mt-6 px-6 py-3 text-center text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA band — ink, the ledger closes */}
      <section id="get-started" className="scroll-mt-20 bg-carbon py-24 text-paper-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
          <h2 className="slush-display text-[48px] sm:text-[80px] text-paper-white">
            Stop guessing.
            <br />
            Start logging.
          </h2>
          <p className="mt-5 max-w-xl text-base font-medium text-paper-white/75 sm:text-xl">
            Every trade creates data. Every piece of data creates insight. Every insight creates
            improvement.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/app" className="slush-cta px-10 py-4 text-sm">
              Try Now
            </Link>
            <Link to="/auth" className="slush-sticker-btn px-10 py-4 text-sm">
              Sign in
            </Link>
          </div>
          <div className="meta-row mt-4">
            <span className="mono-label text-paper-white/65">Free while in beta</span>
            <span className="mono-label text-paper-white/65">No card required</span>
            <span className="mono-label text-paper-white/65">Demo mode available</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-carbon bg-paper-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-8 text-xs font-medium text-carbon/60 sm:px-6">
          <span className="mono-label text-carbon">ChartFusionX</span>
          <span>© {new Date().getFullYear()}</span>
          <a href="#pricing" className="hover:text-carbon">
            Pricing
          </a>
          <Link to="/whats-coming" className="hover:text-carbon">
            What's Coming
          </Link>
          <Link to="/privacy" className="hover:text-carbon">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-carbon">
            Terms of Service
          </Link>
          <Link to="/refund-policy" className="hover:text-carbon">
            Refund Policy
          </Link>
          <span className="ml-auto text-carbon/45">
            Analytics and journaling only — not financial advice.
          </span>
        </div>
      </footer>
      <FeatureDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        feature={ALL_FEATURES.find((f) => f.name === active) ?? null}
      />
    </div>
  );
}
