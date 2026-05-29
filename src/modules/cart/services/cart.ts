import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Cart, CartItem } from "@prisma/client";
import type { FullCart, CartLineItem } from "@/modules/cart/types";
import type { CartAccess } from "@/modules/cart/lib/cart-access";
import { webCartAccess } from "@/modules/cart/lib/cart-access";

const CART_COOKIE = "cartSession";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

async function getCookieSessionKey(create: boolean): Promise<string | undefined> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) return existing;
  if (!create) return undefined;
  const key = crypto.randomUUID();
  store.set(CART_COOKIE, key, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return key;
}

async function resolveGuestSessionKey(
  access: CartAccess,
  create: boolean,
): Promise<string | undefined> {
  if (access.userId) return undefined;
  if (access.sessionKey) return access.sessionKey;
  if (access.useCookie) return getCookieSessionKey(create);
  if (create) return crypto.randomUUID();
  return undefined;
}

/** Session key used for the cart (for mobile response headers). */
export async function resolveCartSessionKey(
  access: CartAccess,
): Promise<string | null> {
  if (access.userId) return null;
  const key = await resolveGuestSessionKey(access, true);
  return key ?? null;
}

async function findOrCreateCart(access: CartAccess): Promise<Cart> {
  if (access.userId) {
    const existing = await db.cart.findFirst({ where: { userId: access.userId } });
    if (existing) return existing;
    return db.cart.create({ data: { userId: access.userId } });
  }

  const sessionKey = await resolveGuestSessionKey(access, true);
  if (!sessionKey) {
    throw new Error("Could not resolve guest cart session");
  }
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

export async function getCartForAccess(access: CartAccess): Promise<FullCart> {
  const cart = await findOrCreateCart(access);
  return loadCart(cart);
}

export async function getCart(userId: string | null): Promise<FullCart> {
  return getCartForAccess(webCartAccess(userId));
}

export async function getCartById(cartId: string): Promise<FullCart | null> {
  const cart = await db.cart.findUnique({ where: { id: cartId } });
  if (!cart) return null;
  return loadCart(cart);
}

export async function getCartCountForAccess(access: CartAccess): Promise<number> {
  if (access.userId) {
    const result = await db.cartItem.aggregate({
      where: { cart: { userId: access.userId } },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }
  const sessionKey = await resolveGuestSessionKey(access, false);
  if (!sessionKey) return 0;
  const result = await db.cartItem.aggregate({
    where: { cart: { sessionKey } },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

export async function getCartCount(userId: string | null): Promise<number> {
  return getCartCountForAccess(webCartAccess(userId));
}

export async function addItemToCart(args: {
  access: CartAccess;
  variantId: string;
  quantity: number;
}): Promise<CartItem> {
  const cart = await findOrCreateCart(args.access);
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

/** @deprecated Use addItemToCart with access */
export async function addItemToCartLegacy(args: {
  userId: string | null;
  variantId: string;
  quantity: number;
}): Promise<CartItem> {
  return addItemToCart({
    access: webCartAccess(args.userId),
    variantId: args.variantId,
    quantity: args.quantity,
  });
}

export async function updateItemQuantity(args: {
  access: CartAccess;
  itemId: string;
  quantity: number;
}): Promise<void> {
  const item = await db.cartItem.findUnique({
    where: { id: args.itemId },
    include: { cart: true, variant: true },
  });
  if (!item) throw new Error("Cart item not found");

  if (args.access.userId && item.cart.userId !== args.access.userId) {
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

export async function removeItem(args: {
  access: CartAccess;
  itemId: string;
}) {
  const item = await db.cartItem.findUnique({
    where: { id: args.itemId },
    include: { cart: true },
  });
  if (!item) return;
  if (args.access.userId && item.cart.userId !== args.access.userId) {
    throw new Error("Forbidden");
  }
  await db.cartItem.delete({ where: { id: item.id } });
}

export async function applyCoupon(args: {
  access: CartAccess;
  code: string;
}) {
  const cart = await findOrCreateCart(args.access);
  const coupon = await db.coupon.findUnique({ where: { code: args.code } });
  if (!coupon || !coupon.active) throw new Error("Invalid coupon code");
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: coupon.code } });
}

export async function mergeAnonymousCartIntoUser(userId: string) {
  const store = await cookies();
  const sessionKey = store.get(CART_COOKIE)?.value;
  if (!sessionKey) return;
  await mergeCartSessionIntoUser(userId, sessionKey);
  store.delete(CART_COOKIE);
}

export async function mergeCartSessionIntoUser(
  userId: string,
  sessionKey: string,
) {
  const anon = await db.cart.findUnique({
    where: { sessionKey },
    include: { items: true },
  });
  if (!anon || anon.items.length === 0) return;

  const userCart = await findOrCreateCart(webCartAccess(userId));
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
}

export async function clearCart(access: CartAccess) {
  const cart = await findOrCreateCart(access);
  await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
}

export { CART_COOKIE };
