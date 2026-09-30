/**
 * Endorsely affiliate tracking. SERVER-ONLY: the API key never reaches the
 * browser — the public part of the integration is the `endorsely.js` snippet
 * in `__root.tsx`, which sets `window.endorsely_referral` on referred visits.
 *
 * Docs: https://docs.endorsely.com/docs/integration/manual
 * Multiple tracking calls for the same referral id accumulate amounts, so
 * leads (signups) and future purchase events can safely share one endpoint.
 */

const ENDORSELY_REFER_URL = "https://app.endorsely.com/api/public/refer";

/** Public workspace id — also embedded in the client snippet (safe to ship). */
export const ENDORSELY_ORGANIZATION_ID = "6d337b7e-68ff-466a-9844-68525c0155d6";

function getEndorselyApiKey(): string {
  const value = process.env["ENDORSELY_API_KEY"];
  if (!value) throw new Error("ENDORSELY_API_KEY is not configured");
  return value;
}

export type EndorselyReferralInput = {
  referralId: string;
  email: string;
  /** "Signed Up" records a lead; amounts (cents) record purchases. */
  status?: string;
  name?: string;
  amountCents?: number;
};

/**
 * Best-effort referral tracking: returns true when Endorsely accepted the
 * event, false on any failure. Callers must never block signup on this —
 * an outage here should not stop someone from creating an account.
 */
export async function trackEndorselyReferral(
  input: EndorselyReferralInput,
): Promise<boolean> {
  try {
    const response = await fetch(ENDORSELY_REFER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getEndorselyApiKey()}`,
      },
      body: JSON.stringify({
        referralId: input.referralId,
        organizationId: ENDORSELY_ORGANIZATION_ID,
        email: input.email,
        ...(input.status ? { status: input.status } : {}),
        ...(input.name ? { name: input.name } : {}),
        ...(input.amountCents !== undefined ? { amount: input.amountCents } : {}),
      }),
    });
    if (!response.ok) {
      console.error(
        `Endorsely referral tracking failed [${response.status}]: ${await response.text()}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("Endorsely referral tracking error:", error);
    return false;
  }
}

async function resolveStoredReferral(userId: string): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
    const stored = data?.user?.user_metadata?.["endorsely_referral"];
    return typeof stored === "string" && stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export type EndorselyPurchaseInput = {
  /** App user id, when the buyer is a signed-up user — used to resolve the referral. */
  userId?: string | null;
  email: string;
  /** Charge amount already in cents; sent as-is (Endorsely expects cents). */
  amountCents: number | null;
  name?: string;
  customerId?: string | null;
};

/**
 * Purchase/merchant-of-record conversion (docs "backend implementation").
 * No `status` field: a tracking call with an amount records a purchase, and
 * repeated calls for the same referral accumulate totals — which is exactly
 * what recurring subscription renewals need.
 *
 * Best-effort and silent: webhooks must never fail because of tracking.
 * Returns false (without erroring) when there is no referral to attribute.
 */
export async function trackEndorselyPurchase(
  input: EndorselyPurchaseInput,
): Promise<boolean> {
  const referralId = input.userId ? await resolveStoredReferral(input.userId) : null;
  if (!referralId) return false;

  return trackEndorselyReferral({
    referralId,
    email: input.email,
    ...(input.amountCents !== null ? { amountCents: input.amountCents } : {}),
    ...(input.name ? { name: input.name } : {}),
    ...(input.customerId ? { customerId: input.customerId } : {}),
  });
}
