import { createFileRoute } from "@tanstack/react-router";

import { ComingSoonPage } from "@/components/coming-soon";
import { getComingSoonFeature } from "@/lib/beta";

export const Route = createFileRoute("/_authenticated/ai-review")({
  head: () => ({
    meta: [
      { title: "AI Trade Review (Coming Soon) — ChartFusionX" },
      {
        name: "description",
        content:
          "AI-powered trade analysis is currently in development. Join the ChartFusionX waitlist to be notified when AI Trade Review goes live.",
      },
      { property: "og:title", content: "AI Trade Review (Coming Soon) — ChartFusionX" },
      {
        property: "og:description",
        content: "In development. The ChartFusionX journal and analytics are free to use today.",
      },
    ],
  }),
  component: () => <ComingSoonPage feature={getComingSoonFeature("ai-review")} />,
});
