import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { trackEndorselyReferral } from "@/lib/endorsely.server";

/**
 * Records a referred signup ("Signed Up" lead) with Endorsely. The referral
 * id comes from the client's `window.endorsely_referral` (set by the
 * endorsely.js snippet on a referred visit); the email comes from the
 * verified session, so a caller cannot attribute someone else's address.
 *
 * Best-effort by design: a tracking failure never blocks account creation.
 */
export const recordEndorselySignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { referralId?: string; name?: string }) => data)
  .handler(async ({ data, context }) => {
    if (!data.referralId) {
      return { tracked: false as const, reason: "no-referral" as const };
    }

    const email =
      typeof (context as { claims?: { email?: string } }).claims?.email === "string"
        ? ((context as { claims: { email: string } }).claims.email as string)
        : null;
    if (!email) {
      return { tracked: false as const, reason: "no-email" as const };
    }

    // Persist against the account so later purchase events (webhook-side,
    // where the client's localStorage is unavailable) can resolve it.
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.auth.admin.updateUserById(context.userId, {
        user_metadata: { endorsely_referral: data.referralId },
      });
    } catch (error) {
      console.error("Endorsely referral persistence error:", error);
    }

    const tracked = await trackEndorselyReferral({
      referralId: data.referralId,
      email,
      status: "Signed Up",
      ...(data.name ? { name: data.name } : {}),
    });
    return { tracked, reason: tracked ? ("ok" as const) : ("endorsely-error" as const) };
  });

/**
 * Immediate referral capture (docs step 3, backend half): called on page
 * load when the endorsely.js snippet exposes `window.endorsely_referral`, so
 * the referral survives even if the visitor's localStorage is cleared before
 * they sign up. Persists against the signed-in user's auth metadata (no
 * migration needed); anonymous visitors keep the localStorage copy until
 * signup. Best-effort — never surfaces an error to the caller's UI.
 */
export const storeEndorselyReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { referralId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
        user_metadata: { endorsely_referral: data.referralId },
      });
      if (error) {
        console.error("Endorsely referral persistence failed:", error.message);
        return { stored: false as const };
      }
      return { stored: true as const };
    } catch (error) {
      console.error("Endorsely referral persistence error:", error);
      return { stored: false as const };
    }
  });
