import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kartu Transparansi Model AI",
  description:
    "Dokumentasi lengkap model YOLO11 PANTAS: arsitektur, ukuran dataset DIY, metrik F1-Score, gerbang uji blur, dan keterbatasan model yang diakui secara jujur.",
  alternates: { canonical: "/tentang/model" },
};

export default function ModelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
