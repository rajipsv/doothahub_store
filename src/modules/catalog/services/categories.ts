import "server-only";
import { db } from "@/lib/db";
import type { Category } from "@prisma/client";
import type { CategoryNode } from "@/modules/catalog/types";

export async function listCategories(): Promise<CategoryNode[]> {
  const all = await db.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
  const byParent = new Map<string | null, Category[]>();
  for (const cat of all) {
    const key = cat.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(cat);
  }
  const roots = byParent.get(null) ?? [];
  return roots.map((root) => ({
    ...root,
    children: byParent.get(root.id) ?? [],
  }));
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findFirst({ where: { slug, deletedAt: null } });
}

export async function listBrands() {
  return db.brand.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
}
