import type {
  Cart,
  CartItem,
  Category,
  ProductImage,
  ProductVariant,
  Product,
} from "@prisma/client";

export type CartLineItem = CartItem & {
  variant: ProductVariant & {
    product: Product & {
      images: ProductImage[];
      category: Pick<Category, "pickupEligible">;
    };
  };
};

export type FullCart = Cart & {
  items: CartLineItem[];
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
};
