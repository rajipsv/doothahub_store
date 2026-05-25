import type { Metadata } from "next";
import Link from "next/link";
import {
  CartLineItemView,
  CartSummary,
  getCurrentCart,
} from "@/modules/cart";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your cart" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await getCurrentCart();

  if (cart.items.length === 0) {
    return (
      <div className="container grid place-items-center py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Discover something you&apos;ll love.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Your cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="divide-y rounded-lg border bg-card">
          {cart.items.map((item) => (
            <div key={item.id} className="px-4">
              <CartLineItemView item={item} />
            </div>
          ))}
        </div>
        <CartSummary cart={cart} />
      </div>
    </div>
  );
}
