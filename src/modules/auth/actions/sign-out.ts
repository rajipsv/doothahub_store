"use server";

import { signOut } from "@/modules/auth/config";

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
