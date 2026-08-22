import type { Metadata } from "next";
import { TITLE_TEMPLATE } from "@/lib/metadata";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83). The order detail route overrides it from its own layout, so the
 * template is repeated here to keep the suffix on that child.
 */
export const metadata: Metadata = {
  title: { default: "Pesanan Masuk ke Panen Anda", template: TITLE_TEMPLATE },
  description: "Daftar pesanan pembeli atas panen Anda beserta statusnya.",
  robots: { index: false },
};

export default function PesananPetaniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
