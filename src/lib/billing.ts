export type Payment = {
  id: string;
  date: string; // ISO date
  amount: number;
  currency: string;
  description: string;
  refunded?: boolean;
};

export const REFUND_WINDOW_DAYS = 7;

/** Mock billing history — most recent first is NOT assumed; sorted on read. */
export const payments: Payment[] = [
  {
    id: "inv_1001",
    date: "2026-08-06",
    amount: 29,
    currency: "USD",
    description: "ChartFusionX Pro — monthly (first payment)",
  },
  {
    id: "inv_1002",
    date: "2026-09-06",
    amount: 29,
    currency: "USD",
    description: "ChartFusionX Pro — monthly renewal",
  },
];

export type RefundEligibility = {
  eligible: boolean;
  reason:
    | "eligible"
    | "no-payments"
    | "window-expired"
    | "already-refunded"
    | "not-first-payment";
  firstPayment?: Payment;
  daysSinceFirstPayment?: number;
  daysRemaining?: number;
  deadline?: string; // ISO date
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The 7-day refund applies to the FIRST payment only. Any later charge
 * (renewal, upgrade, add-on) is never refundable under this policy.
 */
export function getRefundEligibility(
  history: Payment[] = payments,
  now: Date = new Date(),
): RefundEligibility {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const firstPayment = sorted[0];

  if (!firstPayment) return { eligible: false, reason: "no-payments" };

  const paidAt = new Date(`${firstPayment.date}T00:00:00Z`).getTime();
  const deadlineMs = paidAt + REFUND_WINDOW_DAYS * DAY_MS;
  const daysSinceFirstPayment = Math.floor((now.getTime() - paidAt) / DAY_MS);
  const daysRemaining = Math.max(0, Math.ceil((deadlineMs - now.getTime()) / DAY_MS));
  const deadline = new Date(deadlineMs).toISOString().slice(0, 10);

  if (firstPayment.refunded) {
    return {
      eligible: false,
      reason: "already-refunded",
      firstPayment,
      daysSinceFirstPayment,
      daysRemaining,
      deadline,
    };
  }

  if (now.getTime() > deadlineMs) {
    return {
      eligible: false,
      reason: "window-expired",
      firstPayment,
      daysSinceFirstPayment,
      daysRemaining: 0,
      deadline,
    };
  }

  return {
    eligible: true,
    reason: "eligible",
    firstPayment,
    daysSinceFirstPayment,
    daysRemaining,
    deadline,
  };
}

export function isRefundable(paymentId: string, history: Payment[] = payments, now = new Date()) {
  const eligibility = getRefundEligibility(history, now);
  if (eligibility.firstPayment?.id !== paymentId) return false;
  return eligibility.eligible;
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
