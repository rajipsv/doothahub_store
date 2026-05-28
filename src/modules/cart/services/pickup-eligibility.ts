import "server-only";
import type { CartLineItem, FullCart } from "@/modules/cart/types";

export type CartSplit = {
  pickupLines: CartLineItem[];
  deliveryLines: CartLineItem[];
  pickupSubtotalCents: number;
  deliverySubtotalCents: number;
  pickupShippingCents: number;
  deliveryShippingCents: number;
  pickupTaxCents: number;
  deliveryTaxCents: number;
  pickupTotalCents: number;
  deliveryTotalCents: number;
  combinedTotalCents: number;
  hasPickupLines: boolean;
  hasDeliveryLines: boolean;
  isMixed: boolean;
};

function lineSubtotal(item: CartLineItem): number {
  return item.variant.priceCents * item.quantity;
}

export function calcSubsetTotals(items: CartLineItem[], discountCents = 0) {
  const subtotalCents = items.reduce((acc, it) => acc + lineSubtotal(it), 0);
  const shippingCents =
    subtotalCents > 0 ? (subtotalCents >= 5000 ? 0 : 599) : 0;
  const taxCents = Math.round(subtotalCents * 0);
  const totalCents = Math.max(
    0,
    subtotalCents + taxCents + shippingCents - discountCents,
  );
  return { subtotalCents, shippingCents, taxCents, totalCents, discountCents };
}

export function splitCartByPickupEligibility(cart: FullCart): CartSplit {
  const pickupLines = cart.items.filter((it) => it.variant.product.pickupEligible);
  const deliveryLines = cart.items.filter(
    (it) => !it.variant.product.pickupEligible,
  );

  const pickupTotals = calcSubsetTotals(pickupLines);
  const deliveryTotals = calcSubsetTotals(deliveryLines);

  return {
    pickupLines,
    deliveryLines,
    pickupSubtotalCents: pickupTotals.subtotalCents,
    deliverySubtotalCents: deliveryTotals.subtotalCents,
    pickupShippingCents: pickupTotals.shippingCents,
    deliveryShippingCents: deliveryTotals.shippingCents,
    pickupTaxCents: pickupTotals.taxCents,
    deliveryTaxCents: deliveryTotals.taxCents,
    pickupTotalCents: pickupTotals.totalCents,
    deliveryTotalCents: deliveryTotals.totalCents,
    combinedTotalCents: pickupTotals.totalCents + deliveryTotals.totalCents,
    hasPickupLines: pickupLines.length > 0,
    hasDeliveryLines: deliveryLines.length > 0,
    isMixed: pickupLines.length > 0 && deliveryLines.length > 0,
  };
}

export function assertPickupLinesEligible(lines: CartLineItem[]): void {
  const bad = lines.filter((it) => !it.variant.product.pickupEligible);
  if (bad.length > 0) {
    const names = bad.map((it) => it.variant.product.title).join(", ");
    throw new Error(`These items are not available for pickup: ${names}`);
  }
}
