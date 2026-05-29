import * as SecureStore from "expo-secure-store";
import { API_BASE } from "./config";

const ACCESS_KEY = "doothahub_access_token";
const REFRESH_KEY = "doothahub_refresh_token";
const CART_SESSION_KEY = "doothahub_cart_session";

export type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export type ApiError = { ok: false; error: string };
export type ApiSuccess<T> = { ok: true } & T;

let memoryAccessToken: string | null = null;
let memoryCartSession: string | null = null;

export async function getAccessToken() {
  if (memoryAccessToken) return memoryAccessToken;
  memoryAccessToken = await SecureStore.getItemAsync(ACCESS_KEY);
  return memoryAccessToken;
}

export async function getCartSession() {
  if (memoryCartSession) return memoryCartSession;
  memoryCartSession = await SecureStore.getItemAsync(CART_SESSION_KEY);
  return memoryCartSession;
}

export async function saveAuthTokens(access: string, refresh: string) {
  memoryAccessToken = access;
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function saveCartSession(session: string) {
  memoryCartSession = session;
  await SecureStore.setItemAsync(CART_SESSION_KEY, session);
}

export async function clearAuth() {
  memoryAccessToken = null;
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

type FetchOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  cart?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.auth !== false) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (options.cart !== false) {
    const session = await getCartSession();
    if (session) headers["X-Cart-Session"] = session;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const sessionHeader = res.headers.get("X-Cart-Session");
  if (sessionHeader) await saveCartSession(sessionHeader);

  const data = (await res.json()) as T & ApiError;
  if (
    typeof data === "object" &&
    data !== null &&
    "ok" in data &&
    (data as ApiError).ok === false
  ) {
    throw new Error((data as ApiError).error || "Request failed");
  }

  if (!res.ok) {
    throw new Error(
      typeof data === "object" && data !== null && "error" in data
        ? String((data as ApiError).error)
        : `HTTP ${res.status}`,
    );
  }

  return data;
}

export async function login(email: string, password: string) {
  const data = await apiFetch<
    ApiSuccess<{
      user: ApiUser;
      accessToken: string;
      refreshToken: string;
    }>
  >("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  await saveAuthTokens(data.accessToken, data.refreshToken);
  return data.user;
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const data = await apiFetch<
    ApiSuccess<{
      user: ApiUser;
      accessToken: string;
      refreshToken: string;
    }>
  >("/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
  await saveAuthTokens(data.accessToken, data.refreshToken);
  return data.user;
}

export type CartSplitPayload = {
  pickupLines: { cartItemId: string; title: string; quantity: number; lineTotalCents: number }[];
  deliveryLines: { cartItemId: string; title: string; quantity: number; lineTotalCents: number }[];
  pickupSubtotalCents: number;
  deliverySubtotalCents: number;
  pickupTotalCents: number;
  deliveryTotalCents: number;
  combinedTotalCents: number;
  hasPickupLines: boolean;
  hasDeliveryLines: boolean;
  isMixed: boolean;
  allLinesPickupEligible: boolean;
};

export type CartItemPayload = {
  id: string;
  quantity: number;
  variantId: string;
  productId: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  priceCents: number;
  lineTotalCents: number;
  pickupEligible: boolean;
  attributes: unknown;
};

export type CartPayload = {
  id: string;
  items: CartItemPayload[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  itemCount: number;
  split: CartSplitPayload;
};

export type ProductCardPayload = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  imageUrl: string | null;
  priceCents: number;
  comparePriceCents: number | null;
  currency: string;
  variantId: string | null;
  pickupEligible: boolean;
  category: string;
  brand: string | null;
};

export async function fetchCart() {
  return apiFetch<ApiSuccess<{ cart: CartPayload }>>("/cart");
}
