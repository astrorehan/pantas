import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83).
 */
export const metadata: Metadata = {
  title: "Kelola Listing Saya",
  description: "Listing panen yang Anda terbitkan di marketplace PANTAS.",
  robots: { index: false },
};

export default function ListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
