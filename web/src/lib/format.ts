import type { Grade } from "./types";

const rupiah = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

/** "10000" -> "Rp 10.000" */
export function formatRupiah(n: number): string {
  return `Rp ${rupiah.format(n)}`;
}

/** Compact rupiah for stat tiles: 8_400_000 -> "Rp 8,4 jt" */
export function formatRupiahRingkas(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${num(n / 1_000_000_000)} M`;
  if (n >= 1_000_000) return `Rp ${num(n / 1_000_000)} jt`;
  if (n >= 1_000) return `Rp ${num(n / 1_000)} rb`;
  return formatRupiah(n);
}

/** Indonesian decimal comma, one place, trailing ",0" dropped. */
export function num(n: number, digits = 1): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: digits,
  }).format(n);
}

/**
 * Jarak lingkaran besar tanpa pembulatan.
 *
 * Dipakai perencana rute (F-51) yang menjumlahkan puluhan ruas: membulatkan
 * tiap ruas ke 0,1 km lebih dulu membuat galat menumpuk dan bisa mengubah
 * pilihan titik terdekat ketika dua kandidat berselisih tipis.
 */
export function haversineKmPresisi(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/** Versi tampilan: satu angka di belakang koma. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return Math.round(haversineKmPresisi(lat1, lon1, lat2, lon2) * 10) / 10;
}

export function formatAngka(n: number): string {
  return rupiah.format(n);
}

export function persen(fraction: number): string {
  const val = fraction > 1 ? fraction : fraction * 100;
  return `${Math.round(val)}%`;
}

export const GRADE_LABEL: Record<Grade, string> = {
  A: "Grade A (Premium)",
  B: "Grade B (Standar)",
  C: "Grade C (Industrial Use)",
  REJECT: "Reject",
};

export const GRADE_COLOR: Record<Grade, string> = {
  A: "var(--color-grade-a)",
  B: "var(--color-grade-b)",
  C: "var(--color-grade-c)",
  REJECT: "var(--color-grade-reject)",
};

/** Pasangan tenang dari `GRADE_COLOR`, untuk isian besar di bawah teks grade. */
export const GRADE_TINT: Record<Grade, string> = {
  A: "var(--color-grade-a-tint)",
  B: "var(--color-grade-b-tint)",
  C: "var(--color-grade-c-tint)",
  REJECT: "var(--color-grade-reject-tint)",
};

/**
 * Huruf yang dicetak di pelat penanda grade.
 *
 * REJECT tidak punya huruf karena ia bukan tingkat di dalam skala — ia
 * penolakan terhadap skalanya. Penandanya memakai segitiga `GradeMark`.
 */
export const GRADE_LETTER: Record<Grade, string | null> = {
  A: "A",
  B: "B",
  C: "C",
  REJECT: null,
};

/** ai_engine emits grades like "A", "B - Standar", "REJECT (bercak)". */
export function toGrade(raw: string): Grade {
  const s = raw.toUpperCase();
  if (s.includes("REJECT")) return "REJECT";
  if (s.startsWith("A")) return "A";
  if (s.startsWith("B")) return "B";
  return "C";
}
