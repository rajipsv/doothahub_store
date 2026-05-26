import type { Metadata } from "next";
import Link from "next/link";
import { Package, ShoppingCart, Users, Plus } from "lucide-react";
import {
  getDashboardStats,
  getRevenueSeries,
  RevenueChart,
  StatsGrid,
} from "@/modules/admin";
import { safeFetch } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  {
    href: "/admin/products",
    label: "Manage products",
    desc: "Create, edit, archive your catalogue.",
    icon: Package,
  },
  {
    href: "/admin/products",
    label: "Add new product",
    desc: "Opens the product list \u2014 click 'New product' top-right.",
    icon: Plus,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    desc: "Review, ship, refund customer orders.",
    icon: ShoppingCart,
  },
  {
    href: "/admin/customers",
    label: "Customers",
    desc: "Browse registered customers.",
    icon: Users,
  },
];

const EMPTY_STATS = {
  revenueCents: 0,
  orderCount: 0,
  customerCount: 0,
  productCount: 0,
};

export default async function AdminDashboard() {
  const [stats, series] = await Promise.all([
    safeFetch(() => getDashboardStats(), EMPTY_STATS, "admin:stats"),
    safeFetch(() => getRevenueSeries(), [], "admin:revenue"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick links and last-30-day overview.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                href={a.href}
                className="group flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary hover:bg-accent"
              >
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                <p className="font-semibold">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Last 30 days
        </h2>
        <StatsGrid stats={stats} />
      </section>

      <section>
        <RevenueChart data={series} />
      </section>
    </div>
  );
}
