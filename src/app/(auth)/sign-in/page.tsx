import type { Metadata } from "next";
import { SignInForm, AuthHealthNotice } from "@/modules/auth";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to continue shopping.
        </p>
      </div>
      <AuthHealthNotice />
      <SignInForm />
    </div>
  );
}
