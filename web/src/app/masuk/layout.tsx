import type { Metadata } from "next";
import { TITLE_TEMPLATE } from "@/lib/metadata";

/**
 * The auth screens are client components, so their titles live here — a
 * `"use client"` module cannot export `metadata` (F-83). The template is
 * repeated because a plain-string title here would stop the root one from
 * reaching `/masuk/reset`.
 */
export const metadata: Metadata = {
  title: { default: "Masuk", template: TITLE_TEMPLATE },
  description:
    "Masuk atau daftar ke PANTAS: grading panen berbasis AI, harga wajar, pembeli industri terdekat.",
  robots: { index: false },
};

export default function MasukLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
