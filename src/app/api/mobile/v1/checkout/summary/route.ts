import type { NextRequest } from "next/server";
import { getCartForAccess } from "@/modules/cart";
import { buildPickupSlots } from "@/modules/checkout/lib/pickup-slots";
import {
  getCartAccessFromRequest,
  getMobileUser,
  mobileError,
  mobileJson,
  mobileOptions,
  withMobileCors,
} from "@/lib/mobile-api";
import { serializeCart } from "@/lib/mobile-serializers";
import {
  env,
  isCodEnabled,
  isPickupEnabled,
  isRazorpayConfigured,
  pickupLocationAddress,
  pickupLocationName,
} from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req);
  const access = getCartAccessFromRequest(req, user?.id ?? null);
  const cart = await getCartForAccess(access);

  if (cart.items.length === 0) {
    return withMobileCors(req, mobileError("Cart is empty", 400));
  }

  const serialized = serializeCart(cart);

  return withMobileCors(
    req,
    mobileJson({
      ok: true,
      cart: serialized,
      config: {
        codEnabled: isCodEnabled,
        pickupEnabled: isPickupEnabled,
        razorpayConfigured: isRazorpayConfigured,
        razorpayKeyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null,
        pickupLocationName,
        pickupLocationAddress,
        appName: env.NEXT_PUBLIC_APP_NAME,
      },
      pickupSlots: isPickupEnabled ? buildPickupSlots() : [],
    }),
  );
}
