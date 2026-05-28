"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { ProductStatus } from "@prisma/client";
import { requireRole } from "@/modules/auth";
import { db } from "@/lib/db";
import { packSizeFromSlug } from "@/modules/catalog";
import { buildVariantSku, slugify } from "@/lib/utils";

function resolveVariantSize(sizeRaw: string, productSlug: string): string {
  const trimmed = sizeRaw.trim();
  if (trimmed && trimmed.toLowerCase() !== "default") return trimmed;
  return packSizeFromSlug(productSlug) ?? "Default";
}

export type ImportRowResult = {
  row: number;
  status: "created" | "variant-added" | "skipped" | "error";
  message: string;
  productSlug?: string;
};

export type ImportSummary = {
  ok: boolean;
  error?: string;
  total: number;
  created: number;
  variantsAdded: number;
  errors: number;
  rows: ImportRowResult[];
};

type RawRow = {
  title?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  brand?: string;
  status?: string;
  price?: string;
  comparePrice?: string;
  inventory?: string;
  sku?: string;
  size?: string;
  imageUrl?: string;
};

const EXPECTED_HEADERS = [
  "title",
  "slug",
  "description",
  "shortDescription",
  "category",
  "brand",
  "status",
  "price",
  "comparePrice",
  "inventory",
  "sku",
  "size",
  "imageUrl",
];

function parseStatus(v?: string): ProductStatus {
  const up = (v ?? "").toUpperCase().trim();
  if (up === "DRAFT" || up === "ACTIVE" || up === "ARCHIVED") {
    return up as ProductStatus;
  }
  return ProductStatus.DRAFT;
}

function parseRupeesToPaise(v: string | undefined, field: string): number {
  const cleaned = (v ?? "").toString().replace(/[\s,]/g, "");
  if (cleaned === "") throw new Error(`${field} is required`);
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return Math.round(n * 100);
}

function parseInt0(v: string | undefined, field: string): number {
  const cleaned = (v ?? "").toString().trim();
  if (cleaned === "") return 0;
  const n = Number(cleaned);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return n;
}

async function allocateUniqueSku(slug: string, size: string): Promise<string> {
  let suffix: number | undefined;
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = buildVariantSku(slug, size, suffix);
    if (!candidate) {
      throw new Error(
        "sku is required: provide a sku column or a valid slug + size",
      );
    }
    const existing = await db.productVariant.findUnique({
      where: { sku: candidate },
    });
    if (!existing) return candidate;
    suffix = suffix === undefined ? 2 : suffix + 1;
  }
  throw new Error(
    `Could not allocate a unique SKU for slug "${slug}" and size "${size}"`,
  );
}

async function resolveBrandIdByName(
  name: string,
): Promise<string> {
  const existing = await db.brand.findFirst({
    where: { deletedAt: null, name: { equals: name, mode: "insensitive" } },
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

export async function importProductsAction(
  formData: FormData,
): Promise<ImportSummary> {
  await requireRole("ADMIN");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      error: "Please choose a CSV file.",
      total: 0,
      created: 0,
      variantsAdded: 0,
      errors: 0,
      rows: [],
    };
  }
  if (file.size > 2 * 1024 * 1024) {
    return {
      ok: false,
      error: "File too large. Max 2 MB (about 5000 rows).",
      total: 0,
      created: 0,
      variantsAdded: 0,
      errors: 0,
      rows: [],
    };
  }

  const text = await file.text();
  const parsed = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  if (parsed.errors.length > 0) {
    return {
      ok: false,
      error: `CSV parse error: ${parsed.errors[0]!.message} (row ${parsed.errors[0]!.row ?? "?"})`,
      total: 0,
      created: 0,
      variantsAdded: 0,
      errors: 0,
      rows: [],
    };
  }

  const headers = parsed.meta.fields ?? [];
  const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      ok: false,
      error: `CSV is missing required columns: ${missing.join(", ")}. Download the template and start from that.`,
      total: 0,
      created: 0,
      variantsAdded: 0,
      errors: 0,
      rows: [],
    };
  }

  const rows = parsed.data;
  const categoryByName = new Map<string, string>();
  const allCats = await db.category.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });
  for (const c of allCats) categoryByName.set(c.name.toLowerCase(), c.id);

  const summary: ImportSummary = {
    ok: true,
    total: rows.length,
    created: 0,
    variantsAdded: 0,
    errors: 0,
    rows: [],
  };
  const touchedSlugs = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    const r = rows[i]!;
    try {
      const title = (r.title ?? "").trim();
      if (!title) throw new Error("title is required");

      const slug = ((r.slug ?? "").trim() || slugify(title));
      if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new Error(`invalid slug "${slug}" (lowercase letters/numbers/hyphens only)`);
      }

      const categoryRaw = (r.category ?? "").trim();
      if (!categoryRaw) throw new Error("category is required");
      const categoryId = categoryByName.get(categoryRaw.toLowerCase());
      if (!categoryId) {
        throw new Error(
          `category "${categoryRaw}" not found. Create it under Categories first.`,
        );
      }

      const brandRaw = (r.brand ?? "").trim();
      const brandId = brandRaw ? await resolveBrandIdByName(brandRaw) : null;

      const priceCents = parseRupeesToPaise(r.price, "price");
      const compareRaw = (r.comparePrice ?? "").trim();
      const comparePriceCents = compareRaw
        ? parseRupeesToPaise(compareRaw, "comparePrice")
        : null;
      const inventoryQty = parseInt0(r.inventory, "inventory");
      const size = resolveVariantSize(r.size ?? "", slug);
      let sku = (r.sku ?? "").trim();
      if (!sku) sku = await allocateUniqueSku(slug, size);

      const existing = await db.product.findUnique({ where: { slug } });

      if (existing) {
        if (existing.deletedAt) {
          throw new Error(
            `slug "${slug}" belongs to a deleted product; restore it from the DB or pick a different slug`,
          );
        }
        const dupSku = await db.productVariant.findUnique({ where: { sku } });
        if (dupSku) {
          summary.rows.push({
            row: rowNumber,
            status: "skipped",
            message: `SKU "${sku}" already exists; row skipped`,
            productSlug: slug,
          });
          continue;
        }
        await db.productVariant.create({
          data: {
            productId: existing.id,
            sku,
            priceCents,
            comparePriceCents,
            currency: "INR",
            inventoryQty,
            attributes: { size },
          },
        });
        summary.variantsAdded += 1;
        touchedSlugs.add(slug);
        summary.rows.push({
          row: rowNumber,
          status: "variant-added",
          message: `Added variant ${sku} (${size}) to existing product`,
          productSlug: slug,
        });
        continue;
      }

      const dupSku = await db.productVariant.findUnique({ where: { sku } });
      if (dupSku) {
        throw new Error(`SKU "${sku}" already exists on another product`);
      }

      const description = (r.description ?? "").trim();
      if (description.length < 10) {
        throw new Error("description must be at least 10 characters");
      }
      const imageUrl = (r.imageUrl ?? "").trim();

      await db.product.create({
        data: {
          title,
          slug,
          description,
          shortDescription: (r.shortDescription ?? "").trim() || null,
          status: parseStatus(r.status),
          categoryId,
          brandId,
          images: imageUrl
            ? { create: [{ url: imageUrl, position: 0 }] }
            : undefined,
          variants: {
            create: [
              {
                sku,
                priceCents,
                comparePriceCents,
                currency: "INR",
                inventoryQty,
                attributes: { size },
              },
            ],
          },
        },
      });
      summary.created += 1;
      touchedSlugs.add(slug);
      summary.rows.push({
        row: rowNumber,
        status: "created",
        message: `Created with variant ${sku} (${size})`,
        productSlug: slug,
      });
    } catch (err) {
      summary.errors += 1;
      summary.rows.push({
        row: rowNumber,
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (touchedSlugs.size > 0) {
    revalidatePath("/admin/products");
    revalidatePath("/products");
  }

  return summary;
}
