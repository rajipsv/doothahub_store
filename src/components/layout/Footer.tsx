import Link from "next/link";
import { listCategories, type CategoryNode } from "@/modules/catalog";
import { safeFetch } from "@/lib/utils";

function flattenCategories(nodes: CategoryNode[]) {
  const flat: { slug: string; name: string }[] = [];
  for (const node of nodes) {
    flat.push({ slug: node.slug, name: node.name });
    for (const child of node.children) {
      flat.push({ slug: child.slug, name: child.name });
    }
  }
  return flat;
}

export async function Footer() {
  const categoryTree = await safeFetch(
    () => listCategories(),
    [],
    "footer:categories",
  );
  const categories = flattenCategories(categoryTree);

  return (
    <footer className="mt-16 border-t border-border bg-muted/40 dark:border-white/10">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div>
          <p className="font-display text-xl font-bold md:text-2xl">
            <span className="text-gradient-tech">DoothaHub</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Modern e-commerce, built for performance.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Shop</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/products">All products</Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/categories/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Account</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/account">My account</Link>
            </li>
            <li>
              <Link href="/account/orders">Orders</Link>
            </li>
            <li>
              <Link href="/sign-in">Sign in</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Legal</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4">
        <p className="container text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} DoothaHub Store. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
