import type { NextRequest } from "next/server";
import { verifyMobileToken, signMobileTokenPair } from "@/lib/mobile-auth";
import { findUserByEmail } from "@/modules/auth/services/users";
import {
  mobileError,
  mobileJson,
  mobileOptions,
  withMobileCors,
} from "@/lib/mobile-api";
import { serializeUser } from "@/lib/mobile-serializers";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function POST(req: NextRequest) {
  let body: { refreshToken?: string };
  try {
    body = await req.json();
  } catch {
    return withMobileCors(req, mobileError("Invalid JSON", 400));
  }

  if (!body.refreshToken) {
    return withMobileCors(req, mobileError("refreshToken required", 400));
  }

  const payload = await verifyMobileToken(body.refreshToken, "refresh");
  if (!payload) {
    return withMobileCors(req, mobileError("Invalid refresh token", 401));
  }

  const user = await findUserByEmail(payload.email);
  if (!user) {
    return withMobileCors(req, mobileError("User not found", 401));
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
