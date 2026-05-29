import RazorpayCheckout from "react-native-razorpay";
import { apiFetch } from "@/lib/api";

type OpenRazorpayArgs = {
  email: string;
  name?: string;
  phone: string;
  fulfillmentType: "DELIVERY" | "PICKUP";
  pickupSlotId?: string;
};

export async function openRazorpayCheckout(args: OpenRazorpayArgs) {
  const init = await apiFetch<{
    ok: true;
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    cartId: string;
    prefill: { email: string; name?: string; contact: string };
  }>("/checkout/razorpay-order", {
    method: "POST",
    body: {
      email: args.email,
      name: args.name,
      phone: args.phone,
    },
  });

  const options = {
    description: "DoothaHub Store order",
    currency: init.currency,
    key: init.keyId,
    amount: init.amount,
    name: "DoothaHub Store",
    order_id: init.orderId,
    prefill: init.prefill,
    theme: { color: "#0891b2" },
  };

  const payment = await RazorpayCheckout.open(options);

  await apiFetch<{ ok: true; orderNumbers: string[] }>("/checkout/verify", {
    method: "POST",
    body: {
      razorpayOrderId: payment.razorpay_order_id,
      razorpayPaymentId: payment.razorpay_payment_id,
      razorpaySignature: payment.razorpay_signature,
      cartId: init.cartId,
      email: args.email,
      fulfillmentType: args.fulfillmentType,
      pickupSlotId: args.pickupSlotId,
    },
  });
}
