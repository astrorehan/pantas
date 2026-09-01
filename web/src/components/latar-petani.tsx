"use client";

import dynamic from "next/dynamic";

/**
 * Pekerja latar aplikasi petani, dimuat sesudah layar pertama terlukis.
 *
 * Pekerja ini merender `null` dan menguras antrean pindai offline dari
 * IndexedDB (F-14). Pendaftaran service worker kini ada di root aplikasi agar
 * app shell juga tersedia bagi pembeli dan halaman publik.
 *
 * `ssr: false` sekaligus mengeluarkannya dari HTML server, yang untuk komponen
 * yang selalu mengembalikan `null` memang tidak kehilangan apa pun. Pola yang
 * sama dipakai katalog pembeli untuk kedua lacinya.
 */
const AntreanOffline = dynamic(
  () => import("./antrean-offline").then((m) => m.AntreanOffline),
  { ssr: false },
);

export function LatarPetani() {
  return <AntreanOffline />;
}
