import { createFileRoute } from "@tanstack/react-router";
import { unwrapWebhook } from "@whop/sdk/helpers";

import {
  FOUNDER_COMPANY_ID,
  getWhopWebhookSecret,
  isFounderPlanId,
  recordFounderPurchase,
  refundFounderPurchase,
} from "@/lib/whop-founding.server";

/**
 * POST /api/webhooks/whop
 *
 * Production Whop webhook endpoint for founding purchases made on the
 * separate founding presale. Server-to-server only; signature-verified and
 * idempotent. Never import client-side.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

function badRequest(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

type WebhookEnvelope = {
  id?: string;
  type?: string;
  account_id?: string | null;
  company_id?: string | null;
  data?: any;
};

function extractPurchase(envelope: WebhookEnvelope) {
  const data = envelope.data ?? {};
  const rawPlanId = data?.plan?.id ?? data?.membership?.plan_id ?? data?.plan_id ?? null;

  const email = data?.user?.email ?? data?.member?.email ?? data?.email ?? null;

  const paymentId =
    data?.id && (typeof data.id !== "string" || data.id.startsWith("pay_"))
      ? data.id
      : (data?.payment?.id ?? data?.payment_id ?? null);

  return {
    paymentId: typeof paymentId === "string" ? paymentId : null,
    planId: typeof rawPlanId === "string" ? rawPlanId : null,
    email: typeof email === "string" ? email : null,
    paidAt:
      typeof data?.paid_at === "string"
        ? data.paid_at
        : typeof data?.created_at === "string"
          ? data.created_at
          : null,
    membershipId: typeof data?.membership?.id === "string" ? data.membership.id : null,
    productId: typeof data?.product?.id === "string" ? data.product.id : null,
    productTitle: typeof data?.product?.title === "string" ? data.product.title : null,
    whopUserId: typeof data?.user?.id === "string" ? data.user.id : null,
    amountCents: typeof data?.total === "number" ? Math.round(data.total) : null,
    currency: typeof data?.currency === "string" ? data.currency : null,
  };
}

async function handlePaymentSucceeded(envelope: WebhookEnvelope): Promise<string> {
  const purchase = extractPurchase(envelope);
  const eventId = envelope.id ?? "unknown";

  if (!purchase.paymentId) return "ignored: missing payment id";
  if (!isFounderPlanId(purchase.planId)) return "ignored: not a founding plan";
  if (!purchase.email || !purchase.email.includes("@")) return "ignored: missing buyer email";
  if (!purchase.paidAt) return "ignored: missing paid_at";

  await recordFounderPurchase({
    paymentId: purchase.paymentId,
    eventId,
    planId: purchase.planId,
    email: purchase.email,
    paidAt: purchase.paidAt,
    membershipId: purchase.membershipId,
    productId: purchase.productId,
    productTitle: purchase.productTitle,
    whopUserId: purchase.whopUserId,
    amountCents: purchase.amountCents,
    currency: purchase.currency,
  });

  return "recorded";
}

async function handleRefund(envelope: WebhookEnvelope): Promise<string> {
  const purchase = extractPurchase(envelope);
  if (!purchase.paymentId) return "ignored: missing payment id";

  const refundId = typeof envelope.data?.id === "string" ? envelope.data.id : null;
  const changed = await refundFounderPurchase(purchase.paymentId, refundId);
  return changed > 0 ? "refunded" : "ignored: no founding entitlement for payment";
}

async function processEvent(envelope: WebhookEnvelope): Promise<string> {
  switch (envelope.type) {
    case "payment.succeeded":
    case "membership.activated":
      return handlePaymentSucceeded(envelope);
    case "refund.created":
    case "refund.updated":
      return handleRefund(envelope);
    default:
      return "ignored: unhandled event type";
  }
}

async function logEvent(
  eventId: string,
  eventType: string,
  status: "processed" | "ignored",
  detail: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Generated DB types do not include the founding tables until
  // `supabase gen types` runs post-migration; the runtime shape is exact.

  await (supabaseAdmin as any).from("whop_webhook_events").upsert(
    {
      event_id: eventId,
      event_type: eventType,
      status,
      processed_at: new Date().toISOString(),
      detail,
    },
    { onConflict: "event_id" },
  );
}

export const Route = createFileRoute("/api/webhooks/whop")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let rawBody: string;
        try {
          // Raw body FIRST — parsing or re-serializing breaks the signature.
          rawBody = await request.text();
        } catch {
          return badRequest("Could not read request body");
        }

        if (!rawBody) return badRequest("Empty body");

        // ---- Signature verification (never process unverified events) ----
        let secret: string;
        try {
          secret = getWhopWebhookSecret();
        } catch {
          console.error("WHOP_WEBHOOK_SECRET is not configured");
          // 500 so Whop retries once the operator fixes configuration; the
          // request is valid but the server cannot verify anything yet.
          return new Response("Webhook secret not configured", { status: 500 });
        }

        let envelope: WebhookEnvelope;
        try {
          const headers = Object.fromEntries(request.headers);
          envelope = unwrapWebhook(rawBody, { headers, key: secret }) as WebhookEnvelope;
        } catch (err) {
          console.warn("Whop webhook signature verification failed", err);
          return badRequest("Invalid signature", 401);
        }

        // ---- Company guard ----
        const accountId = envelope.account_id ?? envelope.company_id ?? null;
        if (accountId && accountId !== FOUNDER_COMPANY_ID) {
          return badRequest("Unknown company", 403);
        }

        const eventId = envelope.id ?? null;
        const eventType = envelope.type ?? "unknown";
        if (!eventId) return badRequest("Missing event id");

        // ---- Delivery-level idempotency ----
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const events = (supabaseAdmin as any).from("whop_webhook_events");
        const { data: seen } = await events
          .select("event_id")
          .eq("event_id", eventId)
          .maybeSingle();
        if (seen) return Response.json({ received: true, duplicate: true });

        const { error: insertError } = await events.insert({
          event_id: eventId,
          event_type: eventType,
          status: "received",
        });
        if (insertError) {
          // Another concurrent delivery of the same event won the race.
          return Response.json({ received: true, duplicate: true });
        }

        // ---- Process ----
        let outcome = "ignored: unknown";
        let status: "processed" | "ignored" = "ignored";
        try {
          outcome = await processEvent(envelope);
          status = outcome.startsWith("ignored") ? "ignored" : "processed";
        } catch (err) {
          console.error("Whop webhook processing failed", { eventId, eventType, err });
          // Delete the claim so Whop's retry can be processed cleanly.
          await events.delete().eq("event_id", eventId);
          return new Response("Processing error", { status: 500 });
        }

        try {
          await logEvent(eventId, eventType, status, outcome);
        } catch (err) {
          console.error("Failed to log webhook outcome", err);
        }

        return Response.json({ received: true, outcome });
      },
    },
  },
});
