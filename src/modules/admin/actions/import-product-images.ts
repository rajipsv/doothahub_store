"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/modules/auth";
import { db } from "@/lib/db";
import { bustProductCaches } from "@/lib/cache";

export type ImageImportRowResult = {
  row: number;
  status: "updated" | "created" | "skipped" | "error";
  message: string;
  productSlug?: string;
};

export type ImageImportSummary = {
  ok: boolean;
  error?: string;
  total: number;
  updated: number;
  created: number;
  skipped: number;
  errors: number;
  rows: ImageImportRowResult[];
};

type RawRow = {
  slug?: string;
  imageUrl?: string;
  alt?: string;
  position?: string;
};

const REQUIRED_HEADERS = ["slug", "imageUrl"] as const;

function parseImageUrl(v: string): string {
  const url = v.trim();
  if (!url) throw new Error("imageUrl is required");
  if (url.startsWith("/")) return url;
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("imageUrl must be http(s) or a path starting with /");
    }
    return url;
  } catch {
    throw new Error(
      "imageUrl must be a valid absolute URL or a path starting with /",
    );
  }
}

function parsePosition(v: string | undefined): number {
  const cleaned = (v ?? "").trim();
  if (cleaned === "") return 0;
  const n = Number(cleaned);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("position must be a non-negative integer");
  }
  return n;
}

export async function importProductImagesAction(
  formData: FormData,
): Promise<ImageImportSummary> {
  await requireRole("ADMIN");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return emptySummary(false, "Please choose a CSV file.");
  }
  if (file.size > 2 * 1024 * 1024) {
    return emptySummary(false, "File too large. Max 2 MB.");
  }

  const text = await file.text();
  const parsed = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  if (parsed.errors.length > 0) {
    return emptySummary(
      false,
      `CSV parse error: ${parsed.errors[0]!.message} (row ${parsed.errors[0]!.row ?? "?"})`,
    );
  }

  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return emptySummary(
      false,
      `CSV is missing required columns: ${missing.join(", ")}. Download the template.`,
    );
  }

  const rows = parsed.data;
  const summary: ImageImportSummary = {
    ok: true,
    total: rows.length,
    updated: 0,
    created: 0,
    skipped: 0,
    errors: 0,
    rows: [],
  };
  const touchedSlugs = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    const r = rows[i]!;
    try {
      const slug = (r.slug ?? "").trim().toLowerCase();
      const imageUrlRaw = (r.imageUrl ?? "").trim();

      if (!slug && !imageUrlRaw) {
        summary.skipped += 1;
        summary.rows.push({
          row: rowNumber,
          status: "skipped",
          message: "Empty row",
        });
        continue;
      }

      if (!slug) throw new Error("slug is required");
      if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new Error(
          `invalid slug "${slug}" (lowercase letters, numbers, hyphens only)`,
        );
      }
      if (!imageUrlRaw) throw new Error("imageUrl is required");

      const imageUrl = parseImageUrl(imageUrlRaw);
      const position = parsePosition(r.position);
      const alt = (r.alt ?? "").trim() || null;

      const product = await db.product.findFirst({
        where: { slug, deletedAt: null },
        select: { id: true, title: true },
      });
      if (!product) {
        throw new Error(`No product found with slug "${slug}"`);
      }

      const existing = await db.productImage.findFirst({
        where: { productId: product.id, position },
        select: { id: true, alt: true },
      });

      if (existing) {
        await db.productImage.update({
          where: { id: existing.id },
          data: {
            url: imageUrl,
            alt: alt ?? existing.alt,
          },
        });
        summary.updated += 1;
        summary.rows.push({
          row: rowNumber,
          status: "updated",
          message: `Updated image at position ${position}`,
          productSlug: slug,
        });
      } else {
        await db.productImage.create({
          data: {
            productId: product.id,
            url: imageUrl,
            alt: alt ?? product.title,
            position,
          },
        });
        summary.created += 1;
        summary.rows.push({
          row: rowNumber,
          status: "created",
          message: `Added image at position ${position}`,
          productSlug: slug,
        });
      }

      touchedSlugs.add(slug);
    } catch (err) {
      summary.errors += 1;
      summary.rows.push({
        row: rowNumber,
        status: "error",
        message: err instanceof Error ? err.message : String(err),
        productSlug: (r.slug ?? "").trim() || undefined,
      });
    }
  }

  for (const slug of touchedSlugs) {
    bustProductCaches(slug);
  }
  if (touchedSlugs.size > 0) {
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
  }

  return summary;
}

function emptySummary(ok: boolean, error: string): ImageImportSummary {
  return {
    ok,
    error,
    total: 0,
    updated: 0,
    created: 0,
    skipped: 0,
    errors: 0,
    rows: [],
  };
}
