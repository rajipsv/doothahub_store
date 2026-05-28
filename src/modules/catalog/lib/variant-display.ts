const SLUG_PACK_SIZE_RE = /-(\d+(?:\.\d+)?g)$/i;

const ATTR_PRIORITY = ["weight", "size", "pack", "packSize"] as const;

function normalizeAttrValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "default") return null;
  return trimmed;
}

export function packSizeFromSlug(slug: string): string | null {
  const m = slug.match(SLUG_PACK_SIZE_RE);
  if (!m?.[1]) return null;
  return m[1].toLowerCase();
}

export function getVariantDisplayLabel(input: {
  attributes?: Record<string, unknown> | null;
  slug?: string;
  weightGrams?: number | null;
}): string | null {
  const attrs = input.attributes ?? {};

  for (const key of ATTR_PRIORITY) {
    const label = normalizeAttrValue(attrs[key]);
    if (label) return label;
  }

  for (const [key, value] of Object.entries(attrs)) {
    if (ATTR_PRIORITY.includes(key as (typeof ATTR_PRIORITY)[number])) continue;
    const label = normalizeAttrValue(value);
    if (label) return label;
  }

  if (input.weightGrams != null && input.weightGrams > 0) {
    return `${input.weightGrams} g`;
  }

  if (input.slug) {
    return packSizeFromSlug(input.slug);
  }

  return null;
}
