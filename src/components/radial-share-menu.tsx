import { useEffect, useId, useRef, useState } from "react";
import { Check, Copy, Linkedin, Mail, Share2, Twitter, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Radial share menu — the landing page's single share affordance.
 *
 * A "Share" pill expands into a fan of channel icons arranged in an arc above
 * the trigger; the trigger morphs into the close control. Channels animate
 * outward from the center with a stagger (transform/opacity only, no
 * width/height animation). Arc geometry comes from the --share-angle custom
 * property resolved in the stylesheet, where the mobile breakpoint can
 * retarget the radius.
 */

type ShareChannel = {
  key: "x" | "linkedin" | "email";
  label: string;
  icon: typeof Twitter;
  /** Arc angle in degrees; 0 = straight up, growing clockwise. */
  angle: number;
  href: (url: string, title: string) => string;
};

const CHANNELS: ShareChannel[] = [
  {
    key: "x",
    label: "Share on X",
    icon: Twitter,
    angle: 45,
    href: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    key: "linkedin",
    label: "Share on LinkedIn",
    icon: Linkedin,
    angle: 90,
    href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    key: "email",
    label: "Share by email",
    icon: Mail,
    angle: 135,
    href: (url, title) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
];

const COPY_ANGLE = 0;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReduced(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reduced;
}

type FanSlot =
  | { kind: "copy"; angle: number; slotIndex: number }
  | { kind: "link"; channel: ShareChannel; slotIndex: number };

export function RadialShareMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const copyTimerRef = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const labelId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        // Return focus to the trigger so keyboard users are not dropped.
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const pageUrl = typeof window === "undefined" ? "https://chartfusionx.app" : window.location.origin;
  const pageTitle = "ChartFusionX — the AI trading journal";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — leave the icon as-is.
    }
  };

  // Per-slot motion: transform/opacity only. With reduced motion the stagger
  // is dropped and the stylesheet removes the transitions entirely.
  const slotStyle = (angle: number, slotIndex: number): React.CSSProperties => {
    const base = { "--share-angle": `${angle}deg` } as React.CSSProperties;
    if (reducedMotion) return base;
    return { ...base, "--share-delay": `${slotIndex * 55}ms` } as React.CSSProperties;
  };

  const slots: FanSlot[] = [
    { kind: "copy", angle: COPY_ANGLE, slotIndex: 0 },
    ...CHANNELS.map((channel, i) => ({ kind: "link" as const, channel, slotIndex: i + 1 })),
  ];

  return (
    <div ref={rootRef} className={cn("relative inline-flex flex-col items-center", className)}>
      {/* Fan layer: channels are absolutely positioned around the trigger's
          center; the layer itself never animates size. */}
      <div className={cn("pointer-events-none relative h-14 w-14", open ? "visible" : "invisible")}>
        {slots.map((slot) => {
          const isCopy = slot.kind === "copy";
          const Icon = isCopy ? (copied ? Check : Copy) : slot.channel.icon;
          const label = isCopy ? (copied ? "Link copied" : "Copy link") : slot.channel.label;
          const angle = isCopy ? slot.angle : slot.channel.angle;

          const inner = (
            <>
              <Icon className="size-4" strokeWidth={2.2} aria-hidden />
              {isCopy && copied && <span className="sr-only">Link copied to clipboard</span>}
            </>
          );

          const classes = cn(
            "share-fan-item pointer-events-auto absolute left-1/2 top-1/2 flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_0.35em_0.9em_rgba(0,0,0,0.45)] hover:bg-muted",
            open ? "share-fan-item--open" : undefined,
            reducedMotion ? "share-fan-item--instant" : "share-fan-item--motion",
          );
          const style = slotStyle(angle, slot.slotIndex);

          if (isCopy) {
            return (
              <button key="copy" type="button" onClick={copyLink} style={style} className={classes} aria-label={label}>
                {inner}
              </button>
            );
          }

          return (
            <a
              key={slot.channel.key}
              href={slot.channel.href(pageUrl, pageTitle)}
              target="_blank"
              rel="noreferrer"
              style={style}
              className={classes}
              aria-label={slot.channel.label}
            >
              {inner}
            </a>
          );
        })}
      </div>

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close share menu" : "Share ChartFusionX"}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "mt-1 inline-flex size-14 items-center justify-center rounded-full border transition-colors duration-200",
          open
            ? "border-border bg-card text-foreground hover:bg-muted"
            : "border-positive/30 bg-positive/10 text-positive hover:bg-positive/20",
        )}
      >
        {open ? (
          <X className="size-5" strokeWidth={2.4} aria-hidden />
        ) : (
          <Share2 className="size-5" strokeWidth={2.4} aria-hidden />
        )}
      </button>

      <p
        className={cn(
          "mono-label mt-2 h-4 text-[11px] text-[#9fb6d9] transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        Pick a channel
      </p>
    </div>
  );
}
