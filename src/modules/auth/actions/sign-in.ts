"use server";

import { signInSchema } from "@/modules/auth/schemas/credentials";
import { signIn } from "@/modules/auth/config";
import { verifyCredentials } from "@/modules/auth/services/users";
import { authLimiter } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { sanitizeCallbackUrl } from "@/modules/auth/lib/safe-callback-url";

function destinationForRole(role: string | null | undefined): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "SELLER":
      return "/admin/products";
    case "SUPPORT":
      return "/admin/orders";
    default:
      return "/products";
  }
}

function resolveRedirectTo(
  role: string | null | undefined,
  callbackUrl: string | undefined,
): string {
  const defaultDest = destinationForRole(role);
  return sanitizeCallbackUrl(callbackUrl, defaultDest);
}

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
  const callbackRaw =
    typeof raw.callbackUrl === "string" ? raw.callbackUrl : undefined;
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid credentials",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Pre-resolve the user so we know the destination *before* triggering
  // the redirect. signIn() throws NEXT_REDIRECT on success, so we can't
  // read anything after calling it.
  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return { ok: false, error: "Invalid email or password" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: resolveRedirectTo(user.role, callbackRaw),
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Invalid email or password" };
    }
    throw err;
  }
}
