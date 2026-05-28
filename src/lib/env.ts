import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Friendly fallbacks for single-URL / minimal-config deploys (e.g. Vercel free
// plan where you just paste a DATABASE_URL and click Deploy).
//
// These have to run BEFORE `createEnv` so Zod sees the populated values, AND
// before Prisma initialises so `prisma.datasource.directUrl = env("DIRECT_URL")`
// resolves.
// ---------------------------------------------------------------------------
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}
if (!process.env.NEXT_PUBLIC_APP_URL) {
  if (process.env.VERCEL_URL) {
    process.env.NEXT_PUBLIC_APP_URL = `https://${process.env.VERCEL_URL}`;
  } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    process.env.NEXT_PUBLIC_APP_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
}

const optionalNonEmpty = z
  .string()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const env = createEnv({
  server: {
    // Required: the storefront cannot render without a database.
    DATABASE_URL: z.string().url(),

    // Optional: falls back to DATABASE_URL above. Set the Neon "direct"
    // (non-pooled) URL here if you'll run migrations from the same project.
    DIRECT_URL: z.string().url().optional(),

    // Optional but STRONGLY recommended in production. Without it, Auth.js
    // refuses to sign JWTs and sign-in/sign-up routes will 500 at request
    // time (but the rest of the site still works).
    AUTH_SECRET: z.string().min(32).optional(),
    AUTH_URL: z.string().url().optional(),
    AUTH_TRUST_HOST: optionalNonEmpty,

    AUTH_GOOGLE_ID: optionalNonEmpty,
    AUTH_GOOGLE_SECRET: optionalNonEmpty,
    AUTH_GITHUB_ID: optionalNonEmpty,
    AUTH_GITHUB_SECRET: optionalNonEmpty,

    // Razorpay — all optional. When unset, the checkout page renders normally
    // but the "Pay" button returns a friendly "Payments not configured" error.
    RAZORPAY_KEY_ID: z.string().startsWith("rzp_").optional(),
    RAZORPAY_KEY_SECRET: z.string().min(10).optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(10).optional(),

    RESEND_API_KEY: z.string().startsWith("re_").optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),

    CLOUDINARY_CLOUD_NAME: optionalNonEmpty,
    CLOUDINARY_API_KEY: optionalNonEmpty,
    CLOUDINARY_API_SECRET: optionalNonEmpty,

    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: optionalNonEmpty,

    SENTRY_DSN: optionalNonEmpty,

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  client: {
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().startsWith("rzp_").optional(),
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: optionalNonEmpty,
    NEXT_PUBLIC_SENTRY_DSN: optionalNonEmpty,
    NEXT_PUBLIC_POSTHOG_KEY: optionalNonEmpty,
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_APP_NAME: z.string().default("DoothaHub Store"),
    NEXT_PUBLIC_PICKUP_LOCATION_NAME: optionalNonEmpty,
    NEXT_PUBLIC_PICKUP_ADDRESS: optionalNonEmpty,
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_PICKUP_LOCATION_NAME:
      process.env.NEXT_PUBLIC_PICKUP_LOCATION_NAME,
    NEXT_PUBLIC_PICKUP_ADDRESS: process.env.NEXT_PUBLIC_PICKUP_ADDRESS,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

/**
 * True when Razorpay credentials are fully wired. Use this from server actions
 * to short-circuit with a friendly error instead of throwing deep in the SDK.
 */
export const isRazorpayConfigured = Boolean(
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET,
);

/** Cash on delivery at checkout. Set COD_ENABLED=false to disable. */
export const isCodEnabled = process.env.COD_ENABLED !== "false";

/** Store pickup at checkout. Set PICKUP_ENABLED=false to disable. */
export const isPickupEnabled = process.env.PICKUP_ENABLED !== "false";

export const pickupLocationName =
  process.env.NEXT_PUBLIC_PICKUP_LOCATION_NAME?.trim() ||
  "DoothaHub Store";

export const pickupLocationAddress =
  process.env.NEXT_PUBLIC_PICKUP_ADDRESS?.trim() || "";
