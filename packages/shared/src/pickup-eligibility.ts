/** Effective pickup = category allows pickup AND product is marked pickup-eligible. */
export function isPickupEligible(args: {
  productPickupEligible: boolean;
  categoryPickupEligible: boolean;
}): boolean {
  return args.categoryPickupEligible && args.productPickupEligible;
}
