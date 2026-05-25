"use server";

import { signUpSchema } from "@/modules/auth/schemas/credentials";
import { createUserWithPassword } from "@/modules/auth/services/users";
import { signIn } from "@/modules/auth/config";
import { authLimiter } from "@/lib/rate-limit";
import { headers } from "next/headers";

export type SignUpState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function signUpAction(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") ?? "anon";
  const rl = await authLimiter.limit(`signup:${ip}`);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createUserWithPassword({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/account",
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sign-up failed";
    return { ok: false, error: msg };
  }
}
