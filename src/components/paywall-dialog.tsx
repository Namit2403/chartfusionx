import { useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PaywallState = {
  open: boolean;
  title: string;
  description: string;
};

const CLOSED: PaywallState = { open: false, title: "", description: "" };

let state: PaywallState = CLOSED;
const listeners = new Set<() => void>();

function setState(next: PaywallState) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Opens the upgrade dialog from anywhere (hooks or event handlers). */
export function openPaywall(options?: { title?: string; description?: string }) {
  setState({
    open: true,
    title: options?.title ?? "Start your free trial to continue",
    description:
      options?.description ??
      "This action needs an active plan. Both plans include a 7-day free trial — you won't be charged if you cancel before it ends.",
  });
}

export function closePaywall() {
  setState(CLOSED);
}

/** Mount once inside the app shell. */
export function PaywallDialog() {
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    () => CLOSED,
  );

  return (
    <Dialog open={current.open} onOpenChange={(open) => !open && closePaywall()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <Lock className="size-5 text-primary" />
          </div>
          <DialogTitle className="pt-3 font-display tracking-tight">{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button asChild onClick={closePaywall}>
            <Link to="/billing">See plans</Link>
          </Button>
          <Button variant="secondary" onClick={closePaywall}>
            Keep looking around
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
