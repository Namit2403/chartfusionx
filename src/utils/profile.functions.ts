import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const LEGAL_VERSION = "2026-08-10";

export const getLegalAcceptance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("legal_accepted_at, legal_accepted_version, display_name, email")
      .eq("id", context.userId)
      .maybeSingle();

    return {
      acceptedAt: (data?.["legal_accepted_at"] as string | null) ?? null,
      acceptedVersion: (data?.["legal_accepted_version"] as string | null) ?? null,
      displayName: (data?.["display_name"] as string | null) ?? null,
      email: (data?.["email"] as string | null) ?? null,
      current: data?.["legal_accepted_version"] === LEGAL_VERSION,
    };
  });

export const acceptLegal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const acceptedAt = new Date().toISOString();
    const { error } = await context.supabase
      .from("profiles")
      .update({
        legal_accepted_at: acceptedAt,
        legal_accepted_version: LEGAL_VERSION,
      })
      .eq("id", context.userId);

    if (error) throw new Error(error.message);
    return { acceptedAt, acceptedVersion: LEGAL_VERSION };
  });
