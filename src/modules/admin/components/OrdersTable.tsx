"use client";

import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  markShippedAction,
  refundOrderAction,
} from "@/modules/admin/actions/orders";

type Row = {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
};

export function OrdersTable({ rows }: { rows: Row[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Date</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono text-xs">{r.orderNumber}</TableCell>
            <TableCell>{r.email}</TableCell>
            <TableCell>
              <Badge variant={r.status === "PAID" ? "success" : "secondary"}>
                {r.status}
              </Badge>
            </TableCell>
            <TableCell>{formatMoney(r.totalCents, r.currency)}</TableCell>
            <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
            <TableCell className="space-x-2 text-right">
              <form action={markShippedAction} className="inline">
                <input type="hidden" name="id" value={r.id} />
                <Button type="submit" variant="outline" size="sm">
                  Ship
                </Button>
              </form>
              <form action={refundOrderAction} className="inline">
                <input type="hidden" name="id" value={r.id} />
                <Button type="submit" variant="ghost" size="sm">
                  Refund
                </Button>
              </form>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
