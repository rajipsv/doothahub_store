import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { env } from "@/lib/env";
import {
  handleRazorpayEvent,
  type RazorpayWebhookEvent,
} from "@/modules/payments";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    logger.warn("razorpay webhook hit but RAZORPAY_WEBHOOK_SECRET is unset");
    return new NextResponse("Payments not configured", { status: 503 });
  }

  const sig = req.headers.get("x-razorpay-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const rawBody = await req.text();

  if (!verifyWebhookSignature(rawBody, sig)) {
    logger.warn("razorpay webhook signature mismatch");
    return new NextResponse("Invalid signature", { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  // Razorpay sets a per-delivery id in `x-razorpay-event-id`; fall back to a
  // hash of (event + payment id) to keep idempotency in test/dev mode.
  const eventId =
    req.headers.get("x-razorpay-event-id") ??
    `${event.event}:${event.payload.payment?.entity.id ?? event.payload.refund?.entity.id ?? Math.random()}`;

  try {
    await handleRazorpayEvent({ event, eventId });
    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("razorpay webhook handler error", {
      eventType: event.event,
      err: err instanceof Error ? err.message : String(err),
    });
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
