import { NextResponse } from "next/server";
import { getGradingByHash } from "@/lib/data";
import { normalisasiAuditHash } from "@/lib/audit-hash";
import { BackendUnavailableError } from "@/lib/supabase";

/**
 * Public JSON API Endpoint for Lacak Report (F-60).
 * Accessible without session, CDN cached.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash: mentah } = await params;
  const hash = normalisasiAuditHash(mentah);
  if (!hash) {
    return NextResponse.json(
      { status: "error", message: "Hash audit tidak valid" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let record;
  try {
    record = await getGradingByHash(hash);
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      return NextResponse.json(
        { status: "error", message: "Layanan laporan sementara tidak tersedia" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    throw error;
  }
  if (!record) {
    return NextResponse.json(
      { status: "error", message: "Laporan grading tidak ditemukan" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
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
