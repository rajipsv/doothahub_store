"use client";

import * as React from "react";
import Link from "next/link";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Root segment error boundary (renders inside RootLayout, so no <html>/<body>).
 * Sniffs the message and renders a concrete next-step block when it can
 * recognise the failure mode (missing tables, DB unreachable, missing env).
 */
export default function RootError({ error, reset }: Props) {
  const message = error.message ?? "";

  const isMissingTable =
    /relation .* does not exist/i.test(message) ||
    /table .* does not exist/i.test(message) ||
    /P2021/i.test(message);

  const isDbConnection =
    /Can't reach database server/i.test(message) ||
    /ECONNREFUSED/i.test(message) ||
    /Tenant or user not found/i.test(message);

  const isMissingEnv =
    /Environment variable not found: DATABASE_URL/i.test(message) ||
    /Invalid environment variables/i.test(message);

  React.useEffect(() => {
    console.error("[root error boundary]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>

      {isMissingTable ? (
        <Diagnosis
          title="Your database is missing tables"
          hint="The app connected to your Postgres but the Prisma schema hasn't been pushed yet."
          steps={[
            "Locally, put your production DATABASE_URL in .env",
            "Run:  pnpm prisma db push",
            "Optionally seed demo data:  pnpm db:seed",
            "Refresh this page.",
          ]}
        />
      ) : isDbConnection ? (
        <Diagnosis
          title="Couldn't reach the database"
          hint="The serverless function failed to connect to Postgres."
          steps={[
            "Confirm DATABASE_URL is set in your Vercel env vars.",
            "For Neon, use the POOLED URL (host contains 'pooler') with ?sslmode=require.",
            "Make sure the Neon project isn't paused (free tier sleeps after inactivity).",
          ]}
        />
      ) : isMissingEnv ? (
        <Diagnosis
          title="Missing or invalid env var"
          hint="At minimum, DATABASE_URL is required."
          steps={[
            "Add DATABASE_URL to your Vercel project's env vars and redeploy.",
            'See README "Minimum env vars by goal" for the full list.',
          ]}
        />
      ) : (
        <p className="mt-4 text-muted-foreground">
          An unexpected server-side exception occurred. Check the Vercel
          function logs for the full stack trace.
        </p>
      )}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Go home
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-8 font-mono text-xs text-muted-foreground">
          Error digest: <span className="select-all">{error.digest}</span>
        </p>
      ) : null}

      {process.env.NODE_ENV !== "production" && message ? (
        <pre className="mt-4 overflow-x-auto rounded-md border bg-muted p-3 text-xs">
          {message}
        </pre>
      ) : null}
    </main>
  );
}

function Diagnosis({
  title,
  hint,
  steps,
}: {
  title: string;
  hint: string;
  steps: string[];
}) {
  return (
    <div className="mt-6 rounded-lg border bg-card p-6">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <ol className="mt-4 list-inside list-decimal space-y-1.5 text-sm">
        {steps.map((s) => (
          <li key={s} className="font-mono">
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
