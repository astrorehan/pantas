import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83). The order code is part of the title so judges can tell tabs apart.
 */
export async function generateMetadata({
  params,
}: LayoutProps<"/petani/pesanan/[id]">): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Serah Terima Pesanan #${id}`,
    description: "Status pesanan, verifikasi kode serah terima, dan percakapan dengan pembeli.",
    robots: { index: false },
  };
}

export default function DetailPesananPetaniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
