import "server-only";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email: email.toLowerCase() } });
}

/**
 * Returns the user when credentials match, null when they don't,
 * and null (with a log) when something *infrastructural* breaks
 * (DB unreachable, users table missing, etc.). Auth.js treats any
 * thrown error from `authorize` as a 500 — for sign-in we always
 * want a clean "invalid credentials" instead.
 */
export async function verifyCredentials(email: string, password: string) {
  let user: Awaited<ReturnType<typeof findUserByEmail>> = null;
  try {
    user = await findUserByEmail(email);
  } catch (err) {
    console.warn(
      "[auth] verifyCredentials: lookup failed (DB issue?)",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
  if (!user || !user.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export async function createUserWithPassword(args: {
  name: string;
  email: string;
  password: string;
}) {
  const email = args.email.toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Email already in use");
  const passwordHash = await bcrypt.hash(args.password, 10);
  return db.user.create({
    data: {
      email,
      name: args.name,
      passwordHash,
      role: Role.CUSTOMER,
    },
  });
}
