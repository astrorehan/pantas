import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83).
 */
export const metadata: Metadata = {
  title: "Pindai Panen dengan AI",
  description:
    "Foto batch panen dengan kalibrasi koin untuk grading otomatis YOLOv11.",
  robots: { index: false },
};

export default function PindaiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
