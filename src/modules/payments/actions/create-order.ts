"use server";

import { headers } from "next/headers";
import { getOptionalUser } from "@/modules/auth";
import { getCurrentCart } from "@/modules/cart";
import { createRazorpayOrder } from "@/modules/payments/services/razorpay";
import { checkoutLimiter } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export type CreateRazorpayOrderResult =
  | {
      ok: true;
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      cartId: string;
      prefill: { email: string; name?: string };
    }
  | { ok: false; error: string };

export async function createRazorpayCheckoutOrderAction(args: {
  email: string;
  name?: string;
}): Promise<CreateRazorpayOrderResult> {
  const publicKeyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET || !publicKeyId) {
    return {
      ok: false,
      error:
        "Payments are not configured on this site yet. Please contact the store administrator.",
    };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") ?? "anon";
  const rl = await checkoutLimiter.limit(`rzp:${ip}`);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Try again shortly." };
  }

  const user = await getOptionalUser();
  const cart = await getCurrentCart();
  if (cart.items.length === 0) {
    return { ok: false, error: "Cart is empty" };
  }

  try {
    const order = await createRazorpayOrder({
      cart,
      email: args.email,
      userId: user?.id ?? null,
    });
    return {
      ok: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKeyId,
      cartId: cart.id,
      prefill: { email: args.email, name: args.name ?? user?.name ?? undefined },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Payment init failed",
    };
  }
}
