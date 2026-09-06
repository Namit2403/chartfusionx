import { createFileRoute } from "@tanstack/react-router";

import { ComingSoonPage } from "@/components/coming-soon";
import { getComingSoonFeature } from "@/lib/beta";

export const Route = createFileRoute("/_authenticated/screenshot-reader")({
  head: () => ({
    meta: [
      { title: "AI Screenshot Reader (Coming Soon) — ChartFusionX" },
      {
        name: "description",
        content:
          "Reading trade details straight from a chart screenshot is currently in development. Join the ChartFusionX waitlist.",
      },
      { property: "og:title", content: "AI Screenshot Reader (Coming Soon) — ChartFusionX" },
      {
        property: "og:description",
        content: "In development. The ChartFusionX journal and analytics are free to use today.",
      },
    ],
  }),
  component: () => <ComingSoonPage feature={getComingSoonFeature("screenshot-reader")} />,
});
