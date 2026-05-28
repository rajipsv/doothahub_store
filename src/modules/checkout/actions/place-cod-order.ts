"use server";

import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";
import { getOptionalUser } from "@/modules/auth";
import { getCurrentCart } from "@/modules/cart";
import { splitCartByPickupEligibility } from "@/modules/cart/services/pickup-eligibility";
import { createCheckoutOrders } from "@/modules/orders";
import { createCheckoutAddress } from "@/modules/checkout/services/address";
import { placeCodOrderSchema } from "@/modules/checkout/schemas/checkout-order";
import { sendOrderConfirmation } from "@/modules/payments/services/notify";
import { normalizeIndianPhone } from "@/modules/payments/lib/phone";
import { checkoutLimiter } from "@/lib/rate-limit";
import { isCodEnabled } from "@/lib/env";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";

export type PlaceCodOrderResult =
  | { ok: true; orderNumbers: string[] }
  | { ok: false; error: string };

export async function placeCodOrderAction(
  input: unknown,
): Promise<PlaceCodOrderResult> {
  if (!isCodEnabled) {
    return { ok: false, error: "Cash on delivery is not available." };
  }

  const parsed = placeCodOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your order details." };
  }

  const contact = normalizeIndianPhone(parsed.data.phone);
  if (!contact) {
    return {
      ok: false,
      error: "Enter a valid 10-digit Indian mobile number.",
    };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") ?? "anon";
  const rl = await checkoutLimiter.limit(`cod:${ip}`);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Try again shortly." };
  }

  const user = await getOptionalUser();
  const cart = await getCurrentCart();
  if (cart.items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
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
    return { ok: false, error: "Select a pickup time." };
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

    revalidatePath("/cart");
    revalidatePath("/checkout");

    return { ok: true, orderNumbers };
  } catch (err) {
    logger.error("placeCodOrderAction failed", { err });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not place order",
    };
  }
}
