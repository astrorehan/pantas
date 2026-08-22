import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83).
 */
export const metadata: Metadata = {
  title: "Dampak Panen Anda",
  description:
    "Susut panen yang dicegah, emisi CO₂e yang dihemat, dan nilai tambah dari grading.",
  robots: { index: false },
};

export default function DampakLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
