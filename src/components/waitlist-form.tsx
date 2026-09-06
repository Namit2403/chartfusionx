import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Status = "idle" | "saving" | "done" | "error";

/**
 * Free-beta waitlist signup. Writes to public.waitlist; a unique index on the
 * email keeps repeat submissions from creating duplicates.
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

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail((current) => current || data.user!.email!);
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus("saving");
    setMessage(null);

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
            <Check className="size-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">You're on the ChartFusionX waitlist.</div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {message ??
                "We'll notify you when the next generation of ChartFusionX is ready."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className={cn("space-y-3", className)}>
      <div className={cn("gap-3", compact ? "flex flex-col sm:flex-row sm:items-end" : "grid sm:grid-cols-2")}>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={`waitlist-email-${source}`} className="text-xs text-muted-foreground">
            Email
          </Label>
          <Input
            id={`waitlist-email-${source}`}
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={`waitlist-name-${source}`} className="text-xs text-muted-foreground">
            Name <span className="text-muted-foreground/70">(optional)</span>
          </Label>
          <Input
            id={`waitlist-name-${source}`}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {compact && (
          <Button type="submit" disabled={status === "saving"}>
            {status === "saving" ? <Loader2 className="size-4 animate-spin" /> : "Join the waitlist"}
          </Button>
        )}
      </div>
      {!compact && (
        <Button type="submit" disabled={status === "saving"} className="w-full sm:w-auto">
          {status === "saving" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Joining…
            </>
          ) : (
            "Join the waitlist"
          )}
        </Button>
      )}
      {status === "error" && message && (
        <p className="text-xs text-destructive">{message}</p>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        We'll only email you about ChartFusionX releases. No cost, no card, unsubscribe any time.
      </p>
    </form>
  );
}
