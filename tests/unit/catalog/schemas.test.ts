import { describe, expect, it } from "vitest";
import {
  productFiltersSchema,
  productCreateSchema,
} from "@/modules/catalog";

describe("catalog schemas", () => {
  it("parses default product filters", () => {
    const parsed = productFiltersSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(24);
    expect(parsed.sort).toBe("newest");
  });

  it("coerces numeric query params", () => {
    const parsed = productFiltersSchema.parse({ page: "3", minCents: "1000" });
    expect(parsed.page).toBe(3);
    expect(parsed.minCents).toBe(1000);
  });

  it("rejects invalid slug on product create", () => {
    const r = productCreateSchema.safeParse({
      title: "Test",
      slug: "Has Spaces",
      description: "Long enough description",
      categoryId: "00000000-0000-0000-0000-000000000000",
      variants: [{ sku: "X", priceCents: 100, inventoryQty: 1, attributes: {} }],
      images: [],
    });
    expect(r.success).toBe(false);
  });

  it("requires at least one variant on product create", () => {
    const r = productCreateSchema.safeParse({
      title: "Test",
      slug: "test-product",
      description: "Long enough description",
      categoryId: "00000000-0000-0000-0000-000000000000",
      variants: [],
      images: [],
    });
    expect(r.success).toBe(false);
  });
});
