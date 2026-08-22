import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83).
 */
export const metadata: Metadata = {
  title: "Akun Pembeli",
  description: "Profil perusahaan, preferensi, dan pergantian peran pembeli.",
  robots: { index: false },
};

export default function AkunPembeliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
