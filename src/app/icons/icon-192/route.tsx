import { ImageResponse } from "next/og";
import { PwaIconMark } from "@/lib/pwa-icon-mark";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(<PwaIconMark size={192} />, {
    width: 192,
    height: 192,
  });
}
