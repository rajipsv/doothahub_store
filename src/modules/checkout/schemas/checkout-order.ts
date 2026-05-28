import { z } from "zod";
import { findPickupSlotById } from "@/modules/checkout/lib/pickup-slots";

export const fulfillmentTypeSchema = z.enum(["DELIVERY", "PICKUP"]);

const contactFields = {
  email: z.string().email(),
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Mobile number is required"),
};

export const placeCodOrderSchema = z
  .object({
    ...contactFields,
    fulfillmentType: fulfillmentTypeSchema.default("DELIVERY"),
    pickupSlotId: z.string().optional(),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().length(2).default("IN"),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentType === "PICKUP") {
      if (!data.pickupSlotId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a pickup time",
          path: ["pickupSlotId"],
        });
        return;
      }
      if (!findPickupSlotById(data.pickupSlotId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pickup time is no longer available",
          path: ["pickupSlotId"],
        });
      }
      return;
    }

    if (!data.line1?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address is required",
        path: ["line1"],
      });
    }
    if (!data.city?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "City is required",
        path: ["city"],
      });
    }
    if (!data.region?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "State is required",
        path: ["region"],
      });
    }
    if (!data.postalCode?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PIN code is required",
        path: ["postalCode"],
      });
    }
  });

export type PlaceCodOrderInput = z.infer<typeof placeCodOrderSchema>;

export const checkoutFulfillmentSchema = z
  .object({
    fulfillmentType: fulfillmentTypeSchema.default("DELIVERY"),
    pickupSlotId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentType === "PICKUP") {
      if (!data.pickupSlotId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a pickup time",
          path: ["pickupSlotId"],
        });
        return;
      }
      if (!findPickupSlotById(data.pickupSlotId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pickup time is no longer available",
          path: ["pickupSlotId"],
        });
      }
    }
  });
