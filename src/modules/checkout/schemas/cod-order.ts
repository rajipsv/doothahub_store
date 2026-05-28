import { z } from "zod";

export const placeCodOrderSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Mobile number is required"),
  line1: z.string().min(2, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  region: z.string().min(1, "State is required"),
  postalCode: z.string().min(4, "PIN code is required"),
  country: z.string().length(2).default("IN"),
});

export type PlaceCodOrderInput = z.infer<typeof placeCodOrderSchema>;
