import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductFormDrawer, ProductsTable } from "@/modules/admin";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories, brands] = await Promise.all([
    db.product.findMany({
      where: { deletedAt: null },
      include: {
        variants: { take: 1, orderBy: { priceCents: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.category.findMany({ where: { deletedAt: null } }),
    db.brand.findMany({ where: { deletedAt: null } }),
  ]);

  const rows = products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    priceCents: p.variants[0]?.priceCents ?? 0,
    inventory: p.variants.reduce((acc, v) => acc + v.inventoryQty, 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <ProductFormDrawer
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          brands={brands.map((b) => ({ id: b.id, name: b.name }))}
          cloudinary={{
            cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? null,
            apiKey: process.env.CLOUDINARY_API_KEY ?? null,
          }}
        />
      </div>
      <div className="rounded-lg border bg-card">
        <ProductsTable data={rows} />
      </div>
    </div>
  );
}
