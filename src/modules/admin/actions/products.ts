"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth";
import { db } from "@/lib/db";
import { productCreateSchema } from "@/modules/catalog";
import { bustProductCaches } from "@/lib/cache";

export async function createProductAction(formData: FormData) {
  await requireRole("ADMIN");

  const raw = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    shortDescription: formData.get("shortDescription") || undefined,
    categoryId: formData.get("categoryId"),
    brandId: formData.get("brandId") || undefined,
    status: formData.get("status") ?? "DRAFT",
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

  const created = await db.product.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description,
      shortDescription: parsed.data.shortDescription,
      categoryId: parsed.data.categoryId,
      brandId: parsed.data.brandId,
      status: parsed.data.status,
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

export async function archiveProductAction(formData: FormData) {
  await requireRole("ADMIN");
  const id = formData.get("id");
  if (typeof id !== "string") return { ok: false };
  const product = await db.product.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  bustProductCaches(product.slug);
  revalidatePath("/admin/products");
  return { ok: true };
}
