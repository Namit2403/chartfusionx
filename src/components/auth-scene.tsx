import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

function CornerDots() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute left-2.5 top-2.5 size-1 rounded-full bg-white/25"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-2.5 size-1 rounded-full bg-white/25"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2.5 left-2.5 size-1 rounded-full bg-white/25"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2.5 right-2.5 size-1 rounded-full bg-white/25"
      />
    </>
  );
}

export function AuthGlassInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn("auth-input", className)} {...props} />;
}

export function AuthGhostButton({ className, ...props }: React.ComponentProps<"button">) {
  return <button className={cn("auth-ghost-btn", className)} {...props} />;
}

/**
 * AuthKit-style dark glass backdrop for the auth flow. Renders a full-screen
 * starfield/grid scene with a centered frosted card; bypasses the app chrome
 * when used from a route without a pathless layout wrapper.
 */
export function AuthSceneCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-scene relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Soft light beam bleeding down from above the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[560px] w-[720px] max-w-full bg-[radial-gradient(ellipse_at_top,rgba(170,180,255,0.14),transparent_65%)]"
      />
      <div className="relative z-10 flex w-full flex-col items-center">
        <Link
          to="/"
          aria-label="ChartFusionX home"
          className="glass-item mb-8 flex size-11 items-center justify-center rounded-2xl"
        >
          <span className="font-display text-base font-bold text-white">X</span>
        </Link>
        <div className="auth-card relative w-full max-w-md rounded-3xl p-8">
          <CornerDots />
          <div className="mb-7 flex flex-col items-center text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-white">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/50">{subtitle}</p>
            ) : null}
          </div>
          {children}
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
