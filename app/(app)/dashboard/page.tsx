import type { Metadata } from "next";

import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

const PLACEHOLDER_METRICS = [
  { label: "Revenue", value: "—", hint: "Awaiting store connection" },
  { label: "COGS", value: "—", hint: "Product costs not synced" },
  { label: "Ad spend", value: "—", hint: "No ad accounts connected" },
  { label: "True profit", value: "—", hint: "Revenue − costs − ads" },
  { label: "Margin", value: "—", hint: "Profit / revenue" },
  { label: "ROAS", value: "—", hint: "Revenue / ad spend" },
  { label: "CAC", value: "—", hint: "Ad spend / new customers" },
  { label: "AOV", value: "—", hint: "Revenue / orders" },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Profit overview"
        description="A single view of store economics. Integrations will populate these cards — no business logic is wired yet."
        actions={<Badge variant="secondary">Foundation build</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLACEHOLDER_METRICS.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product performance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Product-level contribution margin will appear here after Shopify
            products and costs are imported.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actionable insights</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Recommendations such as unprofitable SKUs or rising CAC will land
            here once data pipelines are connected.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
