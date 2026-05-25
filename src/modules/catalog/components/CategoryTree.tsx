import Link from "next/link";
import type { CategoryNode } from "@/modules/catalog/types";

export function CategoryTree({ categories }: { categories: CategoryNode[] }) {
  return (
    <nav aria-label="Categories">
      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/categories/${cat.slug}`}
              className="text-sm font-medium hover:underline"
            >
              {cat.name}
            </Link>
            {cat.children.length > 0 ? (
              <ul className="ml-4 mt-1 space-y-1">
                {cat.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/categories/${child.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
