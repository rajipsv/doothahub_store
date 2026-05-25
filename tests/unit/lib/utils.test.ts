import { describe, expect, it } from "vitest";
import { cn, formatMoney, slugify } from "@/lib/utils";

describe("lib/utils", () => {
  it("cn merges classes deduping tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("formatMoney defaults to INR with en-IN locale", () => {
    expect(formatMoney(259900)).toMatch(/2,?599\.00/);
    expect(formatMoney(259900)).toContain("\u20B9");
  });

  it("formatMoney accepts an explicit currency", () => {
    expect(formatMoney(2599, "USD")).toBe("$25.99");
  });

  it("slugify normalises strings", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
    expect(slugify("  many   spaces  ")).toBe("many-spaces");
  });
});
