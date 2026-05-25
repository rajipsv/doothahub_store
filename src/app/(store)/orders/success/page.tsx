import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { OrderSummary } from "@/modules/orders";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ pi?: string }>;
}) {
  const { pi } = await searchParams;

  const order = pi
    ? await db.order.findUnique({
        where: { stripePaymentIntentId: pi },
        include: { items: true, shippingAddress: true },
      })
    : null;

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Thank you!</h1>
        <p className="mt-2 text-muted-foreground">
          Your order has been placed. A confirmation email is on its way.
        </p>
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
