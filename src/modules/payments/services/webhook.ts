import "server-only";
import {
  isEventProcessed,
  recordEvent,
} from "@/modules/payments/services/razorpay";
import {
  markOrderFailed,
  markOrderPaid,
  markOrderRefunded,
  createOrderFromCart,
} from "@/modules/orders";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendOrderConfirmation } from "@/modules/payments/services/notify";

/**
 * Razorpay webhook event shape (the bits we use). The full spec lives at
 * https://razorpay.com/docs/webhooks/payloads/
 */
type RazorpayPaymentEntity = {
  id: string;
  order_id: string | null;
  status: string;
  amount: number;
  amount_refunded: number;
  email?: string;
  notes?: Record<string, string>;
};

type RazorpayRefundEntity = {
  id: string;
  payment_id: string;
  amount: number;
  status: string;
};

export type RazorpayWebhookEvent = {
  event: string;
  account_id?: string;
  payload: {
    payment?: { entity: RazorpayPaymentEntity };
    refund?: { entity: RazorpayRefundEntity };
  };
};

export async function handleRazorpayEvent(args: {
  event: RazorpayWebhookEvent;
  eventId: string;
}): Promise<void> {
  if (await isEventProcessed(args.eventId)) return;

  try {
    switch (args.event.event) {
      case "payment.captured":
      case "payment.authorized": {
        const payment = args.event.payload.payment?.entity;
        if (!payment) break;
        await ensureOrderForPayment(payment);
        const order = await markOrderPaid({
          razorpayOrderId: payment.order_id ?? "",
          razorpayPaymentId: payment.id,
        });
        if (order) {
          await sendOrderConfirmation(order.id);
        }
        break;
      }
      case "payment.failed": {
        const payment = args.event.payload.payment?.entity;
        if (!payment?.order_id) break;
        await markOrderFailed(payment.order_id);
        break;
      }
      case "refund.processed":
      case "refund.created": {
        const refund = args.event.payload.refund?.entity;
        if (!refund) break;
        const payment = await fetchPaymentRefundContext(refund.payment_id);
        if (!payment) break;
        const fully = (payment.amount_refunded ?? 0) >= payment.amount;
        await markOrderRefunded(refund.payment_id, fully);
        break;
      }
      default:
        logger.debug("unhandled razorpay event", { type: args.event.event });
    }
  } finally {
    await recordEvent({
      externalId: args.eventId,
      type: args.event.event,
      payload: args.event,
    });
  }
}

async function ensureOrderForPayment(payment: RazorpayPaymentEntity) {
  if (!payment.order_id) return null;

  const existing = await db.order.findUnique({
    where: { razorpayOrderId: payment.order_id },
  });
  if (existing) return existing;

  const cartId = payment.notes?.cartId;
  const userId = payment.notes?.userId || null;
  const email = payment.notes?.email ?? payment.email ?? "";
  if (!cartId) return null;

  return createOrderFromCart({
    userId,
    email,
    cartId,
    razorpayOrderId: payment.order_id,
    razorpayPaymentId: payment.id,
  });
}

async function fetchPaymentRefundContext(paymentId: string) {
  // Lazy import to avoid cycles + to allow tree-shaking from edge bundles.
  const { getRazorpay } = await import("@/lib/razorpay");
  try {
    const p = await getRazorpay().payments.fetch(paymentId);
    return {
      amount: typeof p.amount === "string" ? Number(p.amount) : p.amount,
      amount_refunded:
        typeof p.amount_refunded === "string"
          ? Number(p.amount_refunded)
          : p.amount_refunded,
    };
  } catch (err) {
    logger.warn("failed to fetch payment for refund", { paymentId, err });
    return null;
  }
}
