import { formatMoney } from "@/lib/utils";
import type { OrderWithItems } from "@/modules/orders/types";
import { Badge } from "@/components/ui/badge";
import { PaymentMethod } from "@prisma/client";

export function OrderSummary({ order }: { order: OrderWithItems }) {
  const isCod = order.paymentMethod === PaymentMethod.COD;
  const codPending =
    isCod && order.paymentStatus === "AWAITING";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Order number</p>
          <p className="text-xl font-bold tracking-tight">{order.orderNumber}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={order.status === "PAID" ? "success" : "secondary"}>
            {order.status}
          </Badge>
          <Badge variant="outline">{isCod ? "Cash on delivery" : "Paid online"}</Badge>
        </div>
      </div>

      {codPending ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-950">
          <p className="font-semibold">Pay on delivery</p>
          <p className="mt-1 text-muted-foreground">
            Please keep{" "}
            <strong>{formatMoney(order.totalCents, order.currency)}</strong> in
            cash ready for the delivery person.
          </p>
        </div>
      ) : null}

      <div className="rounded-lg border bg-card">
        <div className="divide-y">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <p className="font-medium">{it.productTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {it.variantSku} · qty {it.quantity}
                </p>
              </div>
              <p className="font-semibold">
                {formatMoney(it.totalPriceCents, order.currency)}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-1 border-t p-4 text-sm">
          <Row label="Subtotal" value={formatMoney(order.subtotalCents, order.currency)} />
          <Row label="Shipping" value={formatMoney(order.shippingCents, order.currency)} />
          <Row label="Tax" value={formatMoney(order.taxCents, order.currency)} />
          {order.discountCents > 0 ? (
            <Row
              label="Discount"
              value={`- ${formatMoney(order.discountCents, order.currency)}`}
            />
          ) : null}
          <div className="mt-2 border-t pt-2">
            <Row
              label="Total"
              value={formatMoney(order.totalCents, order.currency)}
              bold
            />
          </div>
        </div>
      </div>

      {order.shippingAddress ? (
        <div className="rounded-lg border bg-card p-4 text-sm">
          <p className="mb-2 font-semibold">Delivery address</p>
          <p>{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.line1}</p>
          {order.shippingAddress.line2 ? <p>{order.shippingAddress.line2}</p> : null}
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.region}{" "}
            {order.shippingAddress.postalCode}
          </p>
          <p>{order.shippingAddress.country}</p>
          {order.shippingAddress.phone ? (
            <p className="mt-2 text-muted-foreground">
              Phone: {order.shippingAddress.phone}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
