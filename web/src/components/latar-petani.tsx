"use client";

import dynamic from "next/dynamic";

/**
 * Dua pekerja latar aplikasi petani, dimuat sesudah layar pertama terlukis.
 *
 * Keduanya merender `null`: yang satu menguras antrean pindai offline dari
 * IndexedDB (F-14), yang lain mendaftarkan sw.js saat peramban menganggur.
 * Tidak ada satu piksel pun yang menunggu mereka, jadi tidak ada alasan
 * kodenya — beserta pembantu IndexedDB dan pemanggil grading yang dibawanya —
 * ikut di muatan pertama setiap layar petani, termasuk /petani/pindai yang
 * paling berat di seluruh aplikasi.
 *
 * `ssr: false` sekaligus mengeluarkannya dari HTML server, yang untuk komponen
 * yang selalu mengembalikan `null` memang tidak kehilangan apa pun. Pola yang
 * sama dipakai katalog pembeli untuk kedua lacinya.
 */
const AntreanOffline = dynamic(
  () => import("./antrean-offline").then((m) => m.AntreanOffline),
  { ssr: false },
);

const DaftarServiceWorker = dynamic(
  () => import("./antrean-offline").then((m) => m.DaftarServiceWorker),
  { ssr: false },
);

export function LatarPetani() {
  return (
    <>
      <DaftarServiceWorker />
      <AntreanOffline />
    </>
  );
}
