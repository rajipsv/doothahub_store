import { z } from "zod";

export const productCreateSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().min(10),
  shortDescription: z.string().max(280).optional(),
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  pickupEligible: z.boolean().default(false),
  seoTitle: z.string().max(80).optional(),
  seoDescription: z.string().max(160).optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().optional(),
      }),
    )
    .default([]),
  variants: z
    .array(
      z.object({
        sku: z.string().min(1),
        priceCents: z.number().int().nonnegative(),
        comparePriceCents: z.number().int().nonnegative().optional(),
        inventoryQty: z.number().int().nonnegative().default(0),
        attributes: z.record(z.string()).default({}),
      }),
    )
    .min(1, "At least one variant is required"),
});
export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.partial().extend({
  id: z.string().uuid(),
});
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const productFiltersSchema = z.object({
  q: z.string().optional(),
  categorySlug: z.string().optional(),
  brandSlug: z.string().optional(),
  minCents: z.coerce.number().int().nonnegative().optional(),
  maxCents: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(60).default(24),
});
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>;
