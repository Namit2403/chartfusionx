import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SignInGate({ pageName }: { pageName: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Lock className="size-5" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">
          Sign in to access {pageName}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          ChartFusionX saves your trades, patterns, and AI feedback — all in one place.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/signup">Create free account</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required to get started.
        </p>
      </div>
    </div>
  );
}
