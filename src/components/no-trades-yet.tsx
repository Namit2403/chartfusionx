import { Link } from "@tanstack/react-router";
import { LineChart } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

/**
 * Shown on every data surface while a signed-in trader has no trades yet —
 * nothing in the product should display someone else's numbers.
 */
export function NoTradesYet({
  title = "No trades logged yet",
  description = "Log your first trade and this page fills in with your own numbers — nothing here is sample data.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/40 px-6 py-14 text-center">
      <LineChart className="size-6 text-muted-foreground" />
      <div className="text-base font-medium">{title}</div>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action ?? (
        <Button asChild size="sm" className="mt-1">
          <Link to="/journal/new">Log your first trade</Link>
        </Button>
      )}
    </div>
  );
}
