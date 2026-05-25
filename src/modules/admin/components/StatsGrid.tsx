import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

type Stats = {
  revenueCents: number;
  orderCount: number;
  customerCount: number;
  productCount: number;
};

export function StatsGrid({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Revenue (30d)", value: formatMoney(stats.revenueCents) },
    { label: "Orders (30d)", value: stats.orderCount.toLocaleString() },
    { label: "New customers (30d)", value: stats.customerCount.toLocaleString() },
    { label: "Products", value: stats.productCount.toLocaleString() },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {c.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
