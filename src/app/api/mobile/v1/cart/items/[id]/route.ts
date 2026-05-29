import type { NextRequest } from "next/server";
import { updateItemSchema } from "@doothahub/shared";
import {
  getCartForAccess,
  removeItem,
  resolveCartSessionKey,
  updateItemQuantity,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getMobileUser(req);
  const access = getCartAccessFromRequest(req, user?.id ?? null);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withMobileCors(req, mobileError("Invalid JSON", 400));
  }

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return withMobileCors(req, mobileError("Invalid input", 400));
  }

  try {
    await updateItemQuantity({
      access,
      itemId: id,
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
      mobileError(err instanceof Error ? err.message : "Update failed", 400),
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getMobileUser(req);
  const access = getCartAccessFromRequest(req, user?.id ?? null);

  try {
    await removeItem({ access, itemId: id });
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
      mobileError(err instanceof Error ? err.message : "Remove failed", 400),
    );
  }
}
