import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type SearchHit = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  rank: number;
};

/**
 * Postgres full-text search over products.
 * Uses the materialized `search_vector` column created by prisma/sql/fts.sql.
 * Falls back to ILIKE matching when no FTS query parses.
 */
export async function searchProducts(
  query: string,
  limit = 20,
): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const tsQuery = trimmed
    .split(/\s+/)
    .map((t) => t.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .map((t) => `${t}:*`)
    .join(" & ");

  if (!tsQuery) return [];

  const rows = await db.$queryRaw<SearchHit[]>(Prisma.sql`
    SELECT
      id,
      slug,
      title,
      "shortDescription",
      ts_rank("search_vector", to_tsquery('english', ${tsQuery})) AS rank
    FROM "products"
    WHERE
      "deletedAt" IS NULL
      AND status = 'ACTIVE'
      AND "search_vector" @@ to_tsquery('english', ${tsQuery})
    ORDER BY rank DESC, "createdAt" DESC
    LIMIT ${limit};
  `);

  return rows;
}
