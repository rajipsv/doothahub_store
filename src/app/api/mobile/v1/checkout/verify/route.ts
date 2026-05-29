import type { NextRequest } from "next/server";
import { z } from "zod";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { getCartById } from "@/modules/cart";
import { splitCartByPickupEligibility } from "@/modules/cart/services/pickup-eligibility";
import { PaymentMethod } from "@prisma/client";
import { createCheckoutOrders, markOrderPaid } from "@/modules/orders";
import { db } from "@/lib/db";
import { sendOrderConfirmation } from "@/modules/payments/services/notify";
import { logger } from "@/lib/logger";
import { onlineCheckoutFulfillmentSchema } from "@/modules/checkout/schemas/checkout-order";
import {
  getMobileUser,
  mobileError,
  mobileJson,
  mobileOptions,
  withMobileCors,
} from "@/lib/mobile-api";

export const runtime = "nodejs";

const bodySchema = z
  .object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
    cartId: z.string().uuid(),
    email: z.string().email(),
  })
  .merge(onlineCheckoutFulfillmentSchema);

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withMobileCors(req, mobileError("Invalid JSON", 400));
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return withMobileCors(req, mobileError("Invalid payload", 400));
  }

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
    return withMobileCors(req, mobileError("Payment verification failed", 400));
  }

  const user = await getMobileUser(req);

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
      return withMobileCors(req, mobileError("Cart not found", 404));
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
          split.isMixed || fulfillmentType === "PICKUP" ? pickupSlotId : undefined,
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
      if (!racedOrder) {
        logger.error("mobile verify payment order creation failed", { err });
        return withMobileCors(
          req,
          mobileError(
            err instanceof Error ? err.message : "Could not finalise order",
            500,
          ),
        );
      }
      primary = racedOrder;
    }
  }

  if (!primary) {
    return withMobileCors(req, mobileError("Could not finalise order", 500));
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

  return withMobileCors(
    req,
    mobileJson({
      ok: true,
      orderNumbers: ordersInGroup.map((o) => o.orderNumber),
      orderId: primary.id,
    }),
  );
}
