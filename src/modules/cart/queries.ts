import "server-only";
import { getCart, getCartCount } from "@/modules/cart/services/cart";
import { getOptionalUser } from "@/modules/auth";
import { logger } from "@/lib/logger";

export async function getCurrentCart() {
  const user = await getOptionalUser();
  return getCart(user?.id ?? null);
}

/**
 * Used in the global Header; must never throw or the whole site fails to
 * render. Returns 0 on any failure and logs the cause for debugging.
 */
export async function getCurrentCartCount() {
  try {
    const user = await getOptionalUser();
    return await getCartCount(user?.id ?? null);
  } catch (err) {
    logger.warn("getCurrentCartCount failed; defaulting to 0", {
      err: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}
