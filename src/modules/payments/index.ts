/**
 * Client-safe surface for @/modules/payments.
 * Server-only helpers (webhook, Razorpay SDK, email) live in ./server.ts.
 */
export {
  createRazorpayCheckoutOrderAction,
  type CreateRazorpayOrderResult,
} from "@/modules/payments/actions/create-order";
export {
  verifyAndPlaceOrderAction,
  type VerifyResult,
} from "@/modules/payments/actions/verify-payment";
export { razorpayCheckoutDisplayConfig } from "@/modules/payments/razorpay-checkout-display";
