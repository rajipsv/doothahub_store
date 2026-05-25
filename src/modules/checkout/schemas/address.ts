import { z } from "zod";

export const checkoutSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  line1: z.string().min(2),
  line2: z.string().optional(),
  city: z.string().min(1),
  region: z.string().min(1),
  postalCode: z.string().min(2),
  country: z.string().length(2, "Use 2-letter country code"),
  phone: z.string().optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
