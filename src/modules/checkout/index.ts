/** Client-safe exports. Server helpers live under actions/ and services/. */
export { CheckoutForm } from "@/modules/checkout/components/CheckoutForm";
export { buildPickupSlots } from "@/modules/checkout/lib/pickup-slots";
export type { PickupSlot } from "@/modules/checkout/lib/pickup-slots";
export { createCheckoutAddress } from "@/modules/checkout/services/address";
export {
  placeCodOrderSchema,
  onlineCheckoutFulfillmentSchema,
  type PlaceCodOrderInput,
} from "@/modules/checkout/schemas/checkout-order";
