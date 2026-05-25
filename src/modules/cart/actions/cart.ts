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

export async function addItemAction(formData: FormData) {
  const parsed = addItemSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity") ?? 1,
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }
  const user = await getOptionalUser();
  await addItemToCart({
    userId: user?.id ?? null,
    variantId: parsed.data.variantId,
    quantity: parsed.data.quantity,
  });
  revalidatePath("/cart");
  revalidatePath("/(store)", "layout");
  return { ok: true };
}

export async function updateItemAction(formData: FormData) {
  const parsed = updateItemSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const user = await getOptionalUser();
  await updateItemQuantity({
    userId: user?.id ?? null,
    itemId: parsed.data.itemId,
    quantity: parsed.data.quantity,
  });
  revalidatePath("/cart");
  revalidatePath("/(store)", "layout");
  return { ok: true };
}

export async function removeItemAction(formData: FormData) {
  const parsed = removeItemSchema.safeParse({
    itemId: formData.get("itemId"),
  });
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const user = await getOptionalUser();
  await removeItem({ userId: user?.id ?? null, itemId: parsed.data.itemId });
  revalidatePath("/cart");
  revalidatePath("/(store)", "layout");
  return { ok: true };
}

export async function applyCouponAction(formData: FormData) {
  const parsed = applyCouponSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { ok: false, error: "Invalid coupon" };
  const user = await getOptionalUser();
  try {
    await applyCoupon({ userId: user?.id ?? null, code: parsed.data.code });
    revalidatePath("/cart");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Coupon error",
    };
  }
}
