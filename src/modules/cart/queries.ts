import "server-only";
import { getCart, getCartCount } from "@/modules/cart/services/cart";
import { getOptionalUser } from "@/modules/auth";

export async function getCurrentCart() {
  const user = await getOptionalUser();
  return getCart(user?.id ?? null);
}

export async function getCurrentCartCount() {
  const user = await getOptionalUser();
  return getCartCount(user?.id ?? null);
}
