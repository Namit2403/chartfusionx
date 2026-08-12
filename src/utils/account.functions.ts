import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPaddleClient, paddleErrorMessage, type PaddleEnv } from "@/lib/paddle.server";

/** Updates the display name / avatar on the profile and the auth user metadata. */
export const updateAccountProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { displayName: string; avatarUrl: string | null }) => data)
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const displayName = data.displayName.trim().slice(0, 80);
    if (!displayName) {
      return { ok: false as const, message: "Please enter a name." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: data.avatarUrl?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) return { ok: false as const, message: error.message };

    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { display_name: displayName, avatar_url: data.avatarUrl?.trim() || null },
    });

    return { ok: true as const, message: null };
  });

/**
 * Permanently deletes the account: cancels any live Paddle subscription first
 * so the member is never billed after leaving, then removes all their data.
 */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv; confirm: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.confirm.trim().toUpperCase() !== "DELETE") {
      return { ok: false as const, message: "Type DELETE to confirm." };
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id, environment, status")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscription && subscription.status !== "canceled") {
      try {
        const paddle = getPaddleClient(subscription.environment as PaddleEnv);
        await paddle.subscriptions.cancel(subscription.paddle_subscription_id, {
          effectiveFrom: "immediately",
        });
      } catch (err) {
        console.error(
          "deleteAccount: cancel failed",
          paddleErrorMessage(err, "cancel failed"),
        );
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Rows in trades/subscriptions/etc. cascade from auth.users.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return { ok: false as const, message: error.message };

    return { ok: true as const, message: null };
  });
