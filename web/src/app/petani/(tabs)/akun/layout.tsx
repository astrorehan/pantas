import type { Metadata } from "next";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83).
 */
export const metadata: Metadata = {
  title: "Akun Petani",
  description: "Profil lahan, komoditas, sertifikasi, dan preferensi petani.",
  robots: { index: false },
};

export default function AkunPetaniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
