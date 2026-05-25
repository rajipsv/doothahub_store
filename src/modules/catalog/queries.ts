import "server-only";
import { unstable_cache } from "next/cache";
import { cacheTags } from "@/lib/cache";
import {
  getProductBySlug,
  listFeaturedProducts,
  listProducts,
} from "@/modules/catalog/services/products";
import {
  getCategoryBySlug,
  listCategories,
  listBrands,
} from "@/modules/catalog/services/categories";
import type { ProductFiltersInput } from "@/modules/catalog/schemas/product";

export const getCachedFeaturedProducts = unstable_cache(
  async (limit = 8) => listFeaturedProducts(limit),
  ["catalog:featured"],
  { tags: [cacheTags.products], revalidate: 300 },
);

export const getCachedProductBySlug = (slug: string) =>
  unstable_cache(
    () => getProductBySlug(slug),
    ["catalog:product", slug],
    { tags: [cacheTags.products, cacheTags.product(slug)], revalidate: 300 },
  )();

export const getCachedCategories = unstable_cache(
  async () => listCategories(),
  ["catalog:categories"],
  { tags: [cacheTags.categories], revalidate: 600 },
);

export const getCachedBrands = unstable_cache(
  async () => listBrands(),
  ["catalog:brands"],
  { tags: [cacheTags.categories], revalidate: 600 },
);

export const getCachedCategoryBySlug = (slug: string) =>
  unstable_cache(
    () => getCategoryBySlug(slug),
    ["catalog:category", slug],
    { tags: [cacheTags.categories, cacheTags.category(slug)], revalidate: 600 },
  )();

export async function listProductsForCategory(
  slug: string,
  filters: Omit<ProductFiltersInput, "categorySlug">,
) {
  return listProducts({ ...filters, categorySlug: slug });
}

export { listProducts };
