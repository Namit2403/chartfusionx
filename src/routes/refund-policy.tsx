import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { LegalPage, LegalSection } from "@/components/legal-page";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useSubscription, type PaymentTransaction } from "@/hooks/useSubscription";

const REFUND_WINDOW_DAYS = 30;

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy — ChartFusionX" },
      {
        name: "description",
        content:
          "ChartFusionX offers a 30-day refund on your first payment only. Check your eligibility and see how refund requests are processed.",
      },
      { property: "og:title", content: "Refund Policy — ChartFusionX" },
      {
        property: "og:description",
        content:
          "30-day refund on your first payment only — check your eligibility and how to request one.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ChartFusionX" },
      { property: "og:url", content: "https://chartfusionx.lovable.app/refund-policy" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Refund Policy — ChartFusionX" },
      {
        name: "twitter:description",
        content: "30-day refund on your first payment only at ChartFusionX.",
      },
    ],
    links: [{ rel: "canonical", href: "https://chartfusionx.lovable.app/refund-policy" }],
  }),
  component: RefundPage,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

type Eligibility = {
  eligible: boolean;
  message: string;
  firstPaymentId: string | null;
};

function evaluate(transactions: PaymentTransaction[]): Eligibility {
  const paid = transactions
    .filter((t) => t.status === "completed" && t.amount_cents > 0)
    .sort((a, b) => a.billed_at.localeCompare(b.billed_at));

  const first = paid[0];
  if (!first) {
    return {
      eligible: false,
      firstPaymentId: null,
      message:
        "No payments on file yet. Your 30-day window starts the day your first charge is taken, after the free trial ends.",
    };
  }

  if (first.refunded_cents > 0) {
    return {
      eligible: false,
      firstPaymentId: first.id,
      message: "Your first payment has already been refunded, so no further refund is available.",
    };
  }

  const deadline = new Date(
    new Date(first.billed_at).getTime() + REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const msLeft = deadline.getTime() - Date.now();

  if (msLeft <= 0) {
    return {
      eligible: false,
      firstPaymentId: first.id,
      message: `Your ${REFUND_WINDOW_DAYS}-day window closed on ${formatDate(deadline.toISOString())}, 30 days after your first payment on ${formatDate(first.billed_at)}.`,
    };
  }

  const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  return {
    eligible: true,
    firstPaymentId: first.id,
    message: `You're eligible. ${daysLeft} day${daysLeft === 1 ? "" : "s"} left to request a refund of your first payment (window closes ${formatDate(deadline.toISOString())}).`,
  };
}

function EligibilityPanel() {
  const { transactions, loading, userId } = useSubscription();
  const { user, loading: authLoading } = useAuthUser();

  if (!authLoading && !user) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Sign in to check whether your account is within the {REFUND_WINDOW_DAYS}-day refund window.
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Checking your payment history…
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Sign in to check whether your account is within the {REFUND_WINDOW_DAYS}-day
        refund window.
      </div>
    );
  }

  const eligibility = evaluate(transactions);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        {eligibility.eligible ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-positive" />
        ) : (
          <XCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            {eligibility.eligible ? "Refund available" : "Not eligible for a refund"}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {eligibility.message}
          </p>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Charge</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 text-right font-medium">Refundable</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isFirst = tx.id === eligibility.firstPaymentId;
                const refundable = isFirst && eligibility.eligible;
                return (
                  <tr key={tx.id} className="border-t border-border/60">
                    <td className="num py-2 text-muted-foreground">{formatDate(tx.billed_at)}</td>
                    <td className="py-2">{tx.description ?? "Subscription"}</td>
                    <td className="num py-2">{money(tx.amount_cents, tx.currency)}</td>
                    <td className="py-2 text-right">
                      <span className={refundable ? "text-positive" : "text-muted-foreground"}>
                        {tx.status !== "completed"
                          ? "No — not paid"
                          : refundable
                            ? "Yes"
                            : isFirst
                              ? "Window closed"
                              : "Case by case"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <a
        href="mailto:billing@chartfusionx.com?subject=Refund%20request"
        className={`mt-5 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          eligibility.eligible
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "pointer-events-none border border-border text-muted-foreground opacity-60"
        }`}
        aria-disabled={!eligibility.eligible}
      >
        Request refund
      </a>
    </div>
  );
}

function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updated="10 August 2026"
      intro="ChartFusionX, operated by Antonio Hernandez, offers a 30-day money-back guarantee on your first payment, and reviews renewal charges case by case."
    >
      <LegalSection heading="Your eligibility">
        <EligibilityPanel />
      </LegalSection>

      <LegalSection heading="1. The 30-day money-back guarantee">
        <p>
          If you are not satisfied with ChartFusionX, you can request a full refund within 30 days of
          your <span className="text-foreground">first</span> payment — no justification required.
          Your 7-day free trial is not a charge, so the window starts on the first payment taken
          after the trial ends.
        </p>
      </LegalSection>

      <LegalSection heading="2. Renewals and other charges">
        <p>
          Renewal charges, plan upgrades, prorated amounts and add-ons fall outside the 30-day
          guarantee, but they are not automatically excluded: we and Paddle review these requests
          case by case, and duplicate charges, accidental renewals and billing errors are refunded.
          Refunds are not available for accounts terminated for breach of our Terms of Service.
        </p>
      </LegalSection>

      <LegalSection heading="3. How to request a refund">
        <p>
          Our order process is conducted by our online reseller Paddle.com, which is the Merchant of
          Record for all our orders. You can request a refund directly from Paddle at{" "}
          <a
            href="https://paddle.net"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-4"
          >
            paddle.net
          </a>{" "}
          using your order email, or email{" "}
          <span className="text-foreground">billing@chartfusionx.com</span> from the address on your
          account with the subject "Refund request". No justification is required within the 30-day
          window.
        </p>
      </LegalSection>


      <LegalSection heading="4. Processing">
        <p>
          Approved refunds are issued to the original payment method within 5–10 business days,
          depending on your bank or card issuer. Access to paid features ends when the refund is
          issued.
        </p>
      </LegalSection>

      <LegalSection heading="5. Cancelling instead of refunding">
        <p>
          You can cancel your subscription at any time from Plans & billing. Cancellation takes
          effect immediately: future charges stop and paid features are locked right away, while
          your trades and journal stay saved. Cancelling on its own does not trigger a refund of an
          already-paid period outside the 30-day first-payment window.
        </p>
      </LegalSection>

      <LegalSection heading="6. Statutory rights and contact">
        <p>
          Nothing in this policy limits refund rights you may have under the consumer law of your
          country. If a duplicate or clearly erroneous charge occurs, contact us and we will correct
          it regardless of the 30-day window. Questions? Email{" "}
          <span className="text-foreground">billing@chartfusionx.com</span>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
