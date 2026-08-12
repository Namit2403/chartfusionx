import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
  }
  return _supabase;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function externalIds(item: any) {
  return {
    priceId: item?.price?.importMeta?.externalId as string | undefined,
    productId: item?.product?.importMeta?.externalId as string | undefined,
  };
}

/** Looks up the owning user when an event carries no customData (e.g. portal changes). */
async function resolveUserId(
  data: any,
  env: PaddleEnv,
  subscriptionId?: string,
): Promise<string | null> {
  const fromCustomData = data?.customData?.userId;
  if (fromCustomData) return fromCustomData as string;

  if (subscriptionId) {
    const { data: row } = await getSupabase()
      .from("subscriptions")
      .select("user_id")
      .eq("paddle_subscription_id", subscriptionId)
      .eq("environment", env)
      .maybeSingle();
    if (row?.user_id) return row.user_id;
  }

  if (data?.customerId) {
    const { data: row } = await getSupabase()
      .from("subscriptions")
      .select("user_id")
      .eq("paddle_customer_id", data.customerId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (row?.user_id) return row.user_id;
  }

  return null;
}

async function upsertSubscription(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, scheduledChange } = data;

  const userId = await resolveUserId(data, env, id);
  if (!userId) {
    console.error("Cannot attribute subscription to a user", { subscriptionId: id });
    return;
  }

  const item = items?.[0];
  const { priceId, productId } = externalIds(item);
  if (!priceId || !productId) {
    console.warn("Skipping subscription: missing importMeta.externalId", {
      rawPriceId: item?.price?.id,
      rawProductId: item?.product?.id,
    });
    return;
  }

  // Upsert on every lifecycle event so plan changes update price_id/product_id,
  // and an `updated` arriving before `created` still creates the row.
  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        paddle_subscription_id: id,
        paddle_customer_id: customerId,
        product_id: productId,
        price_id: priceId,
        status,
        current_period_start: currentBillingPeriod?.startsAt ?? null,
        current_period_end: currentBillingPeriod?.endsAt ?? null,
        cancel_at_period_end: scheduledChange?.action === "cancel",
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" },
    );

  // One free trial per account: stamp it the moment a trial starts.
  if (status === "trialing") {
    await getSupabase()
      .from("profiles")
      .update({ trial_used_at: new Date().toISOString() })
      .eq("id", userId)
      .is("trial_used_at", null);
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      canceled_at: data?.canceledAt ?? new Date().toISOString(),
      // Keep the paid-for window: access runs to the end of the billing period.
      current_period_end:
        data?.currentBillingPeriod?.endsAt ?? data?.canceledAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
}

/** Refunds and credits: record the amount and revoke access on a full refund. */
async function handleAdjustment(data: any, env: PaddleEnv) {
  if (data?.action !== "refund" && data?.action !== "chargeback") return;
  if (data?.status === "rejected") return;

  const transactionId = data?.transactionId as string | undefined;
  if (!transactionId) return;

  const refunded = Math.abs(Number(data?.totals?.total ?? 0));

  const { data: tx } = await getSupabase()
    .from("payment_transactions")
    .select("id, amount_cents, refunded_cents, paddle_subscription_id")
    .eq("paddle_transaction_id", transactionId)
    .eq("environment", env)
    .maybeSingle();

  if (!tx) {
    console.warn("Adjustment for an unknown transaction", { transactionId });
    return;
  }

  const totalRefunded = data?.status === "approved" ? refunded : tx.refunded_cents;

  await getSupabase()
    .from("payment_transactions")
    .update({
      refunded_cents: totalRefunded,
      status: totalRefunded >= tx.amount_cents ? "refunded" : "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", tx.id);

  const isFullRefund = data?.status === "approved" && totalRefunded >= tx.amount_cents;
  const subscriptionId = (data?.subscriptionId ?? tx.paddle_subscription_id) as string | undefined;

  if (isFullRefund && subscriptionId) {
    await getSupabase()
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false,
        current_period_end: new Date().toISOString(),
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", subscriptionId)
      .eq("environment", env);
  }
}


async function handleTransaction(data: any, env: PaddleEnv, status: string) {
  const subscriptionId = data?.subscriptionId as string | undefined;
  const userId = await resolveUserId(data, env, subscriptionId);
  if (!userId) {
    console.warn("Transaction without an attributable user", { transactionId: data?.id });
    return;
  }

  const item = data?.items?.[0];
  const priceId = item?.price?.importMeta?.externalId ?? null;
  const totals = data?.details?.totals;

  await getSupabase()
    .from("payment_transactions")
    .upsert(
      {
        user_id: userId,
        paddle_transaction_id: data.id,
        paddle_subscription_id: subscriptionId ?? null,
        paddle_customer_id: data?.customerId ?? null,
        price_id: priceId,
        product_id: item?.price?.productId ?? null,
        amount_cents: Number(totals?.total ?? 0),
        currency: data?.currencyCode ?? "USD",
        status,
        description: item?.price?.description ?? "ChartFusionX subscription",
        billed_at: data?.billedAt ?? data?.createdAt ?? new Date().toISOString(),
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_transaction_id" },
    );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.eventType) {
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionActivated:
    case EventName.SubscriptionTrialing:
    case EventName.SubscriptionPaused:
    case EventName.SubscriptionResumed:
    case EventName.SubscriptionPastDue:
      await upsertSubscription(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    case EventName.AdjustmentCreated:
    case EventName.AdjustmentUpdated:
      await handleAdjustment(event.data, env);
      break;
    case EventName.TransactionCompleted:
      await handleTransaction(event.data, env, "completed");
      break;
    case EventName.TransactionPaymentFailed:
      await handleTransaction(event.data, env, "failed");
      break;

    default:
      console.log("Unhandled event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
