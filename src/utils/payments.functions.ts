import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ACTIVE_STATUSES,
  FREE_TRADE_LIMIT,
  getPlan,
  type AiFeature,
} from "@/lib/entitlements";
import {
  gatewayFetch,
  getPaddleClient,
  paddleErrorMessage,
  type PaddleEnv,
} from "@/lib/paddle.server";

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

    // Count real trades (not log events) so deleting a trade gives the
    // allowance back on the free plan.
    const { count: tradesLogged } = await supabase
      .from("trades")
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
      .from("trades")
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

/**
 * Cancels at the end of the paid period — the member keeps everything they
 * already paid for and simply isn't billed again.
 */
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id, environment, status, current_period_end")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return { ok: false as const, message: "No subscription to cancel", endsAt: null };
    }
    if (subscription.status === "canceled") {
      return { ok: true as const, message: null, endsAt: subscription.current_period_end };
    }

    try {
      const paddle = getPaddleClient(subscription.environment as PaddleEnv);
      await paddle.subscriptions.cancel(subscription.paddle_subscription_id, {
        effectiveFrom: "next_billing_period",
      });
    } catch (err) {
      const message = paddleErrorMessage(err, "Could not cancel your subscription");
      console.error("cancelSubscription failed:", message);
      return { ok: false as const, message, endsAt: null };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq("paddle_subscription_id", subscription.paddle_subscription_id);

    return { ok: true as const, message: null, endsAt: subscription.current_period_end };
  });

/** Undoes a scheduled cancellation while the plan is still running. */
export const resumeSubscription = createServerFn({ method: "POST" })
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

    if (!subscription) {
      return { ok: false as const, message: "No subscription found" };
    }

    try {
      const paddle = getPaddleClient(subscription.environment as PaddleEnv);
      await paddle.subscriptions.update(subscription.paddle_subscription_id, {
        scheduledChange: null,
      });
    } catch (err) {
      const message = paddleErrorMessage(err, "Could not resume your subscription");
      console.error("resumeSubscription failed:", message);
      return { ok: false as const, message };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: false, updated_at: new Date().toISOString() })
      .eq("paddle_subscription_id", subscription.paddle_subscription_id);

    return { ok: true as const, message: null };
  });

/**
 * Works out how checkout should open for this user:
 *  - first ever plan  → catalog price, 7-day trial applies
 *  - trial used before → a server-created transaction on an identical price
 *    without a trial period, so the trial can't be farmed
 * Also reuses the existing Paddle customer so we don't create duplicates.
 */
export const createCheckoutIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) => data)
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

    const previous = (subRow as SubscriptionRecord | null) ?? null;
    if (previous && subscriptionIsUsable(previous) && previous.status !== "canceled") {
      return {
        ok: false as const,
        message: "You already have an active plan. Use 'Switch plan' instead.",
        mode: null,
        paddlePriceId: null,
        transactionId: null,
        customerId: null,
        trialApplies: false,
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("trial_used_at")
      .eq("id", userId)
      .maybeSingle();

    const trialUsed = Boolean(profile?.trial_used_at) || Boolean(previous);
    const customerId = previous?.paddle_customer_id ?? null;

    try {
      const priceRes = await gatewayFetch(
        data.environment,
        `/prices?external_id=${encodeURIComponent(data.priceId)}`,
      );
      const priceJson = (await priceRes.json()) as {
        data?: Array<{
          id: string;
          description: string;
          product_id: string;
          unit_price: { amount: string; currency_code: string };
          billing_cycle: { interval: string; frequency: number } | null;
        }>;
      };
      const price = priceJson.data?.[0];
      if (!price) throw new Error("Price not found");

      if (!trialUsed) {
        return {
          ok: true as const,
          message: null,
          mode: "price" as const,
          paddlePriceId: price.id,
          transactionId: null,
          customerId,
          trialApplies: true,
        };
      }

      const txRes = await gatewayFetch(data.environment, "/transactions", {
        method: "POST",
        body: JSON.stringify({
          items: [
            {
              quantity: 1,
              price: {
                description: price.description,
                product_id: price.product_id,
                unit_price: price.unit_price,
                billing_cycle: price.billing_cycle,
                quantity: { minimum: 1, maximum: 1 },
              },
            },
          ],
          ...(customerId ? { customer_id: customerId } : {}),
          custom_data: { userId },
        }),
      });
      const txJson = (await txRes.json()) as {
        data?: { id: string };
        error?: { detail?: string };
      };
      if (!txJson.data?.id) {
        throw new Error(txJson.error?.detail ?? "Could not start checkout");
      }

      return {
        ok: true as const,
        message: null,
        mode: "transaction" as const,
        paddlePriceId: price.id,
        transactionId: txJson.data.id,
        customerId,
        trialApplies: false,
      };
    } catch (err) {
      const message = paddleErrorMessage(err, "Could not start checkout");
      console.error("createCheckoutIntent failed:", message);
      return {
        ok: false as const,
        message,
        mode: null,
        paddlePriceId: null,
        transactionId: null,
        customerId: null,
        trialApplies: false,
      };
    }
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

    if (error) return { ok: false as const, message: error.message, overviewUrl: null };
    if (!subscription) {
      return {
        ok: false as const,
        message: "No subscription found for this account",
        overviewUrl: null,
      };
    }

    try {
      const paddle = getPaddleClient(subscription.environment as PaddleEnv);
      const session = await paddle.customerPortalSessions.create(
        subscription.paddle_customer_id,
        [subscription.paddle_subscription_id],
      );
      const overviewUrl = session.urls?.general?.overview ?? null;
      if (!overviewUrl) {
        return {
          ok: false as const,
          message: "The billing portal is unavailable right now. Please try again shortly.",
          overviewUrl: null,
        };
      }
      return { ok: true as const, message: null, overviewUrl };
    } catch (err) {
      // Paddle SDK errors are class instances and cannot cross the RPC boundary.
      const message =
        err && typeof err === "object" && "detail" in err
          ? String((err as { detail: unknown }).detail)
          : err instanceof Error
            ? err.message
            : "Could not open the billing portal";
      console.error("createPortalSession failed:", message);
      return { ok: false as const, message, overviewUrl: null };
    }
  });

