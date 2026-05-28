import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImageImportForm } from "@/modules/admin";

export const metadata: Metadata = { title: "Update product images" };

export default function UpdateProductImagesPage() {
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
          Bulk update product images
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set or replace image URLs for products that already exist. Use
          Cloudinary <code className="text-xs">secure_url</code> values or paths
          like <code className="text-xs">/products/slug.webp</code>.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Export / fill / import</p>
            <p className="text-sm text-muted-foreground">
              Download lists every product from your database. Existing image
              URLs are pre-filled; empty <code>imageUrl</code> cells are ready
              for you to paste Cloudinary links. Re-upload when done (rows with
              blank <code>imageUrl</code> are skipped).
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="/api/admin/product-images/export">
              <Download className="mr-1 h-4 w-4" />
              Download products CSV
            </a>
          </Button>
        </div>
      </div>

      <ProductImageImportForm />

      <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
        <p className="font-semibold">How it works</p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong>Download products CSV</strong> exports{" "}
            <code>title</code>, <code>slug</code>, <code>imageUrl</code>,{" "}
            <code>alt</code>, and <code>position</code> for all active products.
          </li>
          <li>
            <strong>slug</strong> must match an existing product (same as the
            product URL path).
          </li>
          <li>
            <strong>imageUrl</strong> is the full image URL (e.g. from
            Cloudinary Media Library) or a site path under{" "}
            <code>/public</code>.
          </li>
          <li>
            If an image already exists at <strong>position</strong> 0, its URL
            is updated; otherwise a new image row is created.
          </li>
          <li>
            To add a second gallery image, use <code>position</code>{" "}
            <code>1</code>, <code>2</code>, etc.
          </li>
          <li>
            Does not create products — use{" "}
            <Link href="/admin/products/import" className="underline">
              Import CSV
            </Link>{" "}
            for new catalog rows.
          </li>
        </ul>
      </div>
    </div>
  );
}
