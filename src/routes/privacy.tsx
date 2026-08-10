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
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="10 August 2026"
      intro="ChartFusionX is a SaaS trading journal and AI review platform. This policy explains what we collect, why we collect it, and the choices you have."
    >
      <LegalSection heading="1. Information we collect">
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

      <LegalSection heading="2. How we use your information">
        <ul className="space-y-1">
          <li>To provide the journal, dashboard, analytics, and AI review features.</li>
          <li>To generate AI feedback, coaching, Trader DNA scores, and reports.</li>
          <li>To process subscription payments and send service notifications.</li>
          <li>To improve product reliability, performance, and security.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. AI processing">
        <p>
          When you request AI review, strategy discovery, screenshot reading, chart critique, voice
          summaries, or coaching, the relevant trade content is sent to third-party AI model
          providers to generate a response. We do not sell your trading data, and we do not use your
          private journal entries to train public models.
        </p>
      </LegalSection>

      <LegalSection heading="4. Sharing">
        <p>
          We share data only with service providers who help us operate ChartFusionX — hosting,
          database, payment processing, analytics, email delivery, and AI model providers — under
          contracts that limit their use of your data. We may disclose data when legally required.
          If you join a Team or mentorship workspace, the data you explicitly share is visible to
          the members of that workspace.
        </p>
      </LegalSection>

      <LegalSection heading="5. Retention and deletion">
        <p>
          We retain your data for as long as your account is active. You can delete individual
          trades and uploads at any time. When you close your account, we delete or anonymize your
          personal data within 30 days, except where we must keep records for tax, accounting, or
          legal purposes.
        </p>
      </LegalSection>

      <LegalSection heading="6. Security">
        <p>
          Data is encrypted in transit. Access to production data is restricted to authorized
          personnel. No online service can guarantee absolute security, so please use a strong,
          unique password.
        </p>
      </LegalSection>

      <LegalSection heading="7. Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, export, or delete
          your personal data, and to object to certain processing. Contact us to exercise these
          rights.
        </p>
      </LegalSection>

      <LegalSection heading="8. Children">
        <p>ChartFusionX is not intended for anyone under 18 years of age.</p>
      </LegalSection>

      <LegalSection heading="9. Changes and contact">
        <p>
          We will post any material changes to this policy on this page and update the date above.
          Questions? Email <span className="text-foreground">privacy@chartfusionx.com</span>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
