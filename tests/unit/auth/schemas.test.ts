import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "@/modules/auth";

describe("auth schemas", () => {
  it("rejects weak passwords on sign-up", () => {
    const r = signUpSchema.safeParse({
      name: "Demo",
      email: "demo@example.com",
      password: "weakpass",
      confirmPassword: "weakpass",
    });
    expect(r.success).toBe(false);
  });

  it("requires matching confirm password", () => {
    const r = signUpSchema.safeParse({
      name: "Demo",
      email: "demo@example.com",
      password: "Strong1Password",
      confirmPassword: "Different1Password",
    });
    expect(r.success).toBe(false);
  });

  it("accepts a strong, matching password", () => {
    const r = signUpSchema.safeParse({
      name: "Demo",
      email: "demo@example.com",
      password: "Strong1Password",
      confirmPassword: "Strong1Password",
    });
    expect(r.success).toBe(true);
  });

  it("validates basic sign-in", () => {
    const r = signInSchema.safeParse({
      email: "user@example.com",
      password: "Strong1Password",
    });
    expect(r.success).toBe(true);
  });
});
