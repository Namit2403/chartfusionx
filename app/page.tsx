import Link from "next/link";

import { Brand } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { METRIC_CATALOG } from "@/lib/metrics";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Brand />
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Open app</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <Badge variant="secondary" className="mb-4">
          Shopify profit intelligence
        </Badge>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          See the profit your store actually makes.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          CommercePilot connects store and advertising data into one dashboard:
          revenue, costs, ad spend, true profit, margins, ROAS, CAC, AOV, and
          product performance.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/dashboard">View dashboard</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/signup">Create account</Link>
          </Button>
        </div>

        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRIC_CATALOG.map((metric) => (
            <Card key={metric.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
