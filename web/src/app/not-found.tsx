import type { Metadata } from "next";
import { NotFoundScreen } from "@/components/error-screen";

export const metadata: Metadata = { title: "Halaman tidak ditemukan" };

export default function NotFound() {
  return <NotFoundScreen />;
}
