import { ImageResponse } from "next/og";
import { PwaIconMark } from "@/lib/pwa-icon-mark";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(<PwaIconMark size={512} />, {
    width: 512,
    height: 512,
  });
}
