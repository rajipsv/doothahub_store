import Link from "next/link";
import { requireRole } from "@/modules/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return (
    <div className="grid min-h-screen md:grid-cols-[220px_1fr]">
      <aside className="hidden border-r bg-card p-6 md:block">
        <Link href="/admin" className="mb-8 block text-lg font-bold">
          DoothaHub Admin
        </Link>
        <nav className="space-y-2 text-sm font-medium">
          <Link href="/admin" className="block hover:underline">
            Dashboard
          </Link>
          <Link href="/admin/products" className="block hover:underline">
            Products
          </Link>
          <Link href="/admin/orders" className="block hover:underline">
            Orders
          </Link>
          <Link href="/admin/customers" className="block hover:underline">
            Customers
          </Link>
          <Link href="/" className="block hover:underline text-muted-foreground">
            Back to store
          </Link>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
