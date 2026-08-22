import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83).
 */
export const metadata: Metadata = {
  title: "Hasil AI Grading",
  description:
    "Komposisi grade, skor kualitas, dan foto beranotasi dari batch panen yang dipindai.",
  robots: { index: false },
};

export default function HasilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
