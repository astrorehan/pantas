/**
 * Algoritma harga PANTAS — bagian murni (PRD §14).
 *
 * Dipisahkan dari `data.ts` karena `getRekomendasiHarga` di sana adalah fungsi
 * async yang membaca tabel `harga_acuan`: sifat matematis rumusnya tidak bisa
 * diuji tanpa ikut menyeret Supabase. Yang ada di berkas ini murni angka masuk
 * → angka keluar, dan `harga.properti.test.ts` menguji 1.000 komposisi acak
 * terhadapnya (F-104).
 *
 *     skor_kualitas = 1,00·A + 0,70·B + 0,40·C
 *     bobot_efektif = Σ komposisi[g] × bobot_grade[g]
 *     pengali       = bobot_efektif × (0,90 + 0,16 × skor_kualitas)
 *     tengah        = harga_acuan × pengali
 *     rentang_wajar = [tengah × 0,93 , tengah × 1,08]  (dibulatkan ke Rp100)
 */

import type { Grade } from "./types";

export type Komposisi = Partial<Record<Grade, number>>;

/** Urutan tetap grade, terbaik lebih dulu. Dipakai setiap kali komposisi dibaca. */
export const URUT_GRADE: Grade[] = ["A", "B", "C", "REJECT"];

/** Bobot dasar per grade untuk pengali harga (PRD §14.1). */
export const BOBOT_GRADE: Record<Grade, number> = {
  A: 1.0,
  B: 0.85,
  C: 0.65,
  REJECT: 0.35,
};

/** Bobot tiap grade di dalam skor kualitas. REJECT tidak menyumbang apa pun. */
export const BOBOT_SKOR: Record<Grade, number> = {
  A: 1.0,
  B: 0.7,
  C: 0.4,
  REJECT: 0,
};

/** Suku konstan dan koefisien skor pada rumus pengali. */
export const PENGALI_DASAR = 0.9;
export const PENGALI_KOEF_SKOR = 0.16;

/**
 * Batas pengali yang dijanjikan PRD §14.2 sifat 2.
 *
 * Keduanya turunan langsung dari rumus, bukan angka yang dipilih terpisah:
 * batas bawah `0,35 × 0,90` (batch REJECT penuh, skor 0) dan batas atas
 * `1,00 × (0,90 + 0,16)` (batch A penuh, skor 1).
 */
export const PENGALI_MIN = 0.315;
export const PENGALI_MAX = 1.06;

/** Skor kualitas batch [0..1] dari komposisi grade. */
export function skorKualitas(komposisi: Komposisi): number {
  const s = URUT_GRADE.reduce(
    (n, g) => n + (komposisi[g] ?? 0) * BOBOT_SKOR[g],
    0,
  );
  return Math.round(s * 100) / 100;
}

/**
 * Bobot grade batch, ditimbang seluruh komposisinya.
 *
 * PRD §14.1 semula menulis `bobot_grade[grade_dominan]` — satu grade memutuskan
 * seluruh bobot. Bentuk itu melanggar sifat 1 (monoton) yang diminta §14.2, dan
 * tes properti F-104 menemukan contoh nyatanya: batch `A 0,4 / B 0,3 / C 0,3`
 * berpengali 1,017, sedangkan batch yang jelas lebih baik `A 0,4 / B 0,6`
 * berpengali 0,877 — memindahkan 30% panen dari C ke B menjatuhkan harga 14%,
 * hanya karena dominannya bergeser dari A ke B dan bobotnya jatuh 1,00 → 0,85.
 *
 * Versi tertimbang menutup lubang itu tanpa mengubah apa pun yang dijanjikan
 * §14.2: batasnya tetap `[0,315 , 1,06]` (batch murni satu grade memberi bobot
 * yang persis sama dengan bobot grade itu), dan tiap sukunya masih bisa
 * ditampilkan di layar harga.
 */
export function bobotEfektif(komposisi: Komposisi): number {
  const total = URUT_GRADE.reduce((n, g) => n + (komposisi[g] ?? 0), 0);
  if (total <= 0) return BOBOT_GRADE.REJECT;
  const w = URUT_GRADE.reduce(
    (n, g) => n + (komposisi[g] ?? 0) * BOBOT_GRADE[g],
    0,
  );
  // Dinormalkan: komposisi datang dari pembulatan 2 desimal di engine, jadi
  // jumlahnya bisa 0,99 atau 1,01 dan bobotnya tidak boleh ikut bergeser.
  return w / total;
}

/** Grade dengan porsi terbesar. Seri diputus oleh urutan A → REJECT. */
export function gradeDominan(komposisi: Komposisi): Grade {
  return URUT_GRADE.reduce((a, b) =>
    (komposisi[b] ?? 0) > (komposisi[a] ?? 0) ? b : a,
  );
}

/**
 * Pengali dari bobot dan skor yang sudah dihitung.
 *
 * Dibulatkan ke 3 desimal karena angka inilah yang tampil di layar harga —
 * membiarkan `0,9689999999999999` bocor ke UI hanya karena aritmetika float.
 */
export function pengaliDari(bobot: number, skor: number): number {
  return Math.round(bobot * (PENGALI_DASAR + PENGALI_KOEF_SKOR * skor) * 1000) / 1000;
}

/** Pengali harga terhadap harga acuan, dari komposisi batch. */
export function pengaliHarga(komposisi: Komposisi): number {
  return pengaliDari(bobotEfektif(komposisi), skorKualitas(komposisi));
}

/** Pembulatan ke Rp100 terdekat; harga sayur tidak pernah disebut per rupiah. */
export function bulatkanRatus(n: number): number {
  return Math.round(n / 100) * 100;
}

/** Rentang wajar di sekitar harga tengah: −7% / +8%, dibulatkan ke Rp100. */
export function rentangWajar(
  hargaAcuan: number,
  pengali: number,
): { min: number; max: number } {
  const tengah = hargaAcuan * pengali;
  return { min: bulatkanRatus(tengah * 0.93), max: bulatkanRatus(tengah * 1.08) };
}
