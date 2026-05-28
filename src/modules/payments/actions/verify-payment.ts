"use server";

import { z } from "zod";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { getOptionalUser } from "@/modules/auth";
import { getCartById } from "@/modules/cart";
import { splitCartByPickupEligibility } from "@/modules/cart/services/pickup-eligibility";
import { PaymentMethod } from "@prisma/client";
import { createCheckoutOrders, markOrderPaid } from "@/modules/orders";
import { db } from "@/lib/db";
import { sendOrderConfirmation } from "@/modules/payments/services/notify";
import { logger } from "@/lib/logger";
import { onlineCheckoutFulfillmentSchema } from "@/modules/checkout/schemas/checkout-order";

const inputSchema = z
  .object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
    cartId: z.string().uuid(),
    email: z.string().email(),
  })
  .merge(onlineCheckoutFulfillmentSchema);

export type VerifyResult =
  | { ok: true; orderNumbers: string[]; orderId: string }
  | { ok: false; error: string };

export async function verifyAndPlaceOrderAction(
  input: z.input<typeof inputSchema>,
): Promise<VerifyResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid payload" };

  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    cartId,
    email,
    fulfillmentType,
    pickupSlotId,
    forceDelivery,
  } = parsed.data;

  if (
    !verifyCheckoutSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    })
  ) {
    logger.warn("razorpay signature mismatch", { razorpayOrderId });
    return { ok: false, error: "Payment verification failed" };
  }

  const user = await getOptionalUser();

  let primary = await db.order.findUnique({
    where: { razorpayOrderId },
    select: {
      id: true,
      orderNumber: true,
      orderGroupId: true,
      status: true,
    },
  });

  if (!primary) {
    const cart = await getCartById(cartId);
    if (!cart) {
      return { ok: false, error: "Cart not found" };
    }

    const split = splitCartByPickupEligibility(cart);
    const useForceDelivery =
      forceDelivery ??
      (!split.isMixed &&
        split.hasPickupLines &&
        !split.hasDeliveryLines &&
        fulfillmentType === "DELIVERY");

    try {
      const created = await createCheckoutOrders({
        userId: user?.id ?? null,
        email,
        cartId,
        paymentMethod: PaymentMethod.ONLINE,
        pickupSlotId:
          split.isMixed || fulfillmentType === "PICKUP"
            ? pickupSlotId
            : undefined,
        forceDelivery: useForceDelivery,
        razorpayOrderId,
        razorpayPaymentId,
      });
      primary = await db.order.findUnique({
        where: { id: created.primaryOrderId },
        select: {
          id: true,
          orderNumber: true,
          orderGroupId: true,
          status: true,
        },
      });
    } catch (err) {
      const racedOrder = await db.order.findUnique({
        where: { razorpayOrderId },
        select: {
          id: true,
          orderNumber: true,
          orderGroupId: true,
          status: true,
        },
      });
      if (racedOrder) {
        primary = racedOrder;
      } else {
        logger.error("order creation after verified payment failed", { err });
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Could not finalise order",
        };
      }
    }
  }

  if (!primary) {
    return { ok: false, error: "Could not finalise order" };
  }

  const paid = await markOrderPaid({ razorpayOrderId, razorpayPaymentId });

  const ordersInGroup = paid?.orderGroupId
    ? await db.order.findMany({
        where: { orderGroupId: paid.orderGroupId },
        select: { id: true, orderNumber: true },
      })
    : paid
      ? [{ id: paid.id, orderNumber: paid.orderNumber }]
      : [{ id: primary.id, orderNumber: primary.orderNumber }];

  for (const o of ordersInGroup) {
    await sendOrderConfirmation(o.id).catch((err) => {
      logger.warn("order confirmation email failed", { err });
    });
  }

  return {
    ok: true,
    orderNumbers: ordersInGroup.map((o) => o.orderNumber),
    orderId: primary.id,
  };
}
