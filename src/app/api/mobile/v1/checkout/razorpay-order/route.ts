import type { NextRequest } from "next/server";
import { z } from "zod";
import { getCartForAccess } from "@/modules/cart";
import { createRazorpayOrder } from "@/modules/payments/server";
import { checkoutLimiter } from "@/lib/rate-limit";
import { env, isRazorpayConfigured } from "@/lib/env";
import { normalizeIndianPhone } from "@/modules/payments/lib/phone";
import {
  getCartAccessFromRequest,
  getMobileUser,
  mobileError,
  mobileJson,
  mobileOptions,
  withMobileCors,
} from "@/lib/mobile-api";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).optional(),
  phone: z.string().min(10),
});

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function POST(req: NextRequest) {
  const publicKeyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!isRazorpayConfigured || !publicKeyId) {
    return withMobileCors(
      req,
      mobileError("Payments are not configured on this site yet.", 503),
    );
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await checkoutLimiter.limit(`mobile-rzp:${ip}`);
  if (!rl.success) {
    return withMobileCors(req, mobileError("Too many attempts", 429));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withMobileCors(req, mobileError("Invalid JSON", 400));
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return withMobileCors(req, mobileError("Invalid checkout details", 400));
  }

  const contact = normalizeIndianPhone(parsed.data.phone);
  if (!contact) {
    return withMobileCors(
      req,
      mobileError("Enter a valid 10-digit Indian mobile number.", 400),
    );
  }

  const user = await getMobileUser(req);
  const access = getCartAccessFromRequest(req, user?.id ?? null);
  const cart = await getCartForAccess(access);

  if (cart.items.length === 0) {
    return withMobileCors(req, mobileError("Cart is empty", 400));
  }

  try {
    const order = await createRazorpayOrder({
      cart,
      email: parsed.data.email,
      phone: contact,
      userId: user?.id ?? null,
    });
    return withMobileCors(
      req,
      mobileJson({
        ok: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: publicKeyId,
        cartId: cart.id,
        prefill: {
          email: parsed.data.email,
          name: parsed.data.name ?? undefined,
          contact,
        },
      }),
    );
  } catch (err) {
    return withMobileCors(
      req,
      mobileError(err instanceof Error ? err.message : "Payment init failed", 500),
    );
  }
}
