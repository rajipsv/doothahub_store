"use client";

import * as React from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPaymentIntentAction } from "@/modules/payments";
import { absoluteUrl } from "@/lib/utils";

type Props = {
  publishableKey: string;
  defaultEmail?: string;
};

export function CheckoutForm({ publishableKey, defaultEmail }: Props) {
  const stripePromise = React.useMemo(
    () => loadStripe(publishableKey),
    [publishableKey],
  );

  const [email, setEmail] = React.useState(defaultEmail ?? "");
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function init() {
    setError(null);
    if (!email) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    const res = await createPaymentIntentAction({ email });
    setLoading(false);
    if (!res.ok || !res.clientSecret) {
      setError(res.error ?? "Failed to start payment");
      return;
    }
    setClientSecret(res.clientSecret);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {!clientSecret ? (
        <Button onClick={init} disabled={loading} className="w-full" size="lg">
          {loading ? "Starting checkout..." : "Continue to payment"}
        </Button>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: { theme: "stripe" },
          }}
        >
          <PaymentSubmit />
        </Elements>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function PaymentSubmit() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErr(null);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: absoluteUrl("/orders/success"),
      },
      redirect: "if_required",
    });
    setSubmitting(false);
    if (error) {
      setErr(error.message ?? "Payment failed");
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      router.push(`/orders/success?pi=${paymentIntent.id}`);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={submitting} className="w-full" size="lg">
        {submitting ? "Processing..." : "Pay now"}
      </Button>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
    </form>
  );
}
