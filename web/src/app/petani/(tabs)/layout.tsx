import type { Metadata } from "next";
import { BottomNav } from "@/components/app-shell";
import { TITLE_TEMPLATE } from "@/lib/metadata";

/**
 * The dashboard title lives here because this group's `page.tsx` is a
 * `"use client"` module and cannot export `metadata` (F-83). Each child tab
 * overrides it from its own layout, so the template has to be repeated —
 * a plain-string title here would strip the suffix off every tab below.
 */
export const metadata: Metadata = {
  title: { default: "Beranda Petani", template: TITLE_TEMPLATE },
  description:
    "Ringkasan panen, hasil grading terakhir, dan pesanan masuk untuk petani PANTAS.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://pantas.id/petani",
  },
  openGraph: {
    title: "Beranda Petani | PANTAS",
    description:
      "Ringkasan panen, hasil grading terakhir, dan pesanan masuk untuk petani PANTAS.",
    type: "website",
    url: "/petani",
  },
};

/**
 * Only the tab destinations carry the bottom nav. The scan → grade → price →
 * listing flow is a focused task with its own footer actions.
 */
export default function PetaniTabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav role="petani" />
    </>
  );
}
