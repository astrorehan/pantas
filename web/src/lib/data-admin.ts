import { getSupabase } from "./supabase";
import type { Grade, RingkasanPlatform, Rute, StatusPesanan } from "./types";
import { DEMO_RUTE } from "./demo-data";
import {
  LISTINGS,
  KUNCI_RUTE_DEMO,
  KUNCI_STATUS_RUTE_DEMO,
  POLA_UUID,
  bacaStatusRuteDemo,
  delay,
  pesanGalat,
  type DynamicSupabase,
} from "./data";

/**
 * Jalur data konsol operator: potret platform, moderasi listing, siklus hidup
 * rute, dan jejak audit.
 *
 * Berkas terpisah dari `data.ts` karena anggaran bundel, bukan karena selera.
 * `data.ts` ikut ke hampir setiap route, jadi menaruh plumbing admin di sana
 * berarti setiap petani mengunduh kode konsol yang tidak akan pernah ia buka —
 * dan pertumbuhannya cukup untuk mendorong `/petani/pindai` dan
 * `/petani/pesanan/[id]` melewati anggaran 260 KB gzip. Sebagai modul sendiri,
 * kodenya hanya masuk chunk route `/admin`.
 *
 * Semua fungsi di sini bersandar pada RLS peran admin. Dipanggil dari layar
 * lain mereka tidak akan galat — mereka akan memulangkan himpunan yang jauh
 * lebih sempit, yang justru lebih berbahaya daripada penolakan. Karena itu
 * pemanggilnya selalu berada di balik `RequireRole`.
 */

const RINGKASAN_DEMO: RingkasanPlatform = {
  pengguna: { petani: 24, pembeli: 9, admin: 1, total: 34, demo: 34 },
  listing: { tayang: 15, disembunyikan: 0, total: 18 },
  pesanan: { dipesan: 4, dikonfirmasi: 3, serah_terima: 2, selesai: 142, total: 151 },
  gmv_selesai: 245000000,
  gmv_berjalan: 18600000,
  grading_24j: 11,
  sumber: "demo",
};

/**
 * Potret platform untuk konsol operator (F-90).
 *
 * Empat kueri, bukan sebelas penghitung `head: true`. Pada skala koperasi
 * tabel-tabel ini berukuran ribuan baris, jadi menariknya sekali lalu
 * menjumlahkan di sini lebih murah daripada satu round-trip per angka — dan
 * yang dibayar operator adalah waktu tunggu di depan layar, bukan CPU.
 *
 * Bila peran pemanggil bukan admin, RLS memulangkan himpunan yang jauh lebih
 * sempit (pesanan miliknya sendiri, listing tayang saja) alih-alih galat. Itu
 * sebabnya fungsi ini hanya dipanggil dari `/admin`, yang sudah dijaga
 * `RequireRole` — di layar lain angkanya akan benar tapi bukan angka platform.
 */
export async function getRingkasanPlatform(): Promise<RingkasanPlatform> {
  const supabase = await getSupabase();
  if (!supabase) {
    await delay(150);
    return RINGKASAN_DEMO;
  }

  const sejak24Jam = new Date(Date.now() - 86400000).toISOString();
  const client = supabase as unknown as DynamicSupabase;

  const [profil, listing, pesanan, grading] = await Promise.all([
    client.from("profiles").select("peran, is_demo"),
    client.from("listings").select("status"),
    client.from("orders").select("status, status_kasus, total"),
    client.from("gradings").select("id", { count: "exact", head: true }).gte("created_at", sejak24Jam),
  ]);

  // Satu kueri gagal berarti angkanya tidak diketahui, bukan nol. Nol di layar
  // operator terbaca sebagai "tidak ada aktivitas" — kesimpulan yang salah dan
  // sulit dibedakan dari yang benar.
  if (profil.error || listing.error || pesanan.error || grading.error) {
    console.warn(
      "[pantas] getRingkasanPlatform fallback demo:",
      pesanGalat(profil.error ?? listing.error ?? pesanan.error ?? grading.error),
    );
    return RINGKASAN_DEMO;
  }

  const barisProfil = (profil.data ?? []) as { peran: string; is_demo: boolean }[];
  const barisListing = (listing.data ?? []) as { status: string }[];
  const barisPesanan = (pesanan.data ?? []) as {
    status: StatusPesanan;
    status_kasus: string;
    total: number;
  }[];

  const hitungPeran = (peran: string) =>
    barisProfil.filter((p) => p.peran === peran).length;
  const hitungStatus = (status: StatusPesanan) =>
    barisPesanan.filter((o) => o.status === status && o.status_kasus === "normal").length;

  return {
    pengguna: {
      petani: hitungPeran("petani"),
      pembeli: hitungPeran("pembeli"),
      admin: hitungPeran("admin"),
      total: barisProfil.length,
      demo: barisProfil.filter((p) => p.is_demo).length,
    },
    listing: {
      tayang: barisListing.filter((l) => l.status === "tayang").length,
      disembunyikan: barisListing.filter((l) => l.status === "disembunyikan").length,
      total: barisListing.length,
    },
    pesanan: {
      dipesan: hitungStatus("dipesan"),
      dikonfirmasi: hitungStatus("dikonfirmasi"),
      serah_terima: hitungStatus("serah_terima"),
      selesai: hitungStatus("selesai"),
      total: barisPesanan.length,
    },
    gmv_selesai: barisPesanan
      .filter((o) => o.status === "selesai" && o.status_kasus === "normal")
      .reduce((n, o) => n + Number(o.total ?? 0), 0),
    gmv_berjalan: barisPesanan
      .filter((o) => o.status !== "selesai" && o.status_kasus === "normal")
      .reduce((n, o) => n + Number(o.total ?? 0), 0),
    grading_24j: grading.count ?? 0,
    sumber: "supabase",
  };
}

export type StatusListingDb = "tayang" | "habis" | "ditutup" | "disembunyikan";

/** Satu baris di layar moderasi. Statusnya nilai basis data, bukan kosakata
 *  layar petani (`dijeda`/`terjual`) yang tidak pernah sampai ke Postgres. */
export interface BarisModerasi {
  id: string;
  nama: string;
  komoditas: string;
  grade: Grade;
  harga_per_kg: number;
  berat_kg: number;
  status: StatusListingDb;
  petani: string;
  petani_id: string;
  created_at: string;
  gambar: string;
  hash_audit: string | null;
}

/**
 * Semua listing yang terlihat oleh peran pemanggil, terbaru dulu.
 *
 * Sesudah migrasi 0015 admin melihat seluruhnya termasuk yang disembunyikan;
 * sebelum migrasi itu diterapkan ia hanya melihat yang tayang. Layar moderasi
 * tetap berfungsi pada keadaan kedua — yang hilang cuma kemampuan memulihkan
 * kembali listing yang sudah diturunkan.
 */
export async function getListingsModerasi(): Promise<BarisModerasi[]> {
  const supabase = await getSupabase();
  if (supabase) {
    const client = supabase as unknown as DynamicSupabase;
    const { data, error } = await client
      .from("listings")
      .select("id, nama, komoditas, grade, harga_per_kg, berat_kg, status, created_at, gambar, petani_id, profiles(nama), gradings(hash_audit)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return (data as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        nama: String(r.nama ?? ""),
        komoditas: String(r.komoditas ?? ""),
        grade: (r.grade ?? "B") as Grade,
        harga_per_kg: Number(r.harga_per_kg ?? 0),
        berat_kg: Number(r.berat_kg ?? 0),
        status: (r.status ?? "tayang") as StatusListingDb,
        petani: String(
          (r.profiles as { nama?: string } | null)?.nama ?? "Petani PANTAS",
        ),
        petani_id: String(r.petani_id ?? ""),
        created_at: String(r.created_at ?? ""),
        gambar: String(r.gambar ?? "/img/tomat.jpg"),
        hash_audit:
          (r.gradings as { hash_audit?: string } | null)?.hash_audit ?? null,
      }));
    }
    if (error) console.warn("[pantas] getListingsModerasi fallback demo:", pesanGalat(error));
  }

  await delay(150);
  return LISTINGS.map((l) => ({
    id: l.id,
    nama: l.nama,
    komoditas: l.komoditas,
    grade: l.grade,
    harga_per_kg: l.harga_per_kg,
    berat_kg: l.berat_kg,
    status: "tayang" as StatusListingDb,
    petani: l.petani,
    petani_id: l.petani_id ?? "",
    created_at: new Date().toISOString(),
    gambar: l.gambar,
    hash_audit: l.hash_audit ?? null,
  }));
}

export type HasilModerasi =
  | { ok: true; status: StatusListingDb }
  | { ok: false; pesan: string };

/**
 * Menyembunyikan atau memulihkan satu listing, dengan alasan (F-91).
 *
 * Perubahan status dan baris audit terjadi di dalam satu fungsi Postgres, jadi
 * tidak ada keadaan di mana listing sudah turun tapi alasannya belum tercatat.
 * Kegagalan wewenang dipulangkan sebagai pesan, bukan lemparan: layar moderasi
 * menampilkannya di tempat, dan operator tahu bedanya dengan jaringan putus.
 */
export async function moderasiListing(
  id: string,
  status: Extract<StatusListingDb, "tayang" | "disembunyikan">,
  alasan: string,
): Promise<HasilModerasi> {
  const supabase = await getSupabase();
  if (!supabase) {
    return {
      ok: false,
      pesan: "Moderasi butuh basis data. Mode demo hanya membaca listing contoh.",
    };
  }

  const client = supabase as unknown as DynamicSupabase;
  const { error } = await client.rpc("moderasi_listing", {
    p_listing_id: id,
    p_status: status,
    p_alasan: alasan,
  });

  if (error) return { ok: false, pesan: pesanGalat(error) ?? "Moderasi gagal." };
  return { ok: true, status };
}

/** Menaikkan rute satu langkah: draf → terkunci → berjalan → selesai. */
export async function ubahStatusRute(
  id: string,
  status: Rute["status"],
): Promise<{ ok: true } | { ok: false; pesan: string }> {
  const supabase = await getSupabase();
  if (!supabase || !POLA_UUID.test(id)) {
    // Rute demo hidup di localStorage; naikkan di sana supaya perencana yang
    // berjalan tanpa basis data tetap punya siklus hidup yang utuh.
    return naikkanRuteLokal(id, status);
  }

  const client = supabase as unknown as DynamicSupabase;
  const { error } = await client.rpc("ubah_status_rute", {
    p_rute_id: id,
    p_status: status,
  });

  if (error) return { ok: false, pesan: pesanGalat(error) ?? "Status rute gagal diubah." };
  return { ok: true };
}

function naikkanRuteLokal(
  id: string,
  status: Rute["status"],
): { ok: true } | { ok: false; pesan: string } {
  if (typeof window === "undefined") {
    return { ok: false, pesan: "Status rute hanya bisa diubah dari peramban." };
  }
  try {
    const mentah = window.localStorage.getItem(KUNCI_RUTE_DEMO);
    const tersimpan = mentah ? (JSON.parse(mentah) as Rute[]) : [];

    if (tersimpan.some((r) => r.id === id)) {
      const berikut = tersimpan.map((r) => (r.id === id ? { ...r, status } : r));
      window.localStorage.setItem(KUNCI_RUTE_DEMO, JSON.stringify(berikut));
      return { ok: true };
    }

    // Rute bawaan: statusnya tinggal di peta timpaan, karena `DEMO_RUTE`
    // adalah konstanta modul dan tidak bisa ditulisi.
    if (DEMO_RUTE.some((r) => r.id === id)) {
      const timpa = { ...bacaStatusRuteDemo(), [id]: status };
      window.localStorage.setItem(KUNCI_STATUS_RUTE_DEMO, JSON.stringify(timpa));
      return { ok: true };
    }

    return { ok: false, pesan: "Rute itu tidak ditemukan di penyimpanan lokal." };
  } catch {
    return { ok: false, pesan: "Penyimpanan peramban penuh atau tidak tersedia." };
  }
}

/** Sengketa aktif yang menunggu keputusan operator koperasi. */
export interface BarisSengketa {
  id: string;
  nama: string;
  status: StatusPesanan;
  alasan: string;
  total: number;
  diminta_pada: string;
  pembeli: string;
  petani: string;
}

export async function getSengketaAktif(): Promise<BarisSengketa[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const client = supabase as unknown as DynamicSupabase;
  const { data, error } = await client
    .from("orders")
    .select(
      "id, nama, status, alasan_kasus, total, diminta_pada, pembeli:profiles!orders_pembeli_id_fkey(nama), petani:profiles!orders_petani_id_fkey(nama)",
    )
    .eq("status_kasus", "sengketa")
    .order("diminta_pada", { ascending: true });

  if (error) {
    console.warn("[pantas] getSengketaAktif:", pesanGalat(error));
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    nama: String(r.nama),
    status: r.status as StatusPesanan,
    alasan: String(r.alasan_kasus ?? ""),
    total: Number(r.total ?? 0),
    diminta_pada: String(r.diminta_pada ?? ""),
    pembeli: (r.pembeli as { nama?: string } | null)?.nama ?? "Pembeli",
    petani: (r.petani as { nama?: string } | null)?.nama ?? "Petani",
  }));
}

export async function selesaikanSengketa(
  orderId: string,
  batalkan: boolean,
  catatan: string,
): Promise<{ ok: true } | { ok: false; pesan: string }> {
  const supabase = await getSupabase();
  if (!supabase) return { ok: false, pesan: "Basis data tidak tersedia." };

  const client = supabase as unknown as DynamicSupabase;
  const { error } = await client.rpc("selesaikan_sengketa_order", {
    p_order_id: orderId,
    p_batalkan: batalkan,
    p_catatan: catatan.trim(),
  });
  if (error) {
    return {
      ok: false,
      pesan: pesanGalat(error) ?? "Resolusi sengketa gagal disimpan.",
    };
  }
  return { ok: true };
}

/** Satu peristiwa di jejak audit (F-62). */
export interface BarisAudit {
  id: number;
  aktor_id: string | null;
  aktor_nama: string | null;
  aksi: string;
  entitas: string;
  entitas_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Jejak audit, terbaru dulu. Hanya peran admin yang bisa membacanya (policy
 * 0004), jadi daftar kosong bagi peran lain adalah RLS bekerja, bukan galat.
 */
export async function getAuditLog(batas = 100): Promise<BarisAudit[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const client = supabase as unknown as DynamicSupabase;
  const { data, error } = await client
    .from("audit_log")
    .select("id, aktor_id, aksi, entitas, entitas_id, meta, created_at, profiles(nama)")
    .order("created_at", { ascending: false })
    .limit(batas);

  if (error) {
    console.warn("[pantas] getAuditLog:", pesanGalat(error));
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: Number(r.id),
    aktor_id: r.aktor_id ? String(r.aktor_id) : null,
    aktor_nama: (r.profiles as { nama?: string } | null)?.nama ?? null,
    aksi: String(r.aksi),
    entitas: String(r.entitas),
    entitas_id: r.entitas_id ? String(r.entitas_id) : null,
    meta: (r.meta as Record<string, unknown> | null) ?? null,
    created_at: String(r.created_at),
  }));
}
