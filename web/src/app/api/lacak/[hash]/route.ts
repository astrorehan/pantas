import { NextResponse } from "next/server";
import { getGradingByHash } from "@/lib/data";

/**
 * Public JSON API Endpoint for Lacak Report (F-60).
 * Accessible without session, CDN cached.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  if (!hash) {
    return NextResponse.json({ status: "error", message: "Hash audit tidak valid" }, { status: 400 });
  }

  const record = await getGradingByHash(decodeURIComponent(hash));
  if (!record) {
    return NextResponse.json({ status: "error", message: "Laporan grading tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(
    { status: "success", data: record },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
