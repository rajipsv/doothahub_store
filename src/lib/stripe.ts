import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
  appInfo: {
    name: "DoothaHub Store",
    version: "0.1.0",
  },
});
