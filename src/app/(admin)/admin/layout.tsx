import Link from "next/link";
import { requireRole, SignOutButton } from "@/modules/auth";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");
  return (
    <div className="grid min-h-screen md:grid-cols-[220px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r bg-card p-6 md:block">
        <Link href="/admin" className="mb-8 block text-lg font-bold">
          DoothaHub Admin
        </Link>
        <nav className="space-y-2 text-sm font-medium">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block hover:underline">
              {n.label}
            </Link>
          ))}
          <Link
            href="/"
            className="block pt-4 text-muted-foreground hover:underline"
          >
            ← Back to store
          </Link>
          <div className="flex items-center gap-2 pt-2">
            <ThemeToggle />
            <SignOutButton variant="link" />
          </div>
        </nav>
      </aside>

      <div className="flex flex-col">
        {/* Mobile top bar — visible only on narrow screens where the sidebar is hidden */}
        <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/admin" className="font-bold">
              DoothaHub Admin
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/"
                className="text-xs text-muted-foreground hover:underline"
              >
                ← Store
              </Link>
              <SignOutButton variant="link" label="Sign out" showIcon={false} />
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t px-2 py-1 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-accent"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
