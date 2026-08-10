import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://chartfusionx.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/journal", changefreq: "weekly", priority: "0.8" },
  { path: "/journal/new", changefreq: "monthly", priority: "0.5" },
  { path: "/ai-review", changefreq: "weekly", priority: "0.8" },
  { path: "/trader-dna", changefreq: "monthly", priority: "0.7" },
  { path: "/coach", changefreq: "monthly", priority: "0.7" },
  { path: "/analytics", changefreq: "monthly", priority: "0.6" },
  { path: "/reports", changefreq: "monthly", priority: "0.6" },
  { path: "/strategy-discovery", changefreq: "monthly", priority: "0.6" },
  { path: "/screenshot-reader", changefreq: "monthly", priority: "0.6" },
  { path: "/chart-critique", changefreq: "monthly", priority: "0.6" },
  { path: "/voice-summary", changefreq: "monthly", priority: "0.6" },
  { path: "/playbook", changefreq: "monthly", priority: "0.6" },
  { path: "/gallery", changefreq: "monthly", priority: "0.5" },
  { path: "/goals", changefreq: "monthly", priority: "0.5" },
  { path: "/teams", changefreq: "monthly", priority: "0.5" },
  { path: "/notifications", changefreq: "monthly", priority: "0.4" },
  { path: "/signup", changefreq: "monthly", priority: "0.8" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },

  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
