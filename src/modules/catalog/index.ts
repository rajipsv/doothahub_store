export {
  listProducts,
  getProductBySlug,
  listFeaturedProducts,
  listAllProductSlugs,
} from "@/modules/catalog/services/products";
export {
  listCategories,
  getCategoryBySlug,
  listBrands,
} from "@/modules/catalog/services/categories";
export { searchProducts, type SearchHit } from "@/modules/catalog/services/search";
export {
  getCachedFeaturedProducts,
  getCachedProductBySlug,
  getCachedCategories,
  getCachedBrands,
  getCachedCategoryBySlug,
  listProductsForCategory,
} from "@/modules/catalog/queries";
export {
  productCreateSchema,
  productUpdateSchema,
  productFiltersSchema,
  type ProductCreateInput,
  type ProductUpdateInput,
  type ProductFiltersInput,
} from "@/modules/catalog/schemas/product";
export type {
  ProductCardData,
  ProductDetail as ProductDetailData,
  CategoryNode,
  ProductFilters,
} from "@/modules/catalog/types";
export { ProductCard } from "@/modules/catalog/components/ProductCard";
export { ProductGrid } from "@/modules/catalog/components/ProductGrid";
export { ProductDetail } from "@/modules/catalog/components/ProductDetail";
export { ProductImageGallery } from "@/modules/catalog/components/ProductImageGallery";
export { VariantPicker } from "@/modules/catalog/components/VariantPicker";
export { PriceTag } from "@/modules/catalog/components/PriceTag";
export { CategoryTree } from "@/modules/catalog/components/CategoryTree";
export {
  getVariantDisplayLabel,
  packSizeFromSlug,
} from "@/modules/catalog/lib/variant-display";
