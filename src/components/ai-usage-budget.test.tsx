import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AiUsageBudget } from "./ai-usage-budget";
import { readUsageBudget, writeUsageBudget } from "@/lib/profile";

function localStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => void store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  };
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock(),
    configurable: true,
  });
});

afterEach(() => {
  window.localStorage.clear();
});

function pressArrow(key: "ArrowRight" | "ArrowLeft", times: number) {
  const thumb = document.activeElement;
  if (!thumb) throw new Error("slider thumb not focused");
  for (let i = 0; i < times; i++) {
    fireEvent.keyDown(thumb, { key });
  }
}

describe("AiUsageBudget", () => {
  it("renders defaults: 50 cap, 75/90 thresholds, hard stop off, on-budget alert", () => {
    render(<AiUsageBudget used={0} />);

    expect(screen.getByTestId("cap-value")).toHaveTextContent("50 actions");
    expect(screen.getAllByTestId("threshold-value")[0]).toHaveTextContent("75%");
    expect(screen.getAllByTestId("threshold-value")[1]).toHaveTextContent("90%");
    expect(screen.getByTestId("budget-alert")).toHaveTextContent("On budget");
    expect(screen.getByRole("switch", { name: "Hard stop at cap" })).not.toBeChecked();
  });

  it("changing the cap persists to the cfx-profile store", () => {
    render(<AiUsageBudget used={0} />);

    const thumb = screen.getByRole("slider", { name: "Monthly cap" });
    fireEvent.focus(thumb);
    thumb.focus();
    pressArrow("ArrowRight", 4); // 50 -> 70 (step 5)

    expect(readUsageBudget().monthlyCap).toBe(70);
    expect(screen.getByTestId("cap-value")).toHaveTextContent("70 actions");
  });

  it("raising the warn threshold past critical drags critical with it", () => {
    render(<AiUsageBudget used={0} />);

    const thumb = screen.getByRole("slider", { name: "Warn threshold" });
    fireEvent.focus(thumb);
    thumb.focus();
    pressArrow("ArrowRight", 20); // 75 -> 95 (clamped at max)

    const stored = readUsageBudget();
    expect(stored.warnThreshold).toBe(95);
    expect(stored.criticalThreshold).toBe(95); // dragged along, never below warn
  });

  it("lowering the critical threshold below warn drags warn down with it", () => {
    render(<AiUsageBudget used={0} />);

    const thumb = screen.getByRole("slider", { name: "Critical threshold" });
    fireEvent.focus(thumb);
    thumb.focus();
    pressArrow("ArrowLeft", 20); // 90 -> 70, crossing warn (75)

    const stored = readUsageBudget();
    expect(stored.criticalThreshold).toBe(70);
    expect(stored.warnThreshold).toBe(70);
  });

  it("toggling hard stop persists", () => {
    render(<AiUsageBudget used={0} />);

    fireEvent.click(screen.getByRole("switch", { name: "Hard stop at cap" }));

    expect(readUsageBudget().hardStop).toBe(true);
  });

  it("shows the warn level when usage crosses the warn threshold", () => {
    // 40/50 = 80% >= 75% warn, < 90% critical
    render(<AiUsageBudget used={40} />);

    expect(screen.getByTestId("budget-alert")).toHaveTextContent("Approaching budget");
    expect(screen.getByTestId("budget-note")).toHaveTextContent("10 actions left");
  });

  it("shows the critical level at/above the critical threshold", () => {
    // 46/50 = 92% >= 90%
    render(<AiUsageBudget used={46} />);

    expect(screen.getByTestId("budget-alert")).toHaveTextContent("Over alert threshold");
    expect(screen.getByTestId("budget-note")).not.toHaveTextContent("paused");
  });

  it("shows the hard-stop pause message when enabled and the cap is reached", () => {
    writeUsageBudget({ hardStop: true });
    render(<AiUsageBudget used={50} />);

    expect(screen.getByTestId("budget-alert")).toHaveTextContent("Over alert threshold");
    expect(screen.getByTestId("budget-note")).toHaveTextContent("Hard stop reached");
    expect(screen.getByTestId("budget-note")).toHaveTextContent("paused");
  });
});
