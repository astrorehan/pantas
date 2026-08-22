import type { Metadata } from "next";
import { NotFoundScreen } from "@/components/error-screen";

export const metadata: Metadata = {
  title: "Halaman Pembeli Tidak Ditemukan",
};

export default function PembeliNotFound() {
  return <NotFoundScreen homeHref="/pembeli" />;
}
