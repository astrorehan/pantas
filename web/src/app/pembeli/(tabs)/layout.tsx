import type { Metadata } from "next";
import { BottomNav } from "@/components/app-shell";
import { TITLE_TEMPLATE } from "@/lib/metadata";

export const metadata: Metadata = {
  title: { default: "Katalog Panen", template: TITLE_TEMPLATE },
  description:
    "Jelajahi komoditas panen segar berkualitas tinggi hasil grading AI langsung dari petani terverifikasi.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://pantas.id/pembeli",
  },
  openGraph: {
    title: "Katalog Panen | PANTAS",
    description:
      "Jelajahi komoditas panen segar berkualitas tinggi hasil grading AI langsung dari petani terverifikasi.",
    type: "website",
    url: "/pembeli",
  },
};

export default function PembeliTabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav role="pembeli" />
    </>
  );
}
