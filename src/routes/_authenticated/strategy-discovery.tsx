import { createFileRoute } from "@tanstack/react-router";

import { ComingSoonPage } from "@/components/coming-soon";
import { getComingSoonFeature } from "@/lib/beta";

export const Route = createFileRoute("/_authenticated/strategy-discovery")({
  head: () => ({
    meta: [
      { title: "AI Strategy Discovery (Coming Soon) — ChartFusionX" },
      {
        name: "description",
        content:
          "AI strategy discovery is currently in development. Join the ChartFusionX waitlist to be notified when it goes live.",
      },
      { property: "og:title", content: "AI Strategy Discovery (Coming Soon) — ChartFusionX" },
      {
        property: "og:description",
        content: "In development. The ChartFusionX journal and analytics are free to use today.",
      },
    ],
  }),
  component: () => <ComingSoonPage feature={getComingSoonFeature("strategy-discovery")} />,
});
