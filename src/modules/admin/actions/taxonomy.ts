"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth";
import { db } from "@/lib/db";
import { bustCategoryCaches } from "@/lib/cache";
import { slugify } from "@/lib/utils";

function revalidateStorefrontCategoryPaths() {
  revalidatePath("/");
  revalidatePath("/products");
}

const inputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only")
    .optional(),
});

function readInput(fd: FormData) {
  const rawName = (fd.get("name") ?? "").toString();
  const rawSlug = (fd.get("slug") ?? "").toString().trim();
  return inputSchema.safeParse({
    name: rawName,
    slug: rawSlug.length > 0 ? rawSlug : undefined,
  });
}

export type TaxonomyResult = { ok: true } | { ok: false; error: string };

export async function createCategoryAction(
  fd: FormData,
): Promise<TaxonomyResult> {
  await requireRole("ADMIN");
  const parsed = readInput(fd);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const slug = parsed.data.slug ?? slugify(parsed.data.name);
  try {
    await db.category.create({ data: { name: parsed.data.name, slug } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique") || msg.includes("unique")) {
      return { ok: false, error: `Slug "${slug}" already exists.` };
    }
    return { ok: false, error: msg };
  }
  bustCategoryCaches(slug);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidateStorefrontCategoryPaths();
  return { ok: true };
}

export async function deleteCategoryAction(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = fd.get("id");
  if (typeof id !== "string") return;
  const existing = await db.category.findUnique({
    where: { id },
    select: { slug: true },
  });
  const inUse = await db.product.count({
    where: { categoryId: id, deletedAt: null },
  });
  if (inUse > 0) {
    throw new Error(
      `Cannot delete: ${inUse} active product(s) still use this category.`,
    );
  }
  await db.category.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  if (existing?.slug) bustCategoryCaches(existing.slug);
  else bustCategoryCaches();
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidateStorefrontCategoryPaths();
}

export async function createBrandAction(
  fd: FormData,
): Promise<TaxonomyResult> {
  await requireRole("ADMIN");
  const parsed = readInput(fd);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const slug = parsed.data.slug ?? slugify(parsed.data.name);
  try {
    await db.brand.create({ data: { name: parsed.data.name, slug } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique") || msg.includes("unique")) {
      return { ok: false, error: `Brand "${parsed.data.name}" or slug "${slug}" already exists.` };
    }
    return { ok: false, error: msg };
  }
  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function deleteBrandAction(fd: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = fd.get("id");
  if (typeof id !== "string") return;
  const inUse = await db.product.count({
    where: { brandId: id, deletedAt: null },
  });
  if (inUse > 0) {
    throw new Error(
      `Cannot delete: ${inUse} active product(s) still use this brand.`,
    );
  }
  await db.brand.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
}
