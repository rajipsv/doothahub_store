import type { NextRequest } from "next/server";
import { applyCouponSchema } from "@doothahub/shared";
import {
  applyCoupon,
  getCartForAccess,
  resolveCartSessionKey,
} from "@/modules/cart";
import {
  attachCartSession,
  getCartAccessFromRequest,
  getMobileUser,
  mobileError,
  mobileJson,
  mobileOptions,
  withMobileCors,
} from "@/lib/mobile-api";
import { serializeCart } from "@/lib/mobile-serializers";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function POST(req: NextRequest) {
  const user = await getMobileUser(req);
  const access = getCartAccessFromRequest(req, user?.id ?? null);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withMobileCors(req, mobileError("Invalid JSON", 400));
  }

  const parsed = applyCouponSchema.safeParse(body);
  if (!parsed.success) {
    return withMobileCors(req, mobileError("Invalid coupon", 400));
  }

  try {
    await applyCoupon({ access, code: parsed.data.code });
    const cart = await getCartForAccess(access);
    const sessionKey = await resolveCartSessionKey(access);
    return attachCartSession(
      req,
      mobileJson({ ok: true, cart: serializeCart(cart) }),
      sessionKey,
    );
  } catch (err) {
    return withMobileCors(
      req,
      mobileError(err instanceof Error ? err.message : "Invalid coupon", 400),
    );
  }
}
