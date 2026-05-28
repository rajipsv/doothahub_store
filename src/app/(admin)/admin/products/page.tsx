import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ProductStatus } from "@prisma/client";
import { ImageIcon, Upload } from "lucide-react";
import { db } from "@/lib/db";
import {
  ProductFormDrawer,
  ProductsTable,
  ProductsFilterBar,
} from "@/modules/admin";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { safeFetch } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

type ProductRow = Prisma.ProductGetPayload<{
  include: {
    variants: true;
    category: { select: { name: true; pickupEligible: true } };
    brand: { select: { name: true } };
  };
}>;

type SearchParams = {
  q?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildWhere(p: SearchParams): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { deletedAt: null };
  const q = p.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (p.categoryId && UUID_RE.test(p.categoryId)) {
    where.categoryId = p.categoryId;
  }
  if (p.brandId && UUID_RE.test(p.brandId)) {
    where.brandId = p.brandId;
  }
  if (
    p.status &&
    (Object.values(ProductStatus) as string[]).includes(p.status)
  ) {
    where.status = p.status as ProductStatus;
  }
  return where;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const where = buildWhere(sp);

  const [products, categories, brands] = await Promise.all([
    safeFetch<ProductRow[]>(
      () =>
        db.product.findMany({
          where,
          include: {
            variants: { take: 1, orderBy: { priceCents: "asc" } },
            category: { select: { name: true, pickupEligible: true } },
            brand: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
      [],
      "admin:products",
    ),
    safeFetch(
      () =>
        db.category.findMany({
          where: { deletedAt: null },
          orderBy: { name: "asc" },
        }),
      [],
      "admin:products:categories",
    ),
    safeFetch(
      () =>
        db.brand.findMany({
          where: { deletedAt: null },
          orderBy: { name: "asc" },
        }),
      [],
      "admin:products:brands",
    ),
  ]);

  const rows = products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    category: p.category?.name ?? "\u2014",
    brand: p.brand?.name ?? "\u2014",
    priceCents: p.variants[0]?.priceCents ?? 0,
    inventory: p.variants.reduce((acc, v) => acc + v.inventoryQty, 0),
    pickupEligible: p.pickupEligible,
    categoryPickupEligible: p.category?.pickupEligible ?? false,
  }));

  const hasCategories = categories.length > 0;
  const isFiltered = Boolean(
    sp.q || sp.categoryId || sp.brandId || sp.status,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <div className="flex items-center gap-2">
          {hasCategories ? (
            <>
              <Button asChild variant="outline">
                <Link href="/admin/products/import">
                  <Upload className="mr-1 h-4 w-4" />
                  Import CSV
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/products/update-images">
                  <ImageIcon className="mr-1 h-4 w-4" />
                  Update images
                </Link>
              </Button>
              <ProductFormDrawer
                categories={categories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  pickupEligible: c.pickupEligible,
                }))}
                brands={brands.map((b) => ({ id: b.id, name: b.name }))}
                cloudinary={{
                  cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? null,
                  apiKey: process.env.CLOUDINARY_API_KEY ?? null,
                }}
              />
            </>
          ) : (
            <Button asChild>
              <Link href="/admin/categories">Add your first category</Link>
            </Button>
          )}
        </div>
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

      <ProductsFilterBar
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {rows.length} {rows.length === 1 ? "product" : "products"}
          {isFiltered ? " match your filters" : ""}
        </span>
      </div>

      <div className="rounded-lg border bg-card">
        <ProductsTable data={rows} />
      </div>
    </div>
  );
}
