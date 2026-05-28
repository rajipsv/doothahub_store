import type {
  Brand,
  Category,
  Product,
  ProductImage,
  ProductVariant,
} from "@prisma/client";

export type ProductCardData = Pick<
  Product,
  "id" | "slug" | "title" | "shortDescription" | "pickupEligible"
> & {
  brand: Pick<Brand, "id" | "name" | "slug"> | null;
  category: Pick<Category, "id" | "name" | "slug" | "pickupEligible">;
  images: Pick<ProductImage, "id" | "url" | "alt">[];
  variants: Pick<
    ProductVariant,
    | "id"
    | "priceCents"
    | "comparePriceCents"
    | "currency"
    | "weightGrams"
    | "attributes"
  >[];
};

export type ProductDetail = Product & {
  brand: Brand | null;
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
};

export type CategoryNode = Category & {
  children: Category[];
};

export type ProductFilters = {
  q?: string;
  categorySlug?: string;
  brandSlug?: string;
  minCents?: number;
  maxCents?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
};
