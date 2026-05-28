import "server-only";
import {
  FulfillmentType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCart, getCartById } from "@/modules/cart";

function makeOrderNumber(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "";
  }
  return out;
}

export async function createOrderFromCart(args: {
  userId: string | null;
  email: string;
  cartId?: string;
  paymentMethod: PaymentMethod;
  fulfillmentType?: FulfillmentType;
  pickupSlotAt?: Date | null;
  pickupSlotLabel?: string | null;
  shippingAddressId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}) {
  const cart = args.cartId
    ? await getCartById(args.cartId)
    : await getCart(args.userId);
  if (!cart) throw new Error("Cart not found");
  if (cart.items.length === 0) throw new Error("Cart is empty");

  const fulfillmentType =
    args.fulfillmentType ?? FulfillmentType.DELIVERY;

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: makeOrderNumber(),
        userId: args.userId ?? null,
        email: args.email,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.AWAITING,
        paymentMethod: args.paymentMethod,
        fulfillmentType,
        pickupSlotAt: args.pickupSlotAt ?? null,
        pickupSlotLabel: args.pickupSlotLabel ?? null,
        currency: cart.currency,
        subtotalCents: cart.subtotalCents,
        taxCents: cart.taxCents,
        shippingCents: cart.shippingCents,
        discountCents: cart.discountCents,
        totalCents: cart.totalCents,
        razorpayOrderId: args.razorpayOrderId ?? null,
        razorpayPaymentId: args.razorpayPaymentId ?? null,
        shippingAddressId: args.shippingAddressId ?? null,
        couponCode: cart.couponCode,
        items: {
          create: cart.items.map((it) => ({
            variantId: it.variantId,
            productTitle: it.variant.product.title,
            variantSku: it.variant.sku,
            quantity: it.quantity,
            unitPriceCents: it.variant.priceCents,
            totalPriceCents: it.variant.priceCents * it.quantity,
          })),
        },
      },
      include: { items: true, shippingAddress: true },
    });

    for (const it of cart.items) {
      await tx.productVariant.update({
        where: { id: it.variantId },
        data: { inventoryQty: { decrement: it.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({
      where: { id: cart.id },
      data: { couponCode: null },
    });

    return created;
  });

  return order;
}

/**
 * Mark an order as paid. Idempotent: safe to call from both the
 * client-side post-checkout action and the webhook handler.
 */
export async function markOrderPaid(args: {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
}) {
  const order = await db.order.findUnique({
    where: { razorpayOrderId: args.razorpayOrderId },
  });
  if (!order) return null;
  if (
    order.status === OrderStatus.PAID &&
    order.paymentStatus === PaymentStatus.SUCCEEDED
  ) {
    return order;
  }
  return db.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.SUCCEEDED,
      paymentMethod: PaymentMethod.ONLINE,
      razorpayPaymentId: args.razorpayPaymentId ?? order.razorpayPaymentId,
    },
  });
}

/** Admin confirms cash collected for a COD order. */
export async function markCodPaymentReceived(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (order.paymentMethod !== PaymentMethod.COD) {
    throw new Error("Not a cash-on-delivery order");
  }
  if (order.paymentStatus === PaymentStatus.SUCCEEDED) {
    return order;
  }
  return db.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.SUCCEEDED,
    },
  });
}

export async function markOrderFailed(razorpayOrderId: string) {
  const order = await db.order.findUnique({
    where: { razorpayOrderId },
  });
  if (!order) return null;
  return db.order.update({
    where: { id: order.id },
    data: { paymentStatus: PaymentStatus.FAILED },
  });
}

export async function markOrderRefunded(razorpayPaymentId: string, fully = true) {
  const order = await db.order.findUnique({
    where: { razorpayPaymentId },
  });
  if (!order) return null;
  return db.order.update({
    where: { id: order.id },
    data: {
      status: fully ? OrderStatus.REFUNDED : order.status,
      paymentStatus: fully
        ? PaymentStatus.REFUNDED
        : PaymentStatus.PARTIALLY_REFUNDED,
    },
  });
}

export async function getOrder(id: string, userId?: string) {
  const where: Prisma.OrderWhereInput = { id };
  if (userId) where.userId = userId;
  return db.order.findFirst({
    where,
    include: { items: true, shippingAddress: true },
  });
}

export async function getOrderByRazorpayOrderId(razorpayOrderId: string) {
  return db.order.findUnique({
    where: { razorpayOrderId },
    include: { items: true, shippingAddress: true },
  });
}

export async function listUserOrders(userId: string) {
  return db.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllOrders(limit = 100) {
  return db.order.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { email: true, name: true } } },
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return db.order.update({ where: { id }, data: { status } });
}
