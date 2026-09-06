import { createFileRoute } from "@tanstack/react-router";

import { ComingSoonPage } from "@/components/coming-soon";
import { getComingSoonFeature } from "@/lib/beta";

export const Route = createFileRoute("/_authenticated/chart-critique")({
  head: () => ({
    meta: [
      { title: "AI Chart Critique (Coming Soon) — ChartFusionX" },
      {
        name: "description",
        content:
          "AI chart critique is currently in development. Join the ChartFusionX waitlist to be notified when it goes live.",
      },
      { property: "og:title", content: "AI Chart Critique (Coming Soon) — ChartFusionX" },
      {
        property: "og:description",
        content: "In development. The ChartFusionX journal and analytics are free to use today.",
      },
    ],
  }),
  component: () => <ComingSoonPage feature={getComingSoonFeature("chart-critique")} />,
});
