import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Workspace and connection preferences. Forms are presentational only."
      />
      <div className="grid max-w-xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace">Name</Label>
              <Input id="workspace" defaultValue="CommercePilot" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Reporting currency</Label>
              <Input id="currency" defaultValue="USD" disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
