import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { formatBytes, useDownloadProgress } from "./use-download-progress";

function streamOf(chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

const originalFetch = globalThis.fetch;
const originalAnchor = HTMLAnchorElement.prototype.click;
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  HTMLAnchorElement.prototype.click = originalAnchor;
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
  vi.restoreAllMocks();
});

function stubSaver() {
  const clicks: string[] = [];
  HTMLAnchorElement.prototype.click = vi.fn(function mockClick(this: HTMLAnchorElement) {
    clicks.push(this.download);
  }) as typeof HTMLAnchorElement.prototype.click;
  URL.createObjectURL = vi.fn(() => "blob:mock") as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn(() => {}) as typeof URL.revokeObjectURL;
  return clicks;
}

describe("useDownloadProgress", () => {
  it("tracks real bytes against Content-Length and saves the file", async () => {
    const clicks = stubSaver();
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(streamOf(["abcd", "efghij"]), {
        status: 200,
        headers: { "Content-Length": "10" },
      }),
    );

    const { result } = renderHook(() => useDownloadProgress());
    void act(() => {
      void result.current.start("https://example.test/report.csv", "report.csv");
    });

    await waitFor(() => expect(result.current.state.phase).toBe("complete"));
    expect(result.current.state.received).toBe(10);
    expect(result.current.state.total).toBe(10);
    expect(clicks).toEqual(["report.csv"]);
  });

  it("stays in the non-percentage fallback while Content-Length is unknown", async () => {
    stubSaver();
    // A stream that emits one chunk and never closes: download stays in flight.
    const encoder = new TextEncoder();
    const neverClosing = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("partial"));
      },
    });
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(neverClosing, { status: 200 }),
    );

    const { result } = renderHook(() => useDownloadProgress());
    void act(() => {
      void result.current.start("https://example.test/report.csv", "report.csv");
    });

    await waitFor(() => expect(result.current.state.phase).toBe("downloading"));
    await waitFor(() => expect(result.current.state.received).toBe(7));
    // No total from the server: the hook must not invent one mid-flight.
    expect(result.current.state.total).toBeNull();

    await act(async () => {
      result.current.cancel();
    });
  });

  it("cancel aborts the real request and lands in the cancelled phase", async () => {
    stubSaver();
    globalThis.fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    ) as unknown as typeof globalThis.fetch;

    const { result } = renderHook(() => useDownloadProgress());
    void act(() => {
      void result.current.start("https://example.test/report.csv", "report.csv");
    });
    await act(async () => {
      result.current.cancel();
    });

    await waitFor(() => expect(result.current.state.phase).toBe("cancelled"));
  });

  it("marks network failure as error with a message and retries", async () => {
    stubSaver();
    const failing = vi.fn().mockRejectedValue(new TypeError("Network error"));
    globalThis.fetch = failing as unknown as typeof globalThis.fetch;

    const { result } = renderHook(() => useDownloadProgress());
    void act(() => {
      void result.current.start("https://example.test/report.csv", "report.csv");
    });
    await waitFor(() => expect(result.current.state.phase).toBe("error"));
    expect(result.current.state.message).toBe("Network error");

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(streamOf(["ok"]), { status: 200 }),
    );
    await act(async () => {
      result.current.retry();
    });
    await waitFor(() => expect(result.current.state.phase).toBe("complete"));
  });

  it("formats byte sizes for the file line", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
