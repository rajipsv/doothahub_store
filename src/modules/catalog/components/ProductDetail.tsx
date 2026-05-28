"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/modules/catalog/components/PriceTag";
import { VariantPicker } from "@/modules/catalog/components/VariantPicker";
import { getVariantDisplayLabel } from "@/modules/catalog/lib/variant-display";
import type { ProductDetail as ProductDetailData } from "@/modules/catalog/types";

type Props = {
  product: ProductDetailData;
  onAddToCart: (variantId: string, quantity: number) => Promise<void>;
};

export function ProductDetail({ product, onAddToCart }: Props) {
  const [variantId, setVariantId] = React.useState(
    product.variants[0]?.id ?? "",
  );
  const [qty, setQty] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const selected =
    product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  const packSize = selected
    ? getVariantDisplayLabel({
        attributes: selected.attributes as Record<string, unknown>,
        slug: product.slug,
        weightGrams: selected.weightGrams,
      })
    : null;

  async function handleAdd() {
    if (!selected) return;
    setPending(true);
    try {
      await onAddToCart(selected.id, qty);
    } finally {
      setPending(false);
    }
  }

  const cover = product.images[0];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt ?? product.title}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : null}
        </div>
        {product.images.length > 1 ? (
          <div className="grid grid-cols-4 gap-2">
            {product.images.slice(1).map((img) => (
              <div
                key={img.id}
                className="relative aspect-square overflow-hidden rounded-md bg-muted"
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? product.title}
                  fill
                  sizes="20vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
        <div>
          {product.brand ? (
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              {product.brand.name}
            </p>
          ) : null}
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {product.title}
          </h1>
          {packSize ? (
            <p className="mt-2 text-base font-medium text-foreground">
              Pack size: <span className="text-primary">{packSize}</span>
            </p>
          ) : null}
        </div>

        {selected ? (
          <PriceTag
            cents={selected.priceCents}
            compareCents={selected.comparePriceCents}
            currency={selected.currency}
          />
        ) : null}

        <p className="text-muted-foreground">{product.shortDescription}</p>

        <VariantPicker
          variants={product.variants}
          value={variantId}
          onChange={setVariantId}
        />

        <div className="flex items-center gap-3">
          <label htmlFor="qty" className="text-sm font-medium">
            Quantity
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            max={Math.max(1, selected?.inventoryQty ?? 1)}
            value={qty}
            onChange={(e) =>
              setQty(Math.max(1, Number(e.target.value) || 1))
            }
            className="h-10 w-20 rounded-md border border-input bg-background px-3 text-sm"
          />
          <Button onClick={handleAdd} disabled={pending || !selected} size="lg">
            {pending ? "Adding..." : "Add to cart"}
          </Button>
        </div>

        <div className="prose prose-sm max-w-none">
          <h2 className="text-lg font-semibold">Description</h2>
          <p>{product.description}</p>
        </div>
      </div>
    </div>
  );
}
