import type { NextRequest } from "next/server";
import { listUserOrders, getOrder } from "@/modules/orders/services/orders";
import {
  getMobileUser,
  mobileError,
  mobileJson,
  mobileOptions,
  withMobileCors,
} from "@/lib/mobile-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) {
    return withMobileCors(req, mobileError("Sign in required", 401));
  }

  const orders = await listUserOrders(user.id);
  return withMobileCors(
    req,
    mobileJson({
      ok: true,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalCents: o.totalCents,
        fulfillmentType: o.fulfillmentType,
        createdAt: o.createdAt.toISOString(),
        itemCount: o.items.length,
      })),
    }),
  );
}
