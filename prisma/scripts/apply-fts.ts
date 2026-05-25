import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  const sql = readFileSync(resolve(process.cwd(), "prisma/sql/fts.sql"), "utf8");
  const db = new PrismaClient();
  try {
    for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
      await db.$executeRawUnsafe(statement);
    }
    console.log("FTS migration applied.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
