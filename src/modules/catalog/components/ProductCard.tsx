import Image from "next/image";
import Link from "next/link";
import { PriceTag } from "@/modules/catalog/components/PriceTag";
import { getVariantDisplayLabel } from "@/modules/catalog/lib/variant-display";
import type { ProductCardData } from "@/modules/catalog/types";

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const variant = product.variants[0];
  const packSize = variant
    ? getVariantDisplayLabel({
        attributes: variant.attributes as Record<string, unknown>,
        slug: product.slug,
        weightGrams: variant.weightGrams,
      })
    : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group surface-glass block overflow-hidden rounded-xl transition-all hover:border-primary/40 hover:shadow-[0_0_28px_hsl(187_92%_48%_/0.12)]"
    >
      <div className="relative aspect-square overflow-hidden bg-muted/80">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-4">
        {product.brand ? (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {product.brand.name}
          </p>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-medium">{product.title}</h3>
        {packSize ? (
          <p className="text-xs font-medium text-primary">{packSize}</p>
        ) : null}
        {variant ? (
          <PriceTag
            cents={variant.priceCents}
            compareCents={variant.comparePriceCents}
            currency={variant.currency}
          />
        ) : null}
      </div>
    </Link>
  );
}
