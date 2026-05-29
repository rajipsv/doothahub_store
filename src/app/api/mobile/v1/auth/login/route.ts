import type { NextRequest } from "next/server";
import { signInSchema } from "@doothahub/shared";
import { verifyCredentials } from "@/modules/auth/services/users";
import { signMobileTokenPair } from "@/lib/mobile-auth";
import { mergeCartSessionIntoUser } from "@/modules/cart";
import {
  mobileError,
  mobileJson,
  mobileOptions,
  withMobileCors,
} from "@/lib/mobile-api";
import { serializeUser } from "@/lib/mobile-serializers";
import { authLimiter } from "@/lib/rate-limit";
import { CART_SESSION_HEADER } from "@/modules/cart/lib/cart-access";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = await authLimiter.limit(`mobile-login:${ip}`);
  if (!rl.success) {
    return withMobileCors(req, mobileError("Too many attempts", 429));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withMobileCors(req, mobileError("Invalid JSON", 400));
  }

  const loginParsed = signInSchema.safeParse(body);
  if (!loginParsed.success) {
    return withMobileCors(req, mobileError("Invalid email or password", 400));
  }

  const user = await verifyCredentials(
    loginParsed.data.email,
    loginParsed.data.password,
  );
  if (!user) {
    return withMobileCors(req, mobileError("Invalid email or password", 401));
  }

  const sessionKey = req.headers.get(CART_SESSION_HEADER);
  if (sessionKey) {
    await mergeCartSessionIntoUser(user.id, sessionKey);
  }

  const tokens = await signMobileTokenPair({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return withMobileCors(
    req,
    mobileJson({
      ok: true,
      user: serializeUser(user),
      ...tokens,
    }),
  );
}
