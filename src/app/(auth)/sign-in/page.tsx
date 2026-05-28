import type { Metadata } from "next";
import { SignInForm, AuthHealthNotice } from "@/modules/auth";
import { sanitizeCallbackUrl } from "@/modules/auth/lib/safe-callback-url";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl: callbackUrlRaw } = await searchParams;
  const callbackUrl = callbackUrlRaw
    ? sanitizeCallbackUrl(callbackUrlRaw, "/products")
    : undefined;

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to continue shopping.
        </p>
      </div>
      <AuthHealthNotice />
      <SignInForm callbackUrl={callbackUrl} />
    </div>
  );
}
