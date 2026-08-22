import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang Kami: Tiga Pilar Inovasi Pangan",
  description:
    "Mengenal 3 Pilar Inovasi PANTAS: Grading AI terkalibrasi koin Rp500, Harga Wajar tingkat petani, dan Logistik Konsolidasi Rendah Emisi untuk rantai pasok panen DIY.",
  alternates: { canonical: "/tentang" },
};

export default function TentangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
