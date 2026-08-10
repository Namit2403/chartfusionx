import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const STORAGE_KEY = "cfx-onboarded";

const steps = [
  {
    headline: "Welcome to ChartFusionX",
    body: "You're 3 steps away from understanding your trading like never before.",
    cta: "Let's go",
  },
  {
    headline: "Start by logging a trade",
    body: "It doesn't have to be perfect. Just log one real trade you took recently — asset, entry, exit, and how it felt.",
    cta: "Log a trade",
    skip: "I'll do this later",
    to: "/journal/new",
  },
  {
    headline: "Then let the AI review it",
    body: "Once your trade is logged, the AI will grade your entry, risk, execution, and psychology — like a coach watching over your shoulder.",
    cta: "Got it, show me the dashboard",
  },
] as const;

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const current = steps[step]!;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <DialogContent className="max-w-md border-border bg-card p-6">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Step {step + 1} of 3
          </div>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>

        <h2 className="mt-5 text-xl font-semibold tracking-tight">{current.headline}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{current.body}</p>

        <div className="mt-6 flex flex-col gap-2">
          {"to" in current && current.to ? (
            <Button asChild onClick={close}>
              <Link to={current.to}>{current.cta}</Link>
            </Button>
          ) : (
            <Button onClick={() => (step === steps.length - 1 ? close() : setStep(step + 1))}>
              {current.cta}
            </Button>
          )}
          {"skip" in current && current.skip && (
            <button
              onClick={() => setStep(step + 1)}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {current.skip}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
