import "server-only";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function verifyCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);
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
