export type CartSplitLineSummary = {
  cartItemId: string;
  title: string;
  quantity: number;
  lineTotalCents: number;
};

export type CartSplitSummary = {
  pickupLines: CartSplitLineSummary[];
  deliveryLines: CartSplitLineSummary[];
  pickupSubtotalCents: number;
  deliverySubtotalCents: number;
  pickupTotalCents: number;
  deliveryTotalCents: number;
  combinedTotalCents: number;
  hasPickupLines: boolean;
  hasDeliveryLines: boolean;
  isMixed: boolean;
  allLinesPickupEligible: boolean;
};

type SplitLine = {
  id: string;
  quantity: number;
  variant: { priceCents: number; product: { title: string } };
};

export function toCartSplitSummary(split: {
  pickupLines: SplitLine[];
  deliveryLines: SplitLine[];
  pickupSubtotalCents: number;
  deliverySubtotalCents: number;
  pickupTotalCents: number;
  deliveryTotalCents: number;
  combinedTotalCents: number;
  hasPickupLines: boolean;
  hasDeliveryLines: boolean;
  isMixed: boolean;
}): CartSplitSummary {
  const mapLine = (it: SplitLine): CartSplitLineSummary => ({
    cartItemId: it.id,
    title: it.variant.product.title,
    quantity: it.quantity,
    lineTotalCents: it.variant.priceCents * it.quantity,
  });

  return {
    pickupLines: split.pickupLines.map(mapLine),
    deliveryLines: split.deliveryLines.map(mapLine),
    pickupSubtotalCents: split.pickupSubtotalCents,
    deliverySubtotalCents: split.deliverySubtotalCents,
    pickupTotalCents: split.pickupTotalCents,
    deliveryTotalCents: split.deliveryTotalCents,
    combinedTotalCents: split.combinedTotalCents,
    hasPickupLines: split.hasPickupLines,
    hasDeliveryLines: split.hasDeliveryLines,
    isMixed: split.isMixed,
    allLinesPickupEligible:
      split.hasPickupLines && !split.hasDeliveryLines,
  };
}
