import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import {
  CART_SESSION_HEADER,
  mobileCartAccess,
  type CartAccess,
} from "@/modules/cart/lib/cart-access";

const CORS_ORIGINS = [
  "http://localhost:8081",
  "http://localhost:19006",
  "exp://localhost:8081",
];

export function mobileJson<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function mobileError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function withMobileCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin");
  if (origin && (CORS_ORIGINS.includes(origin) || origin.startsWith("exp://"))) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
  } else if (process.env.NODE_ENV === "development") {
    res.headers.set("Access-Control-Allow-Origin", "*");
  }
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Cart-Session",
  );
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS",
  );
  return res;
}

export function mobileOptions(req: NextRequest) {
  return withMobileCors(req, new NextResponse(null, { status: 204 }));
}

export async function getMobileUser(req: NextRequest) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  const payload = await verifyMobileToken(token, "access");
  if (!payload) return null;
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}

export async function requireMobileUser(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) return null;
  return user;
}

export function getCartAccessFromRequest(
  req: NextRequest,
  userId: string | null,
): CartAccess {
  const sessionKey = req.headers.get(CART_SESSION_HEADER);
  return mobileCartAccess(userId, sessionKey);
}

export function attachCartSession(
  req: NextRequest,
  res: NextResponse,
  sessionKey: string | null | undefined,
) {
  if (sessionKey) {
    const out = withMobileCors(req, res);
    out.headers.set(CART_SESSION_HEADER, sessionKey);
    return out;
  }
  return withMobileCors(req, res);
}
