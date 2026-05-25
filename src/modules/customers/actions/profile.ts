"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/auth";
import {
  profileSchema,
  addressSchema,
} from "@/modules/customers/schemas/profile";
import {
  createAddress,
  deleteAddress,
  updateProfile,
} from "@/modules/customers/services/profile";

export async function updateProfileAction(formData: FormData): Promise<void> {
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return;
  const user = await requireUser();
  await updateProfile(user.id, parsed.data);
  revalidatePath("/account");
}

export async function createAddressAction(formData: FormData): Promise<void> {
  const parsed = addressSchema.safeParse({
    fullName: formData.get("fullName"),
    line1: formData.get("line1"),
    line2: formData.get("line2") || undefined,
    city: formData.get("city"),
    region: formData.get("region"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
    phone: formData.get("phone") || undefined,
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) return;
  const user = await requireUser();
  await createAddress(user.id, parsed.data);
  revalidatePath("/account/addresses");
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const user = await requireUser();
  await deleteAddress(user.id, id);
  revalidatePath("/account/addresses");
}
