import type { Metadata } from "next";
import Link from "next/link";
import { FulfillmentType, PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { OrderSummary } from "@/modules/orders";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

function parseOrderNumbers(
  raw: string | string[] | undefined,
): string[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return [...new Set(list.filter(Boolean))];
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ o?: string | string[] }>;
}) {
  const { o } = await searchParams;
  const orderNumbers = parseOrderNumbers(o);

  const orders =
    orderNumbers.length > 0
      ? await db.order.findMany({
          where: { orderNumber: { in: orderNumbers } },
          include: { items: true, shippingAddress: true },
          orderBy: { createdAt: "asc" },
        })
      : [];

  const combinedTotal = orders.reduce((sum, ord) => sum + ord.totalCents, 0);
  const currency = orders[0]?.currency ?? "INR";

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Thank you!</h1>
        {orders.length > 1 ? (
          <p className="mt-2 text-muted-foreground">
            Your cart was split into {orders.length} orders (
            {orders.map((ord) => ord.orderNumber).join(" and ")}). Total{" "}
            <strong>{formatMoney(combinedTotal, currency)}</strong>.
          </p>
        ) : orders[0]?.paymentMethod === PaymentMethod.COD ? (
          <p className="mt-2 text-muted-foreground">
            Your order is confirmed. Pay{" "}
            <strong>
              {formatMoney(orders[0].totalCents, orders[0].currency)}
            </strong>{" "}
            in cash when you{" "}
            {orders[0].fulfillmentType === FulfillmentType.PICKUP
              ? "pick up your order"
              : "receive delivery"}
            .
            {orders[0].pickupSlotLabel ? (
              <>
                {" "}
                Pickup: <strong>{orders[0].pickupSlotLabel}</strong>.
              </>
            ) : null}{" "}
            A confirmation email is on its way.
          </p>
        ) : orders[0]?.fulfillmentType === FulfillmentType.PICKUP &&
          orders[0].pickupSlotLabel ? (
          <p className="mt-2 text-muted-foreground">
            Your order is confirmed for pickup at{" "}
            <strong>{orders[0].pickupSlotLabel}</strong>. A confirmation email is
            on its way.
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground">
            Your order has been placed. A confirmation email is on its way.
          </p>
        )}
      </div>

      <div className="space-y-8">
        {orders.map((order) => (
          <OrderSummary key={order.id} order={order} />
        ))}
        {orders.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Order details are being processed. Check your email shortly.
          </p>
        ) : null}
      </div>

      <div className="mt-8 text-center">
        <Button asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
