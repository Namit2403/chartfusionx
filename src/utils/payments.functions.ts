import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ACTIVE_STATUSES,
  FREE_TRADE_LIMIT,
  getPlan,
  type AiFeature,
} from "@/lib/entitlements";
import { gatewayFetch, getPaddleClient, type PaddleEnv } from "@/lib/paddle.server";

type SubscriptionRecord = {
  paddle_subscription_id: string;
  paddle_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
  created_at: string;
};

function subscriptionIsUsable(sub: SubscriptionRecord | null) {
  if (!sub) return false;
  const notExpired =
    !sub.current_period_end || new Date(sub.current_period_end).getTime() > Date.now();
  if (ACTIVE_STATUSES.includes(sub.status)) return notExpired;
  if (sub.status === "canceled") return notExpired;
  return false;
}

/** Start of the metering window: the current billing period, else the last 30 days. */
function periodStart(sub: SubscriptionRecord | null) {
  if (sub?.current_period_start) return sub.current_period_start;
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) => data)
  .handler(async ({ data }) => {
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const result = (await response.json()) as { data?: Array<{ id: string }> };
    if (!result.data?.length) throw new Error("Price not found");
    return result.data[0]!.id;
  });

/**
 * Everything the billing UI and the paywall need, resolved server-side so the
 * client cannot fabricate an entitlement.
 */
export const getBillingOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const subscription = (subRow as SubscriptionRecord | null) ?? null;
    const entitled = subscriptionIsUsable(subscription);
    const plan = getPlan(subscription?.price_id);

    const { count } = await supabase
      .from("ai_usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", periodStart(subscription));

    const { data: transactions } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("billed_at", { ascending: true });

    const { count: tradesLogged } = await supabase
      .from("trade_log_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const aiUsed = count ?? 0;
    const aiLimit = plan?.aiActionsPerPeriod ?? null;
    const tradesUsed = tradesLogged ?? 0;

    return {
      subscription,
      entitled,
      planId: plan?.priceId ?? null,
      planName: plan?.name ?? null,
      aiUsed,
      aiLimit,
      aiRemaining: aiLimit === null ? null : Math.max(0, aiLimit - aiUsed),
      tradesUsed,
      tradeLimit: entitled ? null : FREE_TRADE_LIMIT,
      tradesRemaining: entitled ? null : Math.max(0, FREE_TRADE_LIMIT - tradesUsed),
      transactions: transactions ?? [],
    };
  });

/**
 * Records one logged trade. Free (signed-in) accounts get FREE_TRADE_LIMIT
 * trades; subscribers are unlimited. This is the real gate.
 */
export const recordTradeLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const entitled = subscriptionIsUsable((subRow as SubscriptionRecord | null) ?? null);

    const { count } = await supabase
      .from("trade_log_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const tradesUsed = count ?? 0;
    if (!entitled && tradesUsed >= FREE_TRADE_LIMIT) {
      return {
        ok: false as const,
        reason: "limit-reached" as const,
        tradesUsed,
        tradeLimit: FREE_TRADE_LIMIT,
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("trade_log_events").insert({ user_id: userId });

    return {
      ok: true as const,
      reason: "ok" as const,
      tradesUsed: tradesUsed + 1,
      tradeLimit: entitled ? null : FREE_TRADE_LIMIT,
    };
  });

/**
 * Records one AI action after checking entitlement and the plan's monthly cap.
 * This is the real gate — the UI check is only for a nicer message.
 */
export const recordAiUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { feature: AiFeature | string; environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const subscription = (subRow as SubscriptionRecord | null) ?? null;
    if (!subscriptionIsUsable(subscription)) {
      return { ok: false as const, reason: "no-subscription" as const, aiUsed: 0, aiLimit: 0 };
    }

    const plan = getPlan(subscription?.price_id);
    const aiLimit = plan?.aiActionsPerPeriod ?? null;

    const { count } = await supabase
      .from("ai_usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", periodStart(subscription));

    const aiUsed = count ?? 0;
    if (aiLimit !== null && aiUsed >= aiLimit) {
      return { ok: false as const, reason: "limit-reached" as const, aiUsed, aiLimit };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("ai_usage_events")
      .insert({ user_id: userId, feature: String(data.feature) });

    return { ok: true as const, reason: "ok" as const, aiUsed: aiUsed + 1, aiLimit };
  });

/** Upgrade or downgrade in place, charging the prorated difference immediately. */
export const changePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id, price_id, environment, status")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) throw new Error("No subscription to change. Start a plan first.");
    if (subscription.price_id === data.priceId) {
      return { ok: true, unchanged: true };
    }

    const resolved = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const priceResult = (await resolved.json()) as { data?: Array<{ id: string }> };
    const paddlePriceId = priceResult.data?.[0]?.id;
    if (!paddlePriceId) throw new Error("Target plan price not found");

    const paddle = getPaddleClient(subscription.environment as PaddleEnv);
    await paddle.subscriptions.update(subscription.paddle_subscription_id, {
      items: [{ priceId: paddlePriceId, quantity: 1 }],
      prorationBillingMode: "prorated_immediately",
    });

    // Reflect immediately; the webhook confirms with authoritative period data.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .update({
        price_id: data.priceId,
        product_id: getPlan(data.priceId)?.productId ?? data.priceId,
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", subscription.paddle_subscription_id);

    return { ok: true, unchanged: false };
  });

/** Cancels immediately — access ends as soon as this returns. */
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id, environment, status")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) throw new Error("No subscription to cancel");
    if (subscription.status === "canceled") return { ok: true };

    const paddle = getPaddleClient(subscription.environment as PaddleEnv);
    await paddle.subscriptions.cancel(subscription.paddle_subscription_id, {
      effectiveFrom: "immediately",
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false,
        current_period_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", subscription.paddle_subscription_id);

    return { ok: true };
  });

/** Creates a Paddle customer portal session for payment methods and invoices. */
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id, environment")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!subscription) throw new Error("No subscription found for this account");

    const paddle = getPaddleClient(subscription.environment as PaddleEnv);
    const session = await paddle.customerPortalSessions.create(
      subscription.paddle_customer_id,
      [subscription.paddle_subscription_id],
    );

    return {
      overviewUrl: session.urls.general.overview,
      subscriptionUrls: session.urls.subscriptions ?? [],
    };
  });
