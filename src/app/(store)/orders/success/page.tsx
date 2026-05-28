import type { Metadata } from "next";
import Link from "next/link";
import { FulfillmentType, PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { OrderSummary } from "@/modules/orders";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ o?: string }>;
}) {
  const { o } = await searchParams;

  const order = o
    ? await db.order.findUnique({
        where: { orderNumber: o },
        include: { items: true, shippingAddress: true },
      })
    : null;

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Thank you!</h1>
        {order?.paymentMethod === PaymentMethod.COD ? (
          <p className="mt-2 text-muted-foreground">
            Your order is confirmed. Pay{" "}
            <strong>
              {formatMoney(order.totalCents, order.currency)}
            </strong>{" "}
            in cash when you{" "}
            {order.fulfillmentType === FulfillmentType.PICKUP
              ? "pick up your order"
              : "receive delivery"}
            .
            {order.pickupSlotLabel ? (
              <>
                {" "}
                Pickup: <strong>{order.pickupSlotLabel}</strong>.
              </>
            ) : null}{" "}
            A confirmation email is on its way.
          </p>
        ) : order?.fulfillmentType === FulfillmentType.PICKUP &&
          order.pickupSlotLabel ? (
          <p className="mt-2 text-muted-foreground">
            Your order is confirmed for pickup at{" "}
            <strong>{order.pickupSlotLabel}</strong>. A confirmation email is on
            its way.
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground">
            Your order has been placed. A confirmation email is on its way.
          </p>
        )}
      </div>
      {order ? (
        <OrderSummary order={order} />
      ) : (
        <p className="text-center text-muted-foreground">
          Order details are being processed. Check your email shortly.
        </p>
      )}
      <div className="mt-8 text-center">
        <Button asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
