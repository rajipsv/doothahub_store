import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amountMinor: number, currency = "INR"): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normalise a variant size label for use in a SKU (uppercase, hyphen-separated). */
export function normalizeSizeForSku(size: string): string {
  const normalized = size
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "DEFAULT";
}

/**
 * Build a stock-keeping unit from product slug + variant size.
 * Matches the seed script pattern: `DEMO-PRODUCT-1-M`.
 * @param suffix When set (e.g. 2), appends `-2` for duplicate sizes in the same product.
 */
export function buildVariantSku(
  slug: string,
  size: string,
  suffix?: number,
): string {
  const baseSlug = slug
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!baseSlug) return "";

  const base = `${baseSlug}-${normalizeSizeForSku(size)}`;
  if (suffix != null && suffix > 1) return `${base}-${suffix}`;
  return base;
}

export function absoluteUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

/**
 * Run an async data-fetch and fall back to a default value on failure.
 * Used by public storefront pages so a transient infrastructure issue
 * (DB tables not pushed yet, Neon paused, etc.) renders an empty state
 * instead of crashing the whole route. The cause is logged to stderr so
 * it still shows up in Vercel function logs for debugging.
 *
 * Do NOT use this in payment / checkout / admin paths where silent
 * fallbacks would mask correctness bugs — let those errors surface.
 */
export async function safeFetch<T>(
  fn: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[safeFetch] ${label} failed, using fallback:`, msg);
    return fallback;
  }
}
