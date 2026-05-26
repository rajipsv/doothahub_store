import type { Metadata } from "next";
import { db } from "@/lib/db";
import { safeFetch } from "@/lib/utils";
import {
  TaxonomyManager,
  createCategoryAction,
  deleteCategoryAction,
} from "@/modules/admin";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const rows = await safeFetch(
    async () => {
      const list = await db.category.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        include: {
          _count: { select: { products: { where: { deletedAt: null } } } },
        },
      });
      return list.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c._count.products,
      }));
    },
    [],
    "admin:categories",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Categories appear in the product form and storefront navigation.
        </p>
      </div>
      <TaxonomyManager
        label="category"
        rows={rows}
        createAction={createCategoryAction}
        deleteAction={deleteCategoryAction}
      />
    </div>
  );
}
