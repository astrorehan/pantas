import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83).
 */
export const metadata: Metadata = {
  title: "Penawaran Masuk dari Pembeli",
  description: "Tawaran harga dari pembeli industri atas listing panen Anda.",
  robots: { index: false },
};

export default function PenawaranLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
