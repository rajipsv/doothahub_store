import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCachedProductBySlug,
  ProductDetail,
} from "@/modules/catalog";
import { JsonLd } from "@/components/seo/JsonLd";
import { addItemAction } from "@/modules/cart";
import { absoluteUrl, formatMoney, safeFetch } from "@/lib/utils";

// On-demand ISR: first request renders + caches, subsequent requests hit
// the cache for `revalidate` seconds. Avoids slurping the whole catalog
// at build time and works for a changing inventory.
export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await safeFetch(
    () => getCachedProductBySlug(slug),
    null,
    `product:metadata:${slug}`,
  );
  if (!product) return { title: "Not found" };
  return {
    title: product.seoTitle ?? product.title,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    openGraph: {
      title: product.title,
      description: product.shortDescription ?? undefined,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
    alternates: { canonical: `/products/${product.slug}` },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await safeFetch(
    () => getCachedProductBySlug(slug),
    null,
    `product:${slug}`,
  );
  if (!product) notFound();

  const variant = product.variants[0];
  const productLd = variant
    ? {
        "@context": "https://schema.org/",
        "@type": "Product",
        name: product.title,
        description: product.description,
        image: product.images.map((i) => i.url),
        sku: variant.sku,
        brand: product.brand
          ? { "@type": "Brand", name: product.brand.name }
          : undefined,
        offers: {
          "@type": "Offer",
          url: absoluteUrl(`/products/${product.slug}`),
          priceCurrency: variant.currency,
          price: (variant.priceCents / 100).toFixed(2),
          availability:
            variant.inventoryQty > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
      }
    : null;

  const breadcrumbLd = {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category.name,
        item: absoluteUrl(`/categories/${product.category.slug}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: absoluteUrl(`/products/${product.slug}`),
      },
    ],
  };

  async function handleAdd(variantId: string, quantity: number) {
    "use server";
    const fd = new FormData();
    fd.set("variantId", variantId);
    fd.set("quantity", String(quantity));
    await addItemAction(fd);
  }

  return (
    <div className="container py-10">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">
          Home
        </Link>{" "}
        /{" "}
        <Link
          href={`/categories/${product.category.slug}`}
          className="hover:underline"
        >
          {product.category.name}
        </Link>{" "}
        / <span className="text-foreground">{product.title}</span>
      </nav>

      <ProductDetail product={product} onAddToCart={handleAdd} />

      {productLd ? <JsonLd data={productLd} /> : null}
      <JsonLd data={breadcrumbLd} />

      <p className="sr-only">
        Price from {variant ? formatMoney(variant.priceCents, variant.currency) : ""}
      </p>
    </div>
  );
}
