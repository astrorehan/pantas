"use client";

import dynamic from "next/dynamic";

/**
 * Sonner (≈9 KB gzip) dimuat belakangan.
 *
 * `<Toaster />` dipasang di root layout, jadi impor statisnya membuat setiap
 * route — termasuk halaman publik yang tidak pernah memunculkan toast — membayar
 * ongkosnya di first-load (NFR-05). Tak ada yang hilang: toast pertama muncul
 * beberapa ratus milidetik setelah hidrasi, jauh sebelum ada yang menekan tombol.
 *
 * `ssr: false` karena toast memang tidak punya bentuk di HTML server.
 */
const ToasterSonner = dynamic(() => import("./toaster-sonner"), { ssr: false });

export function Toaster() {
  return <ToasterSonner />;
}

/** Modul sonner, dimuat sekali lalu dipakai ulang. */
const sonnerModule = () => import("sonner");

/**
 * The only four shapes a toast may take. `galat` is for application failures;
 * network trouble gets `jaringan`, which says so plainly instead of implying
 * the user broke something (F-98).
 *
 * Pemanggil tetap memanggilnya sinkron — antreannya diurus di sini, bukan di
 * layar. Toast yang dipicu sebelum modulnya tiba tetap muncul, hanya satu tick
 * lebih lambat.
 */
export const toast = {
  sukses: (pesan: string, detail?: string) =>
    void sonnerModule().then((m) => m.toast.success(pesan, { description: detail })),
  galat: (pesan: string, detail?: string) =>
    void sonnerModule().then((m) => m.toast.error(pesan, { description: detail })),
  /**
   * Network error toast. Pass translated title and desc from your component
   * using t("common.network_error_title") and t("common.network_error_desc").
   */
  jaringan: (title?: string, desc?: string) =>
    void sonnerModule().then((m) =>
      m.toast.error(title ?? "Unable to connect", { description: desc }),
    ),
  info: (pesan: string, detail?: string) =>
    void sonnerModule().then((m) => m.toast(pesan, { description: detail })),
};
