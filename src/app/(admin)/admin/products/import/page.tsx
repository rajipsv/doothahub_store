import type { Metadata } from "next";
import Link from "next/link";
import { Download, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ProductImportForm } from "@/modules/admin";
import { safeFetch } from "@/lib/utils";

export const metadata: Metadata = { title: "Import products" };
export const dynamic = "force-dynamic";

export default async function ImportProductsPage() {
  const categories = await safeFetch(
    () =>
      db.category.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        select: { name: true },
      }),
    [],
    "admin:import:categories",
  );

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/admin/products">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to products
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Bulk import products
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV to create many products at once. Use the template below.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">CSV template</p>
            <p className="text-sm text-muted-foreground">
              Open in Excel or Google Sheets, fill in your rows, save as CSV,
              then upload below.
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="/products-template.csv" download>
              <Download className="mr-1 h-4 w-4" />
              Download template
            </a>
          </Button>
        </div>
      </div>

      <ProductImportForm />

      <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
        <p className="font-semibold">How it works</p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong>One row per variant.</strong> Two rows with the same{" "}
            <code>slug</code> become two variants (e.g. sizes M and L) of the
            same product. The first row provides the title/description/category;
            later rows only need the variant fields ({" "}
            <code>sku</code>, <code>size</code>, <code>price</code>,{" "}
            <code>inventory</code>).
          </li>
          <li>
            <strong>Prices are in rupees</strong> (e.g. <code>999</code> means
            ₹999). Decimals like <code>999.50</code> are allowed.
          </li>
          <li>
            <strong>Category must already exist.</strong> Available categories:{" "}
            {categories.length === 0 ? (
              <Link href="/admin/categories" className="underline">
                add one first
              </Link>
            ) : (
              <em>{categories.map((c) => c.name).join(", ")}</em>
            )}
            .
          </li>
          <li>
            <strong>Brand is optional</strong> and created on the fly if it
            doesn{"\u2019"}t exist.
          </li>
          <li>
            <strong>Slug is optional</strong> {"\u2014"} auto-generated from the
            title. Lowercase letters, numbers and hyphens only.
          </li>
          <li>
            <strong>Status</strong> defaults to <code>DRAFT</code>. Use{" "}
            <code>ACTIVE</code> to publish to the storefront.
          </li>
          <li>
            <strong>Each SKU must be unique.</strong> Rows with a SKU that
            already exists are skipped (not errored).
          </li>
          <li>
            <strong>imageUrl</strong> is a single URL for the product{"\u2019"}s
            first image. Leave blank if you{"\u2019"}ll add images later from the
            product form.
          </li>
        </ul>
      </div>
    </div>
  );
}
