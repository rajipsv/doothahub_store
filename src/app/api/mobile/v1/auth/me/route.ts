import type { NextRequest } from "next/server";
import { getMobileUser, mobileError, mobileJson, mobileOptions, withMobileCors } from "@/lib/mobile-api";
import { serializeUser } from "@/lib/mobile-serializers";
import { findUserByEmail } from "@/modules/auth/services/users";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export function OPTIONS(req: NextRequest) {
  return mobileOptions(req);
}

export async function GET(req: NextRequest) {
  const authUser = await getMobileUser(req);
  if (!authUser) {
    return withMobileCors(req, mobileError("Unauthorized", 401));
  }

  const user = await db.user.findUnique({ where: { id: authUser.id } });
  if (!user) {
    return withMobileCors(req, mobileError("User not found", 404));
  }

  return withMobileCors(req, mobileJson({ ok: true, user: serializeUser(user) }));
}
