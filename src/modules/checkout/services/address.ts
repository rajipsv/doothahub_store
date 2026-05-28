import "server-only";
import { db } from "@/lib/db";
import type { CheckoutInput } from "@/modules/checkout/schemas/address";

export async function createCheckoutAddress(args: {
  userId: string | null;
  input: CheckoutInput;
}) {
  return db.address.create({
    data: {
      userId: args.userId,
      fullName: args.input.fullName,
      line1: args.input.line1,
      line2: args.input.line2,
      city: args.input.city,
      region: args.input.region,
      postalCode: args.input.postalCode,
      country: args.input.country.toUpperCase(),
      phone: args.input.phone,
    },
  });
}
