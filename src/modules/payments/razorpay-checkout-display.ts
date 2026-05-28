/**
 * Razorpay Standard Checkout display config (client-safe).
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/configure-payment-methods/
 */
export const razorpayCheckoutDisplayConfig = {
  display: {
    blocks: {
      upiQuick: {
        name: "GPay, PhonePe & UPI",
        instruments: [
          { method: "gpay" },
          { method: "phonepe" },
          { method: "upi" },
        ],
      },
    },
    sequence: ["block.upiQuick", "upi", "card", "netbanking", "wallet"],
    preferences: {
      show_default_blocks: true,
    },
  },
} as const;
