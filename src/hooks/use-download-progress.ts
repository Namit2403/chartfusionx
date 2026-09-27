import { useCallback, useRef, useState } from "react";

export type DownloadPhase = "idle" | "downloading" | "complete" | "cancelled" | "error";

export type DownloadState = {
  phase: DownloadPhase;
  fileName: string;
  /** Bytes actually received from the wire so far. */
  received: number;
  /** Total bytes when the server sent Content-Length, otherwise null. */
  total: number | null;
  /** Human-readable failure detail for the error phase. */
  message: string | null;
};

const IDLE: DownloadState = { phase: "idle", fileName: "", received: 0, total: null, message: null };

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Real download progress for in-app exports/downloads.
 *
 * Streams the response body and tracks actual bytes against Content-Length —
 * the percentage is never simulated. When the server omits Content-Length
 * (or the environment lacks stream readers), the total stays null and the
 * UI falls back to a non-percentage "Starting download…" state instead of a
 * fabricated bar. Cancellation is real: it aborts the fetch, not just the UI.
 *
 * Intended for small in-app files (report exports, CSVs). The bytes are
 * buffered in memory and saved via an object URL once complete.
 *
 * No live download trigger exists on the site yet (the Reports page export
 * buttons are handler-less placeholders) — the first real action adopts this
 * hook plus <DownloadProgressCard> together.
 */
export function useDownloadProgress() {
  const [state, setState] = useState<DownloadState>(IDLE);
  const abortRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<{ url: string; fileName: string } | null>(null);

  const start = useCallback(async (url: string, fileName: string) => {
    lastRequestRef.current = { url, fileName };

    // A fresh start supersedes any in-flight download.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ phase: "downloading", fileName, received: 0, total: null, message: null });

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const headerTotal = Number(response.headers.get("content-length"));
      const total = Number.isFinite(headerTotal) && headerTotal > 0 ? headerTotal : null;
      setState((current) => ({ ...current, total }));

      const chunks: BlobPart[] = [];
      let received = 0;
      const reader = response.body?.getReader();

      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.byteLength;
          setState((current) => ({ ...current, received }));
        }
      } else {
        // No stream reader available: buffer the whole body, no percentage.
        const blob = await response.blob();
        chunks.push(blob);
        received = blob.size;
      }

      const blob = new Blob(chunks);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);

      setState((current) => ({
        ...current,
        phase: "complete",
        received: blob.size,
        total: current.total ?? blob.size,
      }));
    } catch (error) {
      if (controller.signal.aborted) {
        setState((current) => ({ ...current, phase: "cancelled", message: null }));
        return;
      }
      setState((current) => ({
        ...current,
        phase: "error",
        message: error instanceof Error && error.message ? error.message : null,
      }));
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const retry = useCallback(() => {
    if (!lastRequestRef.current) return;
    void start(lastRequestRef.current.url, lastRequestRef.current.fileName);
  }, [start]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(IDLE);
  }, []);

  return { state, start, cancel, retry, reset };
}
