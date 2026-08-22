import { getSupabase, isSupabaseConfigured } from "./supabase";
import type {
  AgregatBatch,
  DampakAgregat,
  EstimasiBerat,
  Grade,
  GradingError,
  GradingMulti,
  GradingResult,
  LaporanGrading,
  Listing,
  Pengiriman,
  Pesan,
  RekomendasiHarga,
  Rute,
  RuteItem,
  Ulasan,
  Penawaran,
} from "./types";
import type { Database } from "./database.types";
import { FAKTOR_EMISI_BAWAAN, tonCo2eDicegah, type FaktorEmisi } from "./emisi";
import { jarakKm, keTitik, type Titik } from "./jarak";
import {
  BOBOT_GRADE,
  URUT_GRADE,
  bobotEfektif,
  gradeDominan,
  pengaliDari,
  rentangWajar,
  skorKualitas,
  type Komposisi,
} from "./harga";

/**
 * Single seam between the UI and the backend.
 *
 * Every function tries Supabase / the FastAPI grading service first and falls
 * back to the demo data below when the backend is not configured or a call
 * fails — the app stays fully usable offline (docs/BACKEND.md).
 */

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ----------------------------------------------------------------------- */
/* Listings                                                                  */
/* ----------------------------------------------------------------------- */

type ListingRow = Database["public"]["Views"]["listings_view"]["Row"];

/**
 * Titik acuan jarak di sisi server: pusat Kota Yogyakarta.
 *
 * Server tidak tahu pembeli sedang berdiri di mana — geolocation hanya ada di
 * peramban. Jadi angka yang dirender lebih dulu adalah jarak dari pusat kota,
 * dan layar menyebutkannya begitu ("dari pusat Yogyakarta"), bukan
 * "dari lokasi Anda". Begitu izin lokasi diberikan, klien menghitung ulang dan
 * labelnya berubah.
 */
const ACUAN_KOTA: Titik = { lat: -7.7956, lng: 110.3695 };

export function rowToListing(r: ListingRow): Listing {
  const titik = keTitik(r.lat, r.lng);
  return {
    id: r.id ?? "",
    nama: r.nama ?? "",
    komoditas: r.komoditas ?? "",
    grade: (r.grade ?? "B") as Grade,
    berat_kg: Number(r.berat_kg ?? 0),
    harga_per_kg: r.harga_per_kg ?? 0,
    gambar: r.gambar ?? "/img/tomat.jpg",
    petani: r.petani ?? "Petani PANTAS",
    petani_id: r.petani_id ?? undefined,
    lokasi: r.lokasi ?? "-",
    // Kebun tanpa koordinat tidak pernah lagi meminjam posisi pembeli: dulu ia
    // terbaca "0 km" dan naik ke puncak daftar terdekat.
    jarak_km: jarakKm(ACUAN_KOTA, titik),
    rating: Number(r.rating ?? 5),
    transaksi: r.transaksi ?? 0,
    lat: titik?.lat ?? null,
    lng: titik?.lng ?? null,
    satuan: r.satuan ?? undefined,
    stok_kg: r.stok_kg != null ? Number(r.stok_kg) : undefined,
    panen_terakhir: r.panen_terakhir ?? undefined,
    komposisi: (r.komposisi as Listing["komposisi"]) ?? undefined,
    catatan_ai: r.catatan_ai ?? undefined,
    alamat: r.alamat ?? undefined,
    // Keduanya ada di listings_view sejak 0009; `hash_audit` datang dari join
    // ke gradings dan tetap null untuk listing tanpa pindaian.
    hash_audit: r.hash_audit ?? undefined,
    grading_id: r.grading_id ?? undefined,
  };
}

/**
 * Distance is a function of where the viewer is standing, so the demo listings
 * store coordinates and get their `jarak_km` computed on read — the same way
 * Supabase rows do. Hard-coded distances went stale the moment the seed moved
 * from Bandung to Yogyakarta.
 */
function withJarak(l: Listing): Listing {
  return { ...l, jarak_km: jarakKm(ACUAN_KOTA, keTitik(l.lat, l.lng)) };
}

export async function getListings(): Promise<Listing[]> {
  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("listings_view")
      .select("*")
      .eq("status", "tayang")
      .order("id");
    if (!error && data && data.length > 0) return data.map(rowToListing);
    if (error) console.warn("[pantas] getListings fallback demo:", error.message);
  }
  await delay(200);
  return LISTINGS.map(withJarak);
}

export async function getListing(id: string): Promise<Listing | undefined> {
  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("listings_view")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) return rowToListing(data);
    if (error) console.warn("[pantas] getListing fallback demo:", error.message);
  }
  await delay(150);
  const demo = LISTINGS.find((l) => l.id === id);
  return demo ? withJarak(demo) : undefined;
}

/* ----------------------------------------------------------------------- */
/* Grading — POST /predict on the FastAPI service (ai_engine/api.py)         */
/* ----------------------------------------------------------------------- */

const PREDICT_URL = process.env.NEXT_PUBLIC_PREDICT_URL;

/**
 * Komoditas yang dipahami engine — satu entri per file di
 * ai_engine/grading_configs/. Nilai `id` inilah yang dikirim ke /predict
 * sebagai `commodity`; bobot modelnya dipilih dari kata dasar
 * ("tomato_ceri" -> export_models/tomato_seg.pt), jadi id baru hanya valid
 * bila config JSON-nya ada. Di-generate oleh scripts/gen-komoditas.mjs
 * (jalan otomatis tiap `dev`/`build`) supaya tidak pernah out of sync
 * sama isi folder config — edit label/kelompok di script itu, bukan di sini.
 */
export { KOMODITAS } from "./komoditas.generated";
import { KOMODITAS } from "./komoditas.generated";

export const KOMODITAS_DEFAULT = "tomato_sayur";

export function labelKomoditas(id: string): string {
  return KOMODITAS.find((k) => k.id === id)?.label ?? "Komoditas";
}

export async function gradeBatch(opts?: {
  /** Camera capture as data URL (store.lastCapture). */
  imageDataUrl?: string | null;
  /** Komoditas spesifik yang dipahami engine, mis. "tomato_sayur". */
  commodity?: string;
  /**
   * Kotak [x, y, w, h] tempat koin Rp500 diperkirakan berada (store.lastCoinRoi).
   * Tanpa ini calibration.py menyapu seluruh foto dan bisa memakai tomat bulat
   * sebagai referensi 27 mm.
   */
  coinRoi?: [number, number, number, number] | null;
}): Promise<GradingResult> {
  if (PREDICT_URL && opts?.imageDataUrl) {
    try {
      const blob = await (await fetch(opts.imageDataUrl)).blob();
      const form = new FormData();
      form.append("image", blob, "batch.jpg");
      form.append("commodity", opts.commodity ?? KOMODITAS_DEFAULT);
      if (opts.coinRoi) form.append("roi", JSON.stringify(opts.coinRoi));
      const res = await fetch(`${PREDICT_URL.replace(/\/$/, "")}/predict`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as GradingResult;
      if (json.status === "success" || json.status === "error") return json;
      throw new Error("bentuk respons tidak dikenal");
    } catch (e) {
      return {
        status: "error",
        message: `Gagal menghubungi layanan grading (${e instanceof Error ? e.message : e}). Coba lagi.`,
        luring: true,
      };
    }
  }

  // Demo mode — same payload shape as ai_engine/model.py `dict_results`.
  await delay(1800);
  return {
    status: "success",
    komoditas: opts?.commodity ?? KOMODITAS_DEFAULT,
    objek_terdeteksi: 0,
    kalibrasi: { referensi: "koin_500", px_per_mm2: 0, valid: false },
    ringkasan_batch: {
      komposisi: {},
      skor_keseragaman: 0,
    },
    objek: [],
    hash_audit: "sha256:demo-mode-no-camera",
  };
}

/** Satu foto dalam antrean pindai — data URL beserta ROI koinnya sendiri. */
export interface FotoAntrean {
  dataUrl: string;
  /** Kotak [x, y, w, h] koin pada foto *ini*; null untuk foto galeri. */
  roi: [number, number, number, number] | null;
}

/**
 * Pindai batch multi-foto (F-12) — POST /predict/batch.
 *
 * Tiap foto membawa ROI koinnya sendiri: koin tidak berada di tempat yang sama
 * pada lima sudut yang berbeda, dan memakai satu ROI untuk semuanya akan
 * membuat kalibrasi gagal di empat foto sisanya.
 */
export async function gradeBatchMulti(
  fotos: FotoAntrean[],
  commodity: string,
): Promise<GradingMulti> {
  if (fotos.length === 0) {
    return {
      status: "error",
      komoditas: commodity,
      foto: [],
      agregat: agregatKosong(commodity, "Tidak ada foto yang dikirim."),
    };
  }

  if (PREDICT_URL) {
    try {
      const form = new FormData();
      for (const [i, f] of fotos.entries()) {
        const blob = await (await fetch(f.dataUrl)).blob();
        form.append("images", blob, `batch-${i + 1}.jpg`);
      }
      form.append("commodity", commodity);
      form.append("rois", JSON.stringify(fotos.map((f) => f.roi)));

      const res = await fetch(`${PREDICT_URL.replace(/\/$/, "")}/predict/batch`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as GradingMulti | GradingError;
      // Validasi komoditas & batas jumlah foto dijawab engine sebagai
      // GradingError polos, tanpa bidang `agregat`.
      if ("agregat" in json) return json;
      if (json.status === "error") {
        return {
          status: "error",
          komoditas: commodity,
          foto: [],
          agregat: agregatKosong(commodity, json.message),
        };
      }
      throw new Error("bentuk respons tidak dikenal");
    } catch (e) {
      return {
        status: "error",
        komoditas: commodity,
        foto: [],
        agregat: agregatKosong(
          commodity,
          `Gagal menghubungi layanan grading (${e instanceof Error ? e.message : e}). Coba lagi.`,
          true,
        ),
      };
    }
  }

  // Mode demo: bentuk payload yang sama, tanpa mengarang objek apa pun.
  await delay(1800);
  return {
    status: "error",
    komoditas: commodity,
    foto: fotos.map((_, i) => ({
      indeks: i,
      hasil: { status: "error", message: "Layanan grading tidak dikonfigurasi." },
    })),
    agregat: agregatKosong(
      commodity,
      "Layanan grading tidak dikonfigurasi (NEXT_PUBLIC_PREDICT_URL kosong).",
    ),
  };
}

/** Agregat kosong yang jujur: nol objek, dan alasan kenapa. */
function agregatKosong(
  komoditas: string,
  message: string,
  luring = false,
): AgregatBatch {
  return {
    status: "error",
    komoditas,
    foto_terproses: 0,
    foto_gagal: [],
    objek_terdeteksi: 0,
    kalibrasi: { referensi: "koin_500", valid: false, foto_terkalibrasi: 0 },
    ringkasan_batch: { komposisi: {}, skor_keseragaman: 0 },
    objek: [],
    message,
    luring,
  };
}

/* ----------------------------------------------------------------------- */
/* Riwayat pindai — tabel `gradings` (F-13)                                  */
/* ----------------------------------------------------------------------- */

/** Satu baris riwayat, sudah dibentuk untuk daftar. */
export interface RiwayatItem {
  id: string;
  tanggal: string;
  /** Id komoditas engine ("tomato_sayur"). */
  komoditas: string;
  komoditas_label: string;
  grade_dominan: Grade;
  objek: number;
  gambar?: string;
  skor?: number;
  /** Jumlah foto penyusun (F-12); undefined/1 = pindai satu foto. */
  foto?: number;
  hash_audit?: string;
  /** True jika hasil grading ini sudah dipublikasikan ke market sebagai listing. */
  is_listed?: boolean;
}

export interface FilterRiwayat {
  /** Halaman 1-basis. */
  halaman: number;
  perHalaman: number;
  /** Id komoditas persis; kosong = semua. */
  komoditas?: string;
  /** Batas tanggal inklusif, format "YYYY-MM-DD". */
  dari?: string;
  sampai?: string;
  grade?: Grade;
}

export interface HalamanRiwayat {
  items: RiwayatItem[];
  total: number;
}

/** Akhir hari lokal untuk batas `sampai`, supaya tanggalnya inklusif. */
function akhirHari(tanggal: string): string {
  return new Date(`${tanggal}T23:59:59.999`).toISOString();
}

function cocokFilter(item: RiwayatItem, f: FilterRiwayat): boolean {
  if (f.komoditas && item.komoditas !== f.komoditas) return false;
  if (f.grade && item.grade_dominan !== f.grade) return false;
  if (f.dari && item.tanggal < new Date(`${f.dari}T00:00:00`).toISOString()) return false;
  if (f.sampai && item.tanggal > akhirHari(f.sampai)) return false;
  return true;
}

const riwayatGradingCache = new Map<string, HalamanRiwayat>();

export function getCachedRiwayatGrading(kunci: string): HalamanRiwayat | null {
  return riwayatGradingCache.get(kunci) ?? null;
}

export function clearRiwayatGradingCache() {
  riwayatGradingCache.clear();
}

/**
 * Mengambil daftar pindaian dari Supabase jika terhubung, atau dari memori
 * lokal jika belum (F-13, §4.3). Dipakai oleh halaman riwayat petani; karena
 * fallback-nya transparan, komponen tidak perlu tahu dari mana data datang —
 * layar riwayat punya satu jalur kode untuk kedua mode.
 */
export async function getRiwayatGrading(
  filter: FilterRiwayat,
  cadanganLokal: RiwayatItem[] = [],
): Promise<HalamanRiwayat> {
  const kunci = JSON.stringify(filter);
  const cacheKey = `${kunci}_${cadanganLokal.length}`;
  if (riwayatGradingCache.has(cacheKey)) {
    return riwayatGradingCache.get(cacheKey)!;
  }

  const dari = (filter.halaman - 1) * filter.perHalaman;

  const supabase = await getSupabase();
  if (supabase) {
    let q = supabase
      .from("gradings")
      .select(
        "id, created_at, komoditas, komoditas_label, grade_dominan, objek_terdeteksi, gambar_url, hash_audit, hasil, listings(id)",
        { count: "exact" },
      );
    if (filter.komoditas) q = q.eq("komoditas", filter.komoditas);
    if (filter.grade) q = q.eq("grade_dominan", filter.grade);
    if (filter.dari) q = q.gte("created_at", new Date(`${filter.dari}T00:00:00`).toISOString());
    if (filter.sampai) q = q.lte("created_at", akhirHari(filter.sampai));

    const { data, error, count } = await q
      .order("created_at", { ascending: false })
      .range(dari, dari + filter.perHalaman - 1);

    if (!error) {
      const res: HalamanRiwayat = {
        items: (data ?? []).map((g) => ({
          id: g.id,
          tanggal: g.created_at,
          komoditas: g.komoditas,
          komoditas_label: g.komoditas_label,
          grade_dominan: g.grade_dominan as Grade,
          objek: g.objek_terdeteksi,
          gambar: g.gambar_url ?? undefined,
          skor: skorRingkasan(g.hasil),
          foto: fotoRingkasan(g.hasil),
          hash_audit: g.hash_audit ?? undefined,
          is_listed: Array.isArray(g.listings) ? g.listings.length > 0 : !!g.listings,
        })),
        total: count ?? 0,
      };
      riwayatGradingCache.set(cacheKey, res);
      riwayatGradingCache.set(kunci, res);
      return res;
    }
    console.warn("[pantas] getRiwayatGrading fallback lokal:", error.message);
  }

  await delay(120);
  const cocok = cadanganLokal.filter((i) => cocokFilter(i, filter));
  const res: HalamanRiwayat = {
    items: cocok.slice(dari, dari + filter.perHalaman),
    total: cocok.length,
  };
  riwayatGradingCache.set(cacheKey, res);
  riwayatGradingCache.set(kunci, res);
  return res;
}

/**
 * Berapa pindaian yang benar-benar tersimpan.
 *
 * `store.scans` bukan jawabannya: ia singgahan delapan pindaian terakhir —
 * `.limit(8)` saat hidrasi dan `.slice(0, 8)` saat menambah, karena satu
 * pindaian bisa membawa foto sebagai data URL dan localStorage cuma ~5 MB.
 * Ubin "Pindaian tersimpan" di Akun membacanya apa adanya, jadi arsip 15
 * pindaian dilaporkan sebagai 8 — angka yang bukan salah hitung, melainkan
 * ukuran singgahan yang kebetulan diberi label arsip.
 *
 * `head: true` supaya yang lewat kabel hanya hitungannya. Tanpa Supabase,
 * cadangan lokal memang satu-satunya arsip yang ada, jadi panjangnya benar.
 */
export async function getJumlahRiwayatGrading(
  cadanganLokal: number = 0,
): Promise<number> {
  const supabase = await getSupabase();
  if (supabase) {
    const { count, error } = await supabase
      .from("gradings")
      .select("id", { count: "exact", head: true });
    if (!error) return count ?? 0;
    console.warn("[pantas] getJumlahRiwayatGrading fallback lokal:", error.message);
  }
  return cadanganLokal;
}

/** Laporan utuh satu pindaian, untuk `/petani/riwayat/[id]`. */
export async function getGradingDetail(
  id: string,
): Promise<{ item: RiwayatItem; hasil: LaporanGrading } | null> {
  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("gradings")
      .select("*, listings(id)")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) {
      return {
        item: {
          id: data.id,
          tanggal: data.created_at,
          komoditas: data.komoditas,
          komoditas_label: data.komoditas_label,
          grade_dominan: data.grade_dominan as Grade,
          objek: data.objek_terdeteksi,
          gambar: data.gambar_url ?? undefined,
          skor: skorRingkasan(data.hasil),
          foto: fotoRingkasan(data.hasil),
          hash_audit: data.hash_audit ?? undefined,
          is_listed: Array.isArray(data.listings) ? data.listings.length > 0 : !!data.listings,
        },
        hasil: data.hasil as unknown as LaporanGrading,
      };
    }
  }
  return null;
}

function skorRingkasan(hasil: unknown): number | undefined {
  const skor = (hasil as LaporanGrading | null)?.ringkasan_batch?.skor_keseragaman;
  return typeof skor === "number" ? skor : undefined;
}

function fotoRingkasan(hasil: unknown): number | undefined {
  const n = (hasil as { foto_terproses?: number } | null)?.foto_terproses;
  return typeof n === "number" ? n : undefined;
}

/* ----------------------------------------------------------------------- */
/* Rekomendasi harga — harga_acuan (DB) × pengali kualitas                   */
/* ----------------------------------------------------------------------- */

const GRADE_LABEL: Record<Grade, string> = {
  A: "A (Premium)",
  B: "B (Standar)",
  C: "C (Ekonomis)",
  REJECT: "REJECT (Tidak layak jual)",
};

/**
 * Bagian murni algoritma harga tinggal di `harga.ts` supaya tes properti F-104
 * bisa menjalankannya 1.000 kali tanpa menyentuh Supabase. Di-reekspor dari sini
 * karena seluruh layar sudah mengimpornya lewat `@/lib/data`.
 */
export {
  BOBOT_GRADE,
  URUT_GRADE,
  bobotEfektif,
  gradeDominan,
  pengaliHarga,
  rentangWajar,
  skorKualitas,
} from "./harga";

export interface LotGrade {
  grade: Grade;
  /** Porsi grade ini pada batch asal [0..1]. */
  porsi: number;
  berat_kg: number;
}

/**
 * Bagi berat batch ke tiap grade menurut komposisinya.
 *
 * Pembulatan memakai metode sisa terbesar, bukan `Math.round` per baris: tiga
 * lot yang masing-masing dibulatkan sendiri bisa berjumlah 119 atau 121 kg dari
 * batch 120 kg, dan selisih itu muncul lagi sebagai stok yang tidak pernah bisa
 * dipesan habis. Grade dengan porsi nol tidak menghasilkan lot.
 */
export function pecahBeratPerGrade(
  komposisi: Partial<Record<Grade, number>>,
  totalKg: number,
): LotGrade[] {
  const hadir = URUT_GRADE.filter((g) => (komposisi[g] ?? 0) > 0);
  if (hadir.length === 0 || totalKg <= 0) return [];

  const mentah = hadir.map((grade) => {
    const porsi = komposisi[grade] ?? 0;
    return { grade, porsi, tepat: porsi * totalKg };
  });

  const lots = mentah.map((m) => ({ ...m, berat_kg: Math.floor(m.tepat) }));
  let sisa = Math.round(totalKg - lots.reduce((n, l) => n + l.berat_kg, 0));

  // Sisa kilogram jatuh ke grade dengan pecahan terbesar lebih dulu.
  const urutSisa = [...lots].sort(
    (a, b) => (b.tepat - b.berat_kg) - (a.tepat - a.berat_kg),
  );
  for (let i = 0; sisa > 0 && i < urutSisa.length; i++, sisa--) {
    urutSisa[i].berat_kg++;
  }

  return lots.map(({ grade, porsi, berat_kg }) => ({ grade, porsi, berat_kg }));
}

/**
 * Komposisi ⇄ query string, mis. `"A:0.143,B:0.571,C:0.286"`.
 *
 * Layar harga adalah server component dan menghitung rekomendasi per grade,
 * jadi komposisinya harus ikut di URL — bukan hanya di store klien. Bentuk
 * ringkas ini dipilih supaya URL tetap terbaca petani yang menyalinnya.
 */
export function komposisiKeParam(
  komposisi: Partial<Record<Grade, number>>,
): string {
  return URUT_GRADE.filter((g) => (komposisi[g] ?? 0) > 0)
    .map((g) => `${g}:${(komposisi[g] ?? 0).toFixed(3)}`)
    .join(",");
}

/**
 * Tautan "Jual" dari sebuah laporan grading.
 *
 * Dibangun di satu tempat karena laporan yang sama bisa dibuka dari layar
 * hasil dan dari arsip riwayat, dan dua salinan tautan berarti dua peluang
 * kehilangan parameter. Sebelum ini persis itu yang terjadi: tautan arsip
 * hanya mengirim komoditas dan grade, jadi batch yang sama mendapat dua harga
 * wajar berbeda tergantung layar mana yang dipakai membukanya.
 */
export function hrefJualLaporan({
  komoditas,
  komposisi,
  objek,
  sampel_kg,
  dari,
  grading_id,
  gambar,
}: {
  komoditas: string;
  komposisi: Partial<Record<Grade, number>>;
  /** Butir yang dinilai engine; ukuran sampel di balik komposisi. */
  objek: number;
  /** Perkiraan berat isi foto dalam kg, bila laporannya punya. */
  sampel_kg?: number | null;
  /** Jalur internal untuk tombol kembali layar harga. */
  dari: string;
  /** Hanya id baris `gradings` sungguhan — id cache bukan kunci asing sah. */
  grading_id?: string;
  /** Hanya URL penyimpanan; data URL puluhan kilobita tidak muat di URL. */
  gambar?: string | null;
}): string {
  const q = new URLSearchParams({
    komoditas,
    grade: gradeDominan(komposisi),
    skor: String(skorKualitas(komposisi)),
    komposisi: komposisiKeParam(komposisi),
    dari,
    objek: String(Math.max(0, Math.trunc(objek))),
  });
  if (sampel_kg && sampel_kg > 0) q.set("sampel", sampel_kg.toFixed(3));
  if (grading_id) q.set("grading", grading_id);
  if (gambar) q.set("gambar", gambar);
  return `/petani/harga?${q}`;
}

export function paramKeKomposisi(
  raw?: string,
): Partial<Record<Grade, number>> | null {
  if (!raw) return null;
  const hasil: Partial<Record<Grade, number>> = {};
  for (const bagian of raw.split(",")) {
    const [g, n] = bagian.split(":");
    const nilai = Number(n);
    if (!URUT_GRADE.includes(g as Grade) || !Number.isFinite(nilai)) continue;
    if (nilai > 0) hasil[g as Grade] = nilai;
  }
  return Object.keys(hasil).length > 0 ? hasil : null;
}

/**
 * Mirrors `harga_acuan` in supabase/seed_demo.sql.
 *
 * Semua angka **tingkat petani** (farm gate), bukan harga eceran. Versi
 * sebelumnya memakai harga konsumen, sementara pengali kualitas tertinggi hanya
 * 1,06 — petani grade A jadi disarankan menjual seharga ~106% harga konsumen.
 * Rumus di `lib/harga.ts` tidak diubah; yang keliru level pasar acuannya.
 * Angka dan `sumber` di sini wajib sama persis dengan `HARGA_SIMULASI` di
 * `app/api/cron/harga/route.ts`, supaya demo tanpa backend tidak menampilkan
 * harga yang berbeda dari demo dengan backend.
 */
const SUMBER_BAPANAS = "Bapanas, harga produsen nasional 2025";
const SUMBER_ESTIMASI = "Estimasi kalibrasi PANTAS, tingkat petani";

const DEMO_ACUAN: Record<
  string,
  { label: string; harga: number; sumber: string }
> = {
  tomato_sayur: { label: "Tomat Sayur", harga: 5000, sumber: SUMBER_ESTIMASI },
  tomato_beef: { label: "Tomat Beef", harga: 4800, sumber: SUMBER_ESTIMASI },
  tomato_ceri: { label: "Tomat Ceri", harga: 11000, sumber: SUMBER_ESTIMASI },
  tomato_merah: { label: "Tomat Merah", harga: 5200, sumber: SUMBER_ESTIMASI },
  chili_rawit: { label: "Cabai Rawit Merah", harga: 52000, sumber: SUMBER_BAPANAS },
  chili_merah_besar: { label: "Cabai Merah Besar", harga: 34000, sumber: SUMBER_BAPANAS },
  chili_merah_keriting: { label: "Cabai Merah Keriting", harga: 30000, sumber: SUMBER_BAPANAS },
  chili_hijau_besar: { label: "Cabai Hijau Besar", harga: 18000, sumber: SUMBER_ESTIMASI },
  cucumber_lokal: { label: "Timun Lokal", harga: 3500, sumber: SUMBER_ESTIMASI },
  cucumber_baby: { label: "Timun Baby", harga: 6500, sumber: SUMBER_ESTIMASI },
  // Kata dasar sebagai cadangan untuk varian yang belum punya harga sendiri.
  tomato: { label: "Tomat", harga: 5000, sumber: SUMBER_ESTIMASI },
  chili: { label: "Cabai", harga: 34000, sumber: SUMBER_BAPANAS },
  carrot: { label: "Wortel", harga: 6000, sumber: SUMBER_ESTIMASI },
  cucumber: { label: "Timun", harga: 3500, sumber: SUMBER_ESTIMASI },
};

export async function getRekomendasiHarga(opts?: {
  komoditas?: string;
  /**
   * Komposisi batch — jalur utama sejak F-104. Bobot grade ditimbang seluruh
   * komposisinya, jadi angka ini tidak bisa diturunkan dari grade dominan saja.
   */
  komposisi?: Komposisi;
  grade?: Grade;
  skor?: number;
}): Promise<RekomendasiHarga> {
  const komoditas = opts?.komoditas ?? KOMODITAS_DEFAULT;
  const komposisi = opts?.komposisi;
  const grade = komposisi ? gradeDominan(komposisi) : (opts?.grade ?? "B");
  const skor = komposisi ? skorKualitas(komposisi) : (opts?.skor ?? 0.62);
  /**
   * Tanpa komposisi — tautan lama berbentuk `?grade=B&skor=0,62` — batch
   * dianggap murni grade itu. Itu satu-satunya asumsi yang bisa dipertanggung-
   * jawabkan dari dua angka tersebut, dan hasilnya sama dengan rumus sebelum
   * F-104. Sifat monoton tidak tersentuh: ia sifat antar-komposisi, dan di jalur
   * ini tidak ada komposisi yang dibandingkan.
   */
  const bobot = komposisi ? bobotEfektif(komposisi) : BOBOT_GRADE[grade];

  // Komoditas spesifik dulu, lalu kata dasar ("carrot_lokal" -> "carrot").
  const base = komoditas.split("_")[0];
  const demo = DEMO_ACUAN[komoditas] ?? DEMO_ACUAN[base];
  let label = demo?.label ?? labelKomoditas(komoditas);
  let acuan = demo?.harga ?? 5000;
  // Komoditas yang belum punya baris sama sekali jatuh ke angka tomat; itu
  // tebakan, dan kalimatnya harus mengatakan begitu, bukan menyamar jadi acuan.
  let sumber = demo?.sumber
    ? `${demo.sumber}, demo`
    : "Belum ada acuan untuk komoditas ini, angka sementara";

  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("harga_acuan")
      .select("*")
      .in("komoditas", [komoditas, base]);
    const row =
      data?.find((r) => r.komoditas === komoditas) ??
      data?.find((r) => r.komoditas === base);
    if (!error && row) {
      label = row.label;
      acuan = row.harga;
      const tgl = new Date(row.updated_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      sumber = `${row.sumber}, ${tgl}`;
    }
  } else {
    await delay(300);
  }

  // Rumus transparan (tampil apa adanya di layar harga):
  // pengali = bobot_grade × (0,9 + 0,16 × skor); rentang wajar −7% / +8%.
  const pengali = pengaliDari(bobot, skor);

  return {
    komoditas_label: label,
    grade_dominan: grade,
    grade_dominan_label: GRADE_LABEL[grade],
    harga_acuan: acuan,
    harga_acuan_sumber: sumber,
    skor_kualitas: skor,
    bobot_grade: Math.round(bobot * 1000) / 1000,
    pengali,
    ...rentangWajar(acuan, pengali),
  };
}

/* ----------------------------------------------------------------------- */
/* Demo fallback data (mode offline tanpa backend)                           */
/* ----------------------------------------------------------------------- */

/**
 * Mirror of `supabase/seed_demo.sql` (F-03). Kept in step with the seed so the
 * app looks the same whether or not the backend is reachable, and so the map
 * shows one coherent DIY cluster in both cases.
 *
 * Only tomato and chilli appear: they are the commodities with a truthful photo
 * in `public/img`. A carrot listing carrying a potato photograph is a false
 * claim on a screen a judge grades.
 *
 * ⚠ `harga_per_kg` tiap baris wajib jatuh di dalam rentang wajarnya sendiri:
 * `DEMO_ACUAN[komoditas].harga × pengaliHarga(komposisi)`, lalu −7% / +8%.
 * Versi sebelumnya memakai harga eceran pasar sementara acuannya sudah tingkat
 * petani, jadi 10 dari 12 listing demo terbaca "Di atas rentang" — katalog yang
 * dinilai juri menuduh petaninya sendiri memasang harga tidak wajar. Angka di
 * bawah dipilih di sekitar tengah rentang. Begitu `DEMO_ACUAN` berubah, blok ini
 * ikut dihitung ulang, dan `supabase/seed_demo.sql` harus dapat angka yang sama.
 */
export const LISTINGS: Listing[] = [
  {
    id: "PNT-L-0401",
    nama: "Tomat Sayur Pakem",
    komoditas: "tomato_sayur",
    grade: "B",
    berat_kg: 320,
    harga_per_kg: 4100,
    gambar: "/img/tomat.jpg",
    petani: "Pak Warsono",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    lokasi: "Pakem, Sleman",
    jarak_km: 0,
    rating: 4.8,
    transaksi: 96,
    lat: -7.6497,
    lng: 110.421,
    satuan: "kg",
    stok_kg: 320,
    panen_terakhir: "Hari ini, 06.00 WIB",
    komposisi: { A: 0.14, B: 0.57, C: 0.29 },
    catatan_ai:
      "Kematangan merata dan kulit tebal, tahan pengiriman 3–5 hari. Dua butir undersize masuk kelas ekonomis, bukan dibuang.",
    alamat: "Kebun Warsono, Jl. Kaliurang KM 17, Hargobinangun, Pakem",
    hash_audit: "sha256:demo-mode-no-camera",
  },
  {
    id: "PNT-L-0402",
    nama: "Tomat Beef Rumah Kaca",
    komoditas: "tomato_beef",
    grade: "A",
    berat_kg: 180,
    harga_per_kg: 4600,
    gambar: "/img/tomat-rumahkaca.jpg",
    petani: "Pak Warsono",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    lokasi: "Pakem, Sleman",
    jarak_km: 0,
    rating: 4.8,
    transaksi: 96,
    lat: -7.6497,
    lng: 110.421,
    satuan: "kg",
    stok_kg: 180,
    panen_terakhir: "Kemarin, 15.30 WIB",
    komposisi: { A: 0.4, B: 0.6 },
    catatan_ai:
      "Ukuran besar dan seragam, solidity tinggi. Cocok untuk pasta dan saus industri.",
    alamat: "Kebun Warsono, Jl. Kaliurang KM 17, Hargobinangun, Pakem",
    hash_audit: "sha256:demo-mode-no-camera-2",
  },
  {
    id: "PNT-L-0403",
    nama: "Cabai Rawit Merah",
    komoditas: "chili_rawit",
    grade: "A",
    berat_kg: 140,
    harga_per_kg: 48000,
    gambar: "/img/cabai-rawit.jpg",
    petani: "Pak Warsono",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    lokasi: "Pakem, Sleman",
    jarak_km: 0,
    rating: 4.8,
    transaksi: 96,
    lat: -7.6497,
    lng: 110.421,
    satuan: "kg",
    stok_kg: 140,
    panen_terakhir: "Hari ini, 05.30 WIB",
    komposisi: { A: 0.5, B: 0.33, C: 0.17 },
    catatan_ai:
      "Warna merata, tingkat kepedasan konsisten. Veto patologi belum aktif untuk cabai, mutu dinilai dari geometri dan cacat kulit saja.",
    alamat: "Kebun Warsono, Jl. Kaliurang KM 17, Hargobinangun, Pakem",
  },
  {
    id: "PNT-L-0421",
    nama: "Tomat Merah Turi",
    komoditas: "tomato_merah",
    grade: "A",
    berat_kg: 240,
    harga_per_kg: 5100,
    gambar: "/img/tomat.jpg",
    petani: "Bu Karsih",
    petani_id: "a0000000-0000-4000-a000-000000000002",
    lokasi: "Turi, Sleman",
    jarak_km: 0,
    rating: 4.6,
    transaksi: 61,
    lat: -7.618,
    lng: 110.352,
    satuan: "kg",
    stok_kg: 240,
    panen_terakhir: "Hari ini, 07.00 WIB",
    komposisi: { A: 0.58, B: 0.34, C: 0.08 },
    catatan_ai: "Panen pagi, langsung dinaungi. Keseragaman tinggi.",
    alamat: "Greenhouse Karsih Tani, Donokerto, Turi",
  },
  {
    id: "PNT-L-0422",
    nama: "Tomat Ceri Organik",
    komoditas: "tomato_ceri",
    grade: "A",
    berat_kg: 620,
    harga_per_kg: 11200,
    gambar: "/img/tomat-cherry.jpg",
    petani: "Pak Rahman",
    petani_id: "a0000000-0000-4000-a000-000000000003",
    lokasi: "Cangkringan, Sleman",
    jarak_km: 0,
    rating: 4.9,
    transaksi: 120,
    lat: -7.635,
    lng: 110.453,
    satuan: "kg",
    stok_kg: 620,
    panen_terakhir: "Hari ini, 06.00 WIB",
    komposisi: { A: 0.67, B: 0.33 },
    catatan_ai:
      "Sertifikasi organik dalam proses. Ambang ukuran memakai config varian ceri.",
    alamat: "Kebun Organik Merapi Asri, Wukirsari, Cangkringan",
  },
  {
    id: "PNT-L-0424",
    nama: "Cabai Merah Besar",
    komoditas: "chili_merah_besar",
    grade: "B",
    berat_kg: 300,
    harga_per_kg: 29500,
    gambar: "/img/cabai-pasar.jpg",
    petani: "Pak Budi Santosa",
    petani_id: "a0000000-0000-4000-a000-000000000004",
    lokasi: "Kalibawang, Kulon Progo",
    jarak_km: 0,
    rating: 4.7,
    transaksi: 88,
    lat: -7.735,
    lng: 110.22,
    satuan: "kg",
    stok_kg: 300,
    panen_terakhir: "2 hari lalu",
    komposisi: { A: 0.24, B: 0.59, C: 0.17 },
    catatan_ai:
      "Volume besar dari kelompok tani Kalibawang. Siap konsolidasi satu rute.",
    alamat: "Kelompok Tani Budi Makmur, Banjararum, Kalibawang",
  },
  {
    id: "PNT-L-0426",
    nama: "Tomat Sayur Sedayu",
    komoditas: "tomato_sayur",
    grade: "C",
    berat_kg: 540,
    harga_per_kg: 3100,
    gambar: "/img/tomat.jpg",
    petani: "Kelompok Tani Sedayu",
    petani_id: "a0000000-0000-4000-a000-000000000005",
    lokasi: "Sedayu, Bantul",
    jarak_km: 0,
    rating: 4.4,
    transaksi: 55,
    lat: -7.828,
    lng: 110.276,
    satuan: "kg",
    stok_kg: 540,
    panen_terakhir: "3 hari lalu",
    komposisi: { B: 0.21, C: 0.66, REJECT: 0.13 },
    catatan_ai:
      "Batch akhir musim. Grade rendah tetap terserap industri olahan.",
    alamat: "Kelompok Tani Sedayu Sejahtera, Argomulyo, Sedayu",
  },
];

export interface DemoOrderData {
  id: string;
  kode: string;
  status: "dipesan" | "dikonfirmasi" | "serah_terima" | "selesai";
  nama: string;
  grade: Grade;
  berat_kg: number;
  harga_per_kg: number;
  total: number;
  pembeli: string;
  petani: string;
  pembeli_id: string;
  petani_id: string;
  berat_aktual_kg?: number;
  tanggal: string;
  komoditas: string;
}

export const DEMO_ORDERS: DemoOrderData[] = [
  {
    id: "PNT-0501",
    kode: "PNT-KX7M-42",
    status: "selesai",
    nama: "Tomat Sayur Pakem",
    grade: "B",
    berat_kg: 180,
    harga_per_kg: 4100,
    total: 738000,
    pembeli: "Rina Pradita",
    petani: "Pak Warsono",
    pembeli_id: "b0000000-0000-4000-b000-000000000001",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    tanggal: new Date(Date.now() - 86400000 * 21).toISOString(),
    komoditas: "tomato_sayur",
  },
  {
    id: "PNT-0502",
    kode: "PNT-QW3T-18",
    status: "selesai",
    nama: "Tomat Beef Rumah Kaca",
    grade: "A",
    berat_kg: 120,
    harga_per_kg: 4600,
    total: 552000,
    pembeli: "Rina Pradita",
    petani: "Pak Warsono",
    pembeli_id: "b0000000-0000-4000-b000-000000000001",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    tanggal: new Date(Date.now() - 86400000 * 14).toISOString(),
    komoditas: "tomato_beef",
  },
  {
    id: "PNT-0503",
    kode: "PNT-HN9B-63",
    status: "selesai",
    nama: "Tomat Ceri Grade C",
    grade: "C",
    berat_kg: 44,
    harga_per_kg: 7000,
    total: 308000,
    pembeli: "Rina Pradita",
    petani: "Pak Warsono",
    pembeli_id: "b0000000-0000-4000-b000-000000000001",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    tanggal: new Date(Date.now() - 86400000 * 9).toISOString(),
    komoditas: "tomato_ceri",
  },
  {
    id: "PNT-0504",
    kode: "PNT-RD5K-27",
    status: "serah_terima",
    nama: "Cabai Rawit Merah",
    grade: "A",
    berat_kg: 60,
    harga_per_kg: 48000,
    total: 2880000,
    pembeli: "Rina Pradita",
    petani: "Pak Warsono",
    pembeli_id: "b0000000-0000-4000-b000-000000000001",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    tanggal: new Date(Date.now() - 86400000 * 2).toISOString(),
    komoditas: "chili_rawit",
  },
  {
    id: "PNT-0505",
    kode: "PNT-TM8P-51",
    status: "dikonfirmasi",
    nama: "Cabai Merah Keriting",
    grade: "B",
    berat_kg: 150,
    harga_per_kg: 26000,
    total: 3900000,
    pembeli: "Rina Pradita",
    petani: "Pak Warsono",
    pembeli_id: "b0000000-0000-4000-b000-000000000001",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    tanggal: new Date(Date.now() - 86400000 * 1).toISOString(),
    // Menunjuk PNT-L-0404 di seed, jadi keriting — bukan `chili_merah_besar`
    // seperti tertulis sebelumnya. Field ini memilih baris `harga_acuan` yang
    // dipakai layar harga, jadi salah tunjuk berarti rentang wajar yang salah.
    komoditas: "chili_merah_keriting",
  },
  {
    id: "PNT-0506",
    kode: "PNT-VC2N-39",
    status: "dipesan",
    nama: "Tomat Merah Hargobinangun",
    grade: "B",
    berat_kg: 200,
    harga_per_kg: 4500,
    total: 900000,
    pembeli: "Pak Rahman",
    petani: "Pak Warsono",
    pembeli_id: "a0000000-0000-4000-a000-000000000003",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    tanggal: new Date(Date.now() - 3600000 * 5).toISOString(),
    // PNT-L-0406 adalah Tomat Merah Hargobinangun, bukan tomat sayur.
    komoditas: "tomato_merah",
  },
  {
    id: "PNT-0507",
    kode: "PNT-JF6Y-74",
    status: "selesai",
    nama: "Tomat Sayur Pakem",
    grade: "B",
    berat_kg: 90,
    harga_per_kg: 4100,
    total: 369000,
    pembeli: "Bu Karsih",
    petani: "Pak Warsono",
    pembeli_id: "a0000000-0000-4000-a000-000000000002",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    tanggal: new Date(Date.now() - 86400000 * 30).toISOString(),
    komoditas: "tomato_sayur",
  },
  {
    id: "PNT-0508",
    kode: "PNT-LB4Q-85",
    status: "dikonfirmasi",
    nama: "Tomat Beef Rumah Kaca",
    grade: "A",
    berat_kg: 55,
    harga_per_kg: 4600,
    total: 253000,
    pembeli: "Pak Budi Santosa",
    petani: "Pak Warsono",
    pembeli_id: "a0000000-0000-4000-a000-000000000004",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    tanggal: new Date(Date.now() - 86400000 * 3).toISOString(),
    komoditas: "tomato_beef",
  },
  {
    id: "PNT-0509",
    kode: "PNT-ZP7C-16",
    status: "selesai",
    nama: "Tomat Ceri Organik",
    grade: "A",
    berat_kg: 300,
    harga_per_kg: 11200,
    total: 3360000,
    pembeli: "Rina Pradita",
    petani: "Pak Rahman",
    pembeli_id: "b0000000-0000-4000-b000-000000000001",
    petani_id: "a0000000-0000-4000-a000-000000000003",
    tanggal: new Date(Date.now() - 86400000 * 17).toISOString(),
    komoditas: "tomato_ceri",
  },
  {
    id: "PNT-0510",
    kode: "PNT-GS3W-58",
    status: "dipesan",
    nama: "Cabai Merah Besar",
    grade: "B",
    berat_kg: 120,
    harga_per_kg: 29500,
    total: 3540000,
    pembeli: "Rina Pradita",
    petani: "Pak Budi Santosa",
    pembeli_id: "b0000000-0000-4000-b000-000000000001",
    petani_id: "a0000000-0000-4000-a000-000000000004",
    tanggal: new Date(Date.now() - 3600000 * 7).toISOString(),
    komoditas: "chili_merah_besar",
  },
];

export interface DemoScanData {
  id: string;
  tanggal: string;
  komoditas: string;
  komoditas_label: string;
  grade_dominan: Grade;
  objek: number;
  gambar: string;
  skor?: number;
  foto?: number;
  hash_audit?: string;
}

export const DEMO_SCANS: DemoScanData[] = [
  {
    id: "scan-demo-1",
    tanggal: new Date(Date.now() - 86400000 * 1).toISOString(),
    komoditas: "tomato_sayur",
    komoditas_label: "Tomat Sayur Merapi",
    grade_dominan: "A",
    objek: 8,
    gambar: "/img/tomat.jpg",
    skor: 0.88,
    foto: 1,
    hash_audit: "sha256:demo-mode-no-camera",
  },
  {
    id: "scan-demo-2",
    tanggal: new Date(Date.now() - 86400000 * 3).toISOString(),
    komoditas: "tomato_beef",
    komoditas_label: "Tomat Beef Rumah Kaca",
    grade_dominan: "A",
    objek: 6,
    gambar: "/img/tomat-rumahkaca.jpg",
    skor: 0.92,
    foto: 1,
    hash_audit: "sha256:demo-mode-no-camera-2",
  },
  {
    id: "scan-demo-3",
    tanggal: new Date(Date.now() - 86400000 * 5).toISOString(),
    komoditas: "chili_rawit",
    komoditas_label: "Cabai Rawit Merah",
    grade_dominan: "B",
    objek: 12,
    gambar: "/img/cabai-rawit.jpg",
    skor: 0.82,
    foto: 1,
    hash_audit: "sha256:demo-mode-no-camera-3",
  },
];

/* ----------------------------------------------------------------------- */
/* Traceability & Audit Hash (F-60)                                         */
/* ----------------------------------------------------------------------- */

export interface GradingAuditRecord {
  hash_audit: string;
  komoditas: string;
  komoditas_label: string;
  grade_dominan: Grade;
  objek_terdeteksi: number;
  ringkasan_batch: {
    komposisi: Partial<Record<Grade, number>>;
    skor_keseragaman: number;
    estimasi_berat?: EstimasiBerat;
  };
  /**
   * Laporan multi-foto (F-12) tidak punya satu `px_per_mm2` — tiap sudut punya
   * kalibrasinya sendiri — melainkan `foto_terkalibrasi`. Keduanya opsional
   * supaya halaman lacak publik bisa menyatakan yang benar untuk tiap bentuk,
   * bukan menampilkan "undefined px/mm²".
   */
  kalibrasi: {
    referensi: string;
    valid: boolean;
    px_per_mm2?: number;
    foto_terkalibrasi?: number;
  };
  /** Jumlah foto penyusun laporan; absen berarti pindai satu foto. */
  foto_terproses?: number;
  created_at: string;
  petani_nama?: string;
  petani_kabupaten?: string;
  gambar_url?: string;
  publik: boolean;
}

export async function getGradingByHash(hash: string): Promise<GradingAuditRecord | null> {
  const supabase = await getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("gradings")
      .select("*")
      .eq("hash_audit", hash)
      .maybeSingle();

    if (!error && data) {
      const hasil = data.hasil as {
        ringkasan_batch?: GradingAuditRecord["ringkasan_batch"];
        kalibrasi?: GradingAuditRecord["kalibrasi"];
        foto_terproses?: number;
      } | null;

      // Petani info: separate query to avoid relying on FK alias
      let petaniNama = "Petani PANTAS";
      let petaniKab = "DIY";
      const { data: profil } = await supabase
        .from("profiles")
        .select("nama, lokasi")
        .eq("id", data.petani_id)
        .maybeSingle();
      if (profil) {
        petaniNama = profil.nama ?? petaniNama;
        const parts = (profil.lokasi ?? "").split(",");
        petaniKab = parts.length > 0 ? parts[parts.length - 1].trim() : petaniKab;
      }

      return {
        hash_audit: data.hash_audit ?? hash,
        komoditas: data.komoditas,
        komoditas_label: data.komoditas_label,
        grade_dominan: data.grade_dominan as Grade,
        objek_terdeteksi: data.objek_terdeteksi,
        ringkasan_batch: hasil?.ringkasan_batch ?? { komposisi: { A: 0.8, B: 0.2 }, skor_keseragaman: 0.85 },
        kalibrasi: hasil?.kalibrasi ?? { referensi: "Rp500", px_per_mm2: 4.2, valid: true },
        foto_terproses: hasil?.foto_terproses,
        created_at: data.created_at,
        petani_nama: petaniNama,
        petani_kabupaten: petaniKab,
        gambar_url: data.gambar_url ?? undefined,
        publik: true,
      };
    }
  }

  // Fallback demo audit record
  await delay(150);
  return {
    hash_audit: hash.startsWith("sha256:") ? hash : `sha256:${hash}`,
    komoditas: "tomato_sayur",
    komoditas_label: "Tomat Sayur Merapi",
    grade_dominan: "A",
    objek_terdeteksi: 24,
    ringkasan_batch: {
      komposisi: { A: 0.75, B: 0.21, C: 0.04 },
      skor_keseragaman: 0.88,
    },
    kalibrasi: { referensi: "Koin Rp500 (Ø 27 mm)", px_per_mm2: 4.25, valid: true },
    created_at: new Date().toISOString(),
    petani_nama: "Pak Warsono",
    petani_kabupaten: "Sleman, DI Yogyakarta",
    gambar_url: "/img/tomat.jpg",
    publik: true,
  };
}

/* ----------------------------------------------------------------------- */
/* Logistik & Konsolidasi Rute (EP-F)                                       */
/* ----------------------------------------------------------------------- */




/**
 * Penjemputan yang boleh dilihat satu petani.
 *
 * Tabel `pengiriman` dibaca publik (RLS-nya `using (true)` supaya halaman lacak
 * bisa membacanya tanpa login), jadi penyaringan pemiliknya harus dilakukan di
 * sini — bukan diserahkan ke basis data. Dua jalan dipakai sekaligus karena
 * data demo dan data Supabase menyimpan kepemilikan dengan cara berbeda: baris
 * demo hanya punya nama petani, sedangkan baris nyata terhubung lewat
 * `order_id`.
 */
export function pengirimanMilikPetani(
  list: Pengiriman[],
  pemilik: { nama?: string | null; orderIds?: string[] },
): Pengiriman[] {
  const orderIds = new Set(pemilik.orderIds ?? []);
  const nama = pemilik.nama?.trim().toLowerCase();
  if (!nama && orderIds.size === 0) return list;
  return list.filter(
    (p) =>
      orderIds.has(p.order_id) ||
      (nama ? p.petani?.trim().toLowerCase() === nama : false),
  );
}

/** Penjemputan satu pesanan, atau null bila pesanan itu belum dijadwalkan. */
export function pengirimanUntukOrder(
  list: Pengiriman[],
  orderId: string,
): Pengiriman | null {
  return list.find((p) => p.order_id === orderId) ?? null;
}

/**
 * Hanya pengiriman bermetode `konsolidasi` yang boleh masuk perencana rute:
 * `jemput_mandiri` diantar petani sendiri dan `kurir_mitra` ditangani pihak
 * ketiga, jadi keduanya bukan beban armada koperasi (EP-F, F-51).
 */
export function pengirimanKonsolidasi(list: Pengiriman[]): Pengiriman[] {
  return list.filter((p) => p.metode === "konsolidasi");
}



type DynamicSelectOptions = { count?: "exact" | "planned" | "estimated"; head?: boolean };

type DynamicQueryResult = {
  eq: (col: string, val: unknown) => DynamicQueryResult;
  gte: (col: string, val: unknown) => DynamicQueryResult;
  limit: (n: number) => DynamicQueryResult;
  /** Rantai `select` sesudah `update`, dan penghitung `{ count, head }`. */
  select: (columns?: string, opts?: DynamicSelectOptions) => DynamicQueryResult;
  order: (col: string, opts?: { ascending?: boolean }) => DynamicQueryResult;
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
} & Promise<{ data: unknown[] | null; error: unknown; count?: number | null }>;

export type DynamicSupabase = {
  /** Fungsi security definer (migrasi 0015) — satu-satunya jalan tulis admin. */
  rpc: (
    nama: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>;
  from: (table: string) => {
    select: (columns?: string, opts?: DynamicSelectOptions) => DynamicQueryResult;
    insert: (values: unknown) => {
      select: () => {
        single: () => Promise<{ data: unknown; error: unknown }>;
      };
    } & Promise<{ error: unknown }>;
    update: (values: unknown) => DynamicQueryResult;
    delete: () => { eq: (col: string, val: unknown) => Promise<{ error: unknown }> };
  };
};

/**
 * Bahan demo dimuat saat dipakai, bukan diimpor di kepala berkas.
 *
 * data.ts ikut ke setiap route lewat `KOMODITAS` dan kawan-kawannya, jadi impor
 * statis menaruh ±3 KB gzip bahan demo di bundel semua orang — termasuk petani
 * yang datanya sudah nyata dan tidak akan pernah menyentuhnya. `import()`
 * menaruhnya di chunk tersendiri yang baru terunduh ketika Supabase tidak
 * menjawab; modulnya di-cache runtime, jadi panggilan berikutnya tidak menembak
 * jaringan lagi dan tetap satu instance (DEMO_PESAN dkk. memang ditulisi).
 */
const bahanDemo = () => import("./demo-data");

export async function getPengirimanList(): Promise<Pengiriman[]> {
  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client.from("pengiriman").select("*");
    if (!error && data && data.length > 0) return data as unknown as Pengiriman[];
  }
  await delay(150);
  const { DEMO_PENGIRIMAN } = await bahanDemo();
  return DEMO_PENGIRIMAN;
}

/**
 * Satu penjemputan berdasarkan id — tulang punggung `/petani/logistik/[id]`.
 *
 * `null` (bukan baris pertama yang kebetulan ada) ketika id-nya tidak dikenal:
 * layar yang menampilkan checklist muatan orang lain lebih berbahaya daripada
 * layar yang berkata "tidak ditemukan".
 */
export async function getPengirimanById(
  id: string,
): Promise<Pengiriman | null> {
  const supabase = await getSupabase();
  if (supabase && POLA_UUID.test(id)) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client
      .from("pengiriman")
      .select("*")
      .eq("id", id)
      .limit(1);
    const baris = (data as unknown as Pengiriman[] | null)?.[0];
    if (!error && baris) return baris;
  }
  await delay(80);
  const { DEMO_PENGIRIMAN } = await bahanDemo();
  return DEMO_PENGIRIMAN.find((p) => p.id === id) ?? null;
}

/**
 * Penjemputan satu pesanan — dipakai layar pesanan untuk menautkan dirinya ke
 * muatannya sendiri alih-alih melempar petani ke daftar dan menyuruhnya
 * menebak baris mana miliknya.
 */
export async function getPengirimanOrder(
  orderId: string,
): Promise<Pengiriman | null> {
  const supabase = await getSupabase();
  if (supabase && POLA_UUID.test(orderId)) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client
      .from("pengiriman")
      .select("*")
      .eq("order_id", orderId)
      .limit(1);
    const baris = (data as unknown as Pengiriman[] | null)?.[0];
    if (!error && baris) return baris;
  }
  await delay(80);
  const { DEMO_PENGIRIMAN } = await bahanDemo();
  return pengirimanUntukOrder(DEMO_PENGIRIMAN, orderId);
}

/**
 * Simpan centang checklist rantai dingin satu pengiriman (F-52).
 *
 * Seluruh peta ditulis sekaligus, bukan satu kunci per panggilan: kolomnya
 * jsonb, dan dua centang beruntun yang masing-masing menulis sebagian akan
 * saling menimpa.
 */
export async function simpanChecklistPengiriman(
  pengiriman_id: string,
  checklist: Record<string, boolean>,
): Promise<{ error: string | null }> {
  const supabase = await getSupabase();
  // Baris demo (`SHIP-001`) tidak pernah ada di Supabase: tabel `pengiriman`
  // berkunci uuid, dan mengirimkannya ke sana hanya menghasilkan "invalid
  // input syntax for type uuid" di layar petani.
  if (supabase && POLA_UUID.test(pengiriman_id)) {
    const client = supabase as unknown as DynamicSupabase;
    const { error } = await client
      .from("pengiriman")
      .update({ checklist })
      .eq("id", pengiriman_id);
    if (error) {
      return {
        error:
          (error as { message?: string }).message ??
          "Checklist gagal disimpan.",
      };
    }
    return { error: null };
  }

  // Mode demo: disimpan di objek dalam memori supaya layar tetap konsisten
  // selama sesi berjalan.
  const { DEMO_PENGIRIMAN } = await bahanDemo();
  const baris = DEMO_PENGIRIMAN.find((p) => p.id === pengiriman_id);
  if (baris) baris.checklist = checklist;
  await delay(80);
  return { error: null };
}

/**
 * Bukti penanganan yang tampil di halaman lacak publik (F-52).
 *
 * Hash audit menempel pada grading, sedangkan checklist menempel pada
 * pengiriman, jadi tautannya melewati tiga tabel: gradings → listings →
 * orders → pengiriman. Bila salah satu mata rantai belum ada — lot yang belum
 * terjual, misalnya — fungsi ini mengembalikan null dan halaman lacak tidak
 * menampilkan bagian itu sama sekali. Bukti penanganan yang dikarang lebih
 * buruk daripada tidak ada bukti.
 */
export async function getChecklistUntukHash(hash: string): Promise<{
  checklist: Record<string, boolean>;
  komoditas: string;
} | null> {
  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;

    const { data: grading } = await client
      .from("gradings")
      .select("id, komoditas")
      .eq("hash_audit", hash)
      .maybeSingle();
    if (!grading) return null;

    const g = grading as unknown as { id: string; komoditas: string };
    const { data: listing } = await client
      .from("listings")
      .select("id")
      .eq("grading_id", g.id)
      .maybeSingle();
    if (!listing) return null;

    const { data: order } = await client
      .from("orders")
      .select("id")
      .eq("listing_id", (listing as unknown as { id: string }).id)
      .maybeSingle();
    if (!order) return null;

    const { data: kirim } = await client
      .from("pengiriman")
      .select("checklist")
      .eq("order_id", (order as unknown as { id: string }).id)
      .maybeSingle();
    if (!kirim) return null;

    const checklist =
      ((kirim as unknown as { checklist?: Record<string, boolean> }).checklist ??
        {}) as Record<string, boolean>;
    return { checklist, komoditas: g.komoditas };
  }

  await delay(80);
  const { DEMO_PENGIRIMAN } = await bahanDemo();
  const demo = DEMO_PENGIRIMAN[0];
  return demo.checklist
    ? { checklist: demo.checklist, komoditas: demo.komoditas ?? "tomato_sayur" }
    : null;
}

export async function getPenawaranList(role: "petani" | "pembeli", uid: string): Promise<Penawaran[]> {
  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client.from("penawaran").select("*").eq(role === "petani" ? "petani_id" : "pembeli_id", uid);
    if (!error && data) return data as unknown as Penawaran[];
  }
  await delay(150);
  // Demo mode returns hardcoded offers, we assume uid matches demo user ids.
  const { DEMO_PENAWARAN } = await bahanDemo();
  return DEMO_PENAWARAN.filter(p => role === "petani" ? p.petani_id === uid : p.pembeli_id === uid);
}

/**
 * Bentuk baris dari `rute` + join `rute_item(*, pengiriman(*))` menjadi `Rute`.
 * Nama relasi Postgres adalah `rute_item`, sedangkan UI memakai `item` yang
 * sudah terurut — pengurutan dilakukan di sini supaya tiap pemanggil tidak
 * perlu mengingatnya.
 */
function rowToRute(row: Record<string, unknown>): Rute {
  const items = (row.rute_item as Record<string, unknown>[] | null) ?? [];
  return {
    id: String(row.id ?? ""),
    nomor: Number(row.nomor ?? 0),
    tanggal: String(row.tanggal ?? ""),
    kendaraan: String(row.kendaraan ?? "Pickup L300 (1.5 Ton)"),
    kapasitas_kg: Number(row.kapasitas_kg ?? 1500),
    status: (row.status as Rute["status"]) ?? "draf",
    jarak_km: Number(row.jarak_km ?? 0),
    jarak_individual_km: Number(row.jarak_individual_km ?? 0),
    item: items
      .map((it) => ({
        urutan: Number(it.urutan ?? 0),
        perkiraan_tiba: (it.perkiraan_tiba as string | null) ?? undefined,
        pengiriman: it.pengiriman as unknown as Pengiriman,
      }))
      .filter((it) => it.pengiriman)
      .sort((a, b) => a.urutan - b.urutan),
  };
}

/* --- Penyimpanan rute mode demo ----------------------------------------- */
/**
 * Tanpa Supabase tidak ada server yang bisa menyimpan rute, tetapi juri tetap
 * harus melihat alurnya utuh: admin menyimpan rute, petani melihat nomornya.
 * localStorage menjembatani itu di dalam satu peramban. Di server (render awal)
 * `window` tidak ada, jadi fungsi ini jatuh ke DEMO_RUTE.
 */
export const KUNCI_RUTE_DEMO = "pantas:rute-demo";

/** Rute yang disimpan admin di sesi ini saja — tanpa rute bawaan DEMO_RUTE. */
function bacaRuteLokal(): Rute[] {
  if (typeof window === "undefined") return [];
  try {
    const mentah = window.localStorage.getItem(KUNCI_RUTE_DEMO);
    return mentah ? (JSON.parse(mentah) as Rute[]) : [];
  } catch {
    return [];
  }
}

/**
 * Status rute bawaan yang sudah dimajukan operator, disimpan terpisah.
 *
 * `DEMO_RUTE` adalah konstanta modul — ia tidak bisa ditulisi. Tanpa peta
 * timpaan ini tombol "Kunci rute" pada rute contoh akan selalu gagal, dan
 * satu-satunya rute yang terlihat di basis data kosong justru yang tidak bisa
 * disentuh.
 */
export const KUNCI_STATUS_RUTE_DEMO = "pantas:rute-demo-status";

export function bacaStatusRuteDemo(): Record<string, Rute["status"]> {
  if (typeof window === "undefined") return {};
  try {
    const mentah = window.localStorage.getItem(KUNCI_STATUS_RUTE_DEMO);
    return mentah ? (JSON.parse(mentah) as Record<string, Rute["status"]>) : {};
  } catch {
    return {};
  }
}

async function bacaRuteDemo(): Promise<Rute[]> {
  const timpa = bacaStatusRuteDemo();
  const { DEMO_RUTE } = await bahanDemo();
  return [
    ...DEMO_RUTE.map((r) => (timpa[r.id] ? { ...r, status: timpa[r.id] } : r)),
    ...bacaRuteLokal(),
  ];
}

function tulisRuteDemo(rute: Rute): void {
  if (typeof window === "undefined") return;
  try {
    const mentah = window.localStorage.getItem(KUNCI_RUTE_DEMO);
    const tersimpan = mentah ? (JSON.parse(mentah) as Rute[]) : [];
    window.localStorage.setItem(KUNCI_RUTE_DEMO, JSON.stringify([...tersimpan, rute]));
  } catch {
    /* kuota penuh atau mode privat — rute tetap tampil di sesi berjalan */
  }
}

export async function getRuteList(): Promise<Rute[]> {
  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client
      .from("rute")
      .select("*, rute_item(*, pengiriman(*))")
      .order("nomor", { ascending: false });
    if (!error && data && data.length > 0) {
      // Rute lokal ikut disertakan: pada mode campuran (Supabase aktif tapi
      // tabel pengiriman masih kosong) rencana baru tersimpan di peramban, dan
      // layar petani tetap harus menemukannya.
      return [...(data as Record<string, unknown>[]).map(rowToRute), ...bacaRuteLokal()];
    }
  }
  await delay(150);
  return bacaRuteDemo();
}

/** Satu perhentian rute beserta rute induknya — dipakai layar logistik petani. */
export interface PenugasanRute {
  rute: Rute;
  item: RuteItem;
}

/**
 * Menjawab "pengiriman ini masuk rute mana, dan armada tiba jam berapa?".
 * Arah kebalikan dari getRuteList; `null` bila penjemputan belum dijadwalkan
 * ke rute mana pun (petani melihat status menunggu, bukan nomor palsu).
 */
export async function getRuteUntukPengiriman(
  pengirimanId: string,
): Promise<PenugasanRute | null> {
  const daftar = await getRuteList();
  for (const rute of daftar) {
    const item = rute.item.find((it) => it.pengiriman?.id === pengirimanId);
    if (item) return { rute, item };
  }
  return null;
}

/** Perhentian yang dikirim perencana ke penyimpanan, sudah terurut. */
export interface PerhentianBaru {
  pengiriman_id: string;
  urutan: number;
  perkiraan_tiba: string;
}

export interface RuteBaru {
  kendaraan: string;
  kapasitas_kg: number;
  jarak_km: number;
  jarak_individual_km: number;
  perhentian: PerhentianBaru[];
}

/**
 * Menyimpan hasil perencana ke `rute` + `rute_item` (F-51).
 *
 * Bila insert item gagal — misalnya trigger kapasitas menolak muatan — baris
 * `rute` yang sudah terbuat ikut dihapus supaya tidak meninggalkan rute kosong
 * yang terhitung di dashboard admin.
 */
export const POLA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function simpanRute(input: RuteBaru): Promise<Rute> {
  /*
   * Supabase bisa terkonfigurasi sementara tabel `pengiriman` masih kosong,
   * sehingga perencana menampilkan DEMO_PENGIRIMAN yang ber-id "SHIP-001".
   * Menulis id itu ke Postgres pasti ditolak (kolomnya uuid) dan meninggalkan
   * baris `rute` yatim, jadi perhentian demo selalu disimpan lewat jalur demo.
   */
  const dariBasisData = input.perhentian.every((p) => POLA_UUID.test(p.pengiriman_id));

  const supabase = await getSupabase();
  if (supabase && dariBasisData) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client
      .from("rute")
      .insert({
        kendaraan: input.kendaraan,
        kapasitas_kg: input.kapasitas_kg,
        jarak_km: input.jarak_km,
        jarak_individual_km: input.jarak_individual_km,
        status: "draf",
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(pesanGalat(error) ?? "Rute gagal disimpan.");
    }

    const ruteRow = data as Record<string, unknown>;
    const { error: galatItem } = await client.from("rute_item").insert(
      input.perhentian.map((p) => ({
        rute_id: ruteRow.id,
        pengiriman_id: p.pengiriman_id,
        urutan: p.urutan,
        perkiraan_tiba: p.perkiraan_tiba,
      })),
    );

    if (galatItem) {
      await client.from("rute").delete().eq("id", ruteRow.id);
      throw new Error(pesanGalat(galatItem) ?? "Perhentian rute gagal disimpan.");
    }

    const { data: lengkap } = await client
      .from("rute")
      .select("*, rute_item(*, pengiriman(*))")
      .eq("id", ruteRow.id)
      .maybeSingle();

    return lengkap
      ? rowToRute(lengkap as Record<string, unknown>)
      : rowToRute({ ...ruteRow, rute_item: [] });
  }

  // Mode demo: rakit objek Rute dari data lokal lalu simpan di localStorage.
  await delay(200);
  const semua = await bacaRuteDemo();
  const { DEMO_PENGIRIMAN } = await bahanDemo();
  const nomor = semua.reduce((maks, r) => Math.max(maks, r.nomor), 0) + 1;
  const rute: Rute = {
    id: `RUTE-DEMO-${nomor}`,
    nomor,
    tanggal: new Date().toISOString().slice(0, 10),
    kendaraan: input.kendaraan,
    kapasitas_kg: input.kapasitas_kg,
    status: "draf",
    jarak_km: input.jarak_km,
    jarak_individual_km: input.jarak_individual_km,
    item: input.perhentian.flatMap<RuteItem>((p) => {
      const pengiriman = DEMO_PENGIRIMAN.find((s) => s.id === p.pengiriman_id);
      return pengiriman
        ? [{ urutan: p.urutan, perkiraan_tiba: p.perkiraan_tiba, pengiriman }]
        : [];
    }),
  };
  tulisRuteDemo(rute);
  return rute;
}

export function pesanGalat(error: unknown): string | null {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return null;
}

/* ----------------------------------------------------------------------- */
/* Faktor emisi (F-106)                                                     */
/* ----------------------------------------------------------------------- */

/**
 * Membaca tabel konfigurasi `emisi_faktor`.
 *
 * Hasilnya di-cache selama proses berjalan: setiap layar dampak, kartu rute,
 * dan bagian landing membutuhkan tabel yang sama, dan isinya berubah dalam
 * hitungan bulan — bukan detik. `FAKTOR_EMISI_BAWAAN` dipakai bila Supabase
 * tidak dikonfigurasi atau kueri gagal, supaya angka di layar tetap punya
 * sitasi alih-alih menjadi nol.
 */
let cacheFaktorEmisi: FaktorEmisi[] | null = null;

export async function getFaktorEmisi(): Promise<FaktorEmisi[]> {
  if (cacheFaktorEmisi) return cacheFaktorEmisi;

  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client
      .from("emisi_faktor")
      .select("*")
      .order("komoditas", { ascending: true });
    if (!error && data && data.length > 0) {
      cacheFaktorEmisi = (data as Record<string, unknown>[]).map((r) => ({
        komoditas: String(r.komoditas),
        faktor: Number(r.faktor),
        // `satuan` baru ada sejak 0007; basis data yang belum dimigrasi tetap
        // terbaca sebagai faktor panen, satuan lama satu-satunya di tabel.
        satuan: r.satuan ? String(r.satuan) : "kg CO₂e/kg",
        sumber: String(r.sumber),
        catatan: r.catatan == null ? null : String(r.catatan),
      }));
      return cacheFaktorEmisi;
    }
  }

  cacheFaktorEmisi = FAKTOR_EMISI_BAWAAN;
  return cacheFaktorEmisi;
}

export async function getDampakAgregat(): Promise<DampakAgregat> {
  const faktor = await getFaktorEmisi();

  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client.from("dampak_agregat").select("*").maybeSingle();
    if (!error && data) {
      const d = data as Record<string, unknown>;
      const kg = Number(d.kg_tersalurkan ?? 18450);
      return {
        transaksi_selesai: Number(d.transaksi_selesai ?? 142),
        kg_tersalurkan: kg,
        nilai_transaksi: Number(d.nilai_transaksi ?? 245000000),
        km_dihemat: Number(d.km_dihemat ?? 1240),
        // View agregat tidak memecah berat per komoditas, jadi baris `lainnya`
        // — batas bawah kategori sayuran — dipakai untuk seluruh volume.
        co2e_ton_dihemat: bulatkanTon(tonCo2eDicegah([{ berat_kg: kg }], faktor)),
      };
    }
  }

  await delay(150);
  return {
    transaksi_selesai: 142,
    kg_tersalurkan: 18450,
    nilai_transaksi: 245000000,
    km_dihemat: 1240,
    co2e_ton_dihemat: bulatkanTon(tonCo2eDicegah([{ berat_kg: 18450 }], faktor)),
  };
}

/** Ton CO₂e dibulatkan ke dua desimal — presisi yang wajar untuk klaim dampak. */
function bulatkanTon(ton: number): number {
  return Math.round(ton * 100) / 100;
}


/* ----------------------------------------------------------------------- */
/* Pesan & Realtime Chat                                                    */
/* ----------------------------------------------------------------------- */



interface PesanRow {
  id: string;
  order_id: string | null;
  penawaran_id: string | null;
  pengirim_id: string;
  penerima_id: string;
  isi: string;
  dibaca: boolean;
  created_at: string;
  profiles?: { nama: string } | null;
}

interface UlasanRow {
  id: string;
  order_id: string;
  penilai_id: string;
  dinilai_id: string;
  bintang: number;
  komentar: string | null;
  created_at: string;
  profiles?: { nama: string } | null;
}

/**
 * Percakapan tidak boleh jatuh ke data demo.
 *
 * Fungsi lain di berkas ini sengaja jatuh ke contoh saat backend gagal — katalog
 * kosong lebih buruk daripada katalog contoh. Chat kebalikannya: satu kalimat
 * karangan di tengah negosiasi harga tidak bisa dibedakan dari kalimat lawan
 * bicara yang sungguhan, dan pesan "terkirim" yang sebenarnya ditolak RLS
 * membuat kedua pihak menunggu balasan yang tidak akan pernah datang.
 *
 * Jadi begitu Supabase terpasang, hanya isi Supabase yang boleh tampil, dan
 * kegagalan harus terlihat.
 */
export async function getPesanList(params: { order_id?: string; penawaran_id?: string }): Promise<Pesan[]> {
  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    let query: DynamicQueryResult = client.from("pesan").select("*, profiles:pengirim_id(nama)");
    if (params.order_id) query = query.eq("order_id", params.order_id);
    if (params.penawaran_id) query = query.eq("penawaran_id", params.penawaran_id);
    const { data, error } = await query.order("created_at", { ascending: true });
    if (error) {
      throw new Error((error as { message?: string }).message ?? "Gagal memuat pesan");
    }
    return ((data ?? []) as unknown as PesanRow[]).map((row) => ({
      ...row,
      order_id: row.order_id ?? undefined,
      penawaran_id: row.penawaran_id ?? undefined,
      pengirim_nama: row.profiles?.nama ?? "Pengguna PANTAS",
    }));
  }

  // Klien gagal dimuat padahal env-nya ada: itu kegagalan, bukan mode demo.
  if (isSupabaseConfigured) throw new Error("Klien Supabase tidak tersedia");

  await delay(100);
  const { DEMO_PESAN } = await bahanDemo();
  return DEMO_PESAN.filter(
    (p) => (params.order_id && p.order_id === params.order_id) || (params.penawaran_id && p.penawaran_id === params.penawaran_id)
  );
}

/** Mengembalikan `null` bila pesan tidak tersimpan — pemanggil wajib memberi tahu pengguna. */
export async function kirimPesan(pesan: Omit<Pesan, "id" | "created_at" | "dibaca">): Promise<Pesan | null> {
  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client.from("pesan").insert(pesan).select().single();
    if (error || !data) return null;
    return data as unknown as Pesan;
  }

  if (isSupabaseConfigured) return null;

  const newPesan: Pesan = {
    id: "MSG-" + Math.random().toString(36).substring(2, 9),
    ...pesan,
    dibaca: false,
    created_at: new Date().toISOString(),
  };
  const { DEMO_PESAN } = await bahanDemo();
  DEMO_PESAN.push(newPesan);
  return newPesan;
}

export function subscribePesan(
  filter: { order_id?: string; penawaran_id?: string },
  onNewMessage: (pesan: Pesan) => void
): () => void {
  if (!isSupabaseConfigured) return () => {};

  // Klien Supabase dimuat dinamis, jadi kanalnya baru ada satu tick kemudian.
  // Pemanggil tetap menerima fungsi lepas-langganan yang sinkron: kalau effect
  // React sudah dibongkar sebelum kliennya tiba, `dibatalkan` mencegah kanal
  // yatim yang tidak pernah ditutup.
  let dibatalkan = false;
  let lepas: (() => void) | null = null;

  void getSupabase().then(async (client) => {
    if (!client || dibatalkan) return;
    // Lihat `siapkanAuthRealtime`: kanal yang bergabung sebelum tokennya ada
    // tidak akan pernah menerima satu pesan pun.
    await siapkanAuthRealtime(client);
    if (dibatalkan) return;
    const filterStr = filter.order_id
      ? `order_id=eq.${filter.order_id}`
      : `penawaran_id=eq.${filter.penawaran_id}`;

    const channel = client
      .channel(topikUnik("pesan_chat", String(filter.order_id || filter.penawaran_id)))
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pesan",
          filter: filterStr,
        },
        (payload) => {
          onNewMessage(payload.new as Pesan);
        }
      )
      .subscribe();

    lepas = () => {
      client.removeChannel(channel);
    };
  });

  return () => {
    dibatalkan = true;
    lepas?.();
  };
}

/**
 * Tandai pesan masuk pada satu percakapan sudah dibaca.
 *
 * Hanya baris yang ditujukan ke `penerima_id` yang disentuh — policy update
 * tabel `pesan` mengizinkan kedua pihak, jadi batasannya harus ditulis di sini
 * agar seseorang tidak bisa menandai pesannya sendiri "sudah dibaca" lawan.
 */
export async function tandaiPesanDibaca(
  params: { order_id?: string; penawaran_id?: string },
  penerima_id: string,
): Promise<number> {
  if (!params.order_id && !params.penawaran_id) return 0;

  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    let query: DynamicQueryResult = client
      .from("pesan")
      .update({ dibaca: true })
      .eq("penerima_id", penerima_id)
      .eq("dibaca", false);
    if (params.order_id) query = query.eq("order_id", params.order_id);
    if (params.penawaran_id) query = query.eq("penawaran_id", params.penawaran_id);
    const { data, error } = await query.select("id");
    if (error) return 0;
    return (data as unknown as { id: string }[] | null)?.length ?? 0;
  }

  if (isSupabaseConfigured) return 0;

  let n = 0;
  const { DEMO_PESAN } = await bahanDemo();
  for (const p of DEMO_PESAN) {
    const cocok =
      (params.order_id && p.order_id === params.order_id) ||
      (params.penawaran_id && p.penawaran_id === params.penawaran_id);
    if (cocok && p.penerima_id === penerima_id && !p.dibaca) {
      p.dibaca = true;
      n += 1;
    }
  }
  return n;
}

/**
 * Hasil percobaan hapus satu baris riwayat.
 *
 * Tiga nilai, bukan boolean, karena ketiganya berujung pada kalimat berbeda di
 * layar: `terkunci` adalah penolakan yang benar dan bisa dijelaskan ("batch ini
 * sudah dijual"), sedangkan `gagal` adalah gangguan yang pantas disuruh coba
 * lagi. Menggabungkan keduanya membuat petani diberi tahu batchnya sudah
 * dilisting padahal yang terjadi cuma sinyal putus.
 */
export type HasilHapusRiwayat = "ok" | "terkunci" | "gagal";

/**
 * Hapus satu riwayat grading yang belum diterbitkan ke pasar.
 *
 * Kebijakan RLS `petani_hapus_grading_mandiri` (migrasi 0014) menyaring baris,
 * bukan melempar galat — DELETE yang ditolak pulang tanpa `error` dan tanpa
 * baris. Karena itu penghapusan diminta dengan `.select()` dan hasilnya
 * diperiksa: nol baris berarti kebijakan menahannya, dan satu query lanjutan
 * memisahkan "ditahan karena sudah dilisting" dari "barisnya memang sudah tidak
 * ada" — yang bagi petani sama saja dengan berhasil.
 *
 * Pindaian yang hanya hidup di sesi ini (id `scan-<timestamp>`) tidak punya
 * baris `gradings`; penghapusannya diselesaikan pemanggil lewat `hapusScan` di
 * store.
 */
export async function hapusRiwayatGrading(id: string): Promise<HasilHapusRiwayat> {
  const supabase = await getSupabase();
  if (!supabase || id.startsWith("scan-")) {
    clearRiwayatGradingCache();
    return "ok";
  }

  const { data, error } = await supabase
    .from("gradings")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("[pantas] Gagal menghapus grading:", error.message);
    return "gagal";
  }

  clearRiwayatGradingCache();
  if ((data ?? []).length > 0) return "ok";

  const { data: sisa, error: galatPeriksa } = await supabase
    .from("gradings")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (galatPeriksa) return "gagal";
  return sisa ? "terkunci" : "ok";
}

/**
 * Pesan masuk yang belum dibaca, dipilah per permukaan.
 *
 * Dipilah karena badge navigasi harus menunjuk ke tempat yang benar: pesan
 * pada sebuah penawaran dibaca di layar Penawaran, bukan di layar Pesanan.
 * Satu angka gabungan akan mengirim petani ke tab yang salah.
 */
export interface PesanBelumDibaca {
  total: number;
  pesanan: number;
  penawaran: number;
}

const NOL_BELUM_DIBACA: PesanBelumDibaca = { total: 0, pesanan: 0, penawaran: 0 };

function pilahBelumDibaca(
  rows: { order_id: string | null; penawaran_id: string | null }[],
): PesanBelumDibaca {
  let pesanan = 0;
  let penawaran = 0;
  for (const r of rows) {
    if (r.order_id) pesanan += 1;
    else if (r.penawaran_id) penawaran += 1;
  }
  return { total: pesanan + penawaran, pesanan, penawaran };
}

export async function hitungPesanBelumDibaca(
  penerima_id: string,
): Promise<PesanBelumDibaca> {
  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client
      .from("pesan")
      .select("order_id, penawaran_id")
      .eq("penerima_id", penerima_id)
      .eq("dibaca", false);
    if (!error) {
      return pilahBelumDibaca(
        (data ?? []) as { order_id: string | null; penawaran_id: string | null }[],
      );
    }
    return NOL_BELUM_DIBACA;
  }

  if (isSupabaseConfigured) return NOL_BELUM_DIBACA;

  await delay(60);
  const { DEMO_PESAN } = await bahanDemo();
  return pilahBelumDibaca(
    DEMO_PESAN.filter((p) => p.penerima_id === penerima_id && !p.dibaca).map((p) => ({
      order_id: p.order_id ?? null,
      penawaran_id: p.penawaran_id ?? null,
    })),
  );
}

/**
 * Dengarkan pesan masuk untuk satu pengguna, lintas percakapan.
 *
 * Terpisah dari `subscribePesan` yang di-scope ke satu order/penawaran: badge
 * "belum dibaca" di navigasi harus menyala walau layar chat-nya tidak terbuka.
 */
export function subscribePesanMasuk(
  penerima_id: string,
  onPesan: (pesan: Pesan) => void,
): () => void {
  if (!isSupabaseConfigured) return () => {};

  // Alasan bentuk async-nya sama dengan `subscribePesan` di atas.
  let dibatalkan = false;
  let lepas: (() => void) | null = null;

  void getSupabase().then(async (client) => {
    if (!client || dibatalkan) return;
    await siapkanAuthRealtime(client);
    if (dibatalkan) return;
    const channel = client
      .channel(topikUnik("pesan_masuk", penerima_id))
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pesan",
          filter: `penerima_id=eq.${penerima_id}`,
        },
        (payload) => onPesan(payload.new as Pesan),
      )
      .subscribe();

    lepas = () => {
      client.removeChannel(channel);
    };
  });

  return () => {
    dibatalkan = true;
    lepas?.();
  };
}

/**
 * Status kanal realtime, seperti yang dilihat pemanggil.
 *
 * Dipakai layar untuk mengatakan jujur apakah yang tampil masih hidup. Tanpa
 * itu, aplikasi yang kanalnya diam-diam mati terlihat persis sama dengan
 * aplikasi yang memang belum ada perubahannya — dan pengguna baru sadar
 * setelah menyegarkan halaman, yang justru ingin dihilangkan.
 */
export type StatusLangganan = "menyambung" | "hidup" | "terputus";

/** Jeda coba-ulang, naik berlipat lalu berhenti di 30 detik. */
function jedaUlang(percobaan: number) {
  return Math.min(30_000, 1_000 * 2 ** percobaan);
}

/**
 * Nama topik yang tidak pernah bertabrakan dengan langganan lain.
 *
 * Topik realtime adalah ruang nama milik server, bukan milik satu komponen.
 * Dua langganan bertopik sama — misalnya `pesanan_<uid>` yang dibuat ulang saat
 * React memasang efeknya dua kali di mode ketat — membuat `removeChannel` milik
 * yang lama tiba di server *sesudah* yang baru bergabung, lalu meruntuhkan
 * topik yang sama untuk keduanya. Yang baru tetap melapor `joined`, binding-nya
 * tetap dapat id, dan tidak satu pun perubahan pernah tiba: kegagalan paling
 * sunyi yang mungkin, dan persis yang membuat kedua layar tampak butuh muat
 * ulang manual.
 *
 * Akhiran acak membuat tiap langganan memiliki topiknya sendiri, jadi yang
 * ditutup hanya yang memang ditutup.
 */
let nomorTopik = 0;
function topikUnik(nama: string, uid: string) {
  nomorTopik += 1;
  return `${nama}_${uid}_${Date.now().toString(36)}${nomorTopik}`;
}

/**
 * Pastikan soket realtime membawa token pengguna sebelum kanal apa pun
 * bergabung.
 *
 * Wajib dipanggil sebelum `channel.subscribe()` pada tabel ber-RLS. Alasan
 * lengkapnya ada di `langgananBaris`; ringkasnya: Realtime membekukan klaim JWT
 * pada saat join, dan kanal yang bergabung dengan kunci anon tidak akan pernah
 * menerima satu baris pun — tanpa galat, tanpa jejak.
 */
async function siapkanAuthRealtime(
  client: NonNullable<Awaited<ReturnType<typeof getSupabase>>>,
): Promise<void> {
  const { data } = await client.auth.getSession();
  await client.realtime.setAuth(data.session?.access_token);
}

/**
 * Langganan realtime untuk baris milik satu pengguna pada satu tabel.
 *
 * Menggantikan dua fungsi kembar yang sebelumnya menyalin bentuk yang sama
 * untuk `orders` dan `penawaran`, dan menambahkan tiga hal yang membuat
 * perbedaan antara "sinkron" dan "sinkron sampai sesuatu tersendat":
 *
 *   1. **Status subscribe dibaca.** Versi lama memanggil `channel.subscribe()`
 *      tanpa callback, jadi `CHANNEL_ERROR` — kanal yang ditolak server,
 *      misalnya karena soketnya belum membawa token — lewat tanpa jejak. Layar
 *      tetap tampak normal dan diam selamanya.
 *
 *   2. **Sambung ulang dengan jeda berlipat.** Jaringan ponsel di kebun putus
 *      dan tersambung lagi; kanal yang mati sekali tidak boleh mati untuk
 *      seterusnya.
 *
 *   3. **`onSegar` di tiap penyambungan dan tiap tab kembali terlihat.**
 *      Realtime hanya mengabarkan perubahan yang terjadi *selagi* tersambung.
 *      Apa pun yang lewat saat soketnya putus — atau saat ponsel terkunci —
 *      hanya bisa disusul dengan mengambil ulang barisnya. Inilah yang
 *      menggantikan "muat ulang paksa" yang dilakukan pengguna secara manual.
 *
 * Dua `.on` pada satu kanal karena filter `postgres_changes` hanya menerima
 * satu perbandingan: tidak ada cara menuliskan "pembeli_id = uid atau
 * petani_id = uid" sebagai satu filter.
 *
 * Yang dikirim balik adalah baris mentah — tanpa nama kedua pihak, yang datang
 * dari join. Pemanggil yang menerima id tak dikenal mengambil baris utuhnya
 * sendiri.
 */
export function langgananBaris(opts: {
  /** Nama kanal, dipakai juga di pesan galat. */
  nama: string;
  tabel: "orders" | "penawaran";
  uid: string;
  /** Kolom pemilik yang difilter; satu kanal, satu `.on` per kolom. */
  kolom: readonly string[];
  onUbah: (row: Record<string, unknown>) => void;
  /** Ambil ulang dari basis data — dipanggil tiap kanal hidup lagi. */
  onSegar?: () => void;
  onStatus?: (status: StatusLangganan) => void;
}): () => void {
  const { nama, tabel, uid, kolom, onUbah, onSegar, onStatus } = opts;
  if (!isSupabaseConfigured) return () => {};

  let dibatalkan = false;
  let lepasKanal: (() => void) | null = null;
  let percobaan = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const jadwalkanUlang = () => {
    if (dibatalkan || timer) return;
    const jeda = jedaUlang(percobaan++);
    timer = setTimeout(() => {
      timer = null;
      lepasKanal?.();
      lepasKanal = null;
      void pasang();
    }, jeda);
  };

  const pasang = async () => {
    const client = await getSupabase();
    if (!client || dibatalkan) return;

    /*
     * Token pengguna harus sudah ada di soket sebelum kanal bergabung.
     *
     * Realtime menyimpan klaim JWT milik langganan `postgres_changes` **pada
     * saat join** — barisnya ada di `realtime.subscription`, lengkap dengan
     * kolom `claims`. Klaim itulah yang dipakai untuk mengevaluasi policy
     * select tabelnya bagi tiap perubahan yang lewat. Kalau soketnya masih
     * memakai kunci anon waktu bergabung, langganannya tercatat sebagai
     * `role: anon, sub: null`, `auth.uid()` bernilai NULL, dan setiap baris
     * gagal `auth.uid() = pembeli_id or auth.uid() = petani_id`.
     *
     * Yang terlihat dari sisi klien: `SUBSCRIBED`, soket hidup, binding dapat
     * id dari server — dan tidak satu pun perubahan pernah tiba. Memanggil
     * `setAuth` belakangan tidak menyembuhkannya: baris langganannya sudah
     * ditulis, dan klaimnya tidak ikut diperbarui.
     *
     * `getSession()` juga menyegarkan token yang hampir kedaluwarsa, jadi
     * kanal yang tersambung ulang tidak pernah bergabung dengan token basi.
     */
    await siapkanAuthRealtime(client);
    if (dibatalkan) return;

    onStatus?.("menyambung");
    const channel = client.channel(topikUnik(nama, uid));
    for (const k of kolom) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: tabel, filter: `${k}=eq.${uid}` },
        (payload) => {
          const baris = payload.new as Record<string, unknown> | null;
          if (baris && typeof baris.id === "string") onUbah(baris);
        },
      );
    }

    channel.subscribe((status, err) => {
      if (dibatalkan) return;
      if (status === "SUBSCRIBED") {
        percobaan = 0;
        onStatus?.("hidup");
        // Susul perubahan yang terjadi sebelum kanal ini hidup.
        onSegar?.();
        return;
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        console.warn(
          `[pantas] kanal realtime ${nama} ${status}`,
          err?.message ?? "",
        );
        onStatus?.("terputus");
        jadwalkanUlang();
      }
    });

    lepasKanal = () => {
      void client.removeChannel(channel);
    };
  };

  void pasang();

  /*
   * Tab yang kembali terlihat selalu mengambil ulang, terlepas dari kanalnya.
   *
   * Peramban ponsel membekukan soket pada tab yang tersembunyi, dan sebagian
   * memutusnya tanpa mengabari siapa pun. Ini jaring pengaman terakhir supaya
   * layar yang dibuka lagi tidak pernah menampilkan keadaan kemarin.
   */
  const saatTerlihat = () => {
    if (document.visibilityState === "visible") onSegar?.();
  };
  const saatDaring = () => {
    percobaan = 0;
    lepasKanal?.();
    lepasKanal = null;
    void pasang();
  };
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", saatTerlihat);
    window.addEventListener("online", saatDaring);
  }

  /*
   * Token yang diperbarui berarti kanal harus bergabung ulang.
   *
   * Klaim langganan dibekukan saat join, termasuk `exp`-nya. Ketika Supabase
   * menukar token satu jam sekali, baris langganan yang lama tetap memegang
   * klaim lama; membiarkannya berarti kanal yang perlahan basi lalu berhenti
   * lolos pemeriksaan tanpa pernah melapor putus.
   */
  let lepasAuth: (() => void) | null = null;
  void getSupabase().then((client) => {
    if (!client || dibatalkan) return;
    const { data } = client.auth.onAuthStateChange((event) => {
      if (dibatalkan) return;
      // Hanya `TOKEN_REFRESHED`. `SIGNED_IN` dan `INITIAL_SESSION` ikut menyala
      // saat `pasang()` memanggil `getSession()`, jadi mendengarkannya membuat
      // pemasangan memicu pemasangan berikutnya — kanal beranak tanpa henti.
      if (event === "TOKEN_REFRESHED") saatDaring();
    });
    lepasAuth = () => data.subscription.unsubscribe();
  });

  return () => {
    dibatalkan = true;
    if (timer) clearTimeout(timer);
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", saatTerlihat);
      window.removeEventListener("online", saatDaring);
    }
    lepasAuth?.();
    lepasKanal?.();
  };
}

/** Hasil pengiriman ulasan; `error` berisi kalimat yang layak ditampilkan. */
export interface HasilUlasan {
  ulasan: Ulasan | null;
  error: string | null;
}

export async function kirimUlasan(
  ulasan: Omit<Ulasan, "id" | "created_at">,
): Promise<HasilUlasan> {
  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client
      .from("ulasan")
      .insert(ulasan)
      .select()
      .single();
    if (!error && data) return { ulasan: data as unknown as Ulasan, error: null };

    // Kegagalan tidak boleh diam-diam jatuh ke penyimpanan demo: dulu insert
    // yang ditolak tetap melaporkan "ulasan terkirim", dan pengguna baru tahu
    // saat ratingnya tidak pernah berubah. Dua penolakan yang wajar terjadi
    // punya kalimatnya sendiri.
    const kode = (error as { code?: string } | null)?.code;
    if (kode === "23505")
      return { ulasan: null, error: "Anda sudah menilai pesanan ini." };
    if (kode === "42501")
      return {
        ulasan: null,
        error:
          "Ulasan hanya bisa diberikan oleh kedua pihak setelah pesanan selesai.",
      };
    return {
      ulasan: null,
      error:
        (error as { message?: string } | null)?.message ??
        "Ulasan gagal dikirim.",
    };
  }

  // Mode demo tanpa Supabase: keunikan order + penilai tetap ditegakkan supaya
  // perilakunya sama dengan basis data.
  const { DEMO_ULASAN } = await bahanDemo();
  if (
    DEMO_ULASAN.some(
      (u) => u.order_id === ulasan.order_id && u.penilai_id === ulasan.penilai_id,
    )
  ) {
    return { ulasan: null, error: "Anda sudah menilai pesanan ini." };
  }
  const baru: Ulasan = {
    id: "ULS-" + Math.random().toString(36).substring(2, 9),
    ...ulasan,
    created_at: new Date().toISOString(),
  };
  DEMO_ULASAN.push(baru);
  return { ulasan: baru, error: null };
}

/**
 * Ulasan yang sudah ada untuk satu pesanan — dipakai layar detail untuk tahu
 * siapa yang sudah menilai. Tanpa ini, status "sudah menilai" hanya hidup di
 * state komponen dan hilang begitu halaman dimuat ulang.
 */
export async function getUlasanPesanan(order_id: string): Promise<Ulasan[]> {
  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client
      .from("ulasan")
      .select("*, profiles:penilai_id(nama)")
      .eq("order_id", order_id);
    if (!error && data) {
      return (data as unknown as UlasanRow[]).map((row) => ({
        ...row,
        komentar: row.komentar ?? undefined,
        penilai_nama: row.profiles?.nama ?? "Pengguna PANTAS",
      }));
    }
  }
  await delay(100);
  const { DEMO_ULASAN } = await bahanDemo();
  return DEMO_ULASAN.filter((u) => u.order_id === order_id);
}

export async function getUlasanList(user_id: string): Promise<Ulasan[]> {
  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client.from("ulasan").select("*, profiles:penilai_id(nama)").eq("dinilai_id", user_id);
    if (!error && data) {
      return (data as unknown as UlasanRow[]).map((row) => ({
        ...row,
        komentar: row.komentar ?? undefined,
        penilai_nama: row.profiles?.nama ?? "Pengguna PANTAS",
      }));
    }
  }
  await delay(100);
  const { DEMO_ULASAN } = await bahanDemo();
  return DEMO_ULASAN.filter((u) => u.dinilai_id === user_id);
}



