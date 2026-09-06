import { createFileRoute } from "@tanstack/react-router";

import { ComingSoonPage } from "@/components/coming-soon";
import { getComingSoonFeature } from "@/lib/beta";

export const Route = createFileRoute("/_authenticated/trader-dna")({
  head: () => ({
    meta: [
      { title: "Trader DNA (Coming Soon) — ChartFusionX" },
      {
        name: "description",
        content:
          "Your behavioural trading profile is currently in development. Join the ChartFusionX waitlist to be notified when Trader DNA goes live.",
      },
      { property: "og:title", content: "Trader DNA (Coming Soon) — ChartFusionX" },
      {
        property: "og:description",
        content: "In development. The ChartFusionX journal and analytics are free to use today.",
      },
    ],
  }),
  component: () => <ComingSoonPage feature={getComingSoonFeature("trader-dna")} />,
});
