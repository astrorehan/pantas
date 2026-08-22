import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83).
 */
export const metadata: Metadata = {
  title: "Detail Laporan Pindai",
  description:
    "Laporan mutu lengkap satu batch panen: komposisi grade, rincian per objek, dan hash audit.",
  robots: { index: false },
};

export default function RiwayatDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
