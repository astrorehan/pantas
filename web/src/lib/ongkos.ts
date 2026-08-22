/**
 * Estimasi ongkos angkut (F-53).
 *
 * PRD §EP-F menuntut rumusnya ditampilkan, bukan disembunyikan:
 *
 *     ongkos = tarif_dasar + tarif_per_km × jarak + tarif_per_kg × berat
 *
 * dengan diskon konsolidasi. Karena angkanya ikut muncul di layar pembeli,
 * fungsi ini juga mengembalikan rinciannya suku demi suku — komponen UI tidak
 * boleh menyusun ulang rumus sendiri, sebab dua salinan rumus berarti dua
 * jawaban berbeda begitu tarifnya berubah.
 */

/** Tarif armada L300 koperasi, dasar demo per Juli 2026. */
export interface TarifAngkut {
  /** Biaya keberangkatan: sewa armada, sopir, dan bongkar muat. */
  dasar: number;
  per_km: number;
  per_kg: number;
  /**
   * Potongan pada komponen jarak saat pengiriman ikut rute konsolidasi.
   * Sengaja hanya pada jarak: armada yang sama tetap menempuh kilometer itu
   * sekali, tapi bongkar muat dan bobot muatan tiap petani tidak ikut hemat.
   */
  diskon_konsolidasi: number;
}

export const TARIF: TarifAngkut = {
  dasar: 15_000,
  per_km: 3_500,
  per_kg: 250,
  diskon_konsolidasi: 0.35,
};

export interface SukuOngkos {
  label: string;
  /** Rumus suku ini, apa adanya, untuk ditampilkan di layar. */
  rumus: string;
  nilai: number;
}

export interface Ongkos {
  suku: SukuOngkos[];
  subtotal: number;
  /** Nilai potongan konsolidasi, 0 bila penjemputan mandiri. */
  diskon: number;
  total: number;
  konsolidasi: boolean;
}

export interface InputOngkos {
  jarak_km: number;
  berat_kg: number;
  /** Ikut satu rute dengan petani lain (F-51). */
  konsolidasi?: boolean;
  tarif?: TarifAngkut;
}

/** Dibulatkan ke 500 terdekat: kuitansi armada tidak pernah berisi rupiah ganjil. */
function bulatkan(nilai: number): number {
  return Math.round(nilai / 500) * 500;
}

export function hitungOngkos({
  jarak_km,
  berat_kg,
  konsolidasi = false,
  tarif = TARIF,
}: InputOngkos): Ongkos {
  // Nilai negatif hanya bisa datang dari data rusak; diperlakukan sebagai nol
  // supaya estimasi tidak pernah lebih murah daripada biaya keberangkatan.
  const jarak = Math.max(0, jarak_km);
  const berat = Math.max(0, berat_kg);

  const biayaJarak = tarif.per_km * jarak;
  const biayaBerat = tarif.per_kg * berat;

  const suku: SukuOngkos[] = [
    {
      label: "Biaya keberangkatan",
      rumus: "tarif dasar armada",
      nilai: tarif.dasar,
    },
    {
      label: "Jarak tempuh",
      rumus: `${formatAngkaId(tarif.per_km)}/km × ${formatAngkaId(jarak, 1)} km`,
      nilai: biayaJarak,
    },
    {
      label: "Bobot muatan",
      rumus: `${formatAngkaId(tarif.per_kg)}/kg × ${formatAngkaId(berat)} kg`,
      nilai: biayaBerat,
    },
  ];

  const subtotal = tarif.dasar + biayaJarak + biayaBerat;
  const diskon = konsolidasi ? biayaJarak * tarif.diskon_konsolidasi : 0;

  return {
    suku,
    subtotal: bulatkan(subtotal),
    diskon: bulatkan(diskon),
    total: bulatkan(subtotal - diskon),
    konsolidasi,
  };
}

/** Angka gaya Indonesia tanpa simbol mata uang, dipakai di dalam teks rumus. */
function formatAngkaId(n: number, desimal = 0): string {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
  });
}

/**
 * Ongkos per kilogram, angka yang sebenarnya dipakai pembeli untuk
 * membandingkan dua lot. Berat nol tidak menghasilkan Infinity.
 */
export function ongkosPerKg(ongkos: Ongkos, berat_kg: number): number {
  if (berat_kg <= 0) return 0;
  return Math.round(ongkos.total / berat_kg);
}
