import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83).
 */
export const metadata: Metadata = {
  title: "Inquiry & Penawaran Saya",
  description: "Keranjang penawaran yang Anda kirim ke petani PANTAS.",
  robots: { index: false },
};

export default function InquiryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
