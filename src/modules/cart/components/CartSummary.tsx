import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { applyCouponAction } from "@/modules/cart/actions/cart";
import type { FullCart } from "@/modules/cart/types";

export function CartSummary({ cart }: { cart: FullCart }) {
  return (
    <aside className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Order summary</h2>

      <div className="mt-4 space-y-2 text-sm">
        <Row label="Subtotal" value={formatMoney(cart.subtotalCents, cart.currency)} />
        <Row label="Shipping" value={formatMoney(cart.shippingCents, cart.currency)} />
        <Row label="Tax" value={formatMoney(cart.taxCents, cart.currency)} />
        {cart.discountCents > 0 ? (
          <Row
            label="Discount"
            value={`- ${formatMoney(cart.discountCents, cart.currency)}`}
          />
        ) : null}
      </div>

      <div className="mt-4 border-t pt-4">
        <Row
          label="Total"
          value={formatMoney(cart.totalCents, cart.currency)}
          bold
        />
      </div>

      <form action={applyCouponAction} className="mt-4 flex gap-2">
        <input
          name="code"
          placeholder="Coupon code"
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
        />
        <Button type="submit" variant="outline" size="sm">
          Apply
        </Button>
      </form>

      <Button asChild className="mt-4 w-full" size="lg" disabled={cart.items.length === 0}>
        <Link href="/checkout">Checkout</Link>
      </Button>
    </aside>
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
