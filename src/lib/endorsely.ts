import { storeEndorselyReferral } from "@/utils/endorsely.functions";

/**
 * Client-side Endorsely referral capture. The `endorsely.js` snippet in
 * `__root.tsx` sets `window.endorsely_referral` when the visitor arrives
 * through a referral link; we mirror it into localStorage so a signup that
 * happens in a later session (or another tab) still attributes correctly.
 * Docs: https://docs.endorsely.com/docs/integration/manual
 */
export function endorselyReferralId(): string | null {
  if (typeof window === "undefined") return null;

  const holder = window as unknown as { endorsely_referral?: unknown };
  const fromWindow =
    typeof holder.endorsely_referral === "string" && holder.endorsely_referral.length > 0
      ? holder.endorsely_referral
      : null;

  if (fromWindow) {
    try {
      localStorage.setItem("endorsely_referral", fromWindow);
    } catch {
      // Private mode etc. — attribution still works for this visit.
    }
    return fromWindow;
  }

  try {
    return localStorage.getItem("endorsely_referral");
  } catch {
    return null;
  }
}

let forwardAttempted = false;

/**
 * Docs step 3, "send to backend immediately": on page load, forward a fresh
 * referral id to the server so it is stored against the signed-in user (or
 * kept in localStorage until they sign up). Runs at most once per page load.
 * The server call requires auth — signed-out visitors are covered by the
 * localStorage copy, which the signup flow picks up later.
 */
export function forwardEndorselyReferral(): void {
  if (forwardAttempted || typeof window === "undefined") return;
  const referralId = endorselyReferralId();
  if (!referralId) return;
  forwardAttempted = true;
  void storeEndorselyReferral({ data: { referralId } }).catch(() => {
    // Signed-out or transient failure — the localStorage copy remains.
  });
}
