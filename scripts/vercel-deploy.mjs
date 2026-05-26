#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Custom Vercel buildCommand entry point.
 *
 * Why a script and not just chained shell commands?
 *   1. Cross-shell env propagation (cmd / bash / sh) is fiddly. A single
 *      Node process keeps env mutations in scope for every child command.
 *   2. We want to fall back DIRECT_URL → DATABASE_URL when the user only
 *      pasted one URL in Vercel.
 *   3. `prisma db push` should not hard-fail the build — if it fails
 *      (e.g. user uses a pooled Neon URL that pgbouncer can't run DDL on),
 *      the rest of the build still ships, and the runtime error boundary
 *      gives the user actionable instructions.
 */
import { spawnSync } from "node:child_process";

const env = { ...process.env };

/**
 * Derive a Prisma-friendly direct URL from a possibly-pooled Postgres URL.
 *  - Neon: pooled host has `-pooler` (e.g. ep-xxx-pooler.region.aws.neon.tech);
 *          the direct host is the same without `-pooler`.
 *  - Any provider: strip `pgbouncer=true` and `connection_limit` query params
 *    because `prisma db push` runs DDL that pgbouncer in tx-mode can't handle.
 */
function toDirectUrl(raw) {
  try {
    const u = new URL(raw);
    u.hostname = u.hostname.replace("-pooler.", ".");
    u.searchParams.delete("pgbouncer");
    u.searchParams.delete("connection_limit");
    u.searchParams.delete("pool_timeout");
    return u.toString();
  } catch {
    return raw;
  }
}

if (!env.DIRECT_URL && env.DATABASE_URL) {
  env.DIRECT_URL = toDirectUrl(env.DATABASE_URL);
  if (env.DIRECT_URL !== env.DATABASE_URL) {
    console.log(
      "[deploy] Derived DIRECT_URL from DATABASE_URL (stripped pgbouncer/pooler).",
    );
  } else {
    console.log(
      "[deploy] DIRECT_URL was not set; falling back to DATABASE_URL for Prisma.",
    );
  }
}

function run(cmd, args, { allowFailure = false } = {}) {
  console.log(`[deploy] $ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    if (allowFailure) {
      console.warn(
        `[deploy] ${cmd} exited with code ${result.status}; continuing.`,
      );
      return false;
    }
    console.error(`[deploy] ${cmd} exited with code ${result.status}; aborting.`);
    process.exit(result.status ?? 1);
  }
  return true;
}

run("prisma", ["generate"]);

if (env.DATABASE_URL) {
  console.log(
    "[deploy] Pushing Prisma schema to the database (idempotent, ~3s if no changes)...",
  );
  const pushed = run(
    "prisma",
    ["db", "push", "--skip-generate", "--accept-data-loss"],
    { allowFailure: true },
  );
  if (pushed) {
    console.log("[deploy] Schema is up to date.");

    // Seed on first deploy only. We detect "first deploy" by checking if
    // any user exists. If the table is non-empty, this is a no-op so it's
    // safe to leave in the build script forever.
    if (env.SEED_ON_DEPLOY !== "false") {
      console.log(
        "[deploy] Seeding demo data (skipped if any users already exist; set SEED_ON_DEPLOY=false to disable)...",
      );
      run("tsx", ["prisma/seed.ts"], { allowFailure: true });
    }
  } else {
    console.warn(
      "[deploy] Schema push failed. The app will still deploy, but DB-dependent\n" +
        "[deploy] pages will render the diagnostic error card until you push the\n" +
        "[deploy] schema manually (`pnpm prisma db push` against your prod URL).",
    );
  }
} else {
  console.warn(
    "[deploy] DATABASE_URL is not set; skipping `prisma db push`. The deployed\n" +
      "[deploy] storefront will work in 'demo mode' (empty catalogue) until you\n" +
      "[deploy] add DATABASE_URL to your Vercel env vars and redeploy.",
  );
}

run("next", ["build"]);
