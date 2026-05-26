import type { Metadata } from "next";
import { SignUpForm, AuthHealthNotice } from "@/modules/auth";

export const metadata: Metadata = { title: "Create an account" };
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start shopping in seconds.
        </p>
      </div>
      <AuthHealthNotice />
      <SignUpForm />
    </div>
  );
}
