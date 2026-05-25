"use server";

import { headers } from "next/headers";
import { getOptionalUser } from "@/modules/auth";
import { getCurrentCart } from "@/modules/cart";
import { ensurePaymentIntent } from "@/modules/payments/services/stripe";
import { checkoutLimiter } from "@/lib/rate-limit";

export async function createPaymentIntentAction(args: { email: string }) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") ?? "anon";
  const rl = await checkoutLimiter.limit(`pi:${ip}`);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Try again shortly." };
  }

  const user = await getOptionalUser();
  const cart = await getCurrentCart();
  if (cart.items.length === 0) {
    return { ok: false, error: "Cart is empty" };
  }
  try {
    const pi = await ensurePaymentIntent({
      cart,
      email: args.email,
      userId: user?.id ?? null,
    });
    return {
      ok: true,
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Payment init failed",
    };
  }
}
