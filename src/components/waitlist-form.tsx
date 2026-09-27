import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Send } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Status = "idle" | "saving" | "done" | "error";

/**
 * Free-beta waitlist email capture. Writes to public.waitlist; a unique index
 * on the email keeps repeat submissions from creating duplicates.
 *
 * One shared component for every email-capture location on the site
 * (whats-coming, pricing, billing, coming-soon pages, marketing landing).
 *
 * States: idle -> saving (request in flight, inputs disabled) -> done (only
 * after the backend confirms, including duplicate 23505 which is surfaced as
 * an already-on-the-list confirmation) or error (real message, immediate
 * retry without reload). The success state is never shown optimistically.
 *
 * Status line is aria-live so screen readers hear Sending / confirmation /
 * error without re-finding the input. The trailing icon button carries a
 * state-specific accessible label. prefers-reduced-motion swaps the plane
 * animation for an instant state change (CSS also disables the keyframes).
 */
export function WaitlistForm({
  source,
  className,
  compact = false,
}: {
  source: string;
  className?: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [flying, setFlying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const flyTimerRef = useRef<number | null>(null);
  const planeDelayMs = 620;

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail((current) => current || data.user!.email!);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (flyTimerRef.current !== null) window.clearTimeout(flyTimerRef.current);
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || status === "saving") return;

    setStatus("saving");
    setMessage(null);

    // Send-plane flight: plays while the request is in flight, then the
    // spinner takes over until the real response lands.
    setFlying(true);
    if (flyTimerRef.current !== null) window.clearTimeout(flyTimerRef.current);
    flyTimerRef.current = window.setTimeout(() => setFlying(false), planeDelayMs);

    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("waitlist").insert({
      email: trimmed,
      name: name.trim() || null,
      source,
      user_id: userData.user?.id ?? null,
    });

    if (error && error.code !== "23505") {
      setStatus("error");
      setMessage("We couldn't save that just now. Please try again in a moment.");
      return;
    }

    setStatus("done");
    setMessage(
      error?.code === "23505"
        ? "You're already on the ChartFusionX waitlist — we'll be in touch."
        : null,
    );
  }

  if (status === "done") {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <Check className="size-4" aria-hidden />
          </span>
          <div>
            <div className="text-sm font-semibold">You're on the ChartFusionX waitlist.</div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {message ??
                `We'll notify ${email.trim() || "you"} when the next generation of ChartFusionX is ready.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sending = status === "saving";
  const buttonLabel =
    sending ? "Sending your email" : status === "error" ? "Retry submitting your email" : "Submit email";

  return (
    <form onSubmit={(e) => void submit(e)} className={cn("space-y-3", className)}>
      <div className={cn("gap-3", compact ? "flex flex-col sm:flex-row sm:items-end" : "grid sm:grid-cols-2")}>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={`waitlist-email-${source}`} className="text-xs text-muted-foreground">
            Email
          </Label>
          <div
            className={cn(
              "waitlist-pill flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 transition-colors",
              status === "error"
                ? "border-destructive/60"
                : focused || sending
                  ? "border-positive/60"
                  : "border-border",
            )}
            data-status={status}
          >
            <Input
              ref={inputRef}
              id={`waitlist-email-${source}`}
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              disabled={sending}
              aria-invalid={status === "error" || undefined}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => setEmail(e.target.value)}
              className="waitlist-pill-input border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
            <button
              ref={sendButtonRef}
              type="submit"
              disabled={sending}
              aria-label={buttonLabel}
              aria-disabled={sending}
              data-flying={sending && flying ? "true" : undefined}
              className={cn(
                "waitlist-send relative flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
                status === "error"
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-positive hover:bg-positive/10",
              )}
            >
              {sending ? (
                <Loader2 className="waitlist-plane-spinner size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="waitlist-plane size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
        {!compact && (
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={`waitlist-name-${source}`} className="text-xs text-muted-foreground">
              Name <span className="text-muted-foreground/70">(optional)</span>
            </Label>
            <Input
              id={`waitlist-name-${source}`}
              placeholder="Your name"
              value={name}
              disabled={sending}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Status line — announced politely to assistive tech. */}
      <div aria-live="polite" className="min-h-5 text-xs leading-relaxed">
        {sending && <p className="text-muted-foreground">Sending…</p>}
        {status === "error" && message && <p className="text-destructive">{message}</p>}
        {status === "idle" && (
          <p className="text-muted-foreground">
            We'll only email you about ChartFusionX releases. No cost, no card, unsubscribe any time.
          </p>
        )}
      </div>
    </form>
  );
}
