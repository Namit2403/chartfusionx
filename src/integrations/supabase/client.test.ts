import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Regression pin for the blank-screen deployment bug: the Supabase browser
 * client used to throw at module load when env vars were missing, which took
 * down the whole React app. It must instead resolve queries with an explicit
 * `SUPABASE_NOT_CONFIGURED` error.
 */
afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

async function loadClientWithoutEnv() {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
  vi.stubEnv("SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "");
  return import("@/integrations/supabase/client");
}

describe("supabase client without configured env vars", () => {
  it("does not throw at import time", async () => {
    await expect(loadClientWithoutEnv()).resolves.toBeTruthy();
  });

  it("resolves query chains with an explicit not-configured error", async () => {
    const { supabase } = await loadClientWithoutEnv();
    const result = await supabase.from("trades").select("*");
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe("SUPABASE_NOT_CONFIGURED");
  });

  it("resolves auth calls instead of crashing (signed-out behavior)", async () => {
    const { supabase } = await loadClientWithoutEnv();
    const result = await supabase.auth.getUser();
    expect(result.data?.user ?? null).toBeNull();
    expect(result.error?.code).toBe("SUPABASE_NOT_CONFIGURED");
  });

  it("keeps chain methods usable after multiple property accesses", async () => {
    const { supabase } = await loadClientWithoutEnv();
    const result = await supabase.from("trades").select("id").eq("user_id", "x").limit(1);
    expect(result.error?.code).toBe("SUPABASE_NOT_CONFIGURED");
  });
});
