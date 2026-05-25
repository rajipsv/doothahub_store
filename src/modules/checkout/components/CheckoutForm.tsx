"use client";

import * as React from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRazorpayCheckoutOrderAction } from "@/modules/payments/actions/create-order";
import { verifyAndPlaceOrderAction } from "@/modules/payments/actions/verify-payment";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

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
  appName?: string;
};

export function CheckoutForm({ defaultEmail, defaultName, appName }: Props) {
  const router = useRouter();
  const [email, setEmail] = React.useState(defaultEmail ?? "");
  const [name, setName] = React.useState(defaultName ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [scriptReady, setScriptReady] = React.useState(false);

  async function startCheckout() {
    setError(null);
    if (!email) {
      setError("Email is required");
      return;
    }
    if (typeof window === "undefined" || !window.Razorpay) {
      setError("Payment SDK is still loading. Try again in a moment.");
      return;
    }

    setLoading(true);
    const init = await createRazorpayCheckoutOrderAction({ email, name });
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
      prefill: { email: init.prefill.email, name: init.prefill.name ?? "" },
      notes: { cartId: init.cartId },
      theme: { color: "#0f172a" },
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

  return (
    <div className="space-y-6">
      <Script
        src={RAZORPAY_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

      <div className="space-y-3">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
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

      <Button
        onClick={startCheckout}
        disabled={loading || !scriptReady}
        className="w-full"
        size="lg"
      >
        {loading
          ? "Processing..."
          : scriptReady
            ? "Pay with Razorpay"
            : "Loading payment..."}
      </Button>

      <p className="text-xs text-muted-foreground">
        Secure payments by Razorpay. UPI, cards, net-banking, wallets and more.
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
