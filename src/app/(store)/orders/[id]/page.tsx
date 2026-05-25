import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrder, OrderSummary } from "@/modules/orders";
import { getOptionalUser } from "@/modules/auth";

export const metadata: Metadata = { title: "Your order" };
export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOptionalUser();
  const order = await getOrder(id, user?.id);
  if (!order) notFound();

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <OrderSummary order={order} />
    </div>
  );
}
