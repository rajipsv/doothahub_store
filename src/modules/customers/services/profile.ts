import "server-only";
import { db } from "@/lib/db";
import type { ProfileInput, AddressInput } from "@/modules/customers/schemas/profile";

export async function updateProfile(userId: string, input: ProfileInput) {
  return db.user.update({
    where: { id: userId },
    data: { name: input.name, phone: input.phone },
  });
}

export async function listAddresses(userId: string) {
  return db.address.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createAddress(userId: string, input: AddressInput) {
  if (input.isDefault) {
    await db.address.updateMany({
      where: { userId, deletedAt: null },
      data: { isDefault: false },
    });
  }
  return db.address.create({
    data: {
      userId,
      fullName: input.fullName,
      line1: input.line1,
      line2: input.line2,
      city: input.city,
      region: input.region,
      postalCode: input.postalCode,
      country: input.country.toUpperCase(),
      phone: input.phone,
      isDefault: input.isDefault,
    },
  });
}

export async function deleteAddress(userId: string, id: string) {
  const addr = await db.address.findFirst({ where: { id, userId } });
  if (!addr) return;
  await db.address.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
