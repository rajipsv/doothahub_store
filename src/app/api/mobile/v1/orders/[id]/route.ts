import type { NextRequest } from "next/server";
import { getOrder } from "@/modules/orders";
import {
  getMobileUser,
  mobileError,
  mobileJson,
  mobileOptions,
  withMobileCors,
} from "@/lib/mobile-api";
import { formatMoney } from "@doothahub/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getMobileUser(req);
  if (!user) {
    return withMobileCors(req, mobileError("Sign in required", 401));
  }

  const { id } = await params;
  const order = await getOrder(id, user.id);
  if (!order) {
    return withMobileCors(req, mobileError("Order not found", 404));
  }

  return withMobileCors(
    req,
    mobileJson({
      ok: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        fulfillmentType: order.fulfillmentType,
        pickupSlotLabel: order.pickupSlotLabel,
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        taxCents: order.taxCents,
        totalCents: order.totalCents,
        totalFormatted: formatMoney(order.totalCents),
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((it) => ({
          id: it.id,
          title: it.productTitle,
          quantity: it.quantity,
          unitPriceCents: it.unitPriceCents,
          lineTotalCents: it.unitPriceCents * it.quantity,
        })),
      },
    }),
  );
}
