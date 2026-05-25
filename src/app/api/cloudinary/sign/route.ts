import { NextResponse } from "next/server";
import { signUploadParams } from "@/lib/cloudinary";
import { requireRole } from "@/modules/auth";

export const runtime = "nodejs";

export async function POST() {
  await requireRole("ADMIN");
  const signed = signUploadParams("products");
  return NextResponse.json(signed);
}
