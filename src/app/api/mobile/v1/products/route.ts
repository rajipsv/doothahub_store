import type { NextRequest } from "next/server";
import { listProducts, listFeaturedProducts } from "@/modules/catalog/services/products";
import {
  mobileJson,
  mobileOptions,
  withMobileCors,
} from "@/lib/mobile-api";
import { serializeProductCard } from "@/lib/mobile-serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const featured = searchParams.get("featured") === "1";
  const q = searchParams.get("q") ?? undefined;
  const categorySlug = searchParams.get("category") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");

  if (featured) {
    const products = await listFeaturedProducts(12);
    return withMobileCors(
      req,
      mobileJson({
        ok: true,
        products: products.map(serializeProductCard),
      }),
    );
  }

  const result = await listProducts({
    q,
    categorySlug,
    page: Number.isFinite(page) ? page : 1,
    pageSize: 24,
    sort: "newest",
  });

  return withMobileCors(
    req,
    mobileJson({
      ok: true,
      products: result.items.map(serializeProductCard),
      total: result.total,
      page: Number.isFinite(page) ? page : 1,
      pageSize: 24,
    }),
  );
}
