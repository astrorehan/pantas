import type { Metadata } from "next";
import { LandingContent } from "@/components/marketing/landing-content";

export const metadata: Metadata = {
  title: {
    absolute: "PANTAS: Setiap Panen Pantas Dihargai",
  },
  description:
    "Platform agri-commerce yang mengubah penilaian mutu panen menjadi pengukuran objektif berbasis computer vision: komposisi grade per objek, hash audit, harga wajar transparan, dan konsolidasi logistik.",
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return <LandingContent />;
}
