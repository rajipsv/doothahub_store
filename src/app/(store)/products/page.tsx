import type { Metadata } from "next";
import Link from "next/link";
import {
  listProducts,
  productFiltersSchema,
  ProductGrid,
  getCachedCategories,
} from "@/modules/catalog";
import { safeFetch } from "@/lib/utils";

export const metadata: Metadata = { title: "All products" };
export const revalidate = 60;

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const raw = await searchParams;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") flat[k] = v;
    else if (Array.isArray(v) && v[0]) flat[k] = v[0];
  }

  const filters = productFiltersSchema.parse(flat);
  const [{ items, total }, categories] = await Promise.all([
    safeFetch(
      () => listProducts(filters),
      { items: [], total: 0 },
      "products:list",
    ),
    safeFetch(() => getCachedCategories(), [], "products:categories"),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  return (
    <div className="container py-10">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-semibold">Categories</p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  All
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/products?categorySlug=${c.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Sort by</p>
            <ul className="space-y-2">
              <li>
                <Link
                  href={{
                    pathname: "/products",
                    query: { ...flat, sort: "newest" },
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Newest
                </Link>
              </li>
              <li>
                <Link
                  href={{
                    pathname: "/products",
                    query: { ...flat, sort: "price_asc" },
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Price: low to high
                </Link>
              </li>
              <li>
                <Link
                  href={{
                    pathname: "/products",
                    query: { ...flat, sort: "price_desc" },
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Price: high to low
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        <div>
          <div className="mb-6 flex items-baseline justify-between">
            <h1 className="text-2xl font-bold tracking-tight">All products</h1>
            <p className="text-sm text-muted-foreground">{total} items</p>
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg border bg-card p-10 text-center">
              <p className="text-lg font-semibold">No products yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                The catalogue is empty. Seed demo data with
                {" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">pnpm db:seed</code>
                {" "}
                or add products from the admin dashboard.
              </p>
            </div>
          ) : (
            <ProductGrid products={items} />
          )}

          {totalPages > 1 ? (
            <nav className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                return (
                  <Link
                    key={page}
                    href={{
                      pathname: "/products",
                      query: { ...flat, page: String(page) },
                    }}
                    className={
                      page === filters.page
                        ? "rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
                        : "rounded-md px-3 py-1 text-sm hover:bg-accent"
                    }
                  >
                    {page}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
