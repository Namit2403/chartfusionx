import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "cfx-theme";
const DARK_CLASS = "dark";

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage unavailable (private mode, SSR) — fall through to default
  }
  return "dark";
}

let current: Theme = readStoredTheme();
const listeners = new Set<() => void>();

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(DARK_CLASS, theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function getTheme(): Theme {
  return current;
}

export function setTheme(theme: Theme) {
  current = theme;
  apply(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore persistence failures
  }
  listeners.forEach((listener) => listener());
}

export function toggleTheme() {
  setTheme(current === "dark" ? "light" : "dark");
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Re-assert on module load so the class always matches the stored preference
// (the before-paint script in __root handles first-paint; this covers HMR).
if (typeof document !== "undefined") apply(current);

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "dark" as Theme);

  return {
    theme,
    isDark: theme === "dark",
    setTheme,
    toggleTheme,
  };
}

/**
 * Inline script string for the document head: applies the stored theme class
 * before first paint so there is no light/dark flash on load.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var d=t!=="light";var r=document.documentElement;r.classList.toggle("${DARK_CLASS}",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
