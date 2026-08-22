import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83).
 */
export const metadata: Metadata = {
  title: "Bandingkan Dua Pindaian",
  description:
    "Dua laporan mutu berdampingan dengan selisih komposisi grade antar-pindaian.",
  robots: { index: false },
};

export default function BandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
