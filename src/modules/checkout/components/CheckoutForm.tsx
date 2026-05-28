"use client";

import * as React from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { placeCodOrderAction } from "@/modules/checkout";
import {
  createRazorpayCheckoutOrderAction,
  razorpayCheckoutDisplayConfig,
  verifyAndPlaceOrderAction,
} from "@/modules/payments";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type PaymentChoice = "online" | "cod";

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
};

export function CheckoutForm({
  defaultEmail,
  defaultName,
  defaultPhone,
  appName,
  codEnabled = false,
  razorpayConfigured = false,
}: Props) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentChoice>(
    codEnabled && !razorpayConfigured ? "cod" : "online",
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

  React.useEffect(() => {
    if (paymentMethod === "online" && !showOnline && showCod) {
      setPaymentMethod("cod");
    }
    if (paymentMethod === "cod" && !showCod && showOnline) {
      setPaymentMethod("online");
    }
  }, [paymentMethod, showOnline, showCod]);

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
    if (!line1.trim() || !city.trim() || !region.trim() || !postalCode.trim()) {
      setError("Please fill in your full delivery address");
      return;
    }

    setLoading(true);
    const res = await placeCodOrderAction({
      email,
      name,
      phone,
      line1,
      line2: line2 || undefined,
      city,
      region,
      postalCode,
      country: "IN",
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/orders/success?o=${encodeURIComponent(res.orderNumber)}`);
  }

  async function finalisePayment(args: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    cartId: string;
  }) {
    const res = await verifyAndPlaceOrderAction({ ...args, email });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(`/orders/success?o=${encodeURIComponent(res.orderNumber)}`);
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

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
              <span className="font-medium">Cash on delivery</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Pay in cash when your order is delivered
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

      {paymentMethod === "cod" ? (
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
        {loading
          ? "Processing..."
          : paymentMethod === "cod"
            ? "Place order (cash on delivery)"
            : scriptReady
              ? "Pay with Razorpay"
              : "Loading payment..."}
      </Button>

      {paymentMethod === "online" && showOnline ? (
        <p className="text-xs text-muted-foreground">
          After clicking Pay, choose <strong>UPI</strong> or{" "}
          <strong>GPay / PhonePe</strong> in the Razorpay popup.
        </p>
      ) : paymentMethod === "cod" ? (
        <p className="text-xs text-muted-foreground">
          Your order is confirmed immediately. Please keep exact cash ready for
          the delivery person.
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
