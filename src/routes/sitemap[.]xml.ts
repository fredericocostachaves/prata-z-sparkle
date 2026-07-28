import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { CATEGORY_SLUGS, type CatalogCategorySlug, slugifySku } from "@/lib/catalog.types";
import { listCategoryProducts } from "@/lib/catalog.functions";

const BASE_URL = "https://prata-z-sparkle.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_PATHS: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/sobre", changefreq: "monthly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/showroom", changefreq: "monthly", priority: "0.6" },
  { path: "/autenticidade", changefreq: "monthly", priority: "0.5" },
  { path: "/entrega", changefreq: "monthly", priority: "0.5" },
  { path: "/contato", changefreq: "monthly", priority: "0.5" },
  { path: "/grupo-vip", changefreq: "monthly", priority: "0.5" },
  { path: "/politica-troca", changefreq: "yearly", priority: "0.3" },
  { path: "/politica-privacidade", changefreq: "yearly", priority: "0.3" },
  { path: "/politica-cookies", changefreq: "yearly", priority: "0.3" },
  { path: "/termos", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_PATHS];

        for (const slug of CATEGORY_SLUGS) {
          entries.push({ path: `/categoria/${slug}`, changefreq: "daily", priority: "0.9" });
        }

        const seen = new Set<string>();
        await Promise.all(
          CATEGORY_SLUGS.map(async (slug: CatalogCategorySlug) => {
            try {
              const res = await listCategoryProducts({ data: { slug } });
              for (const p of res.products) {
                const s = slugifySku(p.sku ?? "") || p.id;
                if (seen.has(s)) continue;
                seen.add(s);
                entries.push({ path: `/produto/${s}`, changefreq: "daily", priority: "0.8" });
              }
            } catch {
              // categoria indisponível: segue com o restante do sitemap
            }
          }),
        );

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
