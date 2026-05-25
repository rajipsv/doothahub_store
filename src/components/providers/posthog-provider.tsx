"use client";

import * as React from "react";

declare global {
  interface Window {
    posthog?: { init: (key: string, opts: object) => void };
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key || typeof window === "undefined") return;
    import("posthog-js").then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: host ?? "https://us.i.posthog.com",
        capture_pageview: true,
        person_profiles: "identified_only",
      });
    });
  }, []);

  return <>{children}</>;
}
