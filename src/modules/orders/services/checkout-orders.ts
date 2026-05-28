import "server-only";
import {
  FulfillmentType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";
import type { Order } from "@prisma/client";
import { db } from "@/lib/db";
import { getCartById } from "@/modules/cart";
import {
  assertPickupLinesEligible,
  calcSubsetTotals,
  splitCartByPickupEligibility,
} from "@/modules/cart/services/pickup-eligibility";
import type { CartLineItem } from "@/modules/cart/types";
import { findPickupSlotById } from "@/modules/checkout/lib/pickup-slots";
import { makeOrderNumber } from "@/modules/orders/services/order-number";

export type CreateCheckoutOrdersInput = {
  userId: string | null;
  email: string;
  cartId: string;
  paymentMethod: PaymentMethod;
  pickupSlotId?: string;
  shippingAddressId?: string | null;
  /** When every line is pickup-eligible but customer chooses home delivery. */
  forceDelivery?: boolean;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
};

export type CreateCheckoutOrdersResult = {
  orders: Order[];
  orderNumbers: string[];
  primaryOrderId: string;
};

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

async function createOrderInTransaction(
  tx: Tx,
  args: {
    userId: string | null;
    email: string;
    currency: string;
    couponCode: string | null;
    items: CartLineItem[];
    paymentMethod: PaymentMethod;
    fulfillmentType: FulfillmentType;
    pickupSlotAt?: Date | null;
    pickupSlotLabel?: string | null;
    shippingAddressId?: string | null;
    orderGroupId?: string | null;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
  },
) {
  const totals = calcSubsetTotals(args.items);

  const created = await tx.order.create({
    data: {
      orderNumber: makeOrderNumber(),
      userId: args.userId ?? null,
      email: args.email,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.AWAITING,
      paymentMethod: args.paymentMethod,
      fulfillmentType: args.fulfillmentType,
      pickupSlotAt: args.pickupSlotAt ?? null,
      pickupSlotLabel: args.pickupSlotLabel ?? null,
      orderGroupId: args.orderGroupId ?? null,
      currency: args.currency,
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      shippingCents: totals.shippingCents,
      discountCents: totals.discountCents,
      totalCents: totals.totalCents,
      razorpayOrderId: args.razorpayOrderId ?? null,
      razorpayPaymentId: args.razorpayPaymentId ?? null,
      shippingAddressId: args.shippingAddressId ?? null,
      couponCode: args.couponCode,
      items: {
        create: args.items.map((it) => ({
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

  for (const it of args.items) {
    await tx.productVariant.update({
      where: { id: it.variantId },
      data: { inventoryQty: { decrement: it.quantity } },
    });
  }

  return created;
}

export async function createCheckoutOrders(
  input: CreateCheckoutOrdersInput,
): Promise<CreateCheckoutOrdersResult> {
  const cart = await getCartById(input.cartId);
  if (!cart) throw new Error("Cart not found");
  if (cart.items.length === 0) throw new Error("Cart is empty");

  const split = splitCartByPickupEligibility(cart);
  const orderGroupId = split.isMixed ? crypto.randomUUID() : null;

  let pickupSlot: ReturnType<typeof findPickupSlotById> = null;
  const needsPickupOrder =
    split.isMixed ||
    (split.hasPickupLines &&
      !split.hasDeliveryLines &&
      !input.forceDelivery);

  if (needsPickupOrder) {
    if (!input.pickupSlotId) throw new Error("Select a pickup time");
    pickupSlot = findPickupSlotById(input.pickupSlotId);
    if (!pickupSlot) throw new Error("Pickup time is no longer available");
    assertPickupLinesEligible(split.pickupLines);
  }

  const needsDeliveryOrder =
    split.hasDeliveryLines ||
    (split.hasPickupLines && !split.hasDeliveryLines && input.forceDelivery);

  if (
    needsDeliveryOrder &&
    input.paymentMethod === PaymentMethod.COD &&
    !input.shippingAddressId
  ) {
    throw new Error("Delivery address is required");
  }

  const orders = await db.$transaction(async (tx) => {
    const created: Order[] = [];
    let razorpayOrderId = input.razorpayOrderId ?? null;
    let razorpayPaymentId = input.razorpayPaymentId ?? null;

    const base = {
      userId: input.userId,
      email: input.email,
      currency: cart.currency,
      couponCode: cart.couponCode,
      paymentMethod: input.paymentMethod,
      orderGroupId,
    };

    if (split.hasDeliveryLines) {
      created.push(
        await createOrderInTransaction(tx, {
          ...base,
          items: split.deliveryLines,
          fulfillmentType: FulfillmentType.DELIVERY,
          shippingAddressId: input.shippingAddressId ?? null,
          razorpayOrderId,
          razorpayPaymentId,
        }),
      );
      razorpayOrderId = null;
      razorpayPaymentId = null;
    }

    if (needsPickupOrder && split.hasPickupLines) {
      created.push(
        await createOrderInTransaction(tx, {
          ...base,
          items: split.pickupLines,
          fulfillmentType: FulfillmentType.PICKUP,
          pickupSlotAt: pickupSlot ? new Date(pickupSlot.startsAt) : null,
          pickupSlotLabel: pickupSlot?.label ?? null,
          shippingAddressId: null,
          razorpayOrderId,
          razorpayPaymentId,
        }),
      );
      razorpayOrderId = null;
      razorpayPaymentId = null;
    } else if (
      split.hasPickupLines &&
      !split.hasDeliveryLines &&
      input.forceDelivery
    ) {
      created.push(
        await createOrderInTransaction(tx, {
          ...base,
          items: split.pickupLines,
          fulfillmentType: FulfillmentType.DELIVERY,
          shippingAddressId: input.shippingAddressId ?? null,
          orderGroupId: null,
          razorpayOrderId,
          razorpayPaymentId,
        }),
      );
    }

    if (created.length === 0) {
      throw new Error("Nothing to order");
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({
      where: { id: cart.id },
      data: { couponCode: null },
    });

    return created;
  });

  const primary =
    orders.find((o) => o.fulfillmentType === FulfillmentType.DELIVERY) ??
    orders[0]!;

  return {
    orders,
    orderNumbers: orders.map((o) => o.orderNumber),
    primaryOrderId: primary.id,
  };
}
