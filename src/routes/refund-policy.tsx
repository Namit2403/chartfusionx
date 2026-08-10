import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";

import { LegalPage, LegalSection } from "@/components/legal-page";
import {
  REFUND_WINDOW_DAYS,
  formatDate,
  formatMoney,
  getRefundEligibility,
  payments,
} from "@/lib/billing";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy — ChartFusionX" },
      {
        name: "description",
        content:
          "ChartFusionX offers a 7-day refund on your first payment only. Check your eligibility and see how refund requests are processed.",
      },
      { property: "og:title", content: "Refund Policy — ChartFusionX" },
      {
        property: "og:description",
        content:
          "7-day refund on your first payment only — check your eligibility and how to request one.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ChartFusionX" },
      { property: "og:url", content: "https://chartfusionx.lovable.app/refund-policy" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Refund Policy — ChartFusionX" },
      {
        name: "twitter:description",
        content: "7-day refund on your first payment only at ChartFusionX.",
      },
    ],
    links: [{ rel: "canonical", href: "https://chartfusionx.lovable.app/refund-policy" }],
  }),
  component: RefundPage,
});

function EligibilityPanel() {
  const eligibility = getRefundEligibility(payments);
  const { firstPayment } = eligibility;

  const message = (() => {
    switch (eligibility.reason) {
      case "eligible":
        return `You're eligible. ${eligibility.daysRemaining} day${eligibility.daysRemaining === 1 ? "" : "s"} left to request a refund of your first payment (window closes ${formatDate(eligibility.deadline!)}).`;
      case "window-expired":
        return `Your ${REFUND_WINDOW_DAYS}-day window closed on ${formatDate(eligibility.deadline!)}, ${eligibility.daysSinceFirstPayment} days after your first payment.`;
      case "already-refunded":
        return "Your first payment has already been refunded, so no further refund is available.";
      case "no-payments":
        return "No payments on file yet. Your 7-day window starts the day of your first payment.";
      default:
        return "Only your first payment qualifies for a refund.";
    }
  })();

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
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{message}</p>
        </div>
      </div>

      {payments.length > 0 && (
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
              {[...payments]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((p) => {
                  const isFirst = p.id === firstPayment?.id;
                  const refundable = isFirst && eligibility.eligible;
                  return (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="py-2 num text-muted-foreground">{formatDate(p.date)}</td>
                      <td className="py-2">{p.description}</td>
                      <td className="py-2 num">{formatMoney(p.amount, p.currency)}</td>
                      <td className="py-2 text-right">
                        <span
                          className={
                            refundable ? "text-positive" : "text-muted-foreground"
                          }
                        >
                          {refundable ? "Yes" : isFirst ? "Window closed" : "No — renewal"}
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
      intro="We want you to try ChartFusionX with confidence, so your first payment is covered by a 7-day refund window."
    >
      <LegalSection heading="Your eligibility">
        <EligibilityPanel />
      </LegalSection>

      <LegalSection heading="1. The 7-day first-payment refund">
        <p>
          If you are not satisfied with ChartFusionX, you can request a full refund within 7 days of
          your <span className="text-foreground">first</span> payment. This applies once per
          customer and only to the initial charge on your account, whether monthly or annual.
        </p>
      </LegalSection>

      <LegalSection heading="2. What is not refundable">
        <ul className="space-y-1">
          <li>Renewal charges after your first payment, including monthly and annual renewals.</li>
          <li>Plan upgrades, add-ons, and any subsequent purchases.</li>
          <li>Requests made more than 7 days after the first payment.</li>
          <li>Accounts terminated for breach of our Terms of Service.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. How to request a refund">
        <p>
          Email <span className="text-foreground">billing@chartfusionx.com</span> from the address on
          your account with the subject "Refund request" and your account email. No justification is
          required within the 7-day window.
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
          You can cancel your subscription at any time from your account settings. Cancelling stops
          all future charges and you keep access until the end of the current billing period.
          Cancellation on its own does not trigger a refund of an already-paid period outside the
          7-day first-payment window.
        </p>
      </LegalSection>

      <LegalSection heading="6. Statutory rights and contact">
        <p>
          Nothing in this policy limits refund rights you may have under the consumer law of your
          country. If a duplicate or clearly erroneous charge occurs, contact us and we will correct
          it regardless of the 7-day window. Questions? Email{" "}
          <span className="text-foreground">billing@chartfusionx.com</span>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
