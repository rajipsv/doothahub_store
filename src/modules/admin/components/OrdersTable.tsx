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
  markCodCashReceivedAction,
} from "@/modules/admin/actions/orders";

type Row = {
  id: string;
  orderNumber: string;
  email: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfillmentType: string;
  pickupSlotLabel: string | null;
  orderGroupId: string | null;
  totalCents: number;
  currency: string;
  hasRazorpayPayment: boolean;
  createdAt: string;
};

export function OrdersTable({ rows }: { rows: Row[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Fulfillment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Date</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const isCod = r.paymentMethod === "COD";
          const codAwaiting =
            isCod && r.paymentStatus === "AWAITING";
          return (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">
                {r.orderNumber}
                {r.orderGroupId ? (
                  <p className="mt-0.5 font-sans text-[10px] text-muted-foreground">
                    Grouped order
                  </p>
                ) : null}
              </TableCell>
              <TableCell>{r.email}</TableCell>
              <TableCell>
                <Badge variant={isCod ? "outline" : "secondary"}>
                  {isCod ? "COD" : "Online"}
                </Badge>
                {codAwaiting ? (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Cash pending
                  </p>
                ) : null}
              </TableCell>
              <TableCell className="max-w-[200px] text-xs">
                <Badge variant="outline">
                  {r.fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"}
                </Badge>
                {r.pickupSlotLabel ? (
                  <p className="mt-1 text-muted-foreground">{r.pickupSlotLabel}</p>
                ) : null}
              </TableCell>
              <TableCell>
                <Badge variant={r.status === "PAID" ? "success" : "secondary"}>
                  {r.status}
                </Badge>
              </TableCell>
              <TableCell>{formatMoney(r.totalCents, r.currency)}</TableCell>
              <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
              <TableCell className="space-x-2 text-right">
                {codAwaiting ? (
                  <form action={markCodCashReceivedAction} className="inline">
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" variant="default" size="sm">
                      Mark cash received
                    </Button>
                  </form>
                ) : null}
                <form action={markShippedAction} className="inline">
                  <input type="hidden" name="id" value={r.id} />
                  <Button type="submit" variant="outline" size="sm">
                    Ship
                  </Button>
                </form>
                {r.hasRazorpayPayment ? (
                  <form action={refundOrderAction} className="inline">
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Refund
                    </Button>
                  </form>
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
