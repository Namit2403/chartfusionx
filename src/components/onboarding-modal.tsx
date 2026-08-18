import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { hasAcceptedLegal, recordLegalAcceptance } from "@/lib/profile";
import { acceptLegal } from "@/utils/profile.functions";

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
    body: "Once your trade is logged, the AI summarises your entry, risk, execution, and psychology so you can review your own process.",
    cta: "Got it, show me the dashboard",
  },
] as const;

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (hasAcceptedLegal()) setAccepted(true);
  }, []);

  const markSeen = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      seen = true;
    }
    if (!seen) {
      setOpen(true);
      // Persist immediately so it never shows again, however it's dismissed.
      markSeen();
    }
  }, []);

  const close = () => {
    setOpen(false);
    markSeen();
  };

  const current = steps[step]!;
  const isLegalStep = step === 0;
  const blocked = isLegalStep && !accepted;

  const advance = () => {
    if (isLegalStep) {
      recordLegalAcceptance();
      // Persist to the profile so acceptance survives devices and browsers.
      void acceptLegal().catch(() => {
        /* offline or signed out — the local record still applies */
      });
    }
    if (step === steps.length - 1) close();
    else setStep(step + 1);
  };

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

        {isLegalStep && (
          <label className="mt-5 flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            <Checkbox
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              className="mt-0.5"
              aria-label="Accept legal documents"
            />
            <span>
              I have read and accept the{" "}
              <Link to="/privacy" className="text-foreground underline underline-offset-4">
                Privacy Policy
              </Link>
              ,{" "}
              <Link to="/terms" className="text-foreground underline underline-offset-4">
                Terms of Service
              </Link>
              , and{" "}
              <Link to="/refund-policy" className="text-foreground underline underline-offset-4">
                Refund Policy
              </Link>
              .
            </span>
          </label>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {"to" in current && current.to ? (
            <Button asChild onClick={close}>
              <Link to={current.to}>{current.cta}</Link>
            </Button>
          ) : (
            <Button onClick={advance} disabled={blocked}>
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
