import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy — ChartFusionX" },
      {
        name: "description",
        content:
          "ChartFusionX offers a 7-day refund on your first payment only. Here's how eligibility, requests, and cancellations work.",
      },
      { property: "og:title", content: "Refund Policy — ChartFusionX" },
      {
        property: "og:description",
        content: "7-day refund on your first payment only — eligibility and how to request one.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updated="10 August 2026"
      intro="We want you to try ChartFusionX with confidence, so your first payment is covered by a 7-day refund window."
    >
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
