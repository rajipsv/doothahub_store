import type { NextRequest } from "next/server";
import { PaymentMethod } from "@prisma/client";
import { getCartForAccess, splitCartByPickupEligibility } from "@/modules/cart";
import { createCheckoutOrders } from "@/modules/orders";
import {
  createCheckoutAddress,
  placeCodOrderSchema,
} from "@/modules/checkout";
import { sendOrderConfirmation } from "@/modules/payments/server";
import { normalizeIndianPhone } from "@/modules/payments/lib/phone";
import { checkoutLimiter } from "@/lib/rate-limit";
import { isCodEnabled } from "@/lib/env";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  getCartAccessFromRequest,
  getMobileUser,
  mobileError,
  mobileJson,
  mobileOptions,
  withMobileCors,
} from "@/lib/mobile-api";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function POST(req: NextRequest) {
  if (!isCodEnabled) {
    return withMobileCors(req, mobileError("Cash on delivery is not available.", 400));
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await checkoutLimiter.limit(`mobile-cod:${ip}`);
  if (!rl.success) {
    return withMobileCors(req, mobileError("Too many attempts", 429));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withMobileCors(req, mobileError("Invalid JSON", 400));
  }

  const parsed = placeCodOrderSchema.safeParse(body);
  if (!parsed.success) {
    return withMobileCors(req, mobileError("Please check your order details.", 400));
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
    return withMobileCors(req, mobileError("Your cart is empty.", 400));
  }

  const split = splitCartByPickupEligibility(cart);
  const forceDelivery =
    !split.isMixed &&
    split.hasPickupLines &&
    !split.hasDeliveryLines &&
    parsed.data.fulfillmentType === "DELIVERY";

  const needsAddress = split.hasDeliveryLines || forceDelivery;
  const needsPickupSlot =
    split.isMixed ||
    (parsed.data.fulfillmentType === "PICKUP" && split.hasPickupLines);

  if (needsPickupSlot && !parsed.data.pickupSlotId) {
    return withMobileCors(req, mobileError("Select a pickup time.", 400));
  }

  try {
    let shippingAddressId: string | undefined;

    if (needsAddress) {
      const address = await createCheckoutAddress({
        userId: user?.id ?? null,
        input: {
          email: parsed.data.email,
          fullName: parsed.data.name,
          line1: parsed.data.line1!,
          line2: parsed.data.line2,
          city: parsed.data.city!,
          region: parsed.data.region!,
          postalCode: parsed.data.postalCode!,
          country: parsed.data.country,
          phone: contact,
        },
      });
      shippingAddressId = address.id;
    }

    const { orderNumbers } = await createCheckoutOrders({
      userId: user?.id ?? null,
      email: parsed.data.email,
      cartId: cart.id,
      paymentMethod: PaymentMethod.COD,
      pickupSlotId: needsPickupSlot ? parsed.data.pickupSlotId : undefined,
      shippingAddressId,
      forceDelivery,
    });

    const placed = await db.order.findMany({
      where: { orderNumber: { in: orderNumbers } },
      select: { id: true },
    });
    for (const order of placed) {
      await sendOrderConfirmation(order.id).catch((err) => {
        logger.warn("COD order confirmation email failed", { err });
      });
    }

    return withMobileCors(req, mobileJson({ ok: true, orderNumbers }));
  } catch (err) {
    logger.error("mobile COD checkout failed", { err });
    return withMobileCors(
      req,
      mobileError(err instanceof Error ? err.message : "Could not place order", 500),
    );
  }
}
