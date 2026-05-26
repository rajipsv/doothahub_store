import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ProductFormDrawer, ProductsTable } from "@/modules/admin";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { safeFetch } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

type ProductWithVariant = Prisma.ProductGetPayload<{
  include: { variants: true };
}>;

export default async function AdminProductsPage() {
  const [products, categories, brands] = await Promise.all([
    safeFetch<ProductWithVariant[]>(
      () =>
        db.product.findMany({
          where: { deletedAt: null },
          include: { variants: { take: 1, orderBy: { priceCents: "asc" } } },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
      [],
      "admin:products",
    ),
    safeFetch(
      () => db.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
      [],
      "admin:products:categories",
    ),
    safeFetch(
      () => db.brand.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
      [],
      "admin:products:brands",
    ),
  ]);

  const rows = products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    priceCents: p.variants[0]?.priceCents ?? 0,
    inventory: p.variants.reduce((acc, v) => acc + v.inventoryQty, 0),
  }));

  const hasCategories = categories.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        {hasCategories ? (
          <ProductFormDrawer
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            brands={brands.map((b) => ({ id: b.id, name: b.name }))}
            cloudinary={{
              cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? null,
              apiKey: process.env.CLOUDINARY_API_KEY ?? null,
            }}
          />
        ) : (
          <Button asChild>
            <Link href="/admin/categories">Add your first category</Link>
          </Button>
        )}
      </div>

      {!hasCategories ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-950">
          <p className="font-semibold">No categories yet</p>
          <p className="mt-1 text-muted-foreground">
            Every product needs a category. Add at least one on the{" "}
            <Link href="/admin/categories" className="underline">
              Categories
            </Link>{" "}
            page, then come back here to create a product.
          </p>
        </div>
      ) : null}

      <div className="rounded-lg border bg-card">
        <ProductsTable data={rows} />
      </div>
    </div>
  );
}
