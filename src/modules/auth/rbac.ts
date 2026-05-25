import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/modules/auth/config";
import type { Role } from "@prisma/client";

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

export async function getOptionalUser() {
  const session = await auth();
  return session?.user ?? null;
}
