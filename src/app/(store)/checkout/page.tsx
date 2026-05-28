import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm, buildPickupSlots } from "@/modules/checkout";
import {
  CartSummary,
  getCurrentCart,
  splitCartByPickupEligibility,
  toCartSplitSummary,
} from "@/modules/cart";
import { getOptionalUser } from "@/modules/auth";
import {
  env,
  isCodEnabled,
  isPickupEnabled,
  isRazorpayConfigured,
  pickupLocationAddress,
  pickupLocationName,
} from "@/lib/env";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cart = await getCurrentCart();
  if (cart.items.length === 0) redirect("/cart");

  const user = await getOptionalUser();
  const cartSplit = toCartSplitSummary(splitCartByPickupEligibility(cart));
  const pickupSlots = isPickupEnabled ? buildPickupSlots() : [];
  const canOfferPickup =
    isPickupEnabled &&
    pickupSlots.length > 0 &&
    cartSplit.hasPickupLines;

  return (
    <div className="container py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border bg-card p-6">
          <CheckoutForm
            defaultEmail={user?.email ?? undefined}
            defaultName={user?.name ?? undefined}
            appName={env.NEXT_PUBLIC_APP_NAME}
            codEnabled={isCodEnabled}
            razorpayConfigured={isRazorpayConfigured}
            canOfferPickup={canOfferPickup}
            cartSplit={cartSplit}
            pickupSlots={pickupSlots}
            pickupLocationName={pickupLocationName}
            pickupLocationAddress={pickupLocationAddress}
          />
        </div>
        <CartSummary cart={cart} />
      </div>
    </div>
  );
}
