import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MoveRight } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/**
 * Custom 404 — animated illustration centerpiece (v2).
 *
 * Visual concept: the two "4" digits occasionally unwind into looping
 * wind-ribbon strokes that arc around a small worried character standing in
 * for the zero; dust motes drift near the ground line. The illustration is
 * decorative (aria-hidden); the real content is semantic HTML below it.
 *
 * CTA decision (explicit, per brief v2): the primary button keeps the v1
 * pointer-only dodge easter egg — 4 near-misses then it settles. Keyboard
 * users Tab straight to it and press Enter at any time; touch devices and
 * prefers-reduced-motion never see the dodge. The "Go back" secondary link
 * never dodges and falls back to the homepage when there is no history.
 */

const MAX_DODGES = 4;

/* The "4" numeral and its wind-ribbon morph target share one command
   structure (two subpaths, each M + 2 C) so the SMIL `d` morph interpolates. */
const FOUR_NUMERAL =
  "M 24 78 C 40 78 58 78 72 78 C 66 64 58 48 52 36 M 56 40 C 56 68 56 98 56 126";
const FOUR_RIBBON =
  "M 20 96 C 44 116 96 116 118 92 C 132 76 120 58 104 62 M 118 92 C 138 108 168 104 176 84 C 182 66 168 52 152 58";

function WindFour({ begin }: { begin: string }) {
  return (
    <g fill="none" stroke="currentColor" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round">
      <path d={FOUR_NUMERAL}>
        <animate
          attributeName="d"
          values={`${FOUR_NUMERAL};${FOUR_NUMERAL};${FOUR_RIBBON};${FOUR_RIBBON};${FOUR_NUMERAL}`}
          keyTimes="0;0.08;0.3;0.58;1"
          dur="7s"
          begin={begin}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
        />
      </path>
    </g>
  );
}

function Illustration({ reduced }: { reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 340 170"
      className="mx-auto h-auto w-full max-w-md text-foreground"
      aria-hidden="true"
      focusable="false"
    >
      {/* Faint ground line under the numeral group */}
      <line x1={36} y1={132} x2={304} y2={132} stroke="#232541" strokeWidth={2} strokeLinecap="round" />

      {/* Dust motes drifting near the ground */}
      {!reduced && (
        <g fill="#8b8fa8">
          <circle className="cfx-404-mote" style={{ animationDelay: "0s" }} cx={70} cy={126} r={1.8} />
          <circle className="cfx-404-mote" style={{ animationDelay: "1.1s" }} cx={120} cy={118} r={1.4} />
          <circle className="cfx-404-mote" style={{ animationDelay: "2.3s" }} cx={225} cy={122} r={2} />
          <circle className="cfx-404-mote" style={{ animationDelay: "0.7s" }} cx={262} cy={114} r={1.3} />
          <circle className="cfx-404-mote" style={{ animationDelay: "1.8s" }} cx={296} cy={125} r={1.7} />
        </g>
      )}

      {/* Left four */}
      <g className={reduced ? undefined : "cfx-404-sway"} style={{ transformOrigin: "50px 126px", animationDelay: "0.4s" }}>
        {reduced ? (
          <path d={FOUR_NUMERAL} fill="none" stroke="currentColor" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <WindFour begin="2s" />
        )}
      </g>

      {/* Right four (offset copy, staggered morph) */}
      <g transform="translate(214 0)">
        {reduced ? (
          <path d={FOUR_NUMERAL} fill="none" stroke="currentColor" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <WindFour begin="2.8s" />
        )}
      </g>

      {/* Subtle accent glow behind the character */}
      <circle cx={170} cy={96} r={46} fill="var(--color-positive)" opacity={0.06} />

      {/* The character standing in for the zero */}
      <g className={reduced ? undefined : "cfx-404-sway"} style={{ transformOrigin: "170px 126px" }}>
        <rect x={146} y={60} width={48} height={66} rx={23} fill="#1b1e36" stroke="#2a2e52" strokeWidth={2} />
        <circle cx={160} cy={88} r={3.2} fill="#e8ecf8" />
        <circle cx={182} cy={88} r={3.2} fill="#e8ecf8" />
        <path d="M 161 104 Q 171 99 181 104" fill="none" stroke="#e8ecf8" strokeWidth={2.4} strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function NotFound404() {
  const navigate = useNavigate();
  const [dodges, setDodges] = useState(0);
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const [finePointer, setFinePointer] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const fineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setFinePointer(fineQuery.matches);
      setReducedMotion(motionQuery.matches);
    };

    sync();
    fineQuery.addEventListener("change", sync);
    motionQuery.addEventListener("change", sync);
    return () => {
      fineQuery.removeEventListener("change", sync);
      motionQuery.removeEventListener("change", sync);
    };
  }, []);

  const settled = dodges >= MAX_DODGES;
  const dodgeEnabled = finePointer && !reducedMotion && !settled;

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dodgeEnabled) return;

      const button = buttonRef.current?.getBoundingClientRect();
      if (!button) return;

      const cursorX = event.clientX;
      const cursorY = event.clientY;
      const buttonCX = button.left + button.width / 2;
      const buttonCY = button.top + button.height / 2;
      const distance = Math.hypot(cursorX - buttonCX, cursorY - buttonCY);

      // Only react when the cursor is genuinely close.
      if (distance > 96) return;

      // Flee along the cursor->button axis, away from the cursor.
      const awayX = buttonCX - cursorX;
      const awayY = buttonCY - cursorY;
      const magnitude = Math.hypot(awayX, awayY) || 1;
      const step = 64;
      // Keeps worst-case (a corner) clear of the copy above/below the row.
      const maxTravelX = 88;
      const maxTravelY = 52;

      let nextX = pointerOffset.x + (awayX / magnitude) * step;
      let nextY = pointerOffset.y + (awayY / magnitude) * step;

      nextX = Math.max(-maxTravelX, Math.min(maxTravelX, nextX));
      nextY = Math.max(-maxTravelY, Math.min(maxTravelY, nextY));

      setPointerOffset({ x: nextX, y: nextY });
      setDodges((count) => count + 1);
    },
    [dodgeEnabled, pointerOffset.x, pointerOffset.y],
    // pointerOffset intentionally excluded: we read it only to accumulate.
  );

  const handlePointerLeave = useCallback(() => {
    if (!dodgeEnabled) return;
    setPointerOffset({ x: 0, y: 0 });
  }, [dodgeEnabled]);

  const goBack = () => {
    // Real history back, with a safe fallback when there is nothing behind
    // this page (direct landing on a broken external link).
    if (typeof window !== "undefined" && window.history.state?.idx > 0) {
      window.history.back();
    } else {
      void navigate({ to: "/" });
    }
  };

  const settledLine = settled
    ? "Locked in. It'll behave now."
    : dodges > 0
      ? `${MAX_DODGES - dodges} dodge${MAX_DODGES - dodges === 1 ? "" : "s"} left.`
      : "It dodges the cursor. Tab reaches it. Enter submits.";

  const helper =
    !finePointer || reducedMotion ? "No cursor games on this device — it sits still." : settledLine;

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center px-4 py-12">
      <div className="panel grid-lines w-full max-w-xl px-8 py-14 text-center">
        <Illustration reduced={reducedMotion} />

        <p className="mono-label mt-8 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This page isn't in the journal — it may have exited, or never existed at all.
        </p>

        {/* Dodge zone: bounds the button's wandering to this card. */}
        <div
          ref={zoneRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="relative mx-auto mt-10 w-full max-w-xs"
        >
          <div className="flex h-24 items-center justify-center">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => {
                void navigate({ to: "/" });
              }}
              style={{
                transform: `translate(${pointerOffset.x}px, ${pointerOffset.y}px)`,
                transition: reducedMotion ? "none" : "transform 0.18s ease-out",
              }}
              className={cn(
                "rounded-xl px-8 py-3.5 text-sm font-semibold transition-colors",
                settled || !finePointer || reducedMotion
                  ? "cursor-pointer bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                  : "cursor-default border border-border bg-muted text-muted-foreground",
              )}
            >
              Back to the dashboard
              <MoveRight className="ml-2 inline size-4" aria-hidden />
            </button>
            <span className="sr-only">
              This button is always reachable by keyboard: Tab to it and press Enter.
            </span>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
          {helper}
        </p>

        {/* Static secondary: real history back, homepage fallback, never dodges. */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Go back
          </button>
          <span className="text-xs text-muted-foreground/50" aria-hidden>
            ·
          </span>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Go home
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
