import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
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
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[88vh] store-grid-bg">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-background to-background"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-violet-600/25 blur-[120px]"
          aria-hidden
        />

        <div className="container relative flex min-h-[88vh] flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Next-gen shopping
          </div>

          <h1 className="font-display mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl md:leading-[1.1]">
            <span className="text-gradient-tech">DoothaHub</span>
            <span className="mt-2 block text-foreground">
              Built for speed. Designed for India.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            Curated products, seamless checkout with Razorpay, and a storefront
            that feels as sharp as your favourite tech brand.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="glow-primary gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/products">
                Explore catalogue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {categories[0] ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/15 bg-white/5 backdrop-blur hover:bg-white/10 hover:text-foreground"
              >
                <Link href={`/categories/${categories[0].slug}`}>
                  {categories[0].name}
                </Link>
              </Button>
            ) : null}
          </div>

          <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-10 text-center text-sm">
            <div>
              <p className="font-display text-2xl font-bold text-cyan-400">
                {featured.length > 0 ? `${featured.length}+` : "—"}
              </p>
              <p className="mt-1 text-muted-foreground">Featured picks</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-violet-400">
                {categories.length > 0 ? categories.length : "—"}
              </p>
              <p className="mt-1 text-muted-foreground">Categories</p>
            </div>
            <div>
              <p className="font-display flex items-center justify-center gap-1 text-2xl font-bold text-sky-400">
                <Zap className="h-5 w-5" />
                INR
              </p>
              <p className="mt-1 text-muted-foreground">Local payments</p>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="container py-16 md:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                Browse
              </p>
              <h2 className="font-display mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                Shop by category
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-card/80 p-6 text-center backdrop-blur transition-all hover:border-cyan-500/40 hover:shadow-[0_0_32px_hsl(187_92%_48%_/0.15)]"
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-600/10 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
                <span className="relative font-display text-lg font-semibold">
                  {c.name}
                </span>
                <span className="relative mt-2 block text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  View collection →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section className="border-t border-white/10 bg-muted/30 py-16 md:py-20">
          <div className="container">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                  Trending
                </p>
                <h2 className="font-display mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                  Featured products
                </h2>
              </div>
              <Button
                asChild
                variant="ghost"
                className="text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
              >
                <Link href="/products">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ProductGrid products={featured} />
          </div>
        </section>
      ) : null}

      {!hasContent ? (
        <section className="container py-20">
          <div className="mx-auto max-w-xl rounded-xl border border-white/10 bg-card/80 p-8 text-center backdrop-blur">
            <h2 className="font-display text-xl font-semibold">
              Catalogue coming online
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your storefront is live — add products from the admin panel or
              import a CSV.
            </p>
            <div className="mt-6 rounded-lg border border-white/10 bg-muted/50 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                Quick start
              </p>
              <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
{`pnpm prisma db push
pnpm db:seed`}
              </pre>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
