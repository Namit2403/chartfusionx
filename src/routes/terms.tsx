import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — ChartFusionX" },
      {
        name: "description",
        content:
          "The terms that govern your use of ChartFusionX, the AI trading journal: accounts, subscriptions, acceptable use, and disclaimers.",
      },
      { property: "og:title", content: "Terms of Service — ChartFusionX" },
      {
        property: "og:description",
        content: "Accounts, subscriptions, acceptable use, and disclaimers for ChartFusionX.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ChartFusionX" },
      { property: "og:url", content: "https://chartfusionx.lovable.app/terms" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Terms of Service — ChartFusionX" },
      {
        name: "twitter:description",
        content: "Accounts, subscriptions, acceptable use, and disclaimers for ChartFusionX.",
      },
    ],
    links: [{ rel: "canonical", href: "https://chartfusionx.lovable.app/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="10 August 2026"
      intro="These terms form an agreement between you and Antonio Hernandez, a sole trader trading as ChartFusionX. By creating an account or using the app, you agree to them."
    >
      <LegalSection heading="1. Who you are contracting with">
        <p>
          ChartFusionX is owned and operated by{" "}
          <span className="text-foreground">Antonio Hernandez</span>, a sole trader trading as
          "ChartFusionX" ("we", "us", "our"). By creating an account, purchasing a subscription, or
          continuing to use the service, you enter into a binding agreement with Antonio Hernandez
          and accept these terms. If you are using ChartFusionX on behalf of an organisation, you
          confirm you have authority to bind it; otherwise you confirm you are at least 18 years
          old. You can reach us at{" "}
          <span className="text-foreground">support@chartfusionx.com</span>.
        </p>
      </LegalSection>

      <LegalSection heading="2. The service">
        <p>
          ChartFusionX is a software tool for logging trades, reviewing performance, and receiving
          AI-generated feedback. It is a journaling and analytics product, not a broker, and it does
          not execute trades on your behalf.
        </p>
      </LegalSection>

      <LegalSection heading="2. Not financial advice">
        <p>
          All AI reviews, coaching, strategy suggestions, scores, and reports are educational
          information only. They are not financial, investment, tax, or legal advice, and no outcome
          is guaranteed. Trading involves substantial risk of loss. You are solely responsible for
          your trading decisions.
        </p>
      </LegalSection>

      <LegalSection heading="3. Your account">
        <ul className="space-y-1">
          <li>You must be at least 18 and provide accurate registration information.</li>
          <li>You are responsible for keeping your credentials secure and for activity on your account.</li>
          <li>One account per person unless we agree otherwise in writing.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Subscriptions, billing and reseller">
        <p>
          Our order process is conducted by our online reseller Paddle.com. Paddle.com is the
          Merchant of Record for all our orders. Paddle provides all customer service inquiries and
          handles returns. Payment, billing, tax, invoicing, cancellation and refund mechanics are
          governed by{" "}
          <a
            href="https://www.paddle.com/legal/checkout-buyer-terms"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-4"
          >
            Paddle's Buyer Terms
          </a>
          .
        </p>
        <p>
          Paid plans are billed in advance on a recurring monthly or annual basis and renew
          automatically until cancelled. You can cancel at any time from your account settings;
          cancellation stops future charges and access continues until the end of the current
          billing period. Refunds are governed by our Refund Policy.
        </p>
      </LegalSection>


      <LegalSection heading="5. Acceptable use">
        <ul className="space-y-1">
          <li>Do not resell, sublicense, or share access to the service.</li>
          <li>Do not scrape, reverse engineer, or attempt to bypass security or usage limits.</li>
          <li>Do not upload unlawful content or content you do not have the right to upload.</li>
          <li>Do not use the service to provide regulated financial advice to third parties.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. Your content">
        <p>
          You keep ownership of the trades, notes, and screenshots you upload. You grant us a limited
          licence to store and process that content solely to operate the service for you, including
          sending it to AI providers when you request an AI feature.
        </p>
      </LegalSection>

      <LegalSection heading="7. Availability">
        <p>
          We aim for high availability but the service is provided "as is" and "as available". We may
          modify, suspend, or discontinue features, and we may perform maintenance that causes
          temporary downtime.
        </p>
      </LegalSection>

      <LegalSection heading="8. Limitation of liability">
        <p>
          To the maximum extent permitted by law, ChartFusionX is not liable for trading losses, lost
          profits, or indirect or consequential damages. Our total liability for any claim is limited
          to the amount you paid us in the 12 months before the claim.
        </p>
      </LegalSection>

      <LegalSection heading="9. Termination">
        <p>
          You may close your account at any time. We may suspend or terminate accounts that breach
          these terms or that we reasonably believe create risk for other users or for us.
        </p>
      </LegalSection>

      <LegalSection heading="10. Changes and contact">
        <p>
          ChartFusionX is operated by Antonio Hernandez. We may update these terms; material changes
          will be posted here with a new date. Questions? Email{" "}
          <span className="text-foreground">support@chartfusionx.com</span>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
