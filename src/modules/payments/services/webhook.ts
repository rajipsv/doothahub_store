import "server-only";
import type Stripe from "stripe";
import {
  isEventProcessed,
  recordEvent,
} from "@/modules/payments/services/stripe";
import {
  markOrderFailed,
  markOrderPaid,
  markOrderRefunded,
  createOrderFromCart,
} from "@/modules/orders";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendOrderConfirmation } from "@/modules/payments/services/notify";

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  if (await isEventProcessed(event.id)) return;

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await ensureOrderForIntent(pi);
        const order = await markOrderPaid(pi.id);
        if (order) {
          await sendOrderConfirmation(order.id);
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await markOrderFailed(pi.id);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          const fully = charge.amount_refunded >= charge.amount;
          await markOrderRefunded(
            typeof charge.payment_intent === "string"
              ? charge.payment_intent
              : charge.payment_intent.id,
            fully,
          );
        }
        break;
      }
      default:
        logger.debug("unhandled stripe event", { type: event.type });
    }
  } finally {
    await recordEvent(event);
  }
}

async function ensureOrderForIntent(pi: Stripe.PaymentIntent) {
  const existing = await db.order.findUnique({
    where: { stripePaymentIntentId: pi.id },
  });
  if (existing) return existing;

  const cartId = pi.metadata?.cartId;
  const userId = pi.metadata?.userId || null;
  const email = pi.receipt_email ?? "";
  if (!cartId) return null;

  return createOrderFromCart({
    userId,
    email,
    cartId,
    paymentIntentId: pi.id,
  });
}
