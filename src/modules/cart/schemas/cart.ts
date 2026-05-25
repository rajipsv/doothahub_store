import { z } from "zod";

export const addItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().max(50).default(1),
});
export type AddItemInput = z.infer<typeof addItemSchema>;

export const updateItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(0).max(50),
});
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export const removeItemSchema = z.object({
  itemId: z.string().uuid(),
});

export const applyCouponSchema = z.object({
  code: z.string().min(2).max(40),
});
