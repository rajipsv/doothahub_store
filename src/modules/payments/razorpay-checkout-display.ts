/**
 * Razorpay Standard Checkout display config (client-safe).
 * Use Razorpay defaults for UPI app icons (PhonePe, GPay, etc.) — custom
 * `method: "phonepe"` blocks are invalid and can hide the whole UPI section.
 *
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/configure-payment-methods/
 */
export const razorpayCheckoutDisplayConfig = {
  display: {
    sequence: ["upi", "card", "netbanking", "wallet"],
    preferences: {
      show_default_blocks: true,
    },
  },
} as const;

/** Explicitly enable payment methods on Checkout (Razorpay standard options). */
export const razorpayCheckoutMethods = {
  upi: true,
  card: true,
  netbanking: true,
  wallet: true,
} as const;
