import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCachedCategoryBySlug,
  listProductsForCategory,
  productFiltersSchema,
  ProductGrid,
} from "@/modules/catalog";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCachedCategoryBySlug(slug);
  if (!cat) return { title: "Not found" };
  return {
    title: cat.name,
    description: `Shop ${cat.name} at DoothaHub Store.`,
    alternates: { canonical: `/categories/${cat.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") flat[k] = v;
    else if (Array.isArray(v) && v[0]) flat[k] = v[0];
  }
  const filters = productFiltersSchema.parse(flat);

  const cat = await getCachedCategoryBySlug(slug);
  if (!cat) notFound();

  const { items, total } = await listProductsForCategory(slug, filters);

  return (
    <div className="container py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{cat.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} products</p>
      </header>
      <ProductGrid products={items} />
    </div>
  );
}
