import "server-only";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type { FullCart } from "@/modules/cart/types";
import type Stripe from "stripe";

export async function ensurePaymentIntent(args: {
  cart: FullCart;
  email: string;
  userId: string | null;
}) {
  const amount = args.cart.totalCents;
  if (amount <= 0) throw new Error("Cart total must be greater than zero");

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: args.cart.currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    receipt_email: args.email,
    metadata: {
      cartId: args.cart.id,
      userId: args.userId ?? "",
    },
  });

  return intent;
}

export async function refundPaymentIntent(paymentIntentId: string, amountCents?: number) {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amountCents,
  });
}

export async function isEventProcessed(stripeEventId: string): Promise<boolean> {
  const found = await db.stripeEvent.findUnique({
    where: { stripeId: stripeEventId },
  });
  return !!found;
}

export async function recordEvent(event: Stripe.Event) {
  await db.stripeEvent.create({
    data: {
      stripeId: event.id,
      type: event.type,
      payload: event as unknown as object,
    },
  });
}
