import { describe, expect, it } from "vitest";
import { cn, formatMoney, slugify } from "@/lib/utils";

describe("lib/utils", () => {
  it("cn merges classes deduping tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("formatMoney renders cents as USD", () => {
    expect(formatMoney(2599)).toBe("$25.99");
  });

  it("slugify normalises strings", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
    expect(slugify("  many   spaces  ")).toBe("many-spaces");
  });
});
