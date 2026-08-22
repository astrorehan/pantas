import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83).
 */
export const metadata: Metadata = {
  title: "Listing Berhasil Tayang",
  description: "Konfirmasi panen Anda kini tayang untuk pembeli industri.",
  robots: { index: false },
};

export default function ListingTayangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
