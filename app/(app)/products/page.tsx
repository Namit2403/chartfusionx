import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <div>
      <PageHeader
        title="Products"
        description="Track SKU-level cost, price, and contribution once your store is connected."
      />
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No products yet. Shopify import will be added in a later milestone.
        </CardContent>
      </Card>
    </div>
  );
}
