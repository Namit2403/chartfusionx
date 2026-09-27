import { Check, Download, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes, type DownloadState } from "@/hooks/use-download-progress";

/**
 * Download progress card — the shared UI for real, in-flight file transfers.
 *
 * Dark card treatment on the site's tokens; accent is the site's positive
 * green, matching the rest of the app's progress meters. The percentage is
 * rendered only when the server supplies Content-Length — no fabricated
 * progress. The Cancel control renders only while a transfer is actually
 * running (it is always real for fetch-streamed downloads).
 */
export function DownloadProgressCard({
  state,
  onCancel,
  onRetry,
}: {
  state: DownloadState;
  onCancel: () => void;
  onRetry: () => void;
}) {
  if (state.phase === "idle") return null;

  const total = state.total;
  const hasTotal = total !== null && total > 0;
  const percent = hasTotal ? Math.min(100, Math.round((state.received / total) * 100)) : null;
  const running = state.phase === "downloading";
  const sizeLine = hasTotal
    ? `${state.fileName} ${formatBytes(total)}`
    : `${state.fileName}${state.received > 0 ? ` ${formatBytes(state.received)} received` : ""}`;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4",
        state.phase === "error" || state.phase === "cancelled"
          ? "border-destructive/40"
          : "border-border",
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        {state.phase === "complete" ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-positive/15 text-positive">
            <Check className="size-5" strokeWidth={2.5} aria-hidden />
          </span>
        ) : state.phase === "error" || state.phase === "cancelled" ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <X className="size-5" strokeWidth={2.5} aria-hidden />
          </span>
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Download className="size-5" strokeWidth={2.2} aria-hidden />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {state.phase === "downloading" && "Downloading…"}
            {state.phase === "complete" && "Complete"}
            {state.phase === "cancelled" && "Cancelled"}
            {state.phase === "error" && "Download failed"}
          </p>

          {/* Live region: percentage, completion, and failure are announced. */}
          <div aria-live="polite" className="mt-2">
            {running && hasTotal && (
              <>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-positive transition-[width] duration-150 ease-linear motion-reduce:transition-none"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="num mt-1 text-xs text-muted-foreground">{percent}%</p>
              </>
            )}
            {running && !hasTotal && (
              <p className="text-xs text-muted-foreground">Starting download…</p>
            )}
            {state.phase === "complete" && (
              <p className="text-xs text-muted-foreground">Saved to your downloads.</p>
            )}
            {state.phase === "cancelled" && <p className="text-xs text-destructive">Download cancelled.</p>}
            {state.phase === "error" && (
              <p className="text-xs text-destructive">
                Something went wrong{state.message ? ` (${state.message})` : ""} — try again.
              </p>
            )}
          </div>

          <p className="mt-2 truncate text-xs text-muted-foreground">{sizeLine}</p>

          {running && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-7 px-2 text-xs"
              onClick={onCancel}
              aria-label={`Cancel downloading ${state.fileName}`}
            >
              Cancel
            </Button>
          )}
          {(state.phase === "error" || state.phase === "cancelled") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-7 px-2 text-xs"
              onClick={onRetry}
              aria-label={`Retry downloading ${state.fileName}`}
            >
              <RefreshCw className="mr-1.5 size-3.5" aria-hidden />
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
