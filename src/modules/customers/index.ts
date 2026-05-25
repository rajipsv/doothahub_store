export {
  updateProfile,
  listAddresses,
  createAddress,
  deleteAddress,
} from "@/modules/customers/services/profile";
export {
  updateProfileAction,
  createAddressAction,
  deleteAddressAction,
} from "@/modules/customers/actions/profile";
export {
  profileSchema,
  addressSchema,
  type ProfileInput,
  type AddressInput,
} from "@/modules/customers/schemas/profile";
export { ProfileForm } from "@/modules/customers/components/ProfileForm";
export { AddressForm } from "@/modules/customers/components/AddressForm";
