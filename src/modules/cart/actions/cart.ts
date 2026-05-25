"use server";

import { revalidatePath } from "next/cache";
import { getOptionalUser } from "@/modules/auth";
import {
  addItemSchema,
  updateItemSchema,
  removeItemSchema,
  applyCouponSchema,
} from "@/modules/cart/schemas/cart";
import {
  addItemToCart,
  applyCoupon,
  removeItem,
  updateItemQuantity,
} from "@/modules/cart/services/cart";
import { logger } from "@/lib/logger";

function bustCartLayers() {
  revalidatePath("/cart");
  revalidatePath("/(store)", "layout");
}

export async function addItemAction(formData: FormData): Promise<void> {
  const parsed = addItemSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity") ?? 1,
  });
  if (!parsed.success) return;
  const user = await getOptionalUser();
  await addItemToCart({
    userId: user?.id ?? null,
    variantId: parsed.data.variantId,
    quantity: parsed.data.quantity,
  });
  bustCartLayers();
}

export async function updateItemAction(formData: FormData): Promise<void> {
  const parsed = updateItemSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return;
  const user = await getOptionalUser();
  await updateItemQuantity({
    userId: user?.id ?? null,
    itemId: parsed.data.itemId,
    quantity: parsed.data.quantity,
  });
  bustCartLayers();
}

export async function removeItemAction(formData: FormData): Promise<void> {
  const parsed = removeItemSchema.safeParse({
    itemId: formData.get("itemId"),
  });
  if (!parsed.success) return;
  const user = await getOptionalUser();
  await removeItem({ userId: user?.id ?? null, itemId: parsed.data.itemId });
  bustCartLayers();
}

export async function applyCouponAction(formData: FormData): Promise<void> {
  const parsed = applyCouponSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return;
  const user = await getOptionalUser();
  try {
    await applyCoupon({ userId: user?.id ?? null, code: parsed.data.code });
    revalidatePath("/cart");
  } catch (err) {
    logger.warn("applyCoupon failed", {
      msg: err instanceof Error ? err.message : String(err),
    });
  }
}
