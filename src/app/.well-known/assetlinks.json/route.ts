import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Digital Asset Links for Android Trusted Web Activity (TWA).
 * Set TWA_ANDROID_PACKAGE_NAME and TWA_SHA256_CERT_FINGERPRINTS on Vercel.
 * Fingerprints: colon-separated SHA-256 from your signing keystore (comma-separated if multiple).
 */
export async function GET() {
  const packageName = process.env.TWA_ANDROID_PACKAGE_NAME?.trim();
  const rawFingerprints = process.env.TWA_SHA256_CERT_FINGERPRINTS?.trim();

  if (!packageName || !rawFingerprints) {
    return NextResponse.json([], {
      headers: { "Content-Type": "application/json" },
    });
  }

  const sha256_cert_fingerprints = rawFingerprints
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints,
      },
    },
  ];

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
