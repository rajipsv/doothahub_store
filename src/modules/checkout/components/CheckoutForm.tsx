"use client";

import * as React from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { placeCodOrderAction } from "@/modules/checkout/actions/place-cod-order";
import type { PickupSlot } from "@/modules/checkout";
import type { CartSplitSummary } from "@/modules/cart";
import { formatMoney } from "@/lib/utils";
import {
  createRazorpayCheckoutOrderAction,
  razorpayCheckoutDisplayConfig,
  razorpayCheckoutMethods,
  verifyAndPlaceOrderAction,
} from "@/modules/payments";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type PaymentChoice = "online" | "cod";
type FulfillmentChoice = "DELIVERY" | "PICKUP";

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (event: string, handler: (resp: unknown) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckoutInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

type Props = {
  defaultEmail?: string;
  defaultName?: string;
  defaultPhone?: string;
  appName?: string;
  codEnabled?: boolean;
  razorpayConfigured?: boolean;
  canOfferPickup?: boolean;
  cartSplit: CartSplitSummary;
  pickupSlots?: PickupSlot[];
  pickupLocationName?: string;
  pickupLocationAddress?: string;
};

function orderSuccessUrl(orderNumbers: string[]) {
  return `/orders/success?${orderNumbers.map((n) => `o=${encodeURIComponent(n)}`).join("&")}`;
}

function CartLinesList({
  title,
  lines,
  subtotalCents,
}: {
  title: string;
  lines: CartSplitSummary["pickupLines"];
  subtotalCents: number;
}) {
  if (lines.length === 0) return null;
  return (
    <div className="rounded-md border bg-background p-3 text-sm">
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 space-y-1 text-muted-foreground">
        {lines.map((line) => (
          <li key={line.cartItemId} className="flex justify-between gap-2">
            <span>
              {line.title} × {line.quantity}
            </span>
            <span>{formatMoney(line.lineTotalCents)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-right font-medium">
        Subtotal {formatMoney(subtotalCents)}
      </p>
    </div>
  );
}

export function CheckoutForm({
  defaultEmail,
  defaultName,
  defaultPhone,
  appName,
  codEnabled = false,
  razorpayConfigured = false,
  canOfferPickup = false,
  cartSplit,
  pickupSlots = [],
  pickupLocationName = "Store",
  pickupLocationAddress = "",
}: Props) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentChoice>(
    codEnabled && !razorpayConfigured ? "cod" : "online",
  );
  const [fulfillmentType, setFulfillmentType] =
    React.useState<FulfillmentChoice>(
      canOfferPickup && cartSplit.allLinesPickupEligible ? "PICKUP" : "DELIVERY",
    );
  const [pickupSlotId, setPickupSlotId] = React.useState(
    pickupSlots[0]?.id ?? "",
  );
  const [email, setEmail] = React.useState(defaultEmail ?? "");
  const [name, setName] = React.useState(defaultName ?? "");
  const [phone, setPhone] = React.useState(defaultPhone ?? "");
  const [line1, setLine1] = React.useState("");
  const [line2, setLine2] = React.useState("");
  const [city, setCity] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [scriptReady, setScriptReady] = React.useState(false);

  const showOnline = razorpayConfigured;
  const showCod = codEnabled;
  const forceDelivery =
    cartSplit.allLinesPickupEligible && fulfillmentType === "DELIVERY";
  const needsPickupSection =
    cartSplit.isMixed ||
    (cartSplit.hasPickupLines && !forceDelivery);
  const needsAddress = cartSplit.hasDeliveryLines || forceDelivery;

  React.useEffect(() => {
    if (paymentMethod === "online" && !showOnline && showCod) {
      setPaymentMethod("cod");
    }
    if (paymentMethod === "cod" && !showCod && showOnline) {
      setPaymentMethod("online");
    }
  }, [paymentMethod, showOnline, showCod]);

  React.useEffect(() => {
    if (pickupSlots.length > 0 && !pickupSlotId) {
      setPickupSlotId(pickupSlots[0]!.id);
    }
  }, [pickupSlots, pickupSlotId]);

  function validatePickup(): boolean {
    if (!needsPickupSection) return true;
    if (!pickupSlotId) {
      setError("Please select a pickup time");
      return false;
    }
    return true;
  }

  async function startOnlineCheckout() {
    setError(null);
    if (!email) {
      setError("Email is required");
      return;
    }
    if (!phone.trim()) {
      setError("Mobile number is required for UPI (GPay, PhonePe)");
      return;
    }
    if (!validatePickup()) return;
    if (typeof window === "undefined" || !window.Razorpay) {
      setError("Payment SDK is still loading. Try again in a moment.");
      return;
    }

    setLoading(true);
    const init = await createRazorpayCheckoutOrderAction({ email, name, phone });
    if (!init.ok) {
      setLoading(false);
      setError(init.error);
      return;
    }

    const rzp = new window.Razorpay({
      key: init.keyId,
      order_id: init.orderId,
      amount: init.amount,
      currency: init.currency,
      name: appName ?? "DoothaHub Store",
      description: "Order payment",
      prefill: {
        email: init.prefill.email,
        name: init.prefill.name ?? "",
        contact: init.prefill.contact,
      },
      notes: { cartId: init.cartId },
      theme: { color: "#0f172a" },
      method: razorpayCheckoutMethods,
      config: razorpayCheckoutDisplayConfig,
      handler: (response: RazorpaySuccessResponse) => {
        void finalisePayment({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          cartId: init.cartId,
        });
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
        },
      },
    });

    rzp.on("payment.failed", (resp: unknown) => {
      setLoading(false);
      const err = resp as { error?: { description?: string } } | undefined;
      setError(err?.error?.description ?? "Payment failed. Please try again.");
    });

    rzp.open();
  }

  async function placeCodOrder() {
    setError(null);
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!name.trim()) {
      setError("Full name is required");
      return;
    }
    if (!phone.trim()) {
      setError("Mobile number is required");
      return;
    }
    if (!validatePickup()) return;
    if (
      needsAddress &&
      (!line1.trim() || !city.trim() || !region.trim() || !postalCode.trim())
    ) {
      setError("Please fill in your full delivery address");
      return;
    }

    setLoading(true);
    const res = await placeCodOrderAction({
      email,
      name,
      phone,
      fulfillmentType: cartSplit.isMixed
        ? "PICKUP"
        : forceDelivery
          ? "DELIVERY"
          : fulfillmentType,
      pickupSlotId: needsPickupSection ? pickupSlotId : undefined,
      line1: needsAddress ? line1 : undefined,
      line2: needsAddress ? line2 || undefined : undefined,
      city: needsAddress ? city : undefined,
      region: needsAddress ? region : undefined,
      postalCode: needsAddress ? postalCode : undefined,
      country: "IN",
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(orderSuccessUrl(res.orderNumbers));
  }

  async function finalisePayment(args: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    cartId: string;
  }) {
    const res = await verifyAndPlaceOrderAction({
      ...args,
      email,
      fulfillmentType: cartSplit.isMixed
        ? "PICKUP"
        : forceDelivery
          ? "DELIVERY"
          : fulfillmentType,
      pickupSlotId: needsPickupSection ? pickupSlotId : undefined,
      forceDelivery,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(orderSuccessUrl(res.orderNumbers));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (paymentMethod === "cod") {
      void placeCodOrder();
    } else {
      void startOnlineCheckout();
    }
  }

  const onlineDisabled = loading || (showOnline && !scriptReady);
  const codDisabled = loading;
  const payAtPickup = needsPickupSection && !needsAddress;

  const submitLabel = loading
    ? "Processing..."
    : paymentMethod === "cod"
      ? payAtPickup && !cartSplit.isMixed
        ? "Place order (pay at pickup)"
        : cartSplit.isMixed
          ? "Place orders (cash)"
          : "Place order (cash on delivery)"
      : scriptReady
        ? cartSplit.isMixed
          ? "Pay with Razorpay"
          : "Pay with Razorpay"
        : "Loading payment...";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {cartSplit.isMixed ? (
        <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-semibold">Split order</p>
          <p className="text-muted-foreground">
            Pickup-eligible items will be a store pickup order; other items will
            be delivered. You complete one checkout and receive two order
            numbers.
          </p>
          <CartLinesList
            title={`Pickup items (${cartSplit.pickupLines.length})`}
            lines={cartSplit.pickupLines}
            subtotalCents={cartSplit.pickupSubtotalCents}
          />
          <CartLinesList
            title={`Delivery items (${cartSplit.deliveryLines.length})`}
            lines={cartSplit.deliveryLines}
            subtotalCents={cartSplit.deliverySubtotalCents}
          />
        </div>
      ) : null}

      {canOfferPickup && cartSplit.allLinesPickupEligible && !cartSplit.isMixed ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">How do you want your order?</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-primary">
            <input
              type="radio"
              name="fulfillmentType"
              value="DELIVERY"
              checked={fulfillmentType === "DELIVERY"}
              onChange={() => setFulfillmentType("DELIVERY")}
              className="mt-1"
            />
            <span>
              <span className="font-medium">Home delivery</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                We deliver to your address
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-primary">
            <input
              type="radio"
              name="fulfillmentType"
              value="PICKUP"
              checked={fulfillmentType === "PICKUP"}
              onChange={() => setFulfillmentType("PICKUP")}
              className="mt-1"
            />
            <span>
              <span className="font-medium">Store pickup</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Collect from our store at your chosen time
              </span>
            </span>
          </label>
        </fieldset>
      ) : null}

      {showOnline && showCod ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Payment method</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-primary">
            <input
              type="radio"
              name="paymentMethod"
              value="online"
              checked={paymentMethod === "online"}
              onChange={() => setPaymentMethod("online")}
              className="mt-1"
            />
            <span>
              <span className="font-medium">Pay online</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                UPI, cards, net banking via Razorpay
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:border-primary">
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
              className="mt-1"
            />
            <span>
              <span className="font-medium">
                Pay on {payAtPickup && !cartSplit.isMixed ? "pickup" : "delivery"}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Pay in cash when you{" "}
                {cartSplit.isMixed
                  ? "pick up or receive delivery"
                  : payAtPickup
                    ? "collect your order"
                    : "receive delivery"}
              </span>
            </span>
          </label>
        </fieldset>
      ) : null}

      {showOnline ? (
        <Script
          src={RAZORPAY_SCRIPT}
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      ) : null}

      <div className="space-y-3">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="phone">Mobile number</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="numeric"
          placeholder="10-digit mobile"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          required
        />
      </div>

      {needsPickupSection ? (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-semibold">Pickup details</p>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{pickupLocationName}</p>
            {pickupLocationAddress ? <p>{pickupLocationAddress}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickupSlot">Pickup time</Label>
            <select
              id="pickupSlot"
              value={pickupSlotId}
              onChange={(e) => setPickupSlotId(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {pickupSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {needsAddress ? (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-semibold">Delivery address</p>
          <div className="space-y-3">
            <Label htmlFor="line1">Street address</Label>
            <Input
              id="line1"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              autoComplete="address-line1"
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="line2">Apartment, suite (optional)</Label>
            <Input
              id="line2"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              autoComplete="address-line2"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="region">State</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                autoComplete="address-level1"
                required
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="postalCode">PIN code</Label>
            <Input
              id="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              autoComplete="postal-code"
              required
            />
          </div>
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={
          paymentMethod === "cod" ? codDisabled : onlineDisabled || !showOnline
        }
        className="w-full"
        size="lg"
      >
        {submitLabel}
      </Button>

      {paymentMethod === "online" && showOnline ? (
        <div className="space-y-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">How to pay with PhonePe / GPay</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Click <strong>Pay with Razorpay</strong> below.</li>
            <li>
              In the Razorpay window, open the <strong>UPI</strong> section (not
              Cards).
            </li>
            <li>
              <strong>On your phone:</strong> tap the PhonePe or Google Pay icon.
            </li>
            <li>
              <strong>On a computer:</strong> scan the QR with PhonePe or GPay on
              your phone.
            </li>
          </ol>
        </div>
      ) : paymentMethod === "cod" ? (
        <p className="text-xs text-muted-foreground">
          {cartSplit.isMixed
            ? "You will receive two order confirmations. Pay the correct amount for each part when you pick up or receive delivery."
            : payAtPickup
              ? "Your order is confirmed. Please bring exact cash when you collect at the selected time."
              : "Your order is confirmed. Please keep exact cash ready for the delivery person."}
        </p>
      ) : null}

      {!showOnline && !showCod ? (
        <p className="text-sm text-destructive">
          Checkout is not configured. Please contact the store.
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
