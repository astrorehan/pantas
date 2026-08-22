import { Suspense } from "react";
import { BrandBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { Skeleton } from "@/components/ui";
import { getListings } from "@/lib/data";
import Katalog from "./katalog";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Katalog Panen",
  description:
    "Jelajahi komoditas panen segar berkualitas tinggi hasil grading AI langsung dari petani terverifikasi.",
  alternates: {
    canonical: "https://pantas.id/pembeli",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

// Katalog membaca Supabase — segarkan tiap menit agar listing baru muncul
// tanpa rebuild.
export const revalidate = 60;

export default async function KatalogPage() {
  const listings = await getListings();

  return (
    <>
      {/* Modern Speculation Rules API for instant 0ms pre-rendering of pembeli subpages */}
      <script
        type="speculationrules"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            prerender: [
              {
                source: "list",
                urls: [
                  "/pembeli/inquiry",
                  "/pembeli/pesanan",
                  "/pembeli/peta",
                  "/pembeli/akun",
                ],
              },
            ],
          }),
        }}
      />
      <BrandBar title="Katalog Panen" />
      {/* Katalog membaca `?q=` (dipakai palet perintah, F-84), jadi ia harus
          berada di balik batas Suspense agar halaman ini tetap dirender statis. */}
      <Suspense fallback={<MemuatKatalog />}>
        <Katalog listings={listings} />
      </Suspense>
    </>
  );
}

function MemuatKatalog() {
  return (
    <main className="flex-1 py-4">
      <Container className="flex flex-col gap-3">
        <Skeleton className="h-12 w-full lg:w-96" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </Container>
    </main>
  );
}
