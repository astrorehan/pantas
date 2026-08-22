/**
 * Faktor emisi (§14.3, F-106).
 *
 * Angkanya tidak lagi ditulis di komponen. Sumber kebenaran adalah tabel
 * `emisi_faktor` di Postgres (`komoditas`, `faktor`, `satuan`, `sumber`,
 * `catatan`) — mengganti sumber cukup lewat satu baris SQL, tanpa menyentuh
 * kode. Modul ini hanya menyediakan cara membaca tabel itu: pencarian kunci,
 * konversi kg → ton CO₂e, dan salinan cadangan untuk mode demo.
 *
 * Sumber baris komoditas: Poore, J., & Nemecek, T. (2018). *Reducing food's
 * environmental impacts through producers and consumers.* Science, 360(6392),
 * 987–992 — meta-analisis 570 studi atas 38.700 kebun komersial.
 */

export interface FaktorEmisi {
  /** Kunci pencarian: kelompok komoditas, `lainnya`, atau `transport_solar`. */
  komoditas: string;
  faktor: number;
  satuan: string;
  sumber: string;
  catatan: string | null;
}

/** Baris yang dipakai saat komoditas tidak punya faktornya sendiri. */
export const KUNCI_LAINNYA = "lainnya";

/** Baris konversi liter solar → kg CO₂e untuk kartu penghematan rute. */
export const KUNCI_SOLAR = "transport_solar";

/**
 * Salinan isi tabel saat Supabase tidak dikonfigurasi (mode demo, dan render
 * pertama sebelum permintaan jaringan selesai).
 *
 * Ini bukan sumber kedua yang boleh menyimpang: nilainya harus sama dengan
 * seed di `supabase/migrations/0004` + `0007`. Kalau tabel di basis data
 * diubah, tampilan daring ikut berubah tanpa rilis; berkas ini hanya menjaga
 * layar demo tetap punya angka bersitasi, bukan nol.
 */
export const FAKTOR_EMISI_BAWAAN: FaktorEmisi[] = [
  {
    komoditas: "carrot",
    faktor: 0.43,
    satuan: "kg CO₂e/kg",
    sumber: "Poore & Nemecek (2018), Science 360(6392), 987–992",
    catatan: "Kategori Root Vegetables.",
  },
  {
    komoditas: "cucumber",
    faktor: 0.53,
    satuan: "kg CO₂e/kg",
    sumber: "Poore & Nemecek (2018), Science 360(6392), 987–992",
    catatan: "Kategori Other Vegetables.",
  },
  {
    komoditas: "chili",
    faktor: 0.53,
    satuan: "kg CO₂e/kg",
    sumber: "Poore & Nemecek (2018), Science 360(6392), 987–992",
    catatan: "Kategori Other Vegetables.",
  },
  {
    komoditas: "tomato",
    faktor: 0.53,
    satuan: "kg CO₂e/kg",
    sumber: "Poore & Nemecek (2018), Science 360(6392), 987–992",
    catatan:
      "Rata-rata global Poore & Nemecek untuk tomat adalah 2,09 kg CO₂e/kg, " +
      "terangkat produksi rumah kaca berpemanas di Eropa. Tomat Indonesia " +
      "ditanam di lapangan terbuka tanpa pemanas, sehingga PANTAS memakai " +
      "angka Other Vegetables 0,53 agar klaim dampaknya tidak berlebih.",
  },
  {
    komoditas: KUNCI_LAINNYA,
    faktor: 0.53,
    satuan: "kg CO₂e/kg",
    sumber: "Poore & Nemecek (2018), Science 360(6392), 987–992",
    catatan:
      "Kategori Other Vegetables. Dipakai untuk komoditas yang belum punya " +
      "faktor sendiri, sekaligus batas bawah yang aman untuk diklaim.",
  },
  {
    komoditas: KUNCI_SOLAR,
    faktor: 2.68,
    satuan: "kg CO₂e/liter",
    sumber:
      "UK DEFRA/BEIS Greenhouse Gas Conversion Factors 2024 (diesel, average biofuel blend)",
    catatan: "Dipakai kartu penghematan rute konsolidasi, bukan perhitungan panen.",
  },
];

/**
 * Id komoditas aplikasi (`tomato_ceri`, `chili_rawit`) → kunci kelompok di
 * tabel (`tomato`, `chili`). Faktor Poore & Nemecek adalah angka kategori;
 * membedakan tomat ceri dari tomat beef akan mengarang presisi yang tidak ada
 * di sumbernya.
 */
export function kunciKomoditas(komoditas?: string | null): string {
  if (!komoditas) return KUNCI_LAINNYA;
  const bersih = komoditas.trim().toLowerCase();
  if (!bersih) return KUNCI_LAINNYA;
  return bersih.split("_")[0];
}

/** Baris faktor untuk satu komoditas; selalu mengembalikan baris, tidak pernah undefined. */
export function faktorUntuk(
  komoditas: string | null | undefined,
  tabel: FaktorEmisi[] = FAKTOR_EMISI_BAWAAN,
): FaktorEmisi {
  const kunci = kunciKomoditas(komoditas);
  return (
    tabel.find((f) => f.komoditas === kunci) ??
    tabel.find((f) => f.komoditas === KUNCI_LAINNYA) ??
    FAKTOR_EMISI_BAWAAN.find((f) => f.komoditas === KUNCI_LAINNYA)!
  );
}

/** Baris konversi solar untuk kartu penghematan rute. */
export function faktorSolar(
  tabel: FaktorEmisi[] = FAKTOR_EMISI_BAWAAN,
): FaktorEmisi {
  return (
    tabel.find((f) => f.komoditas === KUNCI_SOLAR) ??
    FAKTOR_EMISI_BAWAAN.find((f) => f.komoditas === KUNCI_SOLAR)!
  );
}

/** Satu partai panen yang tersalurkan: berat dan komoditasnya. */
export interface PartaiPanen {
  berat_kg: number;
  komoditas?: string | null;
}

/**
 * Kilogram panen yang tidak jadi terbuang → ton CO₂e yang dicegah.
 *
 * Dihitung per partai, bukan dari total berat: wortel (0,43) dan sayuran lain
 * (0,53) punya faktor berbeda, jadi satu pengali untuk seluruh keranjang akan
 * salah begitu petani menjual lebih dari satu komoditas.
 */
export function tonCo2eDicegah(
  partai: PartaiPanen[],
  tabel: FaktorEmisi[] = FAKTOR_EMISI_BAWAAN,
): number {
  const kg = partai.reduce(
    (total, p) => total + p.berat_kg * faktorUntuk(p.komoditas, tabel).faktor,
    0,
  );
  return kg / 1000;
}

/**
 * Sitasi untuk tooltip statistik dampak. Menyebut rentang faktor yang benar-
 * benar dipakai, bukan satu angka, karena tabel bisa memuat lebih dari satu
 * nilai per satuan.
 */
export function sumberEmisi(
  tabel: FaktorEmisi[] = FAKTOR_EMISI_BAWAAN,
): string {
  const panen = tabel.filter((f) => f.satuan.endsWith("/kg"));
  if (panen.length === 0) return "Faktor emisi belum dikonfigurasi.";

  const nilai = panen.map((f) => f.faktor);
  const min = Math.min(...nilai);
  const max = Math.max(...nilai);
  const angka =
    min === max
      ? formatFaktor(min)
      : `${formatFaktor(min)}–${formatFaktor(max)}`;

  const sumber = [...new Set(panen.map((f) => f.sumber))].join("; ");
  const catatanTomat = panen.find((f) => f.komoditas === "tomato")?.catatan;

  return [
    `Faktor ${angka} kg CO₂e/kg panen, dibaca dari tabel konfigurasi emisi_faktor.`,
    `Sumber: ${sumber}.`,
    catatanTomat,
  ]
    .filter(Boolean)
    .join(" ");
}

/** 0.53 → "0,53" — angka desimal dalam notasi Indonesia. */
export function formatFaktor(faktor: number): string {
  return faktor.toString().replace(".", ",");
}
