import "server-only";

/** How the caller identifies the shopper for cart reads/writes. */
export type CartAccess = {
  userId: string | null;
  /** Guest cart session (mobile `X-Cart-Session` header). */
  sessionKey?: string | null;
  /** When true, fall back to httpOnly cookie for guest session (web). */
  useCookie?: boolean;
};

export const CART_SESSION_HEADER = "x-cart-session";

export function mobileCartAccess(
  userId: string | null,
  sessionKey: string | null | undefined,
): CartAccess {
  return { userId, sessionKey: sessionKey ?? null, useCookie: false };
}

export function webCartAccess(userId: string | null): CartAccess {
  return { userId, useCookie: true };
}
