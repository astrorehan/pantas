import type { Metadata } from "next";
import { TITLE_TEMPLATE } from "@/lib/metadata";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83).
 *
 * Bentuk objek, bukan string biasa: `[id]` dan `banding` punya judulnya
 * sendiri, dan sebuah `title` string di layout perantara memutus template dari
 * induk sehingga kedua layar itu kehilangan sufiks "· PANTAS".
 */
export const metadata: Metadata = {
  title: { default: "Riwayat Pindai Panen", template: TITLE_TEMPLATE },
  description: "Arsip batch panen yang pernah Anda pindai beserta grade-nya.",
  robots: { index: false },
};

export default function RiwayatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
