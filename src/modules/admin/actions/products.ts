"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth";
import { db } from "@/lib/db";
import { productCreateSchema } from "@/modules/catalog";
import { bustProductCaches } from "@/lib/cache";
import { slugify } from "@/lib/utils";

/**
 * Resolve a free-text brand name to a brand id.
 *
 * - Empty string  -> undefined (brand is optional on a product).
 * - Existing match (case-insensitive) -> reuse the row.
 * - Otherwise create a new brand, auto-deduplicating the slug if needed.
 */
async function resolveBrandId(input: unknown): Promise<string | undefined> {
  if (typeof input !== "string") return undefined;
  const name = input.trim();
  if (!name) return undefined;

  const existing = await db.brand.findFirst({
    where: {
      deletedAt: null,
      name: { equals: name, mode: "insensitive" },
    },
  });
  if (existing) return existing.id;

  const base = slugify(name) || "brand";
  let slug = base;
  for (let i = 2; i < 50; i++) {
    try {
      const created = await db.brand.create({ data: { name, slug } });
      return created.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/Unique|unique/.test(msg)) throw err;
      slug = `${base}-${i}`;
    }
  }
  throw new Error("Could not allocate a unique slug for the new brand");
}

export async function createProductAction(formData: FormData) {
  await requireRole("ADMIN");

  const brandId = await resolveBrandId(formData.get("brand"));

  const raw = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    shortDescription: formData.get("shortDescription") || undefined,
    categoryId: formData.get("categoryId"),
    brandId,
    status: formData.get("status") ?? "DRAFT",
    pickupEligible: formData.get("pickupEligible") === "on",
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    images: JSON.parse((formData.get("imagesJson") as string) || "[]"),
    variants: JSON.parse((formData.get("variantsJson") as string) || "[]"),
  };

  const parsed = productCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.pickupEligible) {
    const category = await db.category.findFirst({
      where: { id: parsed.data.categoryId, deletedAt: null },
      select: { pickupEligible: true },
    });
    if (!category?.pickupEligible) {
      return {
        ok: false,
        error: "Enable store pickup on the category before marking this product pickup-eligible.",
      };
    }
  }

  const created = await db.product.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      shortDescription: parsed.data.shortDescription,
      categoryId: parsed.data.categoryId,
      brandId: parsed.data.brandId,
      status: parsed.data.status,
      pickupEligible: parsed.data.pickupEligible,
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
      images: { create: parsed.data.images.map((img, idx) => ({ ...img, position: idx })) },
      variants: { create: parsed.data.variants },
    },
  });

  bustProductCaches(created.slug);
  revalidatePath("/admin/products");
  return { ok: true, id: created.id };
}

export async function togglePickupEligibleAction(
  formData: FormData,
): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id");
  const value = formData.get("pickupEligible");
  if (typeof id !== "string") return;

  const enabling = value === "true";
  if (enabling) {
    const existing = await db.product.findUnique({
      where: { id },
      select: { categoryId: true },
    });
    if (!existing) return;
    const category = await db.category.findFirst({
      where: { id: existing.categoryId, deletedAt: null },
      select: { pickupEligible: true },
    });
    if (!category?.pickupEligible) {
      throw new Error(
        "Enable store pickup on the category before turning pickup on for this product.",
      );
    }
  }

  const product = await db.product.update({
    where: { id },
    data: { pickupEligible: enabling },
  });
  bustProductCaches(product.slug);
  revalidatePath("/admin/products");
}

export async function archiveProductAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const product = await db.product.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  bustProductCaches(product.slug);
  revalidatePath("/admin/products");
}

/**
 * Soft-delete a product. Sets deletedAt so the row vanishes from
 * both the admin list and the storefront, but the data is preserved
 * for order history / audit trails. Variants are kept by FK; the
 * Order/OrderItem table retains its own snapshot of price+title.
 */
export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const product = await db.product.update({
    where: { id },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });
  bustProductCaches(product.slug);
  revalidatePath("/admin/products");
}
