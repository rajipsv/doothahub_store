"use client";

/**
 * Catastrophic fallback for errors thrown in the root layout itself (where
 * the normal error.tsx can't render because there's no layout to nest into).
 * Must include its own <html> and <body>.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          padding: 32,
          maxWidth: 640,
          margin: "0 auto",
          color: "#0f172a",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          The application failed to load
        </h1>
        <p style={{ color: "#475569" }}>
          A critical error happened before the app could finish rendering.
          Check the Vercel function logs for the full stack trace.
        </p>
        {error.digest ? (
          <p style={{ marginTop: 16, fontFamily: "monospace", fontSize: 12 }}>
            Error digest: <span style={{ userSelect: "all" }}>{error.digest}</span>
          </p>
        ) : null}
        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: 24,
            padding: "8px 16px",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            color: "#0f172a",
            textDecoration: "none",
          }}
        >
          Reload
        </a>
      </body>
    </html>
  );
}
