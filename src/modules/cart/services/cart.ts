import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Cart, CartItem } from "@prisma/client";
import type { FullCart, CartLineItem } from "@/modules/cart/types";

const CART_COOKIE = "cartSession";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

async function getSessionKey(): Promise<string> {
  const store = await cookies();
  let key = store.get(CART_COOKIE)?.value;
  if (!key) {
    key = crypto.randomUUID();
    store.set(CART_COOKIE, key, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  }
  return key;
}

async function findOrCreateCart(userId: string | null): Promise<Cart> {
  if (userId) {
    const existing = await db.cart.findFirst({ where: { userId } });
    if (existing) return existing;
    return db.cart.create({ data: { userId } });
  }

  const sessionKey = await getSessionKey();
  const existing = await db.cart.findUnique({ where: { sessionKey } });
  if (existing) return existing;
  return db.cart.create({ data: { sessionKey } });
}

const lineSelect = {
  include: {
    variant: {
      include: {
        product: {
          include: {
            category: { select: { pickupEligible: true } },
            images: { orderBy: { position: "asc" }, take: 1 },
          },
        },
      },
    },
  },
} as const;

function calcTotals(items: CartLineItem[], discountCents = 0) {
  const subtotal = items.reduce(
    (acc, item) => acc + item.variant.priceCents * item.quantity,
    0,
  );
  const shipping = subtotal > 0 ? (subtotal >= 5000 ? 0 : 599) : 0;
  const tax = Math.round(subtotal * 0.0);
  const total = Math.max(0, subtotal + tax + shipping - discountCents);
  return { subtotal, tax, shipping, total };
}

async function loadCart(cart: Cart): Promise<FullCart> {
  const items = (await db.cartItem.findMany({
    where: { cartId: cart.id },
    ...lineSelect,
    orderBy: { createdAt: "asc" },
  })) as unknown as CartLineItem[];

  const { subtotal, tax, shipping, total } = calcTotals(items, 0);

  return {
    ...cart,
    items,
    subtotalCents: subtotal,
    taxCents: tax,
    shippingCents: shipping,
    discountCents: 0,
    totalCents: total,
  };
}

export async function getCart(userId: string | null): Promise<FullCart> {
  const cart = await findOrCreateCart(userId);
  return loadCart(cart);
}

export async function getCartById(cartId: string): Promise<FullCart | null> {
  const cart = await db.cart.findUnique({ where: { id: cartId } });
  if (!cart) return null;
  return loadCart(cart);
}

export async function getCartCount(userId: string | null): Promise<number> {
  if (userId) {
    const result = await db.cartItem.aggregate({
      where: { cart: { userId } },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }
  const store = await cookies();
  const sessionKey = store.get(CART_COOKIE)?.value;
  if (!sessionKey) return 0;
  const result = await db.cartItem.aggregate({
    where: { cart: { sessionKey } },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export async function addItemToCart(args: {
  userId: string | null;
  variantId: string;
  quantity: number;
}): Promise<CartItem> {
  const cart = await findOrCreateCart(args.userId);
  const variant = await db.productVariant.findUnique({
    where: { id: args.variantId },
  });
  if (!variant) throw new Error("Variant not found");

  const existing = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: args.variantId } },
  });

  if (existing) {
    const desired = existing.quantity + args.quantity;
    const capped = Math.min(desired, Math.max(1, variant.inventoryQty));
    return db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: capped },
    });
  }

  return db.cartItem.create({
    data: {
      cartId: cart.id,
      variantId: args.variantId,
      quantity: Math.min(args.quantity, Math.max(1, variant.inventoryQty)),
    },
  });
}

export async function updateItemQuantity(args: {
  userId: string | null;
  itemId: string;
  quantity: number;
}): Promise<void> {
  const item = await db.cartItem.findUnique({
    where: { id: args.itemId },
    include: { cart: true, variant: true },
  });
  if (!item) throw new Error("Cart item not found");

  if (args.userId && item.cart.userId !== args.userId) {
    throw new Error("Forbidden");
  }

  if (args.quantity <= 0) {
    await db.cartItem.delete({ where: { id: item.id } });
    return;
  }

  const capped = Math.min(args.quantity, Math.max(1, item.variant.inventoryQty));
  await db.cartItem.update({
    where: { id: item.id },
    data: { quantity: capped },
  });
}

export async function removeItem(args: { userId: string | null; itemId: string }) {
  const item = await db.cartItem.findUnique({
    where: { id: args.itemId },
    include: { cart: true },
  });
  if (!item) return;
  if (args.userId && item.cart.userId !== args.userId) throw new Error("Forbidden");
  await db.cartItem.delete({ where: { id: item.id } });
}

export async function applyCoupon(args: { userId: string | null; code: string }) {
  const cart = await findOrCreateCart(args.userId);
  const coupon = await db.coupon.findUnique({ where: { code: args.code } });
  if (!coupon || !coupon.active) throw new Error("Invalid coupon code");
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: coupon.code } });
}

export async function mergeAnonymousCartIntoUser(userId: string) {
  const store = await cookies();
  const sessionKey = store.get(CART_COOKIE)?.value;
  if (!sessionKey) return;

  const anon = await db.cart.findUnique({
    where: { sessionKey },
    include: { items: true },
  });
  if (!anon || anon.items.length === 0) return;

  const userCart = await findOrCreateCart(userId);
  if (userCart.id === anon.id) return;

  for (const item of anon.items) {
    await db.cartItem.upsert({
      where: {
        cartId_variantId: { cartId: userCart.id, variantId: item.variantId },
      },
      update: { quantity: { increment: item.quantity } },
      create: {
        cartId: userCart.id,
        variantId: item.variantId,
        quantity: item.quantity,
      },
    });
  }
  await db.cart.delete({ where: { id: anon.id } });
  store.delete(CART_COOKIE);
}

export async function clearCart(userId: string | null) {
  const cart = await findOrCreateCart(userId);
  await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
}

export { CART_COOKIE };
