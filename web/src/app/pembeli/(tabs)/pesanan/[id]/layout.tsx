import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83). The order code is part of the title so judges can tell tabs apart.
 */
export async function generateMetadata({
  params,
}: LayoutProps<"/pembeli/pesanan/[id]">): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Pesanan Pembelian #${id}`,
    description: "Status pesanan, kode serah terima, dan percakapan dengan petani.",
    robots: { index: false },
  };
}

export default function DetailPesananPembeliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
