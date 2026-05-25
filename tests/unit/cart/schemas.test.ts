import { describe, expect, it } from "vitest";
import {
  addItemSchema,
  updateItemSchema,
  applyCouponSchema,
} from "@/modules/cart/schemas/cart";

describe("cart schemas", () => {
  it("accepts a valid add item payload", () => {
    const r = addItemSchema.safeParse({
      variantId: "11111111-1111-1111-1111-111111111111",
      quantity: "2",
    });
    expect(r.success).toBe(true);
    expect(r.data?.quantity).toBe(2);
  });

  it("clamps quantity to 50", () => {
    const r = addItemSchema.safeParse({
      variantId: "11111111-1111-1111-1111-111111111111",
      quantity: "999",
    });
    expect(r.success).toBe(false);
  });

  it("allows quantity zero on update (remove)", () => {
    const r = updateItemSchema.safeParse({
      itemId: "11111111-1111-1111-1111-111111111111",
      quantity: "0",
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty coupon code", () => {
    const r = applyCouponSchema.safeParse({ code: "" });
    expect(r.success).toBe(false);
  });
});
