import "server-only";

import Papa from "papaparse";
import { db } from "@/lib/db";

export type ProductImageCsvRow = {
  title: string;
  slug: string;
  imageUrl: string;
  alt: string;
  position: string;
};

export async function listProductImageCsvRows(): Promise<ProductImageCsvRow[]> {
  const products = await db.product.findMany({
    where: { deletedAt: null },
    orderBy: [{ title: "asc" }, { slug: "asc" }],
    select: {
      slug: true,
      title: true,
      images: {
        orderBy: { position: "asc" },
        take: 1,
        select: { url: true, alt: true, position: true },
      },
    },
  });

  return products.map((p) => {
    const image = p.images[0];
    return {
      title: p.title,
      slug: p.slug,
      imageUrl: image?.url ?? "",
      alt: image?.alt ?? p.title,
      position: String(image?.position ?? 0),
    };
  });
}

export function serializeProductImagesCsv(rows: ProductImageCsvRow[]): string {
  return Papa.unparse(rows, {
    columns: ["title", "slug", "imageUrl", "alt", "position"],
    header: true,
  });
}
