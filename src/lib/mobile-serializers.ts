import "server-only";
import type { FullCart } from "@/modules/cart/types";
import type { ProductCardData } from "@/modules/catalog/types";
import { isPickupEligible } from "@/lib/pickup-eligibility";
import { toCartSplitSummary } from "@/modules/cart/lib/cart-split-summary";
import { splitCartByPickupEligibility } from "@/modules/cart/services/pickup-eligibility";

export function serializeProductCard(product: ProductCardData) {
  const variant = product.variants[0];
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    shortDescription: product.shortDescription,
    imageUrl: product.images[0]?.url ?? null,
    priceCents: variant?.priceCents ?? 0,
    comparePriceCents: variant?.comparePriceCents ?? null,
    currency: variant?.currency ?? "INR",
    variantId: variant?.id ?? null,
    pickupEligible: isPickupEligible({
      productPickupEligible: product.pickupEligible,
      categoryPickupEligible: product.category.pickupEligible,
    }),
    category: product.category.name,
    brand: product.brand?.name ?? null,
  };
}

export function serializeCartItem(
  item: FullCart["items"][number],
) {
  const img = item.variant.product.images[0];
  return {
    id: item.id,
    quantity: item.quantity,
    variantId: item.variant.id,
    productId: item.variant.product.id,
    title: item.variant.product.title,
    slug: item.variant.product.slug,
    imageUrl: img?.url ?? null,
    priceCents: item.variant.priceCents,
    lineTotalCents: item.variant.priceCents * item.quantity,
    pickupEligible: isPickupEligible({
      productPickupEligible: item.variant.product.pickupEligible,
      categoryPickupEligible: item.variant.product.category.pickupEligible,
    }),
    attributes: item.variant.attributes,
  };
}

export function serializeCart(cart: FullCart) {
  const split = splitCartByPickupEligibility(cart);
  return {
    id: cart.id,
    items: cart.items.map(serializeCartItem),
    subtotalCents: cart.subtotalCents,
    shippingCents: cart.shippingCents,
    taxCents: cart.taxCents,
    discountCents: cart.discountCents,
    totalCents: cart.totalCents,
    itemCount: cart.items.reduce((n, i) => n + i.quantity, 0),
    split: toCartSplitSummary(split),
  };
}

export function serializeUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
