import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Ads" };

export default function AdsPage() {
  return (
    <div>
      <PageHeader
        title="Advertising"
        description="Connect Meta, Google, and TikTok ad accounts to attribute spend against true profit."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {["Meta Ads", "Google Ads", "TikTok Ads"].map((platform) => (
          <Card key={platform}>
            <CardHeader>
              <CardTitle className="text-base">{platform}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Disconnected. OAuth and spend sync are not implemented yet.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
