import type { Metadata } from "next";
import type { ReactNode } from "react";

/*
 * Judul & deskripsi tinggal di layout karena daftar penjemputan sekarang
 * komponen klien: ia perlu sesi untuk tahu muatan mana milik petani yang
 * sedang masuk, dan `export const metadata` tidak boleh hidup di berkas
 * "use client".
 */
export const metadata: Metadata = {
  title: "Jadwal & Logistik Penjemputan",
  description:
    "Status penjemputan hasil panen, rute konsolidasi, dan checklist penanganan rantai dingin.",
};

export default function LogistikLayout({ children }: { children: ReactNode }) {
  return children;
}
