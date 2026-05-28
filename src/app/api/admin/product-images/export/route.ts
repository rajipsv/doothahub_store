import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth";
import {
  listProductImageCsvRows,
  serializeProductImagesCsv,
} from "@/modules/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireRole("ADMIN");

  const rows = await listProductImageCsvRows();
  const csv = serializeProductImagesCsv(rows);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `product-images-${date}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
