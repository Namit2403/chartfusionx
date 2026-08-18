import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return (
    <div>
      <PageHeader
        title="Insights"
        description="Actionable recommendations generated from store and ad performance."
      />
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Insights engine is not enabled in this foundation release.
        </CardContent>
      </Card>
    </div>
  );
}
