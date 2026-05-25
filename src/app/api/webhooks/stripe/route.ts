import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { env } from "@/lib/env";
import { handleStripeEvent } from "@/modules/payments";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn("stripe webhook signature failed", {
      msg: err instanceof Error ? err.message : String(err),
    });
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    await handleStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("stripe webhook handler error", {
      eventType: event.type,
      err: err instanceof Error ? err.message : String(err),
    });
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
