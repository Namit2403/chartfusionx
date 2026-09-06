/**
 * ChartFusionX is currently a free, open beta.
 *
 * The journal / analytics side of the product is live and free to use.
 * The AI modules are still in development — they are shown as "Coming soon"
 * and never simulate a model run.
 */

export const BETA_LABEL = "Free beta";

export type ComingSoonFeature = {
  slug: string;
  path: string;
  name: string;
  short: string;
  description: string;
};

export const COMING_SOON_FEATURES: ComingSoonFeature[] = [
  {
    slug: "ai-review",
    path: "/ai-review",
    name: "AI Trade Review",
    short: "Automated review of each logged trade.",
    description:
      "ChartFusionX will read the trades you log and summarise what your entries, exits, risk sizing and execution actually looked like — measured against the rules you wrote down yourself.",
  },
  {
    slug: "chart-critique",
    path: "/chart-critique",
    name: "AI Chart Critique",
    short: "Structured critique of a marked-up chart.",
    description:
      "Upload a chart and ChartFusionX will describe the structure it sees, where your entry sat inside it, and how the setup compares with the ones already in your journal.",
  },
  {
    slug: "screenshot-reader",
    path: "/screenshot-reader",
    name: "AI Screenshot Reader",
    short: "Turn a chart screenshot into journal fields.",
    description:
      "Drop in a screenshot from TradingView, MetaTrader or your broker and ChartFusionX will extract the trade details straight into a journal entry.",
  },
  {
    slug: "strategy-discovery",
    path: "/strategy-discovery",
    name: "AI Strategy Discovery",
    short: "Find which setups carry your results.",
    description:
      "ChartFusionX will group your logged trades by setup, session and instrument and show where your recorded results actually came from.",
  },
  {
    slug: "trader-dna",
    path: "/trader-dna",
    name: "Trader DNA",
    short: "A behavioural profile from your own trades.",
    description:
      "A profile built entirely from your journal: patience, consistency, risk habits and how your behaviour changes after a win or a loss.",
  },
  {
    slug: "voice-summary",
    path: "/voice-summary",
    name: "Voice Summary",
    short: "A spoken end-of-session recap.",
    description:
      "A short spoken summary of the session you just logged — what you traded, how you executed, and what your own numbers say about it.",
  },
];

export const AVAILABLE_NOW = [
  { name: "Trade Journal", path: "/journal", body: "Log entries, exits, size, risk, tags, notes and chart screenshots." },
  { name: "Performance Dashboard", path: "/", body: "Equity curve, win rate, expectancy, profit factor and drawdown from your trades." },
  { name: "Trade Gallery", path: "/gallery", body: "Every chart attachment you upload in one visual library." },
  { name: "Playbook", path: "/playbook", body: "Write down your setups and rules, then measure adherence against real trades." },
  { name: "Analytics", path: "/analytics", body: "Breakdowns by setup, session, instrument and day of week." },
  { name: "Reports", path: "/reports", body: "Period summaries you can review and export." },
  { name: "Goals & Habits", path: "/goals", body: "Set process goals and track the habits behind them." },
  { name: "Notifications", path: "/notifications", body: "Reminders and journal prompts based on your own activity." },
] as const;

export function getComingSoonFeature(slug: string) {
  return COMING_SOON_FEATURES.find((f) => f.slug === slug)!;
}
