import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AuthGhostButton, AuthGlassInput, AuthSceneCard } from "@/components/auth-scene";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your ChartFusionX account" },
      {
        name: "description",
        content:
          "Sign up for ChartFusionX with your email to log trades, track performance and get AI feedback on every setup.",
      },
      { property: "og:title", content: "Create your ChartFusionX account" },
      {
        property: "og:description",
        content: "Start your AI trading journal in under a minute.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignUpPage,
});

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

function SignUpPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/app", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName || email.split("@")[0] },
        },
      });
      if (error) throw error;
      if (data.session) {
        toast.success("Account created. Welcome to ChartFusionX.");
        navigate({ to: "/app", replace: true });
      } else {
        setPendingConfirm(true);
        toast.success("Check your email to confirm your account.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create your account");
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
      toast.error("Google sign-up failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app", replace: true });
  };

  return (
    <AuthSceneCard
      title="Create your account"
      subtitle="Log your trades. Get AI feedback. Understand exactly why you win and lose."
    >
      {pendingConfirm ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-white/60">
            We sent a confirmation link to <span className="text-white">{email}</span>. Click it to
            activate your account, then sign in.
          </div>
          <AuthGhostButton type="button" onClick={() => navigate({ to: "/auth" })}>
            Go to sign in
          </AuthGhostButton>
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

          <form onSubmit={submit} className="space-y-3.5">
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-white/60">
                Password
              </label>
              <AuthGlassInput
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="block text-xs font-medium text-white/60">
                Confirm password
              </label>
              <AuthGlassInput
                id="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
              />
            </div>
            <button type="submit" disabled={busy} className="auth-primary-btn">
              {busy ? "One moment…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/45">
            Already have an account?{" "}
            <Link
              to="/auth"
              className="font-medium text-white underline-offset-4 transition hover:underline"
            >
              Sign in
            </Link>
          </p>
          <p className="mt-3 text-center text-xs leading-relaxed text-white/30">
            By creating an account you agree to our{" "}
            <Link to="/terms" className="underline underline-offset-4 hover:text-white/60">
              Terms
            </Link>
            ,{" "}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-white/60">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link to="/refund-policy" className="underline underline-offset-4 hover:text-white/60">
              Refund Policy
            </Link>
            .
          </p>
        </>
      )}
    </AuthSceneCard>
  );
}
