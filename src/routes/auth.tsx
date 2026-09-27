import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AuthGhostButton, AuthGlassInput, AuthSceneCard } from "@/components/auth-scene";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type Search = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Sign in — ChartFusionX" },
      {
        name: "description",
        content:
          "Sign in or create your ChartFusionX account to log trades and get AI feedback on your execution.",
      },
      { property: "og:title", content: "Sign in — ChartFusionX" },
      {
        property: "og:description",
        content: "Access your AI trading journal, performance dashboard and analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined) {
  if (!value) return "/app";
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return "/app";
    return url.pathname + url.search;
  } catch {
    return "/app";
  }
}

/** Muted-look while the button is dodging (invalid form); style only — the
    button stays enabled so keyboard submit still triggers real validation. */
function cnAuthSubmit(dodging: boolean) {
  return dodging ? "auth-primary-btn auth-primary-btn--muted" : "auth-primary-btn";
}

function cnAuthHelper(dodging: boolean) {
  return dodging ? "mt-1 text-center text-xs text-white/40" : "mt-1 text-center text-xs text-positive";
}

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4">
      <path
        fill="#EA4335"
        d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.75 12 .75 7.62.75 3.84 3.27 1.96 6.96l3.66 2.84C6.5 7.13 9.03 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.25 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.68 2.85c2.15-1.99 3.5-4.92 3.5-8.67z"
      />
      <path
        fill="#FBBC05"
        d="M5.62 14.2a7.2 7.2 0 0 1 0-4.4L1.96 6.96a11.26 11.26 0 0 0 0 10.08l3.66-2.84z"
      />
      <path
        fill="#34A853"
        d="M12 23.25c3.04 0 5.6-1 7.46-2.72l-3.68-2.85c-1.02.69-2.33 1.1-3.78 1.1-2.97 0-5.5-2.09-6.38-4.58l-3.66 2.84c1.88 3.69 5.66 6.21 10.04 6.21z"
      />
    </svg>
  );
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  /* Cosmetic dodge state. Validity mirrors the inputs' REAL native rules
     (type=email + required, required + minLength=8) read via checkValidity —
     nothing invented, nothing weakened. The button is never disabled by this
     layer; keyboard users Tab to it and Enter submits exactly as before. */
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const formRef = useRef<HTMLFormElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

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

  const invalidCount = (emailValid ? 0 : 1) + (passwordValid ? 0 : 1);
  const formValid = invalidCount === 0;
  const dodgeEnabled = finePointer && !reducedMotion && !formValid && !busy;

  // Park the button back in place whenever the gag deactivates.
  useEffect(() => {
    if (!dodgeEnabled) setPointerOffset({ x: 0, y: 0 });
  }, [dodgeEnabled]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLFormElement>) => {
      if (!dodgeEnabled) return;

      const button = submitRef.current?.getBoundingClientRect();
      if (!button) return;

      const buttonCX = button.left + button.width / 2;
      const buttonCY = button.top + button.height / 2;
      if (Math.hypot(event.clientX - buttonCX, event.clientY - buttonCY) > 96) return;

      const awayX = buttonCX - event.clientX;
      const awayY = buttonCY - event.clientY;
      const magnitude = Math.hypot(awayX, awayY) || 1;
      const step = 56;

      // The button is full-width inside the card: keep the wander inside the
      // card's padding so it never leaves the glass panel.
      const nextX = Math.max(-20, Math.min(20, pointerOffset.x + (awayX / magnitude) * step));
      const nextY = Math.max(-36, Math.min(36, pointerOffset.y + (awayY / magnitude) * step));

      setPointerOffset({ x: nextX, y: nextY });
    },
    [dodgeEnabled, pointerOffset.x, pointerOffset.y],
  );

  const handlePointerLeave = useCallback(() => {
    if (!dodgeEnabled) return;
    setPointerOffset({ x: 0, y: 0 });
  }, [dodgeEnabled]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safePath(redirect), replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: safePath(redirect), replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setPendingConfirm(true);
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: safePath(redirect), replace: true });
  };

  const resetPassword = async () => {
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent.");
  };

  return (
    <AuthSceneCard
      title={mode === "signin" ? "Sign in to ChartFusionX" : "Create your account"}
      subtitle="Log your trades. Get AI feedback. Understand exactly why you win and lose."
    >
      {pendingConfirm ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-white/60">
          We sent a confirmation link to <span className="text-white">{email}</span>. Click it to
          activate your account, then sign in.
        </div>
      ) : (
        <>
          <AuthGhostButton type="button" onClick={google} disabled={busy}>
            <GoogleIcon />
            Continue with Google
          </AuthGhostButton>

          <div className="my-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/30">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form
            ref={formRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onSubmit={submit}
            className="space-y-3.5"
          >
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label htmlFor="displayName" className="block text-xs font-medium text-white/60">
                  Display name
                </label>
                <AuthGlassInput
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Trader"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-white/60">
                Email address
              </label>
              <AuthGlassInput
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailValid(e.target.checkValidity());
                }}
                onBlur={(e) => setEmailValid(e.target.checkValidity())}
                placeholder="Your email address"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-white/60">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={resetPassword}
                    className="cursor-pointer text-xs text-white/45 transition hover:text-white/80"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <AuthGlassInput
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordValid(e.target.checkValidity());
                }}
                onBlur={(e) => setPasswordValid(e.target.checkValidity())}
                placeholder="Your password"
              />
            </div>
            <div className="relative">
              <button
                ref={submitRef}
                type="submit"
                disabled={busy}
                aria-disabled={busy}
                style={{
                  transform: `translate(${pointerOffset.x}px, ${pointerOffset.y}px)`,
                  transition: reducedMotion ? "none" : "transform 0.16s ease-out",
                }}
                className={cnAuthSubmit(dodgeEnabled)}
              >
                {busy ? "One moment…" : mode === "signin" ? "Continue" : "Create account"}
              </button>
              <span className="sr-only">
                The submit button is always reachable by keyboard: Tab to it and press Enter.
              </span>
            </div>
            <p
              aria-live="polite"
              className={cnAuthHelper(dodgeEnabled)}
            >
              {dodgeEnabled
                ? invalidCount === 2
                  ? "Two fields to fill before it stands still."
                  : "One field to go before it stands still."
                : "Locked in. Go on then — Tab reaches it, Enter submits."}
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-white/45">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-white underline-offset-4 transition hover:underline"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  to="/auth"
                  className="font-medium text-white underline-offset-4 transition hover:underline"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </>
      )}
    </AuthSceneCard>
  );
}
