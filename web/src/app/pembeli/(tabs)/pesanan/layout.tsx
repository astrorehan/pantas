import type { Metadata } from "next";
import { TITLE_TEMPLATE } from "@/lib/metadata";

/**
 * Title for a `"use client"` page, which cannot export `metadata` itself
 * (F-83). The order detail route overrides it from its own layout, so the
 * template is repeated here to keep the suffix on that child.
 */
export const metadata: Metadata = {
  title: { default: "Pesanan Pembelian Saya", template: TITLE_TEMPLATE },
  description: "Daftar pesanan panen yang Anda beli beserta statusnya.",
  robots: { index: false },
};

export default function PesananPembeliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
