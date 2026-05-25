import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  removeItemAction,
  updateItemAction,
} from "@/modules/cart/actions/cart";
import type { CartLineItem as CartLineItemType } from "@/modules/cart/types";

export function CartLineItem({ item }: { item: CartLineItemType }) {
  const img = item.variant.product.images[0];
  const attrs = item.variant.attributes as Record<string, string>;

  return (
    <div className="flex gap-4 py-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
        {img ? (
          <Image
            src={img.url}
            alt={img.alt ?? item.variant.product.title}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <Link
          href={`/products/${item.variant.product.slug}`}
          className="font-medium hover:underline"
        >
          {item.variant.product.title}
        </Link>
        <div className="text-xs text-muted-foreground">
          {Object.entries(attrs).map(([k, v]) => (
            <span key={k} className="mr-2 capitalize">
              {k}: {v}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-3">
          <form action={updateItemAction} className="flex items-center gap-2">
            <input type="hidden" name="itemId" value={item.id} />
            <label htmlFor={`qty-${item.id}`} className="sr-only">
              Quantity
            </label>
            <input
              id={`qty-${item.id}`}
              type="number"
              name="quantity"
              min={0}
              max={50}
              defaultValue={item.quantity}
              className="h-9 w-20 rounded-md border border-input bg-background px-2 text-sm"
            />
            <Button type="submit" variant="ghost" size="sm">
              Update
            </Button>
          </form>
          <form action={removeItemAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <Button type="submit" variant="ghost" size="sm">
              Remove
            </Button>
          </form>
        </div>
      </div>

      <div className="text-right">
        <p className="font-semibold">
          {formatMoney(item.variant.priceCents * item.quantity, item.variant.currency)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatMoney(item.variant.priceCents, item.variant.currency)} each
        </p>
      </div>
    </div>
  );
}
