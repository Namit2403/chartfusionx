import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Reason = "unauthenticated" | "expired" | "forbidden" | "oauth" | "unknown";

type Search = { reason?: Reason | undefined; redirect?: string | undefined };

const REASONS: Record<Reason, { title: string; body: string }> = {
  unauthenticated: {
    title: "You need to sign in",
    body: "This page is part of your private trading workspace. Sign in with your ChartFusionX account to continue.",
  },
  expired: {
    title: "Your session expired",
    body: "For your security we signed you out after a period of inactivity. Sign in again to pick up where you left off.",
  },
  forbidden: {
    title: "You don't have access to this area",
    body: "Your account is signed in, but it doesn't have the role required for this page. Ask your team owner for access, or switch to an account that has it.",
  },
  oauth: {
    title: "Sign-in couldn't be completed",
    body: "We couldn't finish the Google sign-in handshake. This usually happens when the window is closed early or the link has already been used.",
  },
  unknown: {
    title: "Access is blocked",
    body: "We couldn't verify your access to this page. Signing in again usually resolves it.",
  },
};

export const Route = createFileRoute("/auth-error")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const raw = search["reason"];
    const reason =
      typeof raw === "string" && raw in REASONS ? (raw as Reason) : undefined;
    return {
      reason,
      redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Access blocked — ChartFusionX" },
      {
        name: "description",
        content:
          "Why your access to this ChartFusionX page was blocked and how to get back into your trading workspace.",
      },
      { property: "og:title", content: "Access blocked — ChartFusionX" },
      {
        property: "og:description",
        content: "Understand the authorization error and return to the right sign-in flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthErrorPage,
});

function AuthErrorPage() {
  const { reason, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);

  const info = REASONS[(reason ?? "unknown") as Reason];

  const signOutAndRestart = async () => {
    setBusy(true);
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: redirect ?? "/" }, replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-lg py-14">
      <div className="rounded-xl border border-border bg-card p-7">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{info.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{info.body}</p>

        {redirect && (
          <p className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Blocked page: <span className="text-foreground">{redirect}</span>
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {signedIn ? (
            <Button className="sm:flex-1" onClick={signOutAndRestart} disabled={busy}>
              Sign out and sign in again
            </Button>
          ) : (
            <Button asChild className="sm:flex-1">
              <Link to="/auth" search={{ redirect: redirect ?? "/" }}>
                Go to sign in
              </Link>
            </Button>
          )}
          <Button asChild variant="secondary" className="sm:flex-1">
            <Link to="/signup">Create an account</Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Still stuck? Check our{" "}
          <Link to="/terms" className="underline underline-offset-4">
            Terms
          </Link>{" "}
          or{" "}
          <Link to="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>{" "}
          for account and access rules.
        </p>
      </div>
    </div>
  );
}
