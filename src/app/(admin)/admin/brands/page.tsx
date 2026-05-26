import type { Metadata } from "next";
import { db } from "@/lib/db";
import { safeFetch } from "@/lib/utils";
import {
  TaxonomyManager,
  createBrandAction,
  deleteBrandAction,
} from "@/modules/admin";

export const metadata: Metadata = { title: "Brands" };
export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const rows = await safeFetch(
    async () => {
      const list = await db.brand.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        include: {
          _count: { select: { products: { where: { deletedAt: null } } } },
        },
      });
      return list.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        productCount: b._count.products,
      }));
    },
    [],
    "admin:brands",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Brands are optional on a product.
        </p>
      </div>
      <TaxonomyManager
        label="brand"
        rows={rows}
        createAction={createBrandAction}
        deleteAction={deleteBrandAction}
      />
    </div>
  );
}
