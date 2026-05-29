import type { NextRequest } from "next/server";
import { getProductBySlug } from "@/modules/catalog";
import { isPickupEligible } from "@/lib/pickup-eligibility";
import {
  mobileError,
  mobileJson,
  mobileOptions,
  withMobileCors,
} from "@/lib/mobile-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return withMobileCors(req, mobileError("Product not found", 404));
  }

  return withMobileCors(
    req,
    mobileJson({
      ok: true,
      product: {
        id: product.id,
        slug: product.slug,
        title: product.title,
        description: product.description,
        shortDescription: product.shortDescription,
        pickupEligible: isPickupEligible({
          productPickupEligible: product.pickupEligible,
          categoryPickupEligible: product.category.pickupEligible,
        }),
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        },
        brand: product.brand
          ? { id: product.brand.id, name: product.brand.name, slug: product.brand.slug }
          : null,
        images: product.images.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
        })),
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          priceCents: v.priceCents,
          comparePriceCents: v.comparePriceCents,
          currency: v.currency,
          inventoryQty: v.inventoryQty,
          attributes: v.attributes,
        })),
      },
    }),
  );
}
