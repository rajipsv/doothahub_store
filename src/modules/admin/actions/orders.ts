"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { requireRole } from "@/modules/auth";
import {
  getOrder,
  markCodPaymentReceived,
  updateOrderStatus,
} from "@/modules/orders";
import { refundRazorpayPayment } from "@/modules/payments/services/razorpay";
import { bustOrderCaches } from "@/lib/cache";
import { logger } from "@/lib/logger";

export async function markShippedAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await updateOrderStatus(id, OrderStatus.FULFILLED);
  bustOrderCaches(id);
  revalidatePath("/admin/orders");
}

export async function refundOrderAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const order = await getOrder(id);
  if (!order?.razorpayPaymentId) {
    logger.warn("refund attempted without captured payment", { orderId: id });
    return;
  }
  await refundRazorpayPayment({ razorpayPaymentId: order.razorpayPaymentId });
  bustOrderCaches(id);
  revalidatePath("/admin/orders");
}

export async function markCodCashReceivedAction(
  formData: FormData,
): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id");
  if (typeof id !== "string") return;
  try {
    await markCodPaymentReceived(id);
    bustOrderCaches(id);
    revalidatePath("/admin/orders");
  } catch (err) {
    logger.warn("markCodCashReceived failed", {
      orderId: id,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
