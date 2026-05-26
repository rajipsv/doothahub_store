import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Renders a yellow banner above sign-in / sign-up when the server clearly
 * isn't ready for auth (no AUTH_SECRET, or users table missing). This
 * prevents the confusing 500 from /api/auth/callback/credentials when
 * deploys are missing env vars or DB migrations.
 *
 * Renders nothing in development or when the server is fully ready.
 */
export async function AuthHealthNotice() {
  const missingSecret = !env.AUTH_SECRET && process.env.NODE_ENV === "production";
  let tableMissing = false;

  try {
    await db.user.count();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      /relation .* does not exist/i.test(msg) ||
      /does not exist in the current database/i.test(msg) ||
      /P2021/i.test(msg)
    ) {
      tableMissing = true;
    }
  }

  if (!missingSecret && !tableMissing) return null;

  return (
    <div className="mb-6 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
      <p className="font-semibold">Sign-in is currently unavailable.</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {missingSecret ? (
          <li>
            The server is missing <code className="font-mono">AUTH_SECRET</code>.
            Add a 32+ char random string to the Vercel env vars and redeploy.
          </li>
        ) : null}
        {tableMissing ? (
          <li>
            The database hasn&apos;t been initialised. Run{" "}
            <code className="font-mono">pnpm prisma db push</code> locally
            against your production DATABASE_URL, then refresh this page.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
