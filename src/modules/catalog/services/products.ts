import "server-only";
import { ProductStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ProductFiltersInput } from "@/modules/catalog/schemas/product";
import type { ProductCardData, ProductDetail } from "@/modules/catalog/types";

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, url: true, alt: true },
    orderBy: { position: "asc" },
    take: 1,
  },
  variants: {
    select: {
      id: true,
      priceCents: true,
      comparePriceCents: true,
      currency: true,
    },
    where: { deletedAt: null },
    orderBy: { priceCents: "asc" },
  },
} satisfies Prisma.ProductSelect;

export async function listProducts(
  filters: ProductFiltersInput,
): Promise<{ items: ProductCardData[]; total: number }> {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    status: ProductStatus.ACTIVE,
    ...(filters.categorySlug
      ? { category: { slug: filters.categorySlug } }
      : {}),
    ...(filters.brandSlug ? { brand: { slug: filters.brandSlug } } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { shortDescription: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.minCents !== undefined || filters.maxCents !== undefined
      ? {
          variants: {
            some: {
              deletedAt: null,
              priceCents: {
                ...(filters.minCents !== undefined ? { gte: filters.minCents } : {}),
                ...(filters.maxCents !== undefined ? { lte: filters.maxCents } : {}),
              },
            },
          },
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "newest"
      ? { createdAt: "desc" }
      : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      select: cardSelect,
      orderBy,
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    db.product.count({ where }),
  ]);

  let sorted = items as unknown as ProductCardData[];
  if (filters.sort === "price_asc" || filters.sort === "price_desc") {
    sorted = [...sorted].sort((a, b) => {
      const ap = a.variants[0]?.priceCents ?? 0;
      const bp = b.variants[0]?.priceCents ?? 0;
      return filters.sort === "price_asc" ? ap - bp : bp - ap;
    });
  }

  return { items: sorted, total };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  return db.product.findFirst({
    where: { slug, deletedAt: null, status: ProductStatus.ACTIVE },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: { where: { deletedAt: null }, orderBy: { priceCents: "asc" } },
    },
  }) as unknown as Promise<ProductDetail | null>;
}

export async function listFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const items = await db.product.findMany({
    where: { deletedAt: null, status: ProductStatus.ACTIVE },
    select: cardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return items as unknown as ProductCardData[];
}

export async function listAllProductSlugs(): Promise<string[]> {
  const rows = await db.product.findMany({
    where: { deletedAt: null, status: ProductStatus.ACTIVE },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}
