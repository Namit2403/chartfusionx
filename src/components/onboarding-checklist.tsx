import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, ListChecks, NotebookPen, Smile, Sparkles, X } from "lucide-react";

import {
  hasDismissedOnboarding,
  hasCompletedOnboarding,
  recordOnboardingCompleted,
  recordOnboardingDismissed,
} from "@/lib/profile";
import type { Trade } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Step = {
  key: string;
  title: string;
  hint: string;
  to: string;
  cta: string;
  icon: typeof ListChecks;
  done: (trades: Trade[]) => boolean;
};

const STEPS: Step[] = [
  {
    key: "log",
    title: "Log your first trade",
    hint: "Asset, entry, exit and risk — it takes under a minute.",
    to: "/journal/new",
    cta: "Log a trade",
    icon: ListChecks,
    done: (trades) => trades.length > 0,
  },
  {
    key: "note",
    title: "Add why you took it",
    hint: "One sentence on your entry reason is enough.",
    to: "/journal/new",
    cta: "Write a note",
    icon: NotebookPen,
    done: (trades) => trades.some((t) => t.note.trim().length > 0),
  },
  {
    key: "emotions",
    title: "Rate your emotions",
    hint: "How you felt before and after — this powers your discipline stats.",
    to: "/journal/new",
    cta: "Rate emotions",
    icon: Smile,
    done: (trades) => trades.some((t) => t.emotionBefore !== "—" && t.emotionAfter !== "—"),
  },
];

function StepRow({ step, done, justDone }: { step: Step; done: boolean; justDone: boolean }) {
  const Icon = step.icon;
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 transition",
        done
          ? "border-emerald-500/20 bg-emerald-500/[0.06]"
          : "border-white/10 bg-white/[0.03] hover:border-violet-500/30",
        justDone && "border-emerald-500/50 bg-emerald-500/10",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
          done
            ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
            : "border-white/15 text-muted-foreground",
        )}
      >
        {done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            done ? "text-muted-foreground line-through" : "text-foreground",
          )}
        >
          {step.title}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.hint}</p>
      </div>
      {!done && (
        <Link
          to={step.to}
          className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-300 transition hover:bg-violet-500/20 hover:text-violet-200"
        >
          {step.cta}
          <ChevronRight className="size-3" />
        </Link>
      )}
    </li>
  );
}

/**
 * First-run checklist for signed-in traders. Auto-completes as the trade data
 * fills in. Completing every step (or dismissing) hides it for good — a
 * completed run gets a one-time celebration before it disappears.
 */
export function OnboardingChecklist({ trades }: { trades: Trade[] }) {
  const [dismissed, setDismissed] = useState(true); // hidden until mounted (SSR-safe)
  const [celebrating, setCelebrating] = useState(false); // one-time success payoff
  const [justDone, setJustDone] = useState<ReadonlySet<string>>(new Set());
  const prevDone = useRef<Set<string> | null>(null);
  const celebratedRef = useRef(false);

  useEffect(() => {
    // Completed onboarding hides the checklist permanently — never nag again.
    setDismissed(hasDismissedOnboarding() || hasCompletedOnboarding());
  }, []);

  const statuses = useMemo(() => STEPS.map((s) => ({ step: s, done: s.done(trades) })), [trades]);
  const doneKeys = useMemo(
    () =>
      statuses
        .filter((s) => s.done)
        .map((s) => s.step.key)
        .join(","),
    [statuses],
  );
  const completed = statuses.filter((s) => s.done).length;
  const allDone = completed === STEPS.length;

  // Flash steps that flip to done so the auto-check feels responsive.
  useEffect(() => {
    const nowDone = new Set(doneKeys.split(",").filter(Boolean));
    const prev = prevDone.current;
    prevDone.current = nowDone;
    if (!prev) return;
    const fresh = [...nowDone].filter((k) => !prev.has(k));
    if (fresh.length === 0) return;
    setJustDone(new Set(fresh));
    const id = setTimeout(() => setJustDone(new Set()), 2000);
    return () => clearTimeout(id);
  }, [doneKeys]);

  // When the last step lands, celebrate once, persist it, then vanish.
  useEffect(() => {
    if (!allDone || celebratedRef.current || hasCompletedOnboarding()) return;
    celebratedRef.current = true;
    recordOnboardingCompleted();
    setCelebrating(true);
    const id = setTimeout(() => setCelebrating(false), 5000);
    return () => clearTimeout(id);
  }, [allDone]);

  if (dismissed) return null;
  if (allDone && !celebrating) return null;

  const pct = Math.round((completed / STEPS.length) * 100);

  return (
    <div
      className="fade-rise relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.12] via-white/[0.04] to-transparent p-5 shadow-[0_10px_40px_-20px_rgba(139,92,246,0.5)]"
      data-testid="onboarding-checklist"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-violet-500/20 blur-3xl" />
      <button
        type="button"
        aria-label="Dismiss checklist"
        onClick={() => {
          setDismissed(true);
          recordOnboardingDismissed();
        }}
        className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
      >
        <X className="size-4" />
      </button>

      <div className="relative">
        {celebrating && (
          <div
            data-testid="onboarding-complete"
            className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
          >
            <Sparkles className="size-5 shrink-0 text-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                You're all set — your journal is live! 🎉
              </p>
              <p className="text-xs text-muted-foreground">
                Stats, equity curve and discipline scores now come from your own trades.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
            <ListChecks className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Get set up on ChartFusionX</p>
            <p className="text-xs text-muted-foreground">
              {completed} of {STEPS.length} done — your dashboard fills in as you go.
            </p>
          </div>
          <span className="num ml-auto mr-6 text-xl font-semibold text-foreground">{pct}%</span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-700"
            style={{ width: `${Math.max(4, pct)}%` }}
          />
        </div>

        <ul className="mt-4 space-y-2">
          {statuses.map(({ step, done }) => (
            <StepRow key={step.key} step={step} done={done} justDone={justDone.has(step.key)} />
          ))}
        </ul>
      </div>
    </div>
  );
}
