import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

// Generated on-demand (with ISR), not at build time, so `next build` doesn't
// need a live DB. First request renders + caches for `revalidate` seconds.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    }),
    db.category.findMany({
      where: { deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPaths: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), priority: 1 },
    { url: `${base}/products`, lastModified: new Date(), priority: 0.9 },
  ];

  const productPaths: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: p.updatedAt,
    priority: 0.8,
  }));

  const categoryPaths: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/categories/${c.slug}`,
    lastModified: c.updatedAt,
    priority: 0.7,
  }));

  return [...staticPaths, ...categoryPaths, ...productPaths];
}
