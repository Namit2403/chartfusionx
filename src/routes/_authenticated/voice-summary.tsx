import { createFileRoute } from "@tanstack/react-router";

import { ComingSoonPage } from "@/components/coming-soon";
import { getComingSoonFeature } from "@/lib/beta";

export const Route = createFileRoute("/_authenticated/voice-summary")({
  head: () => ({
    meta: [
      { title: "Voice Summary (Coming Soon) — ChartFusionX" },
      {
        name: "description",
        content:
          "Spoken end-of-session summaries are currently in development. Join the ChartFusionX waitlist to be notified when Voice Summary goes live.",
      },
      { property: "og:title", content: "Voice Summary (Coming Soon) — ChartFusionX" },
      {
        property: "og:description",
        content: "In development. The ChartFusionX journal and analytics are free to use today.",
      },
    ],
  }),
  component: () => <ComingSoonPage feature={getComingSoonFeature("voice-summary")} />,
});
