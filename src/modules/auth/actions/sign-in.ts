"use server";

import { signInSchema } from "@/modules/auth/schemas/credentials";
import { signIn } from "@/modules/auth/config";
import { authLimiter } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { AuthError } from "next-auth";

export type SignInState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") ?? "anon";
  const rl = await authLimiter.limit(`signin:${ip}`);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid credentials",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/account",
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Invalid email or password" };
    }
    throw err;
  }
}
