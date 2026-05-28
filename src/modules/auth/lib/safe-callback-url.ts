/**
 * Allow only same-site relative paths (blocks open redirects).
 */
export function sanitizeCallbackUrl(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (!raw || typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (trimmed.length > 512) return fallback;
  return trimmed;
}
