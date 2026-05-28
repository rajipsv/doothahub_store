import type { Metadata } from "next";
import { db } from "@/lib/db";
import { safeFetch } from "@/lib/utils";
import {
  TaxonomyManager,
  createCategoryAction,
  deleteCategoryAction,
  toggleCategoryPickupEligibleAction,
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
        pickupEligible: c.pickupEligible,
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
          Turn store pickup on per category. When category pickup is off, every
          product in that category is delivery-only. When on, enable pickup per
          product on the Products page.
        </p>
      </div>
      <TaxonomyManager
        label="category"
        rows={rows}
        createAction={createCategoryAction}
        deleteAction={deleteCategoryAction}
        pickupToggleAction={toggleCategoryPickupEligibleAction}
      />
    </div>
  );
}
