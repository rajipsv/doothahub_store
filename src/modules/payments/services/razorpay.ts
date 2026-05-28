import "server-only";
import { getRazorpay } from "@/lib/razorpay";
import { db } from "@/lib/db";
import type { FullCart } from "@/modules/cart/types";

export type CreatedRazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
};

/**
 * Create a Razorpay Order on the server.
 * The returned `id` is opened by Razorpay Checkout JS on the client.
 */
export async function createRazorpayOrder(args: {
  cart: FullCart;
  email: string;
  phone: string;
  userId: string | null;
}): Promise<CreatedRazorpayOrder> {
  const amount = args.cart.totalCents;
  if (amount <= 0) throw new Error("Cart total must be greater than zero");

  const rzp = getRazorpay();
  const order = await rzp.orders.create({
    amount,
    currency: args.cart.currency.toUpperCase(),
    receipt: `cart_${args.cart.id.slice(0, 30)}`,
    notes: {
      cartId: args.cart.id,
      userId: args.userId ?? "",
      email: args.email,
      phone: args.phone,
    },
  });

  return {
    id: order.id,
    amount: typeof order.amount === "string" ? Number(order.amount) : order.amount,
    currency: order.currency,
    receipt: order.receipt ?? undefined,
  };
}

export async function refundRazorpayPayment(args: {
  razorpayPaymentId: string;
  amountMinor?: number;
}) {
  const rzp = getRazorpay();
  return rzp.payments.refund(args.razorpayPaymentId, {
    amount: args.amountMinor,
    speed: "normal",
  });
}

export async function isEventProcessed(externalId: string): Promise<boolean> {
  const found = await db.paymentEvent.findUnique({
    where: { provider_externalId: { provider: "razorpay", externalId } },
  });
  return !!found;
}

export async function recordEvent(args: {
  externalId: string;
  type: string;
  payload: unknown;
}) {
  await db.paymentEvent.create({
    data: {
      provider: "razorpay",
      externalId: args.externalId,
      type: args.type,
      payload: args.payload as object,
    },
  });
}
