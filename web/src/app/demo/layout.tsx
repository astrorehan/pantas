import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal Demo",
  description:
    "Akun demo PANTAS yang sudah terisi data, plus skrip tiga menit untuk menelusuri seluruh alur: pindai, grading, harga, katalog, pesanan, serah terima.",
  alternates: { canonical: "/demo" },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
