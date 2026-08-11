import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — ChartFusionX" },
      {
        name: "description",
        content:
          "How ChartFusionX collects, uses, and protects your trading journal data, account details, and AI analysis inputs.",
      },
      { property: "og:title", content: "Privacy Policy — ChartFusionX" },
      {
        property: "og:description",
        content: "How ChartFusionX handles your trading data, screenshots, and account information.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ChartFusionX" },
      { property: "og:url", content: "https://chartfusionx.lovable.app/privacy" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Privacy Policy — ChartFusionX" },
      {
        name: "twitter:description",
        content: "How ChartFusionX handles your trading data, screenshots, and account information.",
      },
    ],
    links: [{ rel: "canonical", href: "https://chartfusionx.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="10 August 2026"
      intro="ChartFusionX is a SaaS trading journal and AI review platform owned and operated by Antonio Hernandez, a sole trader trading as ChartFusionX. This policy explains what we collect, why we collect it, and the choices you have."
    >
      <LegalSection heading="1. Who we are and our role">
        <p>
          The seller and operator of ChartFusionX is{" "}
          <span className="text-foreground">Antonio Hernandez</span>, a sole trader trading as
          "ChartFusionX" (the "Company", "we", "us"). We are the{" "}
          <span className="text-foreground">data controller</span> for the personal data described
          in this policy: we decide what personal data is collected through ChartFusionX, and the
          purposes and means of processing it. Our subprocessors — including hosting, database, email
          and AI model providers — act as processors on our instructions. Paddle.com acts as our
          Merchant of Record and is an independent controller for payment and tax data it collects
          at checkout. Contact:{" "}
          <span className="text-foreground">privacy@chartfusionx.com</span>.
        </p>
      </LegalSection>

      <LegalSection heading="2. Information we collect">
        <ul className="space-y-1">
          <li>Account data: name, email address, password hash, and billing identifiers.</li>
          <li>
            Trading data you enter: trades, instruments, entries and exits, position sizes, notes,
            tags, goals, and playbooks.
          </li>
          <li>
            Uploads: chart screenshots and images you submit for AI screenshot reading or chart
            critique.
          </li>
          <li>
            Usage data: pages viewed, features used, device and browser type, and approximate
            location derived from IP address.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. How we use your information">
        <ul className="space-y-1">
          <li>To provide the journal, dashboard, analytics, and AI review features.</li>
          <li>To generate AI feedback, coaching, Trader DNA scores, and reports.</li>
          <li>To process subscription payments and send service notifications.</li>
          <li>To improve product reliability, performance, and security.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Legal basis for processing">
        <p>
          Where the UK GDPR, EU GDPR or a similar law applies, we rely on the following legal bases:
        </p>
        <ul className="space-y-1">
          <li>
            <span className="text-foreground">Performance of a contract</span> — to create and
            operate your account, store your trades and uploads, run the features you request, and
            provide support.
          </li>
          <li>
            <span className="text-foreground">Legal obligation</span> — to keep tax, accounting and
            transaction records, and to respond to lawful requests from authorities.
          </li>
          <li>
            <span className="text-foreground">Legitimate interests</span> — to secure the service and
            prevent fraud and abuse, to measure aggregate product usage, and to improve reliability
            and performance, balanced against your rights.
          </li>
          <li>
            <span className="text-foreground">Consent</span> — for optional marketing emails and any
            non-essential cookies or analytics. You can withdraw consent at any time.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. AI processing">
        <p>
          When you request AI review, strategy discovery, screenshot reading, chart critique, voice
          summaries, or coaching, the relevant trade content is sent to third-party AI model
          providers to generate a response. We do not sell your trading data, and we do not use your
          private journal entries to train public models.
        </p>
      </LegalSection>

      <LegalSection heading="6. Sharing and Merchant of Record">
        <p>
          We share data only with the following categories of recipients, under contracts that limit
          their use of your data: service providers and subprocessors (hosting, database, analytics,
          email delivery and AI model providers); professional advisers such as our legal and
          accounting partners; and authorities where legally required. We do not sell your personal
          data.
        </p>
        <p>
          Our order process is conducted by our online reseller{" "}
          <span className="text-foreground">Paddle.com</span>. Paddle.com is the{" "}
          <span className="text-foreground">Merchant of Record</span> for all our orders and handles
          all payment processing, billing, subscription management, invoicing, sales-tax/VAT
          compliance, and customer service inquiries and returns relating to orders. When you check
          out, the name, email, billing address and payment details you enter are collected and
          processed by Paddle as an independent controller under{" "}
          <a
            href="https://www.paddle.com/legal/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-4"
          >
            Paddle's Privacy Notice
          </a>
          . We never receive or store your full card details; we receive only the customer,
          subscription and transaction identifiers we need to activate and manage your plan.
        </p>
      </LegalSection>

      <LegalSection heading="7. International transfers">
        <p>
          Our providers, including Paddle, may process personal data outside your country. Where
          data leaves the UK or EEA we rely on appropriate safeguards such as adequacy decisions or
          Standard Contractual Clauses.
        </p>
      </LegalSection>

      <LegalSection heading="8. Retention and deletion">
        <p>
          We retain your data for as long as your account is active. You can delete individual
          trades and uploads at any time. When you close your account, we delete or anonymize your
          personal data within 30 days, except where we must keep records for tax, accounting, or
          legal purposes.
        </p>
      </LegalSection>

      <LegalSection heading="9. Security">
        <p>
          Data is encrypted in transit. Access to production data is restricted to authorized
          personnel. No online service can guarantee absolute security, so please use a strong,
          unique password.
        </p>
      </LegalSection>

      <LegalSection heading="10. Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export, or delete
          your personal data, to restrict or object to certain processing, to withdraw consent, and
          to complain to your local data protection supervisory authority. Contact us to exercise
          these rights and we will respond within one month.
        </p>
      </LegalSection>

      <LegalSection heading="11. Children">
        <p>ChartFusionX is not intended for anyone under 18 years of age.</p>
      </LegalSection>

      <LegalSection heading="12. Changes and contact">
        <p>
          ChartFusionX is owned and operated by{" "}
          <span className="text-foreground">Antonio Hernandez</span> (trading as ChartFusionX), the
          data controller. We will post any material changes to this policy on this page and update
          the date above. Questions? Email{" "}
          <span className="text-foreground">privacy@chartfusionx.com</span>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
