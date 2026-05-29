import type { NextRequest } from "next/server";
import { getCachedCategories } from "@/modules/catalog";
import { mobileJson, mobileOptions, withMobileCors } from "@/lib/mobile-api";

export const runtime = "nodejs";
export const revalidate = 60;

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function GET(req: NextRequest) {
  const categories = await getCachedCategories();
  return withMobileCors(
    req,
    mobileJson({
      ok: true,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        pickupEligible: c.pickupEligible,
      })),
    }),
  );
}
