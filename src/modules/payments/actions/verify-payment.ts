"use server";

import { z } from "zod";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { getOptionalUser } from "@/modules/auth";
import { FulfillmentType, PaymentMethod } from "@prisma/client";
import { findPickupSlotById } from "@/modules/checkout/lib/pickup-slots";
import { createOrderFromCart, markOrderPaid } from "@/modules/orders";
import { db } from "@/lib/db";
import { sendOrderConfirmation } from "@/modules/payments/services/notify";
import { logger } from "@/lib/logger";

const inputSchema = z
  .object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
    cartId: z.string().uuid(),
    email: z.string().email(),
    fulfillmentType: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
    pickupSlotId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentType === "PICKUP") {
      if (!data.pickupSlotId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a pickup time",
          path: ["pickupSlotId"],
        });
        return;
      }
      if (!findPickupSlotById(data.pickupSlotId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pickup time is no longer available",
          path: ["pickupSlotId"],
        });
      }
    }
  });

export type VerifyResult =
  | { ok: true; orderNumber: string; orderId: string }
  | { ok: false; error: string };

/**
 * Verify the Razorpay-returned signature, then idempotently create the local
 * Order and mark it paid. The webhook may race us; the unique constraint on
 * `razorpayOrderId` makes order creation safe, and `markOrderPaid` is itself
 * idempotent.
 */
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
  } = parsed.data;

  const isPickup = fulfillmentType === "PICKUP";
  const pickupSlot = isPickup && pickupSlotId
    ? findPickupSlotById(pickupSlotId)
    : null;
  if (isPickup && !pickupSlot) {
    return { ok: false, error: "Pickup time is no longer available." };
  }

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

  let order = await db.order.findUnique({
    where: { razorpayOrderId },
    select: { id: true, orderNumber: true, status: true },
  });

  if (!order) {
    try {
      const created = await createOrderFromCart({
        userId: user?.id ?? null,
        email,
        cartId,
        paymentMethod: PaymentMethod.ONLINE,
        fulfillmentType: isPickup
          ? FulfillmentType.PICKUP
          : FulfillmentType.DELIVERY,
        pickupSlotAt: pickupSlot ? new Date(pickupSlot.startsAt) : null,
        pickupSlotLabel: pickupSlot?.label ?? null,
        razorpayOrderId,
        razorpayPaymentId,
      });
      order = {
        id: created.id,
        orderNumber: created.orderNumber,
        status: created.status,
      };
    } catch (err) {
      const racedOrder = await db.order.findUnique({
        where: { razorpayOrderId },
        select: { id: true, orderNumber: true, status: true },
      });
      if (racedOrder) {
        order = racedOrder;
      } else {
        logger.error("order creation after verified payment failed", { err });
        return { ok: false, error: "Could not finalise order" };
      }
    }
  }

  const paid = await markOrderPaid({ razorpayOrderId, razorpayPaymentId });
  if (paid) {
    await sendOrderConfirmation(paid.id).catch((err) => {
      logger.warn("order confirmation email failed", { err });
    });
  }

  return { ok: true, orderNumber: order.orderNumber, orderId: order.id };
}
