import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        navigate({ to: "/", replace: true });
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
        navigate({ to: "/", replace: true });
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
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-md py-10">
      <div className="rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Log your trades. Get AI feedback. Understand exactly why you win and lose.
        </p>

        {pendingConfirm ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              We sent a confirmation link to <span className="text-foreground">{email}</span>. Click
              it to activate your account, then sign in.
            </div>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/auth">Go to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              className="mt-6 w-full"
              onClick={google}
              disabled={busy}
            >
              Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Trader"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
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
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
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
              <Button type="submit" className="w-full" disabled={busy}>
                Create account
              </Button>
            </form>

            <p className="mt-4 text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth" className="text-foreground underline underline-offset-4">
                Sign in
              </Link>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              By creating an account you agree to our{" "}
              <Link to="/terms" className="underline underline-offset-4">
                Terms
              </Link>
              ,{" "}
              <Link to="/privacy" className="underline underline-offset-4">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link to="/refund-policy" className="underline underline-offset-4">
                Refund Policy
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
