import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/modules/auth";
import { listUserOrders } from "@/modules/orders";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await listUserOrders(user.id);

  if (orders.length === 0) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            className="block rounded-lg border bg-card p-4 hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{o.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleDateString()} \u00b7 {o.items.length} items
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={o.status === "PAID" ? "success" : "secondary"}>
                  {o.status}
                </Badge>
                <p className="font-semibold">
                  {formatMoney(o.totalCents, o.currency)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
