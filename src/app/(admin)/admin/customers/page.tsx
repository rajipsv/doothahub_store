import type { Metadata } from "next";
import { CustomersTable, listCustomers } from "@/modules/admin";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await listCustomers(200);
  const rows = customers.map((c) => ({
    id: c.id,
    email: c.email,
    name: c.name,
    role: c.role,
    createdAt: c.createdAt.toISOString(),
    orders: c._count.orders,
  }));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
      <div className="rounded-lg border bg-card">
        <CustomersTable rows={rows} />
      </div>
    </div>
  );
}
