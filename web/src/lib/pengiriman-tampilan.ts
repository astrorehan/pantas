/**
 * Bentuk tampilan satu penjemputan — dipakai daftar `/petani/logistik`, layar
 * detailnya, dan kartu tautan di halaman pesanan.
 *
 * Isinya sengaja bebas React: status muatan dulu dicetak apa adanya dari kolom
 * basis data ("Status: dalam_perjalanan"), dan setiap layar yang ingin
 * memperbaikinya harus mengarang peta labelnya sendiri. Peta itu tinggal satu
 * di sini supaya tiga layar menyebut status yang sama dengan kata yang sama.
 */

import type { Pengiriman, StatusPengiriman } from "./types";

/**
 * Urutan hidup satu muatan. `batal` tidak masuk daftar: ia bukan langkah
 * lanjutan melainkan jalan buntu, dan menempatkannya di ujung garis waktu akan
 * membuatnya terbaca seperti tujuan akhir yang normal.
 */
export const URUT_STATUS: StatusPengiriman[] = [
  "dijadwalkan",
  "dijemput",
  "dalam_perjalanan",
  "tiba",
  "diterima",
];

export type NadaStatus = "brand" | "neutral" | "warn" | "danger";

export interface LangkahPengiriman {
  status: StatusPengiriman;
  /** Kunci i18n label — `logistik.status_*`. */
  labelKey: string;
  keadaan: "done" | "current" | "pending";
}

/** Muatan yang masih menuntut perhatian petani, lawan dari yang sudah tuntas. */
export function pengirimanBerjalan(p: Pengiriman): boolean {
  return p.status !== "diterima" && p.status !== "batal";
}

export function kunciStatus(status: StatusPengiriman): string {
  return `status_${status}`;
}

export function kunciMetode(metode: Pengiriman["metode"]): string {
  return `method_${metode}`;
}

export function nadaStatus(status: StatusPengiriman): NadaStatus {
  if (status === "batal") return "danger";
  if (status === "diterima") return "brand";
  if (status === "dijadwalkan") return "neutral";
  return "warn";
}

/**
 * Garis waktu muatan, ditandai relatif terhadap status sekarang.
 *
 * Status yang tidak dikenal (kolomnya enum di Postgres, tetapi baris lama bisa
 * saja menyimpan nilai yang sudah dihapus) diperlakukan sebagai belum mulai —
 * lebih baik garis waktu yang kosong daripada garis waktu yang mengaku muatan
 * sudah sampai.
 */
export function langkahPengiriman(
  status: StatusPengiriman,
): LangkahPengiriman[] {
  const kini = URUT_STATUS.indexOf(status);
  return URUT_STATUS.map((s, i) => ({
    status: s,
    labelKey: kunciStatus(s),
    keadaan: kini < 0 || i > kini ? "pending" : i === kini ? "current" : "done",
  }));
}
