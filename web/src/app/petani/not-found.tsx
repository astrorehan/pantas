import type { Metadata } from "next";
import { NotFoundScreen } from "@/components/error-screen";

export const metadata: Metadata = {
  title: "Halaman Petani Tidak Ditemukan",
};

export default function PetaniNotFound() {
  return (
    <NotFoundScreen homeHref="/petani" />
  );
}
