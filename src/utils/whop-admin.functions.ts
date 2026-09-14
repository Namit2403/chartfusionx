import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { activateFoundingAccess, getFoundingLaunchConfig } from "@/lib/whop-founding.server";

/**
 * Admin-only launch control for ChartFusionX founding access.
 *
 * Security:
 *  - Both functions require a valid Supabase session (requireSupabaseAuth).
 *  - Activation additionally requires the 'admin' role via the has_role()
 *    database function, so a stolen session alone is not enough.
 *  - No public/GET route exposes mutation; the launch date lives in
 *    app_settings and is only writable through this authenticated server fn.
 */

async function requireAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: isAdmin, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !isAdmin) {
    throw new Error("Forbidden: administrator role required");
  }
}

export type FoundingLaunchStatus = {
  launched: boolean;
  startDate: string | null;
  pendingCount: number;
  activeCount: number;
  refundedCount: number;
};

/** Read-only status; admin-gated to avoid leaking launch plans. */
export const getFoundingLaunchStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);

    const config = await getFoundingLaunchConfig();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Generated DB types do not include the founding tables until
    // `supabase gen types` runs post-migration; the runtime shape is exact.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entitlements = (supabaseAdmin as any).from("founding_entitlements");
    const { count: pendingCount } = await entitlements
      .select("id", { count: "exact", head: true })
      .eq("access_status", "pending");
    const { count: activeCount } = await entitlements
      .select("id", { count: "exact", head: true })
      .eq("access_status", "active");
    const { count: refundedCount } = await entitlements
      .select("id", { count: "exact", head: true })
      .eq("access_status", "refunded");

    return {
      launched: config.launched,
      startDate: config.startDate,
      pendingCount: pendingCount ?? 0,
      activeCount: activeCount ?? 0,
      refundedCount: refundedCount ?? 0,
    } satisfies FoundingLaunchStatus;
  });

/**
 * Officially launches ChartFusionX founding access.
 *
 * `launchDateIso` should be an instant (ISO 8601). Operators pick the wall
 * time in America/New_York; the conversion to an instant happens on the
 * admin client before calling this function, so the server stores one
 * unambiguous UTC instant.
 */
export const launchFoundingAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { launchDateIso: string; timezone?: string }) => data)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);

    const launchInstant = new Date(data.launchDateIso);
    if (Number.isNaN(launchInstant.getTime())) {
      return { ok: false as const, message: "Invalid launch date", activated: 0 };
    }

    // Canonical operator timezone for the founding launch.
    const timezone = data.timezone ?? "America/New_York";

    const alreadyLaunched = await getFoundingLaunchConfig();
    if (alreadyLaunched.launched) {
      return {
        ok: false as const,
        message: "Founding access is already launched; the access clock cannot be moved.",
        activated: 0,
      };
    }

    const activated = await activateFoundingAccess(launchInstant.toISOString());

    return {
      ok: true as const,
      message: `Founding access launched. ${activated} entitlement(s) activated with a 365-day window from ${launchInstant.toISOString()} (${timezone} canonical).`,
      activated,
    };
  });
