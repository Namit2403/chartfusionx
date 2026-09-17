import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { FOUNDER_PLANS as FOUNDER_CHECKOUT_PLANS } from "@/lib/whop-founding";

/**
 * Whop founding-access core. SERVER-ONLY: never import this from client code.
 * It reads WHOP_WEBHOOK_SECRET from the environment and holds a service-role
 * Supabase client.
 */

export type WhopPlanId = "plan_8ljFtIGCyybJb" | "plan_w4Hiq9mjM33aQ";

const FOUNDER_COMPANY_ID = "biz_9w4gyExnEat48S";
const FOUNDER_PRODUCT_ID = "prod_PjjTLlXzGV6hQ";
const FOUNDER_ACCESS_DAYS = 365;

/**
 * Plan metadata lives in the shared client-safe module (`@/lib/whop-founding`);
 * this map keys it by Whop plan id for webhook processing.
 */
export const FOUNDER_PLANS: Record<WhopPlanId, { plan: "Pro" | "Max"; priceCents: number }> = {
  plan_8ljFtIGCyybJb: {
    plan: FOUNDER_CHECKOUT_PLANS.pro_founding.plan,
    priceCents: FOUNDER_CHECKOUT_PLANS.pro_founding.price * 100,
  },
  plan_w4Hiq9mjM33aQ: {
    plan: FOUNDER_CHECKOUT_PLANS.max_founding.plan,
    priceCents: FOUNDER_CHECKOUT_PLANS.max_founding.price * 100,
  },
};

export function isFounderPlanId(value: unknown): value is WhopPlanId {
  return value === "plan_8ljFtIGCyybJb" || value === "plan_w4Hiq9mjM33aQ";
}

export function getWhopWebhookSecret(): string {
  const value = process.env["WHOP_WEBHOOK_SECRET"];
  if (!value) throw new Error("WHOP_WEBHOOK_SECRET is not configured");
  return value;
}

let _admin: ReturnType<typeof createClient<Database>> | null = null;
function admin() {
  if (!_admin) {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) {
      throw new Error(
        "Missing Supabase server environment (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
      );
    }
    _admin = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

/**
 * The generated Database type does not include the founding tables until
 * `supabase gen types` runs against the migrated project. These casts keep
 * the server code honest at runtime; swap them for real generics once the
 * types are regenerated.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminAny(): any {
  return admin();
}

export type FoundingLaunchConfig = {
  launched: boolean;
  /** ISO timestamp of the configured launch; NULL until an admin sets it. */
  startDate: string | null;
};

type SettingsRow = { key: string; value: unknown };

export async function getFoundingLaunchConfig(): Promise<FoundingLaunchConfig> {
  const { data } = await adminAny()
    .from("app_settings")
    .select("key, value")
    .in("key", ["founding_access_launched", "founding_access_start_date"]);

  const rows = (data ?? []) as SettingsRow[];
  const launched = rows.some((row) => row.key === "founding_access_launched" && row.value === true);
  const startRow = rows.find((row) => row.key === "founding_access_start_date");
  const rawStart = startRow?.value;
  const startDate = typeof rawStart === "string" && rawStart !== "null" ? rawStart : null;

  return { launched: Boolean(launched), startDate };
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.includes("@") ? email : null;
}

type FounderPurchaseInput = {
  paymentId: string;
  eventId: string;
  planId: WhopPlanId;
  email: string;
  paidAt: string;
  membershipId: string | null;
  productId: string | null;
  productTitle: string | null;
  whopUserId: string | null;
  amountCents: number | null;
  currency: string | null;
};

/**
 * Record a verified founding purchase. Idempotent at two levels:
 *  - the unique whop_payment_id makes the insert a no-op for replays, and
 *  - an already-activated / already-refunded entitlement is never modified by
 *    a later duplicate event (only immutable purchase metadata is refreshed).
 */
export async function recordFounderPurchase(input: FounderPurchaseInput): Promise<void> {
  const supabase = adminAny();

  const { data: existing } = await supabase
    .from("founding_entitlements")
    .select("id, access_status")
    .eq("whop_payment_id", input.paymentId)
    .maybeSingle();

  if (existing) {
    // Duplicate delivery (payment.succeeded + membership.activated, or Whop
    // retries). Never touch access_status / access_start / access_end.
    return;
  }

  const plan = FOUNDER_PLANS[input.planId];

  const { error } = await supabase.from("founding_entitlements").insert({
    customer_email: input.email,
    whop_payment_id: input.paymentId,
    whop_event_id: input.eventId,
    whop_plan_id: input.planId,
    whop_membership_id: input.membershipId,
    whop_product_id: input.productId,
    whop_product_title: input.productTitle,
    whop_user_id: input.whopUserId,
    plan_name: plan.plan,
    amount_cents: input.amountCents ?? plan.priceCents,
    currency: (input.currency ?? "USD").toUpperCase(),
    paid_at: input.paidAt,
    // Pre-launch state: recorded, paid, but no access window yet.
    access_status: "pending",
    access_start: null,
    access_end: null,
  });

  if (error) {
    // A concurrent duplicate delivery may have won the insert race; that is
    // the idempotent outcome, not a failure.
    if (error.code === "23505") return;
    throw new Error(`Failed to record founding purchase: ${error.message}`);
  }
}

/** Mark a verified refunded payment as refunded; returns rows changed. */
export async function refundFounderPurchase(
  paymentId: string,
  refundId: string | null,
): Promise<number> {
  const { data, error } = await adminAny().rpc("refund_founding_entitlements", {
    _payment_id: paymentId,
    _refund_id: refundId,
  });
  if (error) throw new Error(`Failed to refund founding purchase: ${error.message}`);
  return Number(data ?? 0);
}

/**
 * Admin-only: set the launch configuration and atomically activate every
 * still-pending founding purchase with a 365-day window from the launch date.
 * Returns how many entitlements were activated.
 */
export async function activateFoundingAccess(launchDateIso: string): Promise<number> {
  const supabase = adminAny();

  // Persist the launch configuration first so any later purchase logic and
  // any retry observe a consistent setting.
  const { error: settingsError } = await supabase.from("app_settings").upsert([
    { key: "founding_access_launched", value: true },
    { key: "founding_access_start_date", value: launchDateIso },
  ]);
  if (settingsError) throw new Error(`Failed to save launch config: ${settingsError.message}`);

  const { data, error } = await adminAny().rpc("activate_founding_entitlements", {
    _launch_at: launchDateIso,
  });
  if (error) throw new Error(`Failed to activate founding entitlements: ${error.message}`);
  return Number(data ?? 0);
}

export { FOUNDER_COMPANY_ID, FOUNDER_PRODUCT_ID, FOUNDER_ACCESS_DAYS };
