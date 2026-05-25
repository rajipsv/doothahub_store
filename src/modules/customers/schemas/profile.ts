import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const addressSchema = z.object({
  fullName: z.string().min(2),
  line1: z.string().min(2),
  line2: z.string().optional(),
  city: z.string().min(1),
  region: z.string().min(1),
  postalCode: z.string().min(2),
  country: z.string().length(2),
  phone: z.string().optional(),
  isDefault: z.coerce.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;
