import type { NextRequest } from "next/server";
import {
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
export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req);
  const access = getCartAccessFromRequest(req, user?.id ?? null);
  const cart = await getCartForAccess(access);
  const sessionKey = await resolveCartSessionKey(access);
  return attachCartSession(
    req,
    mobileJson({ ok: true, cart: serializeCart(cart) }),
    sessionKey,
  );
}
