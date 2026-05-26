import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/modules/auth/config";
import type { Role } from "@prisma/client";
import { logger } from "@/lib/logger";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return session.user;
}

export async function requireRole(role: Role | Role[]) {
  const user = await requireUser();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

/**
 * Public, anonymous-friendly user lookup. Used from the layout / Header so
 * a misconfiguration (e.g. missing AUTH_SECRET, unreachable DB) doesn't
 * crash the whole page. Always returns null on failure and logs the cause
 * so it still shows up in Vercel function logs for debugging.
 */
export async function getOptionalUser() {
  try {
    const session = await auth();
    return session?.user ?? null;
  } catch (err) {
    logger.warn("getOptionalUser failed; treating as anonymous", {
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
