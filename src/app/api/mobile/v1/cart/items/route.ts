import type { NextRequest } from "next/server";
import { addItemSchema } from "@doothahub/shared";
import {
  addItemToCart,
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

  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return withMobileCors(req, mobileError("Invalid input", 400));
  }

  try {
    await addItemToCart({
      access,
      variantId: parsed.data.variantId,
      quantity: parsed.data.quantity,
    });
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
      mobileError(err instanceof Error ? err.message : "Could not add item", 400),
    );
  }
}
