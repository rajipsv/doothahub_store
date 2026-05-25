import type { Metadata } from "next";
import {
  getDashboardStats,
  getRevenueSeries,
  RevenueChart,
  StatsGrid,
} from "@/modules/admin";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, series] = await Promise.all([
    getDashboardStats(),
    getRevenueSeries(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <StatsGrid stats={stats} />
      <RevenueChart data={series} />
    </div>
  );
}
