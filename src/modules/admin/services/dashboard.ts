import "server-only";
import { db } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

export async function getDashboardStats() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [revenueAgg, orderCount, customerCount, productCount] =
    await Promise.all([
      db.order.aggregate({
        _sum: { totalCents: true },
        where: {
          paymentStatus: PaymentStatus.SUCCEEDED,
          createdAt: { gte: since },
        },
      }),
      db.order.count({ where: { createdAt: { gte: since } } }),
      db.user.count({ where: { createdAt: { gte: since } } }),
      db.product.count({ where: { deletedAt: null } }),
    ]);

  return {
    revenueCents: revenueAgg._sum.totalCents ?? 0,
    orderCount,
    customerCount,
    productCount,
  };
}

export async function getRevenueSeries() {
  const since = new Date();
  since.setDate(since.getDate() - 14);

  const orders = await db.order.findMany({
    where: {
      paymentStatus: PaymentStatus.SUCCEEDED,
      createdAt: { gte: since },
    },
    select: { totalCents: true, createdAt: true },
  });

  const map = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const k = d.toISOString().slice(0, 10);
    map.set(k, 0);
  }
  for (const o of orders) {
    const k = o.createdAt.toISOString().slice(0, 10);
    map.set(k, (map.get(k) ?? 0) + o.totalCents);
  }

  return Array.from(map.entries()).map(([date, cents]) => ({
    date,
    revenue: cents / 100,
  }));
}

export async function listCustomers(limit = 200) {
  return db.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
