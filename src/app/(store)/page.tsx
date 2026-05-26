import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getCachedFeaturedProducts,
  getCachedCategories,
  ProductGrid,
} from "@/modules/catalog";
import { safeFetch } from "@/lib/utils";

export const revalidate = 300;

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    safeFetch(() => getCachedFeaturedProducts(8), [], "home:featured"),
    safeFetch(() => getCachedCategories(), [], "home:categories"),
  ]);

  const hasContent = featured.length > 0 || categories.length > 0;

  return (
    <div>
      <section className="bg-gradient-to-br from-muted/50 to-background py-16 md:py-24">
        <div className="container text-center">
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            Modern shopping. Built for you.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Discover quality products, fast checkout, and a delightful experience.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/products">Shop now</Link>
            </Button>
            {categories[0] ? (
              <Button asChild size="lg" variant="outline">
                <Link href={`/categories/${categories[0].slug}`}>
                  Browse categories
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="container py-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Shop by category
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="rounded-lg border bg-card p-6 text-center transition-colors hover:bg-accent"
              >
                <p className="font-semibold">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section className="container py-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              Featured products
            </h2>
            <Button asChild variant="link">
              <Link href="/products">View all</Link>
            </Button>
          </div>
          <ProductGrid products={featured} />
        </section>
      ) : null}

      {!hasContent ? (
        <section className="container py-20">
          <div className="mx-auto max-w-xl rounded-lg border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold">No products yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your storefront is live, but the catalogue is empty.
            </p>
            <div className="mt-6 rounded-md border bg-muted p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Quickest way to populate it
              </p>
              <pre className="mt-2 overflow-x-auto text-xs">
{`# locally, with your production DATABASE_URL in .env
pnpm prisma db push
pnpm db:seed         # inserts demo admin + 20 products`}
              </pre>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
