import "server-only";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { env } from "@/lib/env";

export type MobileTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  type: "access" | "refresh";
};

const ACCESS_TTL = "7d";
const REFRESH_TTL = "30d";

function getSecret(): Uint8Array {
  const secret = env.AUTH_SECRET ?? env.MOBILE_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET (min 32 chars) required for mobile auth");
  }
  return new TextEncoder().encode(secret);
}

export async function signMobileAccessToken(user: {
  id: string;
  email: string;
  role: Role;
}): Promise<string> {
  return new SignJWT({
    email: user.email,
    role: user.role,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(getSecret());
}

export async function signMobileRefreshToken(user: {
  id: string;
  email: string;
  role: Role;
}): Promise<string> {
  return new SignJWT({
    email: user.email,
    role: user.role,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(getSecret());
}

export async function verifyMobileToken(
  token: string,
  expectedType: "access" | "refresh" = "access",
): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== expectedType || typeof payload.sub !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      role: (payload.role as Role) ?? "CUSTOMER",
      type: expectedType,
    };
  } catch {
    return null;
  }
}

export async function signMobileTokenPair(user: {
  id: string;
  email: string;
  role: Role;
}) {
  const [accessToken, refreshToken] = await Promise.all([
    signMobileAccessToken(user),
    signMobileRefreshToken(user),
  ]);
  return { accessToken, refreshToken };
}
