import { useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Mode = "paywall" | "signin";

type PaywallState = {
  open: boolean;
  mode: Mode;
  title: string;
  description: string;
};

const CLOSED: PaywallState = { open: false, mode: "paywall", title: "", description: "" };

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
    mode: "paywall",
    title: options?.title ?? "Start your free trial to continue",
    description:
      options?.description ??
      "This action needs an active plan. Both plans include a 7-day free trial — you won't be charged if you cancel before it ends.",
  });
}

/** Opens the "sign in to continue" dialog for logged-out visitors. */
export function openSignInPrompt(options?: { title?: string; description?: string }) {
  setState({
    open: true,
    mode: "signin",
    title: options?.title ?? "Sign in to continue",
    description:
      options?.description ??
      "You can look around freely, but this action needs an account so your trades and AI feedback are saved to you.",
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

  const isSignIn = current.mode === "signin";

  return (
    <Dialog open={current.open} onOpenChange={(open) => !open && closePaywall()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            {isSignIn ? (
              <LogIn className="size-5 text-primary" />
            ) : (
              <Lock className="size-5 text-primary" />
            )}
          </div>
          <DialogTitle className="pt-3 font-display tracking-tight">{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          {isSignIn ? (
            <>
              <Button asChild onClick={closePaywall}>
                <Link to="/signup">Create free account</Link>
              </Button>
              <Button asChild variant="secondary" onClick={closePaywall}>
                <Link to="/auth">Sign in</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild onClick={closePaywall}>
                <Link to="/billing">See plans</Link>
              </Button>
              <Button variant="secondary" onClick={closePaywall}>
                Keep looking around
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
