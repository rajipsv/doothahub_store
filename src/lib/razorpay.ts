import "server-only";
import Razorpay from "razorpay";
import crypto from "node:crypto";
import { env } from "@/lib/env";

// Lazy-init so importing this module does NOT touch process.env at load time.
// This keeps `next build`'s static analysis pass happy when env vars are not
// yet injected (Vercel build phase, CI lint, local typecheck, etc.).

let cached: Razorpay | null = null;

export class RazorpayNotConfiguredError extends Error {
  constructor() {
    super(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable payments.",
    );
    this.name = "RazorpayNotConfiguredError";
  }
}

export function getRazorpay(): Razorpay {
  if (cached) return cached;
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new RazorpayNotConfiguredError();
  }
  cached = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
  return cached;
}

/**
 * Verify the `razorpay_signature` returned by Razorpay Checkout JS.
 * Spec: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret).
 *
 * Returns false (never throws) when the secret is missing, so missing
 * configuration looks like a signature mismatch to callers.
 */
export function verifyCheckoutSignature(args: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${args.razorpayOrderId}|${args.razorpayPaymentId}`)
    .digest("hex");

  return timingSafeEqualHex(expected, args.razorpaySignature);
}

/**
 * Verify a Razorpay webhook payload signature.
 * Spec: HMAC_SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET).
 *
 * Returns false (never throws) when the secret is missing.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return timingSafeEqualHex(expected, signature);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}
