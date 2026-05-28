/**
 * Fix common Cloudinary URL mistakes so next/image can load them.
 */
export function normalizeProductImageUrl(url: string): string {
  return url
    .replace("res-console.cloudinary.com", "res.cloudinary.com")
    .trim();
}
