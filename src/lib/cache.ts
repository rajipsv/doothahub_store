import "server-only";
import { revalidateTag } from "next/cache";

export const cacheTags = {
  products: "products",
  product: (slug: string) => `product:${slug}`,
  categories: "categories",
  category: (slug: string) => `category:${slug}`,
  cart: (id: string) => `cart:${id}`,
  order: (id: string) => `order:${id}`,
  userOrders: (userId: string) => `orders:user:${userId}`,
  adminDashboard: "admin:dashboard",
} as const;

export function bustProductCaches(slug?: string) {
  revalidateTag(cacheTags.products);
  if (slug) revalidateTag(cacheTags.product(slug));
}

export function bustCategoryCaches(slug?: string) {
  revalidateTag(cacheTags.categories);
  if (slug) revalidateTag(cacheTags.category(slug));
}

export function bustCartCache(id: string) {
  revalidateTag(cacheTags.cart(id));
}

export function bustOrderCaches(id: string, userId?: string) {
  revalidateTag(cacheTags.order(id));
  if (userId) revalidateTag(cacheTags.userOrders(userId));
  revalidateTag(cacheTags.adminDashboard);
}
