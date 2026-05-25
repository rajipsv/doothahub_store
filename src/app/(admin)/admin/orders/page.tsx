import type { Metadata } from "next";
import { listAllOrders } from "@/modules/orders";
import { OrdersTable } from "@/modules/admin";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listAllOrders(200);
  const rows = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    email: o.email,
    status: o.status,
    totalCents: o.totalCents,
    currency: o.currency,
    createdAt: o.createdAt.toISOString(),
  }));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      <div className="rounded-lg border bg-card">
        <OrdersTable rows={rows} />
      </div>
    </div>
  );
}
