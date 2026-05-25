"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { requireRole } from "@/modules/auth";
import {
  getOrder,
  updateOrderStatus,
} from "@/modules/orders";
import { refundPaymentIntent } from "@/modules/payments";
import { bustOrderCaches } from "@/lib/cache";

export async function markShippedAction(formData: FormData) {
  await requireRole("ADMIN");
  const id = formData.get("id");
  if (typeof id !== "string") return { ok: false };
  await updateOrderStatus(id, OrderStatus.FULFILLED);
  bustOrderCaches(id);
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function refundOrderAction(formData: FormData) {
  await requireRole("ADMIN");
  const id = formData.get("id");
  if (typeof id !== "string") return { ok: false };
  const order = await getOrder(id);
  if (!order?.stripePaymentIntentId) {
    return { ok: false, error: "No payment intent on order" };
  }
  await refundPaymentIntent(order.stripePaymentIntentId);
  bustOrderCaches(id);
  revalidatePath("/admin/orders");
  return { ok: true };
}
