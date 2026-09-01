"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  KOMODITAS_DEFAULT,
  getFaktorEmisi,
  hitungPesanBelumDibaca,
  langgananBaris,
  pesanGalat,
  rowToListing,
  subscribePesanMasuk,
  type StatusLangganan,
  LISTINGS,
  DEMO_ORDERS,
  DEMO_SCANS,
  type FotoAntrean,
  type PesanBelumDibaca,
} from "./data";
import { AKUN_DEMO, DEMO_PASSWORD, DEMO_USERS } from "./demo";
import { hitungAntrean } from "./antrean-offline";
import { FAKTOR_EMISI_BAWAAN, type FaktorEmisi } from "./emisi";
import { getSupabase, isSupabaseConfigured, uploadCapture } from "./supabase";
import type { Database, Json } from "./database.types";
import type {
  Grade,
  LaporanGrading,
  Listing,
  Peristiwa,
  Role,
  StatusKasusTransaksi,
  StatusPembayaran,
  StatusPesanan,
  HasilAksiTransaksi,
  Penawaran,
} from "./types";

/**
 * Client-side application state, cached to localStorage.
 *
 * The Supabase session is the single source of truth for *who* is signed in.
 * Listings, orders and scans are fetched per user and RLS scopes every row to
 * `auth.uid()`; localStorage is only a cache, keyed by user id, so two accounts
 * on the same device never inherit each other's data (docs/BACKEND.md).
 */

export interface Sesi {
  role: Role;
  email: string;
  nama: string;
  /** UUID auth Supabase — terisi setelah verifikasi OTP email berhasil. */
  userId?: string;
  /** Lokasi dari public.profiles — ditampilkan di halaman akun. */
  lokasi?: string;
  /** Status penyelesaian onboarding coachmark tur (F-04). */
  turSelesai?: boolean;
}

export interface Scan {
  id: string;
  tanggal: string; // ISO
  /** Id komoditas engine ("tomato_sayur"), dipakai filter riwayat (F-13). */
  komoditas?: string;
  komoditas_label: string;
  grade_dominan: Grade;
  objek: number;
  gambar: string; // asset path or data URL
  /** Skor keseragaman batch (0..1) dari ringkasan_batch. */
  skor?: number;
  /** Berapa foto menyusun pindaian ini (F-12); tidak ada / 1 = pindai tunggal. */
  foto?: number;
  hash_audit?: string;
  /**
   * Laporan utuh, disimpan juga di cache lokal supaya halaman detail riwayat
   * (F-13) tetap punya isi ketika Supabase tidak dikonfigurasi. Tanpa ini
   * `/petani/riwayat/[id]` jadi jalan buntu di mode demo (F-82).
   */
  hasil?: LaporanGrading;
}

export interface Order {
  id: string;
  kode: string;
  status: StatusPesanan;
  nama: string;
  grade: Grade;
  berat_kg: number;
  harga_per_kg: number;
  total: number;
  pembeli: string;
  petani: string;
  /**
   * UUID kedua pihak. Nama saja tidak cukup: chat dalam aplikasi (F-33)
   * menulis `pesan.pengirim_id`/`penerima_id`, dan RLS-nya membandingkan
   * kolom itu dengan `auth.uid()` — tanpa uuid di sini setiap kiriman ditolak.
   */
  pembeli_id?: string;
  petani_id?: string;
  /**
   * Berat timbangan saat serah terima, kg (F-101). Bukan sekadar catatan: ia
   * adalah satu-satunya kebenaran lapangan yang mengkalibrasi faktor densitas
   * yang dipakai estimasi berat — lihat ai_engine/calibrate_density.py.
   */
  berat_aktual_kg?: number;
  tanggal: string; // ISO
  /**
   * Id komoditas listing asal (`tomato_ceri`, `carrot`, …), dipakai memilih
   * faktor emisi yang benar di layar dampak. Opsional karena `listing_id`
   * boleh null (`on delete set null`) dan pesanan lama belum menyimpannya;
   * tanpa nilai, perhitungan jatuh ke baris `lainnya`.
   */
  komoditas?: string;
  /** Id listing asal untuk pelacakan dan penghubung penawaran. */
  listing_id?: string;
  /** Pembatalan/sengketa tidak mengubah rel progres fisik `status`. */
  status_kasus?: StatusKasusTransaksi;
  alasan_kasus?: string;
  diminta_oleh?: string;
  diminta_pada?: string;
  ditanggapi_oleh?: string;
  ditanggapi_pada?: string;
  /** Pembayaran dilakukan di luar aplikasi; ini hanya konfirmasi dua pihak. */
  status_pembayaran?: StatusPembayaran;
  pembayaran_ditandai_pada?: string;
  pembayaran_dikonfirmasi_pada?: string;
}

/**
 * Satu baris di keranjang inquiry — salinan listing-nya, bukan sekadar id.
 *
 * Katalog pembeli dibaca dari `listings_view` Supabase, tetapi setiap pembaca
 * inquiry dulu mencari id itu kembali di array demo `LISTINGS`. Untuk listing
 * sungguhan pencarian itu tidak pernah menemukan apa pun, jadi keranjang selalu
 * tampil kosong dan `buatPenawaran` berhenti diam-diam di `items.length === 0`.
 */
export interface InquiryItem {
  listing: Listing;
  /** Kuantitas yang diminta, kg. */
  qty: number;
}

interface State {
  sesi: Sesi | null;
  scans: Scan[];
  myListings: Listing[];
  myPenawaran: Penawaran[];
  inquiry: Record<string, InquiryItem>; // listingId -> lot + kuantitas
  orders: Order[];
  lastCapture: string | null; // data URL from the camera, feeds hasil/listing
  /**
   * Kotak [x, y, w, h] pada `lastCapture` tempat koin Rp500 diperkirakan
   * berada, dihitung dari lingkaran panduan di layar pindai. Tanpa ini
   * calibration.py menyapu seluruh foto dan bisa memakai tomat sebagai
   * referensi 27 mm. null untuk foto galeri / mode demo.
   */
  lastCoinRoi: [number, number, number, number] | null;
  /**
   * Antrean foto pindaian terakhir (F-12). Satu elemen untuk pindai biasa,
   * 2–5 untuk batch multi-sudut. `lastCapture`/`lastCoinRoi` di atas adalah
   * elemen pertamanya, dipertahankan karena layar harga dan penerbitan listing
   * hanya memerlukan satu foto sampul.
   */
  lastCaptures: FotoAntrean[];
  /** Komoditas yang dipilih petani di layar pindai, dipakai oleh /hasil. */
  lastKomoditas: string;
  /**
   * Listing dari penerbitan terakhir. Sebuah array karena satu batch boleh
   * dipecah menjadi satu listing per grade — layar konfirmasi harus
   * bisa menampilkan ketiganya, bukan hanya yang pertama.
   */
  lastPublishedIds: string[];
  /**
   * Baris `gradings` dari pindaian terakhir, dipakai mengisi `listings.grading_id`
   * saat penerbitan. Tanpa ini listing baru tidak pernah tertaut ke laporan
   * mutunya dan tombol "Lacak Sertifikat" di layar pembeli tidak pernah muncul.
   */
  lastGradingId: string | null;
  /**
   * Id `scans` dari pindaian terakhir yang benar-benar dinilai.
   *
   * Layar hasil membacanya untuk menampilkan kembali laporan yang sama saat
   * dikunjungi ulang. Tanpa ini layar itu menilai ulang setiap kali dipasang —
   * dan ketika tidak ada foto sama sekali di sesi ini, yang "dinilai" adalah
   * ketiadaan foto, yang jawabannya nol objek.
   */
  lastScanId: string | null;
  /**
   * Isi tabel konfigurasi `emisi_faktor` (F-106). Dibaca sekali per sesi dan
   * dipakai setiap layar yang mengklaim angka CO₂e, sehingga mengganti sumber
   * cukup dilakukan di basis data. Nilai awalnya salinan bawaan agar render
   * pertama tetap menampilkan angka bersitasi, bukan nol.
   */
  faktorEmisi: FaktorEmisi[];
  /**
   * Pesan masuk yang belum dibaca, lintas percakapan (F-33). Angka inilah yang
   * dipakai badge di navigasi, jadi ia harus hidup walau layar chat tertutup —
   * karena itu langganan realtime-nya dipasang di provider, bukan di
   * `ChatWindow`.
   */
  pesanBelumDibaca: PesanBelumDibaca;
  /**
   * Pindaian yang menunggu diproses di antrean offline (F-14). Angkanya berasal
   * dari IndexedDB, bukan dari state ini — di sini ia hanya disalin supaya
   * badge di dashboard bisa ikut berubah tanpa tiap layar membuka database.
   */
  antreanPindai: number;
  /**
   * Kesehatan kanal realtime, digabung dari kanal pesanan dan penawaran.
   *
   * Ada di state supaya layar bisa berkata jujur. Aplikasi yang kanalnya
   * diam-diam mati terlihat persis sama dengan aplikasi yang memang belum ada
   * perubahannya, dan satu-satunya cara pengguna menemukan bedanya adalah
   * memuat ulang — kebiasaan yang justru ingin dihapus.
   */
  statusLangganan: StatusLangganan;
  /**
   * Antre peristiwa dari seberang yang belum dilihat pengguna.
   *
   * Antrean, bukan satu nilai: petani bisa menerima dua tawaran beruntun, dan
   * yang kedua tidak boleh menimpa yang pertama sebelum sempat terbaca.
   */
  peristiwa: Peristiwa[];
}

/**
 * A new account starts empty and fills up from its own Supabase rows. Seeding
 * this with demo listings/scans is what made every device show the same
 * dashboard regardless of who was signed in.
 */
const INITIAL: State = {
  sesi: null,
  scans: [],
  myListings: [],
  myPenawaran: [],
  inquiry: {},
  orders: [],
  lastCapture: null,
  lastCoinRoi: null,
  lastCaptures: [],
  lastKomoditas: KOMODITAS_DEFAULT,
  lastPublishedIds: [],
  lastGradingId: null,
  lastScanId: null,
  faktorEmisi: FAKTOR_EMISI_BAWAAN,
  pesanBelumDibaca: { total: 0, pesanan: 0, penawaran: 0 },
  antreanPindai: 0,
  statusLangganan: "menyambung",
  peristiwa: [],
};

/**
 * Per-user cache bucket. Without the user id in the key, a second account on
 * the same browser would read the first account's listings and orders.
 */
const KEY_BASE = "pantas-store-v1";
const ACTIVE_SESSION_KEY = "pantas-active-session-v1";
const DEMO_ORDERS_KEY = "pantas-demo-orders-v1";
const SYNC_CHANNEL_NAME = "pantas-order-sync-channel";

const keyFor = (uid?: string) => `${KEY_BASE}:${uid ?? "anon"}`;

function getStoredDemoOrders(): Order[] {
  if (typeof window === "undefined") return DEMO_ORDERS as Order[];
  try {
    const raw = localStorage.getItem(DEMO_ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as Order[];
    }
  } catch {}
  try {
    localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(DEMO_ORDERS));
  } catch {}
  return DEMO_ORDERS as Order[];
}

function saveStoredDemoOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders));
  } catch {}
}

let syncChannelInstance: BroadcastChannel | null = null;
function getSyncChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  try {
    syncChannelInstance ??= new BroadcastChannel(SYNC_CHANNEL_NAME);
    return syncChannelInstance;
  } catch {
    return null;
  }
}

function broadcastSync(msg: { type: "ORDER_UPDATED" | "ORDER_CREATED"; order: Order }) {
  try {
    getSyncChannel()?.postMessage(msg);
  } catch {}
}

function updateSingleDemoOrder(updated: Order) {
  const all = getStoredDemoOrders();
  const index = all.findIndex((o) => o.id === updated.id);
  let next: Order[];
  if (index >= 0) {
    next = all.map((o) => (o.id === updated.id ? { ...o, ...updated } : o));
  } else {
    next = [updated, ...all];
  }
  saveStoredDemoOrders(next);
  broadcastSync({ type: "ORDER_UPDATED", order: updated });
}

function filterOrdersForUser(orders: Order[], sesi: Sesi | null): Order[] {
  if (!sesi) return [];
  const uid = sesi.userId;
  const role = sesi.role;
  const nama = sesi.nama?.toLowerCase();

  return orders.filter((o) => {
    if (uid) {
      if (role === "petani" && o.petani_id === uid) return true;
      if (role === "pembeli" && o.pembeli_id === uid) return true;
    }
    if (
      role === "petani" &&
      (o.petani?.toLowerCase() === nama ||
        (nama?.includes("warsono") && o.petani?.toLowerCase().includes("warsono")))
    )
      return true;
    if (
      role === "pembeli" &&
      (o.pembeli?.toLowerCase() === nama ||
        (nama?.includes("rina") && o.pembeli?.toLowerCase().includes("rina")))
    )
      return true;
    return false;
  });
}

const DEMO_PENAWARAN_KEY = "pantas-demo-penawaran-v1";
const PENAWARAN_SYNC_CHANNEL_NAME = "pantas-penawaran-sync-channel";

const DEFAULT_DEMO_PENAWARAN: Penawaran[] = [
  {
    id: "PNW-001",
    listing_id: "PNT-L-0401",
    pembeli_id: "b0000000-0000-4000-b000-000000000001",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    kuantitas_kg: 150,
    harga_per_kg: 4100,
    status: "terkirim",
    created_at: "2026-08-25T10:00:00.000Z",
    pembeli_nama: "Rina Pradita (CV Saus Nusantara)",
    petani_nama: "Pak Warsono",
  },
  {
    id: "PNW-002",
    listing_id: "PNT-L-0422",
    pembeli_id: "b0000000-0000-4000-b000-000000000001",
    petani_id: "a0000000-0000-4000-a000-000000000003",
    kuantitas_kg: 50,
    harga_per_kg: 11000,
    status: "ditawar_balik",
    created_at: "2026-08-24T10:00:00.000Z",
    pembeli_nama: "Rina Pradita (CV Saus Nusantara)",
    petani_nama: "Bu Karsih",
  },
];

function getStoredDemoPenawaran(): Penawaran[] {
  if (typeof window === "undefined") return DEFAULT_DEMO_PENAWARAN;
  try {
    const raw = localStorage.getItem(DEMO_PENAWARAN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as Penawaran[];
    }
  } catch {}
  try {
    localStorage.setItem(DEMO_PENAWARAN_KEY, JSON.stringify(DEFAULT_DEMO_PENAWARAN));
  } catch {}
  return DEFAULT_DEMO_PENAWARAN;
}

function saveStoredDemoPenawaran(penawaran: Penawaran[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_PENAWARAN_KEY, JSON.stringify(penawaran));
  } catch {}
}

let penawaranSyncChannelInstance: BroadcastChannel | null = null;
function getPenawaranSyncChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  try {
    penawaranSyncChannelInstance ??= new BroadcastChannel(PENAWARAN_SYNC_CHANNEL_NAME);
    return penawaranSyncChannelInstance;
  } catch {
    return null;
  }
}

function broadcastPenawaranSync(msg: {
  type: "PENAWARAN_UPDATED" | "PENAWARAN_CREATED";
  penawaran: Penawaran;
}) {
  try {
    getPenawaranSyncChannel()?.postMessage(msg);
  } catch {}
}

function updateSingleDemoPenawaran(updated: Penawaran) {
  const all = getStoredDemoPenawaran();
  const index = all.findIndex((p) => p.id === updated.id);
  let next: Penawaran[];
  if (index >= 0) {
    next = all.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));
  } else {
    next = [updated, ...all];
  }
  saveStoredDemoPenawaran(next);
  broadcastPenawaranSync({ type: "PENAWARAN_UPDATED", penawaran: updated });
}

function filterPenawaranForUser(penawaran: Penawaran[], sesi: Sesi | null): Penawaran[] {
  if (!sesi) return [];
  const uid = sesi.userId;
  const role = sesi.role;
  const nama = sesi.nama?.toLowerCase();

  return penawaran.filter((p) => {
    if (uid) {
      if (role === "petani" && p.petani_id === uid) return true;
      if (role === "pembeli" && p.pembeli_id === uid) return true;
    }
    if (
      role === "petani" &&
      (p.petani_nama?.toLowerCase() === nama ||
        (nama?.includes("warsono") && p.petani_nama?.toLowerCase().includes("warsono")))
    )
      return true;
    if (
      role === "pembeli" &&
      (p.pembeli_nama?.toLowerCase() === nama ||
        (nama?.includes("rina") && p.pembeli_nama?.toLowerCase().includes("rina")))
    )
      return true;
    return false;
  });
}

function randKode() {
  const c = () =>
    "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)];
  return `PNT-${c()}${c()}${c()}${c()}-${Math.floor(10 + Math.random() * 89)}`;
}

/** "budi.tani@mail.com" -> "Budi Tani" — nama awal sebelum pengguna mengubahnya. */
function namaDariEmail(email: string) {
  const nama = (email.split("@")[0] ?? "")
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  return nama || "Pengguna PANTAS";
}

/** Pesan Supabase Auth -> kalimat yang berarti bagi petani. */
function pesanAuth(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Email ini sudah terdaftar. Silakan masuk, bukan mendaftar.";
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    // Supabase menyamarkan "email tak dikenal" dan "password salah" jadi satu
    // pesan. Dengan mode Masuk/Daftar yang eksplisit (F-02) kita tidak lagi
    // menebak-nebak mana yang terjadi — cukup sebut dua kemungkinannya.
    return "Email atau password salah. Belum punya akun? Pilih tab Daftar.";
  if (m.includes("password") && m.includes("at least"))
    return "Password minimal 6 karakter.";
  if (m.includes("invalid email") || m.includes("email address"))
    return "Format email tidak valid.";
  if (m.includes("not confirmed"))
    return 'Akun ini menunggu konfirmasi email. Matikan "Confirm email" di Supabase → Authentication → Sign In / Providers → Email, lalu masuk lagi.';
  if (m.includes("rate limit") || m.includes("too many"))
    // Kuota SMTP bawaan Supabase (~2 email/jam) habis karena signup masih
    // memicu email konfirmasi. Menunggu tidak menyelesaikan akar masalahnya.
    return 'Kuota email Supabase habis karena "Confirm email" masih aktif. Matikan di Authentication → Sign In / Providers → Email. Setelah itu pendaftaran tidak mengirim email sama sekali.';
  return message;
}

/**
 * Baca `inquiry` dari cache localStorage.
 *
 * Bucket yang ditulis versi sebelumnya berisi `listingId -> qty` — angka
 * telanjang tanpa listing-nya, dan tidak ada tempat mengambil listing itu
 * kembali. Baris seperti itu dibuang, bukan dipaksakan, supaya keranjang tidak
 * merender baris tanpa nama, harga, atau gambar.
 */
function inquiryTersimpan(saved: unknown): Record<string, InquiryItem> {
  if (!saved || typeof saved !== "object") return {};
  const out: Record<string, InquiryItem> = {};
  for (const [id, baris] of Object.entries(saved as Record<string, unknown>)) {
    if (
      baris &&
      typeof baris === "object" &&
      "listing" in baris &&
      typeof (baris as InquiryItem).qty === "number"
    ) {
      out[id] = baris as InquiryItem;
    }
  }
  return out;
}

/** Skor keseragaman dari payload grading (jsonb), bila ada. */
function skorDariHasil(hasil: Json | null): number | undefined {
  const skor = (hasil as unknown as LaporanGrading | null)?.ringkasan_batch
    ?.skor_keseragaman;
  return typeof skor === "number" ? skor : undefined;
}

/** Jumlah foto penyusun pindaian (F-12); undefined untuk laporan satu foto. */
function fotoDariHasil(hasil: Json | null): number | undefined {
  const n = (hasil as unknown as { foto_terproses?: number } | null)?.foto_terproses;
  return typeof n === "number" ? n : undefined;
}

type OrderRow = Database["public"]["Tables"]["orders"]["Row"] & {
  pembeli: { nama: string } | null;
  petani: { nama: string } | null;
  listing: { komoditas: string } | null;
};

/**
 * Kolom pesanan beserta join yang membuatnya bisa dirender: baris `orders`
 * sendiri hanya menyimpan uuid kedua pihak, sedangkan setiap layar menampilkan
 * namanya. Dipakai dua kali — hidrasi awal dan pengambilan ulang saat realtime
 * mengabarkan pesanan yang belum pernah dilihat klien ini.
 */
const ORDER_SELECT =
  "*, pembeli:profiles!orders_pembeli_id_fkey(nama), petani:profiles!orders_petani_id_fkey(nama), listing:listings(komoditas)";

function rowToOrder(r: OrderRow): Order {
  return {
    id: r.id,
    kode: r.kode,
    status: r.status as StatusPesanan,
    nama: r.nama,
    grade: r.grade as Grade,
    berat_kg: Number(r.berat_kg),
    harga_per_kg: r.harga_per_kg,
    total: Number(r.total),
    pembeli: r.pembeli?.nama ?? "Pembeli",
    petani: r.petani?.nama ?? "Petani",
    pembeli_id: r.pembeli_id,
    petani_id: r.petani_id,
    berat_aktual_kg:
      r.berat_aktual_kg == null ? undefined : Number(r.berat_aktual_kg),
    tanggal: r.created_at,
    komoditas: r.listing?.komoditas,
    listing_id: r.listing_id ?? undefined,
    status_kasus: r.status_kasus as StatusKasusTransaksi,
    alasan_kasus: r.alasan_kasus ?? undefined,
    diminta_oleh: r.diminta_oleh ?? undefined,
    diminta_pada: r.diminta_pada ?? undefined,
    ditanggapi_oleh: r.ditanggapi_oleh ?? undefined,
    ditanggapi_pada: r.ditanggapi_pada ?? undefined,
    status_pembayaran: r.status_pembayaran as StatusPembayaran,
    pembayaran_ditandai_pada: r.pembayaran_ditandai_pada ?? undefined,
    pembayaran_dikonfirmasi_pada: r.pembayaran_dikonfirmasi_pada ?? undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Peristiwa langsung                                                   */
/* ------------------------------------------------------------------ */

/**
 * Pabrik peristiwa: mengubah baris yang berubah menjadi kabar yang pantas
 * ditampilkan.
 *
 * Semuanya murni dan bebas i18n. Store tidak tahu bahasa apa yang sedang
 * dipakai layar; ia hanya menyebut *apa* yang terjadi dan pada lot mana.
 * Kalimatnya dirakit `SiaranLangsung` dari kunci kamus.
 */
let nomorPeristiwa = 0;
const idPeristiwa = () => `ev-${Date.now().toString(36)}-${nomorPeristiwa++}`;

function peristiwaPesananBaru(o: Order, peran?: Role): Peristiwa {
  return {
    id: idPeristiwa(),
    jenis: "pesanan_baru",
    nama: o.nama,
    orderId: o.id,
    status: o.status,
    kuantitas_kg: o.berat_kg,
    harga_per_kg: o.harga_per_kg,
    total: o.total,
    lawan: peran === "petani" ? o.pembeli : o.petani,
    href: peran === "petani" ? `/petani/pesanan/${o.id}` : `/pembeli/pesanan/${o.id}`,
    waktu: Date.now(),
  };
}

function peristiwaStatusPesanan(o: Order, peran?: Role): Peristiwa {
  return { ...peristiwaPesananBaru(o, peran), id: idPeristiwa(), jenis: "pesanan_status" };
}

function peristiwaPenawaranBaru(p: Penawaran): Peristiwa {
  return {
    id: idPeristiwa(),
    jenis: "penawaran_baru",
    nama: p.listing_nama ?? "lot",
    kuantitas_kg: p.kuantitas_kg,
    harga_per_kg: p.harga_per_kg,
    total: p.kuantitas_kg * p.harga_per_kg,
    lawan: p.pembeli_nama,
    href: "/petani/penawaran",
    waktu: Date.now(),
  };
}

/**
 * Jawaban petani atas sebuah penawaran, dilihat dari sisi pembeli.
 *
 * `null` untuk petani: dialah yang menjawab, dan mengumumkan kembali
 * tindakannya sendiri sebagai kabar dari seberang hanya akan membingungkan.
 */
function peristiwaPenawaranBerubah(p: Penawaran, peran?: Role): Peristiwa | null {
  if (peran !== "pembeli") return null;
  const jenis =
    p.status === "diterima"
      ? "penawaran_diterima"
      : p.status === "ditolak"
        ? "penawaran_ditolak"
        : p.status === "ditawar_balik"
          ? "penawaran_ditawar_balik"
          : null;
  if (!jenis) return null;
  return {
    id: idPeristiwa(),
    jenis,
    nama: p.listing_nama ?? "lot",
    orderId: p.order_id ?? undefined,
    kuantitas_kg: p.kuantitas_kg,
    harga_per_kg: p.harga_per_kg,
    total: p.kuantitas_kg * p.harga_per_kg,
    lawan: p.petani_nama,
    href: p.order_id ? `/pembeli/pesanan/${p.order_id}` : "/pembeli/pesanan",
    waktu: Date.now(),
  };
}

/**
 * Kolom penawaran beserta join nama kedua pihak — alasannya sama dengan
 * `ORDER_SELECT`. Dipakai hidrasi awal dan pengambilan ulang saat realtime
 * mengabarkan penawaran yang belum pernah dilihat klien ini.
 */
const PENAWARAN_SELECT =
  "*, pembeli:profiles!penawaran_pembeli_id_fkey(nama), petani:profiles!penawaran_petani_id_fkey(nama), listing:listings(nama)";

/** Baris `penawaran` beserta join nama kedua pihak dan nama lotnya. */
type PenawaranRow = Database["public"]["Tables"]["penawaran"]["Row"] & {
  pembeli?: { nama: string } | null;
  petani?: { nama: string } | null;
  listing?: { nama: string } | null;
};

/**
 * Kolom opsional di basis data adalah `null`; di `Penawaran` ia `undefined`.
 * Menyalin barisnya mentah-mentah membuat `tanggal_ambil: null` lolos ke layar,
 * yang lalu merender "Invalid Date" alih-alih "menunggu jadwal".
 */
function rowToPenawaran(r: PenawaranRow): Penawaran {
  return {
    id: r.id,
    listing_id: r.listing_id,
    pembeli_id: r.pembeli_id,
    petani_id: r.petani_id,
    kuantitas_kg: Number(r.kuantitas_kg),
    harga_per_kg: r.harga_per_kg,
    tanggal_ambil: r.tanggal_ambil ?? undefined,
    catatan: r.catatan ?? undefined,
    status: r.status as Penawaran["status"],
    created_at: r.created_at,
    order_id: r.order_id ?? null,
    pembeli_nama: r.pembeli?.nama ?? undefined,
    petani_nama: r.petani?.nama ?? undefined,
    listing_nama: r.listing?.nama ?? undefined,
  };
}

/** Hasil seragam untuk ketiga aksi auth. */
export interface HasilAuth {
  sesi: Sesi | null;
  error: string | null;
}

/** Satu lot yang akan diterbitkan ke katalog. */
export interface PublishInput {
  nama: string;
  /** Id komoditas engine; tanpa ini slug diturunkan dari nama tampilan. */
  komoditas?: string;
  grade: Grade;
  berat_kg: number;
  harga_per_kg: number;
  gambar: string;
  /**
   * Komposisi grade lot ini. Untuk lot campur inilah isi batch sebenarnya, dan
   * pembeli berhak melihatnya: sebuah lot "Grade B" yang ternyata 14% A, 57% B,
   * 29% C bukan hal yang sama dengan lot B murni. Untuk lot hasil pemilahan
   * isinya `{ [grade]: 1 }`.
   */
  komposisi?: Partial<Record<Grade, number>>;
  catatan_ai?: string;
}

interface Actions {
  /**
   * Masuk ke akun yang sudah ada. Tidak pernah mendaftar diam-diam: password
   * yang salah dulu memicu signUp dan balik dengan "email sudah terdaftar",
   * yang membuat pengguna mengira akunnya rusak (F-02).
   */
  masuk(email: string, password: string): Promise<HasilAuth>;
  /** Daftar akun baru; `role` menetapkan `profiles.peran` lewat trigger. */
  daftar(role: Role, email: string, password: string): Promise<HasilAuth>;
  /** Kirim email tautan pemulihan password ke `/masuk/reset`. */
  kirimResetPassword(email: string): Promise<{ error: string | null }>;
  /**
   * Tetapkan password baru untuk sesi yang sedang aktif. Dipakai halaman
   * `/masuk/reset` setelah tautan pemulihan menukar tokennya jadi sesi.
   */
  gantiPassword(password: string): Promise<{ error: string | null }>;
  logout(): void;

  setLastCapture(
    dataUrl: string | null,
    komoditas?: string,
    coinRoi?: [number, number, number, number] | null,
  ): void;
  /** Antrean foto untuk pindai batch multi-foto (F-12). */
  setLastCaptures(fotos: FotoAntrean[], komoditas?: string): void;
  addScan(
    s: Omit<Scan, "id" | "tanggal"> & {
      /**
       * Payload lengkap dari gradeBatch (satu foto) atau agregat
       * gradeBatchMulti (F-12) — dipersistenkan ke tabel gradings.
       */
      hasil?: LaporanGrading;
    },
  ): void;
  /**
   * Buang satu pindaian dari arsip lokal (F-13).
   *
   * Baris `gradings`-nya dihapus terpisah lewat `hapusRiwayatGrading`; ini
   * mengurus salinan sesi, yang di mode tanpa Supabase adalah satu-satunya
   * tempat pindaian itu hidup. Tanpa ini layar riwayat menghapus baris di basis
   * data lalu memunculkannya kembali dari cadangan lokal begitu daftar dimuat
   * ulang.
   */
  hapusScan(id: string): void;
  /**
   * Terbitkan satu batch sebagai satu atau beberapa listing.
   *
   * Array, bukan satu objek, karena petani yang memilah panennya per grade
   * menerbitkan tiga lot sekaligus dari satu pindaian. Menerbitkan satu
   * lot campur tinggal mengirim array berisi satu elemen.
   *
   * `gradingId` diisi saat batch-nya diambil dari arsip riwayat, bukan dari
   * pindaian yang baru saja selesai. Tanpa itu lot yang terbit dari arsip
   * mewarisi `lastGradingId` pindaian terakhir — sertifikat batch yang salah.
   */
  publishListings(inputs: PublishInput[], gradingId?: string): Listing[];

  updateListing(id: string, updates: Partial<Listing>): void;
  deleteListing(id: string): void;
  toggleListingStatus(id: string, status: "tayang" | "dijeda" | "terjual"): void;

  /** Menerima listing utuh, bukan id: barisnya menyimpan salinannya. */
  setInquiryQty(listing: Listing, qty: number): void;
  clearInquiry(): void;

  buatPenawaran(tanggalAmbil?: string, catatan?: string): Promise<void>;
  balasPenawaran(id: string, statusBaru: "diterima" | "ditolak" | "ditawar_balik", hargaBaru?: number): Promise<void>;

  createOrder(l: Listing, qty: number): Order;
  /**
   * Petani confirms handover by keying in the buyer's code.
   *
   * `beratAktualKg` opsional — berat timbangan saat serah terima (F-101).
   * Kosong berarti petani tidak membawa timbangan; verifikasinya tetap sah.
   */
  verifikasiSerahTerima(
    orderId: string,
    kode: string,
    beratAktualKg?: number,
  ): boolean;
  /** Memperbarui status pesanan secara manual (misal: F-50 Jadwal) */
  setOrderStatus(orderId: string, status: StatusPesanan): void;
  /** Batalkan langsung sebelum konfirmasi, atau minta persetujuan sesudahnya. */
  ajukanPembatalan(orderId: string, alasan: string): Promise<HasilAksiTransaksi>;
  /** Hanya pihak lawan yang dapat menerima atau menolak permintaan pembatalan. */
  tanggapiPembatalan(orderId: string, setuju: boolean): Promise<HasilAksiTransaksi>;
  /** Kunci transaksi dan teruskan kasus untuk resolusi admin. */
  bukaSengketa(orderId: string, alasan: string): Promise<HasilAksiTransaksi>;
  /** Catat klaim pembeli bahwa pembayaran di luar aplikasi telah dilakukan. */
  tandaiPembayaran(orderId: string): Promise<HasilAksiTransaksi>;
  /** Catat konfirmasi petani bahwa pembayaran di luar aplikasi telah diterima. */
  konfirmasiPembayaran(orderId: string): Promise<HasilAksiTransaksi>;
  /**
   * Hitung ulang badge pesan belum dibaca. Dipanggil `ChatWindow` sesudah ia
   * menandai percakapan yang sedang dibuka sebagai sudah dibaca.
   */
  refreshPesanBelumDibaca(): Promise<void>;
  /** Hitung ulang badge antrean pindai offline dari IndexedDB (F-14). */
  refreshAntreanPindai(): Promise<void>;
  /** Tandai tur berpandu telah selesai di DB dan state lokal (F-04). */
  completeTour(): Promise<void>;
  /** Reset status tur berpandu agar muncul kembali saat diminta. */
  restartTour(): void;
  /**
   * Simpan titik kebun petani ke `profiles`.
   *
   * Koordinat lot datang dari profil pemiliknya lewat `listings_view`, jadi
   * petani yang profilnya belum punya lat/lng tidak pernah muncul di peta
   * pemasok — lotnya tetap ada di daftar, hanya tanpa titik. Sampai sekarang
   * tidak ada satu pun layar yang bisa mengisinya: hanya seed yang punya
   * koordinat, dan setiap petani yang mendaftar sendiri tidak terlihat.
   */
  simpanLokasiKebun(lat: number, lng: number, lokasi?: string): Promise<void>;
  /** Tandai satu kabar langsung sudah dilihat, lalu buang dari antrean. */
  tutupPeristiwa(id: string): void;
}

const Ctx = createContext<(State & Actions & { ready: boolean }) | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(INITIAL);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);
  const storageKey = useRef(keyFor());
  // Mirror for async actions that need current state without re-subscribing.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    // Instant hydration: restore active session and cached state immediately so UI is interactive in < 1ms
    let cancelled = false;
    let activeSesi: Sesi | null = null;
    let saved: Partial<State> | null = null;

    try {
      const rawSesi = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (rawSesi) activeSesi = JSON.parse(rawSesi) as Sesi;
    } catch {}

    const uid = activeSesi?.userId;
    const currentKey = keyFor(uid);
    storageKey.current = currentKey;

    try {
      const raw = localStorage.getItem(currentKey);
      if (raw) saved = JSON.parse(raw) as Partial<State>;
    } catch {
      try {
        localStorage.removeItem(currentKey);
      } catch {}
    }

    // Shared demo orders for multi-role consistency
    const allDemoOrders = getStoredDemoOrders();
    const userDemoOrders = filterOrdersForUser(allDemoOrders, activeSesi);

    // Merge saved orders with shared demo orders
    const existingOrders = saved?.orders ?? [];
    const mergedOrdersMap = new Map<string, Order>();
    for (const o of existingOrders) mergedOrdersMap.set(o.id, o);
    for (const o of userDemoOrders) {
      if (!mergedOrdersMap.has(o.id)) {
        mergedOrdersMap.set(o.id, o);
      } else {
        const existing = mergedOrdersMap.get(o.id)!;
        mergedOrdersMap.set(o.id, {
          ...existing,
          status: o.status,
          berat_aktual_kg: o.berat_aktual_kg ?? existing.berat_aktual_kg,
        });
      }
    }
    const finalOrders = Array.from(mergedOrdersMap.values());

    // Shared demo penawaran for multi-role consistency
    const allDemoPenawaran = getStoredDemoPenawaran();
    const userDemoPenawaran = filterPenawaranForUser(allDemoPenawaran, activeSesi);

    const existingPenawaran = saved?.myPenawaran ?? [];
    const mergedPenawaranMap = new Map<string, Penawaran>();
    for (const p of existingPenawaran) mergedPenawaranMap.set(p.id, p);
    for (const p of userDemoPenawaran) {
      if (!mergedPenawaranMap.has(p.id)) {
        mergedPenawaranMap.set(p.id, p);
      } else {
        const existing = mergedPenawaranMap.get(p.id)!;
        mergedPenawaranMap.set(p.id, {
          ...existing,
          status: p.status,
          harga_per_kg: p.harga_per_kg ?? existing.harga_per_kg,
          order_id: p.order_id ?? existing.order_id,
        });
      }
    }
    const finalPenawaran = Array.from(mergedPenawaranMap.values());

    // Default demo listings/scans if demo petani
    let initialListings = saved?.myListings ?? [];
    if (initialListings.length === 0 && activeSesi?.role === "petani") {
      initialListings = LISTINGS.filter(
        (l) => l.petani_id === activeSesi?.userId || l.petani === activeSesi?.nama
      );
    }
    let initialScans = saved?.scans ?? [];
    if (initialScans.length === 0 && activeSesi?.role === "petani") {
      initialScans = DEMO_SCANS.map((s) => ({
        id: s.id,
        tanggal: s.tanggal,
        komoditas: s.komoditas,
        komoditas_label: s.komoditas_label,
        grade_dominan: s.grade_dominan as Grade,
        objek: s.objek,
        gambar: s.gambar,
        skor: s.skor,
        foto: s.foto,
        hash_audit: s.hash_audit,
      }));
    }

    /*
     * Hidrasi dari localStorage memang harus terjadi di dalam efek, dan sekali
     * saja: nilainya hanya ada di peramban, jadi memasukkannya lewat
     * `useState(() => …)` membuat HTML server dan render pertama klien berbeda
     * dan React membuang seluruh pohonnya. Satu render tambahan di sini adalah
     * harga yang memang dibayar untuk itu.
     */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidrasi awal dari localStorage, lihat catatan di atas
    setState((s) => ({
      ...s,
      ...(saved ?? {}),
      sesi: activeSesi ?? saved?.sesi ?? null,
      orders: finalOrders.length > 0 ? finalOrders : (saved?.orders ?? []),
      myPenawaran: finalPenawaran.length > 0 ? finalPenawaran : (saved?.myPenawaran ?? []),
      myListings: initialListings,
      scans: initialScans,
      inquiry: inquiryTersimpan(saved?.inquiry),
    }));
    loaded.current = true;
    setReady(true);

    // Non-blocking background verification with Supabase if configured
    const verifySupabase = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const supabase = await getSupabase();
        if (!supabase || cancelled) return;
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        const user = (!error && data?.session?.user) ? data.session.user : null;
        let sesi: Sesi | null = null;
        if (user) {
          const { data: profil } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          if (cancelled) return;
          sesi = {
            role: (profil?.peran as Role) ?? "petani",
            email: user.email ?? "",
            nama: profil?.nama ?? namaDariEmail(user.email ?? ""),
            userId: user.id,
            lokasi: profil?.lokasi ?? undefined,
            turSelesai: profil?.tur_selesai ?? false,
          };
        }
        if (sesi) {
          try {
            localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sesi));
          } catch {}
          setState((s) => ({ ...s, sesi }));
        } else if (!user && cachedSesi?.userId) {
          // Hanya buang sesi yang memang berasal dari Supabase. Menulis
          // `sesi: null` tanpa syarat memicu satu render percuma saat pengunjung
          // memang belum masuk, dan menendang sesi demo tanpa `userId` yang
          // dibuat ketika backend belum dikonfigurasi.
          //
          // Sesi demo ber-uuid seed ikut dikecualikan: uuid-nya nyata, tetapi
          // Supabase tidak pernah menerbitkan sesi untuknya, jadi tanpa syarat
          // ini akun demo tertendang beberapa detik sesudah masuk.
          if (!cachedSesi.email?.endsWith("@demo.pantas.id")) {
            try {
              localStorage.removeItem(ACTIVE_SESSION_KEY);
            } catch {}
            setState((s) => ({ ...s, sesi: null }));
          }
        }
      } catch {
        /* ignore network/auth errors in offline/demo session */
      }
    };

    const cachedSesi = activeSesi ?? saved?.sesi ?? null;

    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => void verifySupabase());
      } else {
        setTimeout(() => void verifySupabase(), 150);
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Cross-tab and shared demo order & offer synchronization
  useEffect(() => {
    const handleOrderUpdate = (order: Order) => {
      setState((s) => {
        const sesi = s.sesi;
        const belongsToUser =
          !sesi ||
          (sesi.role === "petani" && (order.petani_id === sesi.userId || order.petani === sesi.nama || (sesi.nama && order.petani?.includes("Warsono")))) ||
          (sesi.role === "pembeli" && (order.pembeli_id === sesi.userId || order.pembeli === sesi.nama || (sesi.nama && order.pembeli?.includes("Rina"))));

        if (!belongsToUser) return s;

        const exists = s.orders.some((o) => o.id === order.id);
        const nextOrders = exists
          ? s.orders.map((o) => (o.id === order.id ? { ...o, ...order } : o))
          : [order, ...s.orders];

        return { ...s, orders: nextOrders };
      });
    };

    const handlePenawaranUpdate = (penawaran: Penawaran) => {
      setState((s) => {
        const sesi = s.sesi;
        const belongsToUser =
          !sesi ||
          (sesi.role === "petani" && (penawaran.petani_id === sesi.userId || (sesi.nama && penawaran.petani_nama?.includes("Warsono")))) ||
          (sesi.role === "pembeli" && (penawaran.pembeli_id === sesi.userId || (sesi.nama && penawaran.pembeli_nama?.includes("Rina"))));

        if (!belongsToUser) return s;

        const exists = s.myPenawaran.some((p) => p.id === penawaran.id);
        const nextPenawaran = exists
          ? s.myPenawaran.map((p) => (p.id === penawaran.id ? { ...p, ...penawaran } : p))
          : [penawaran, ...s.myPenawaran];

        return { ...s, myPenawaran: nextPenawaran };
      });
    };

    const channel = getSyncChannel();
    if (channel) {
      channel.onmessage = (e) => {
        if (e.data?.type === "ORDER_UPDATED" || e.data?.type === "ORDER_CREATED") {
          handleOrderUpdate(e.data.order);
        }
      };
    }

    const penawaranChan = getPenawaranSyncChannel();
    if (penawaranChan) {
      penawaranChan.onmessage = (e) => {
        if (e.data?.type === "PENAWARAN_UPDATED" || e.data?.type === "PENAWARAN_CREATED") {
          handlePenawaranUpdate(e.data.penawaran);
        }
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === DEMO_ORDERS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as Order[];
          if (Array.isArray(parsed)) {
            setState((s) => {
              const userOrders = filterOrdersForUser(parsed, s.sesi);
              return { ...s, orders: userOrders };
            });
          }
        } catch {}
      }
      if (e.key === DEMO_PENAWARAN_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as Penawaran[];
          if (Array.isArray(parsed)) {
            setState((s) => {
              const userPenawaran = filterPenawaranForUser(parsed, s.sesi);
              return { ...s, myPenawaran: userPenawaran };
            });
          }
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    /*
     * Dua bidang tidak ikut disimpan.
     *
     * `peristiwa` adalah kabar yang sedang ditampilkan sekarang; menyimpannya
     * berarti kartu "penawaran Anda diterima" muncul lagi tiap kali halaman
     * dibuka, berhari-hari sesudah kejadiannya. `statusLangganan` adalah
     * kesehatan soket saat ini, dan soket yang belum tersambung tidak boleh
     * mewarisi klaim "hidup" dari kunjungan kemarin.
     */
    const disimpan: Partial<State> = { ...state };
    delete disimpan.peristiwa;
    delete disimpan.statusLangganan;
    try {
      localStorage.setItem(storageKey.current, JSON.stringify(disimpan));
    } catch {
      // quota exceeded (large captures) — drop the heavy field and retry
      try {
        localStorage.setItem(
          storageKey.current,
          JSON.stringify({ ...disimpan, lastCapture: null }),
        );
      } catch {
        /* storage unavailable — state stays in memory only */
      }
    }
  }, [state, ready]);

  // Once we know the user, replace the cache with their own rows.
  const hydratedFor = useRef<string | null>(null);
  useEffect(() => {
    const uid = state.sesi?.userId;
    if (!isSupabaseConfigured || !uid || hydratedFor.current === uid) return;
    hydratedFor.current = uid;
    void (async () => {
      const supabase = await getSupabase();
      if (!supabase) return;
      const [listingsRes, ordersRes, gradingsRes, penawaranRes] = await Promise.all([
        supabase
          .from("listings_view")
          .select("*")
          .eq("petani_id", uid)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select(ORDER_SELECT)
          .order("created_at", { ascending: false }),
        supabase
          .from("gradings")
          .select(
            "id, created_at, komoditas, komoditas_label, grade_dominan, objek_terdeteksi, gambar_url, hash_audit, hasil",
          )
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("penawaran")
          .select(PENAWARAN_SELECT)
          .or(`petani_id.eq.${uid},pembeli_id.eq.${uid}`)
          .order("created_at", { ascending: false }),
      ]);
      setState((s) => {
        // Merge Supabase orders with local/demo orders
        const dbOrders = ordersRes.error
          ? s.orders
          : ((ordersRes.data ?? []) as OrderRow[]).map(rowToOrder);

        const orderMap = new Map<string, Order>();
        for (const o of dbOrders) orderMap.set(o.id, o);
        for (const o of s.orders) {
          if (!orderMap.has(o.id)) orderMap.set(o.id, o);
        }
        const mergedOrders = Array.from(orderMap.values());
        saveStoredDemoOrders(mergedOrders);

        return {
          ...s,
          myListings: listingsRes.error
            ? s.myListings
            : (listingsRes.data && listingsRes.data.length > 0)
              ? (listingsRes.data).map(rowToListing)
              : s.myListings,
          orders: mergedOrders,
          scans: gradingsRes.error
            ? s.scans
            : (gradingsRes.data && gradingsRes.data.length > 0)
              ? (gradingsRes.data).map((g) => ({
                id: g.id,
                tanggal: g.created_at,
                komoditas: g.komoditas,
                komoditas_label: g.komoditas_label,
                grade_dominan: g.grade_dominan as Grade,
                objek: g.objek_terdeteksi,
                gambar: g.gambar_url ?? "/img/tomat.jpg",
                skor: skorDariHasil(g.hasil),
                foto: fotoDariHasil(g.hasil),
                hash_audit: g.hash_audit ?? undefined,
                hasil: (g.hasil as unknown as LaporanGrading) ?? undefined,
              }))
              : s.scans,
          myPenawaran: penawaranRes.error
            ? s.myPenawaran
            : (penawaranRes.data ?? []).map(rowToPenawaran),
        };
      });
    })();
  }, [state.sesi]);

  // Tabel faktor emisi dibaca sekali, terlepas dari sesi: RLS-nya SELECT
  // publik, dan layar dampak petani maupun kartu rute admin membacanya.
  useEffect(() => {
    let batal = false;
    const muatFaktor = async () => {
      try {
        const faktorEmisi = await getFaktorEmisi();
        if (!batal) setState((s) => ({ ...s, faktorEmisi }));
      } catch {
        /* fallback ke FAKTOR_EMISI_BAWAAN */
      }
    };
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => void muatFaktor());
      } else {
        setTimeout(() => void muatFaktor(), 600);
      }
    }
    return () => {
      batal = true;
    };
  }, []);

  /**
   * Adopsi sesi: pindah bucket cache ke akun ini dan simpan pointer sesi aktif.
   */
  const pakaiSesi = useCallback((sesi: Sesi): HasilAuth => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sesi));
      } catch {}
    }

    const currentKey = keyFor(sesi.userId);
    storageKey.current = currentKey;

    // Retrieve shared demo orders for this user
    const allDemoOrders = getStoredDemoOrders();
    const userOrders = filterOrdersForUser(allDemoOrders, sesi);

    // Initial demo listings if petani
    let initialListings: Listing[] = [];
    if (sesi.role === "petani") {
      initialListings = LISTINGS.filter(
        (l) => l.petani_id === sesi.userId || l.petani === sesi.nama
      );
    }
    let initialScans: Scan[] = [];
    if (sesi.role === "petani") {
      initialScans = DEMO_SCANS.map((s) => ({
        id: s.id,
        tanggal: s.tanggal,
        komoditas: s.komoditas,
        komoditas_label: s.komoditas_label,
        grade_dominan: s.grade_dominan as Grade,
        objek: s.objek,
        gambar: s.gambar,
        skor: s.skor,
        foto: s.foto,
        hash_audit: s.hash_audit,
      }));
    }

    setState((st) => ({
      ...st,
      sesi,
      scans: initialScans,
      lastScanId: null,
      myListings: initialListings,
      myPenawaran: [],
      orders: userOrders,
      inquiry: {},
    }));
    return { sesi, error: null };
  }, []);

  /** Bangun Sesi dari user auth + baris profiles-nya. */
  const sesiDariUser = useCallback(
    async (
      userId: string,
      email: string,
      fallbackRole: Role,
    ): Promise<Sesi> => {
      const supabase = await getSupabase();
      const { data: profil } = await supabase!
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      return {
        // Peran di profil menang: satu akun tetap satu peran.
        role: (profil?.peran as Role) ?? fallbackRole,
        email,
        nama: profil?.nama ?? namaDariEmail(email),
        userId,
        lokasi: profil?.lokasi ?? undefined,
      };
    },
    [],
  );

  const masuk = useCallback(
    async (email: string, password: string): Promise<HasilAuth> => {
      const bersih = email.trim().toLowerCase();
      const demoAkun = AKUN_DEMO.find((a) => a.email === bersih);

      const supabase = await getSupabase();
      if (!supabase) {
        if (demoAkun) {
          return pakaiSesi({
            role: demoAkun.role,
            email: demoAkun.email,
            nama: demoAkun.nama,
            userId: demoAkun.userId,
            lokasi: demoAkun.lokasi,
          });
        }
        return pakaiSesi({
          role: bersih.startsWith("pembeli") ? "pembeli" : "petani",
          email: bersih,
          nama: namaDariEmail(bersih),
        });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: bersih,
        password,
      });

      if (error) {
        // If it's a demo account and demo password matches, fallback smoothly to demo session
        if (demoAkun && password === DEMO_PASSWORD) {
          return pakaiSesi({
            role: demoAkun.role,
            email: demoAkun.email,
            nama: demoAkun.nama,
            userId: demoAkun.userId,
            lokasi: demoAkun.lokasi,
          });
        }
        return { sesi: null, error: pesanAuth(error.message) };
      }

      if (!data.user) {
        if (demoAkun) {
          return pakaiSesi({
            role: demoAkun.role,
            email: demoAkun.email,
            nama: demoAkun.nama,
            userId: demoAkun.userId,
            lokasi: demoAkun.lokasi,
          });
        }
        return { sesi: null, error: "Gagal masuk. Coba lagi." };
      }

      return pakaiSesi(await sesiDariUser(data.user.id, bersih, "petani"));
    },
    [pakaiSesi, sesiDariUser],
  );

  const daftar = useCallback(
    async (role: Role, email: string, password: string): Promise<HasilAuth> => {
      const bersih = email.trim().toLowerCase();

      const supabase = await getSupabase();
      if (!supabase) {
        return pakaiSesi({ role, email: bersih, nama: namaDariEmail(bersih) });
      }

      const { data, error } = await supabase.auth.signUp({
        email: bersih,
        password,
        // `data` hanya dipakai saat akun dibuat — trigger handle_new_user
        // menyalinnya ke public.profiles.
        options: { data: { peran: role, nama: namaDariEmail(bersih) } },
      });
      if (error) return { sesi: null, error: pesanAuth(error.message) };

      if (!data.session) {
        // Dengan proteksi enumerasi email aktif, signUp untuk email yang sudah
        // ada tidak melempar error — ia balas user tanpa identities.
        const sudahTerdaftar = (data.user?.identities?.length ?? 0) === 0;
        return {
          sesi: null,
          error: sudahTerdaftar
            ? "Email ini sudah terdaftar. Silakan masuk lewat tab Masuk."
            : 'Akun dibuat, tapi proyek Supabase masih meminta konfirmasi email. Matikan "Confirm email" di Authentication → Providers → Email, lalu coba lagi.',
        };
      }
      if (!data.user) return { sesi: null, error: "Gagal mendaftar. Coba lagi." };

      return pakaiSesi(await sesiDariUser(data.user.id, bersih, role));
    },
    [pakaiSesi, sesiDariUser],
  );

  const kirimResetPassword = useCallback(async (email: string) => {
    const bersih = email.trim().toLowerCase();
    const supabase = await getSupabase();
    if (!supabase) {
      return {
        error:
          "Pemulihan password butuh backend Supabase. Di mode demo, masuk dengan email apa pun.",
      };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(bersih, {
      redirectTo: `${window.location.origin}/masuk/reset`,
    });
    return { error: error ? pesanAuth(error.message) : null };
  }, []);

  const gantiPassword = useCallback(async (password: string) => {
    const supabase = await getSupabase();
    if (!supabase) {
      return { error: "Ganti password butuh backend Supabase." };
    }
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? pesanAuth(error.message) : null };
  }, []);

  const logout = useCallback(() => {
    void getSupabase().then((supabase) => supabase?.auth.signOut());
    hydratedFor.current = null;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
        localStorage.removeItem(storageKey.current);
      } catch {
        /* storage unavailable */
      }
    }
    storageKey.current = keyFor();
    // Full reset.
    setState(INITIAL);
  }, []);

  const setLastCapture = useCallback(
    (
      dataUrl: string | null,
      komoditas?: string,
      coinRoi: [number, number, number, number] | null = null,
    ) => {
      setState((s) => ({
        ...s,
        lastCapture: dataUrl,
        lastCoinRoi: coinRoi,
        // Pindai satu foto adalah antrean berisi satu; layar hasil hanya perlu
        // membaca satu bidang, bukan menebak jalur mana yang dipakai.
        lastCaptures: dataUrl ? [{ dataUrl, roi: coinRoi }] : [],
        lastKomoditas: komoditas ?? s.lastKomoditas,
        // Foto baru berarti laporan terakhir bukan lagi "hasil pindaian ini".
        // Tanpa ini layar hasil akan memutar ulang laporan foto sebelumnya.
        lastScanId: null,
      }));
    },
    [],
  );

  const setLastCaptures = useCallback(
    (fotos: FotoAntrean[], komoditas?: string) => {
      setState((s) => ({
        ...s,
        lastCaptures: fotos,
        // Foto pertama jadi sampul: itulah yang dipakai layar harga dan
        // penerbitan listing, yang tidak peduli batch ini punya berapa sudut.
        lastCapture: fotos[0]?.dataUrl ?? null,
        lastCoinRoi: fotos[0]?.roi ?? null,
        lastKomoditas: komoditas ?? s.lastKomoditas,
        lastScanId: null,
      }));
    },
    [],
  );

  const addScan = useCallback(
    (input: Omit<Scan, "id" | "tanggal"> & { hasil?: LaporanGrading }) => {
      const { hasil, ...fields } = input;
      setState((s) => {
        const scan: Scan = {
          ...fields,
          skor: fields.skor ?? hasil?.ringkasan_batch?.skor_keseragaman,
          komoditas: fields.komoditas ?? hasil?.komoditas,
          hash_audit: fields.hash_audit ?? hasil?.hash_audit,
          hasil,
          id: `scan-${Date.now()}`,
          tanggal: new Date().toISOString(),
        };
        // Cap history: captures can be data URLs and localStorage is ~5MB.
        // `lastGradingId` dikosongkan dulu supaya batch baru tidak sempat
        // terbit dengan tautan ke laporan mutu pindaian sebelumnya.
        return {
          ...s,
          scans: [scan, ...s.scans].slice(0, 8),
          lastGradingId: null,
          lastScanId: scan.id,
        };
      });

      const sesi = stateRef.current.sesi;
      if (!isSupabaseConfigured || !sesi?.userId || !hasil) return;
      void (async () => {
        const supabase = await getSupabase();
        if (!supabase) return;
        const gambarUrl = fields.gambar.startsWith("data:")
          ? await uploadCapture(fields.gambar, sesi.userId!)
          : null;
        // annotated_img (data URL besar) tidak ikut disimpan ke jsonb. Agregat
        // multi-foto tidak punya bidang itu, jadi penghapusannya no-op di sana.
        const hasilBersih: Record<string, unknown> = { ...hasil };
        delete hasilBersih.annotated_img;
        // `select` supaya id barisnya bisa dipakai `listings.grading_id` saat
        // petani menerbitkan batch ini — tanpa itu tautan lacak sertifikat di
        // layar pembeli tidak pernah punya sumber.
        const { data, error } = await supabase
          .from("gradings")
          .insert({
            petani_id: sesi.userId!,
            komoditas: hasil.komoditas,
            komoditas_label: fields.komoditas_label,
            grade_dominan: fields.grade_dominan,
            objek_terdeteksi: fields.objek,
            hasil: hasilBersih as unknown as Json,
            hash_audit: hasil.hash_audit,
            gambar_url: gambarUrl,
          })
          .select("id")
          .maybeSingle();
        if (error) console.warn("[pantas] simpan grading gagal:", error.message);
        if (data?.id) setState((s) => ({ ...s, lastGradingId: data.id }));
      })();
    },
    [],
  );

  const publishListings = useCallback(
    (inputs: PublishInput[], gradingIdEksplisit?: string): Listing[] => {
      const sesi = stateRef.current.sesi;
      // Menerbitkan dari arsip riwayat menyebutkan laporan mutunya sendiri.
      // `lastGradingId` hanya berlaku untuk pindaian terakhir sesi ini, jadi
      // memakainya di sana akan menautkan lot baru ke sertifikat batch lain —
      // atau ke tidak ada sama sekali.
      const gradingId = gradingIdEksplisit ?? stateRef.current.lastGradingId;

      const listings: Listing[] = inputs.map((input, i) => ({
        // Offset per elemen: tiga lot yang terbit dalam milidetik yang sama
        // tidak boleh berebut id yang sama.
        id: `PNT-L-${Math.floor(1000 + Math.random() * 8999) + i}`,
        nama: input.nama,
        komoditas:
          input.komoditas ?? input.nama.toLowerCase().replace(/\s+/g, "_"),
        grade: input.grade,
        berat_kg: input.berat_kg,
        harga_per_kg: input.harga_per_kg,
        gambar: input.gambar,
        petani: sesi?.nama ?? "Petani PANTAS",
        petani_id: sesi?.userId,
        lokasi: sesi?.lokasi ?? "",
        // Petani yang baru mendaftar belum tentu punya koordinat profil, dan
        // menuliskannya sebagai (0, 0) menaruh kebunnya di Teluk Guinea sambil
        // melapor "0 km" ke tiap pembeli. Tidak tahu ditulis null.
        jarak_km: null,
        rating: 0,
        transaksi: 0,
        lat: null,
        lng: null,
        stok_kg: input.berat_kg,
        panen_terakhir: "Baru saja",
        komposisi: input.komposisi,
        catatan_ai: input.catatan_ai,
        grading_id: gradingId ?? undefined,
      }));

      setState((s) => ({
        ...s,
        myListings: [...listings, ...s.myListings],
        lastPublishedIds: listings.map((l) => l.id),
        lastCapture: null,
      }));

      if (isSupabaseConfigured && sesi?.userId) {
        void (async () => {
          const supabase = await getSupabase();
          if (!supabase) return;
          // Foto batch sama untuk semua lot, jadi unggah sekali lalu pakai
          // ulang URL-nya — memecah per grade tidak boleh berarti tiga unggahan
          // gambar yang identik.
          const asal = inputs[0]?.gambar ?? "";
          let gambar = asal;
          if (asal.startsWith("data:")) {
            const url = await uploadCapture(asal, sesi.userId!);
            if (url) {
              gambar = url;
              const ids = new Set(listings.map((l) => l.id));
              setState((s) => ({
                ...s,
                myListings: s.myListings.map((l) =>
                  ids.has(l.id) ? { ...l, gambar: url } : l,
                ),
              }));
            }
          }
          const { error } = await supabase.from("listings").insert(
            listings.map((l) => ({
              id: l.id,
              petani_id: sesi.userId!,
              grading_id: l.grading_id ?? null,
              nama: l.nama,
              komoditas: l.komoditas,
              grade: l.grade,
              berat_kg: l.berat_kg,
              harga_per_kg: l.harga_per_kg,
              gambar: l.gambar.startsWith("data:") ? gambar : l.gambar,
              stok_kg: l.stok_kg,
              panen_terakhir: l.panen_terakhir,
              komposisi: (l.komposisi ?? null) as unknown as Json,
              catatan_ai: l.catatan_ai ?? null,
            })),
          );
          if (error)
            console.warn("[pantas] terbit listing ke DB gagal:", error.message);
        })();
      }
      return listings;
    },
    [],
  );

  const setInquiryQty = useCallback((listing: Listing, qty: number) => {
    setState((s) => {
      const inquiry = { ...s.inquiry };
      if (qty <= 0) delete inquiry[listing.id];
      else inquiry[listing.id] = { listing, qty };
      return { ...s, inquiry };
    });
  }, []);

  const clearInquiry = useCallback(() => {
    setState((s) => ({ ...s, inquiry: {} }));
  }, []);

  const createOrder = useCallback((l: Listing, qty: number): Order => {
    const sesi = stateRef.current.sesi;
    const pembeliId = sesi?.userId || DEMO_USERS.pembeli.userId;
    const petaniId = l.petani_id || DEMO_USERS.petani.userId;
    const pembeliNama = sesi?.nama || DEMO_USERS.pembeli.nama;

    const order: Order = {
      id: `PNT-${Math.floor(100 + Math.random() * 899)}`,
      kode: randKode(),
      status: "dipesan",
      nama: l.nama,
      grade: l.grade,
      berat_kg: qty,
      harga_per_kg: l.harga_per_kg,
      total: qty * l.harga_per_kg,
      pembeli: pembeliNama,
      petani: l.petani,
      pembeli_id: pembeliId,
      petani_id: petaniId,
      tanggal: new Date().toISOString(),
      komoditas: l.komoditas,
    };

    setState((s) => {
      const inquiry = { ...s.inquiry };
      delete inquiry[l.id];
      return { ...s, orders: [order, ...s.orders], inquiry };
    });

    // Save to shared demo orders and broadcast
    updateSingleDemoOrder(order);

    if (isSupabaseConfigured && pembeliId && petaniId) {
      void getSupabase().then((supabase) =>
        supabase
          ?.from("orders")
          .insert({
            id: order.id,
            kode: order.kode,
            listing_id: l.id,
            pembeli_id: pembeliId,
            petani_id: petaniId,
            status: order.status,
            nama: order.nama,
            grade: order.grade,
            berat_kg: order.berat_kg,
            harga_per_kg: order.harga_per_kg,
            total: order.total,
          })
          .then(({ error }) => {
            if (error)
              console.warn("[pantas] simpan pesanan ke DB gagal:", error.message);
          }),
      );
    }
    return order;
  }, []);

  const buatPenawaran = useCallback(
    async (tanggalAmbil?: string, catatan?: string): Promise<void> => {
      const sesi = stateRef.current.sesi;
      const inquiry = stateRef.current.inquiry;
      if (!sesi?.userId) return;

      // Barisnya sudah membawa listing-nya sendiri, jadi penawaran bisa dibuat
      // untuk lot Supabase mana pun — bukan hanya yang kebetulan ada di
      // `myListings` atau di array demo.
      const items = Object.values(inquiry);

      if (items.length === 0) return;

      const newOffers: Penawaran[] = items.map(({ listing, qty }) => ({
        id: `PNW-${Math.floor(1000 + Math.random() * 8999)}`,
        listing_id: listing.id,
        pembeli_id: sesi.userId!,
        petani_id: listing.petani_id ?? "",
        kuantitas_kg: qty,
        harga_per_kg: listing.harga_per_kg,
        tanggal_ambil: tanggalAmbil,
        catatan,
        status: "terkirim",
        created_at: new Date().toISOString(),
        pembeli_nama: sesi.nama,
        petani_nama: listing.petani,
      }));

      setState((s) => ({
        ...s,
        inquiry: {}, // Kosongkan inquiry setelah dibuat
        myPenawaran: [...newOffers, ...s.myPenawaran],
      }));

      // Simpan ke storage demo bersama dan siarkan ke tab lain
      for (const o of newOffers) {
        updateSingleDemoPenawaran(o);
      }

      const supabase = await getSupabase();
      if (supabase) {
        // `id` sengaja tidak dikirim: kolomnya uuid, sedangkan id sementara di
        // atas berbentuk "PNW-1234" supaya layar punya sesuatu untuk dirender
        // seketika. Mengirimnya membuat setiap insert ditolak, dan penawaran
        // yang tidak pernah ada barisnya juga tidak bisa punya percakapan —
        // `pesan.penawaran_id` menunjuk ke tabel ini (F-33).
        const rows = newOffers.map((o) => ({
          listing_id: o.listing_id,
          pembeli_id: o.pembeli_id,
          petani_id: o.petani_id,
          kuantitas_kg: o.kuantitas_kg,
          harga_per_kg: o.harga_per_kg,
          tanggal_ambil: o.tanggal_ambil,
          catatan: o.catatan,
          status: o.status,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("penawaran")
          .insert(rows)
          .select();
        if (error) {
          console.warn("[pantas] simpan penawaran gagal:", error.message);
          return;
        }
        // Tukar id sementara dengan uuid yang benar-benar tersimpan, urut sama
        // dengan `rows` yang dikirim.
        const tersimpan = (data ?? []) as Penawaran[];
        const adopsi = tersimpan.map((row, i) => ({
          ...row,
          pembeli_nama: newOffers[i]?.pembeli_nama,
          petani_nama: newOffers[i]?.petani_nama,
        }));
        for (const row of adopsi) {
          updateSingleDemoPenawaran(row);
        }
        setState((s) => {
          const sementara = new Set(newOffers.map((o) => o.id));
          const sisa = s.myPenawaran.filter((p) => !sementara.has(p.id));
          return { ...s, myPenawaran: [...adopsi, ...sisa] };
        });
      }
    },
    []
  );

  /**
   * Jawaban petani atas sebuah penawaran.
   *
   * "Diterima" tidak lagi ditangani di sini. Menerima penawaran berarti dua
   * tulisan yang harus terjadi bersama — status penawarannya berubah *dan*
   * pesanannya lahir — dan versi lama menulis keduanya dari peramban, terpisah,
   * lalu menelan kegagalannya sebagai `console.warn`. Policy insert `orders`
   * hanya mengenal pembeli sebagai pembuat pesanan (`auth.uid() = pembeli_id`),
   * jadi insert dari petani selalu ditolak: layar petani memperlihatkan pesanan
   * yang hanya ada di state lokalnya, dan layar pembeli tidak punya apa-apa.
   *
   * Sekarang keduanya dikerjakan RPC `terima_penawaran` (migrasi 0017) dalam
   * satu transaksi, dan pesanan yang dikembalikannya — lengkap dengan id serta
   * kode serah terima buatan basis data — yang dipakai layar. Kegagalannya
   * dilempar, bukan dibisikkan ke konsol, supaya pemanggilnya bisa memberi tahu
   * petani bahwa tawarannya belum jadi.
   */
  const balasPenawaran = useCallback(
    async (id: string, statusBaru: "diterima" | "ditolak" | "ditawar_balik", hargaBaru?: number): Promise<void> => {
      const supabase = await getSupabase();

      if (statusBaru === "diterima") {
        const penawaran = stateRef.current.myPenawaran.find((p) => p.id === id);
        if (!penawaran) return;

        if (supabase) {
          const { data, error } = await supabase.rpc("terima_penawaran", {
            p_penawaran_id: id,
            p_harga_per_kg: hargaBaru ?? undefined,
          });
          if (error) throw new Error(pesanGalat(error) ?? "Penawaran gagal diterima.");

          const baris = (Array.isArray(data) ? data[0] : data) as
            | Database["public"]["Tables"]["orders"]["Row"]
            | null;
          if (!baris) throw new Error("Penawaran gagal diterima.");

          // Nama kedua pihak tidak ikut di baris yang dikembalikan RPC — ia
          // mengembalikan `orders` apa adanya, tanpa join ke `profiles`. Yang
          // sudah kita punya di penawaran dipakai lagi supaya kartunya tidak
          // sempat menampilkan "Pembeli" generik sebelum hidrasi berikutnya.
          const order: Order = {
            ...rowToOrder(baris as OrderRow),
            pembeli: penawaran.pembeli_nama ?? "Pembeli PANTAS",
            petani: stateRef.current.sesi?.nama ?? penawaran.petani_nama ?? "Petani PANTAS",
          };

          const updatedPenawaran: Penawaran = {
            ...penawaran,
            status: "diterima",
            harga_per_kg: order.harga_per_kg,
            order_id: order.id,
          };
          updateSingleDemoPenawaran(updatedPenawaran);
          updateSingleDemoOrder(order);
          setState((s) => ({
            ...s,
            myPenawaran: s.myPenawaran.map((p) => (p.id === id ? updatedPenawaran : p)),
            orders: s.orders.some((o) => o.id === order.id)
              ? s.orders.map((o) => (o.id === order.id ? { ...o, ...order } : o))
              : [order, ...s.orders],
          }));
          return;
        }

        // Mode demo (tanpa Supabase): pesanannya dirakit di sini dan disimpan
        // ke bucket demo bersama, yang dibaca kedua peran di peramban yang sama.
        const l =
          stateRef.current.myListings.find((x: Listing) => x.id === penawaran.listing_id) ??
          LISTINGS.find((x: Listing) => x.id === penawaran.listing_id);
        if (!l) throw new Error("Lot yang ditawar sudah tidak ada.");

        const harga = hargaBaru ?? penawaran.harga_per_kg;
        const order: Order = {
          id: `PNT-D${Date.now().toString(36).toUpperCase().slice(-5)}`,
          kode: randKode(),
          status: "dipesan",
          nama: l.nama,
          grade: l.grade,
          berat_kg: penawaran.kuantitas_kg,
          harga_per_kg: harga,
          total: penawaran.kuantitas_kg * harga,
          pembeli: penawaran.pembeli_nama ?? "Pembeli PANTAS",
          petani: stateRef.current.sesi?.nama ?? l.petani,
          pembeli_id: penawaran.pembeli_id,
          petani_id: penawaran.petani_id || stateRef.current.sesi?.userId,
          tanggal: new Date().toISOString(),
          komoditas: l.komoditas,
          listing_id: l.id,
        };
        const updatedPenawaran: Penawaran = {
          ...penawaran,
          status: "diterima",
          harga_per_kg: harga,
          order_id: order.id,
        };
        updateSingleDemoPenawaran(updatedPenawaran);
        updateSingleDemoOrder(order);
        setState((s) => ({
          ...s,
          myPenawaran: s.myPenawaran.map((p) => (p.id === id ? updatedPenawaran : p)),
          orders: [order, ...s.orders],
        }));
        return;
      }

      // Tolak dan tawar balik tetap satu tulisan biasa: tidak ada pesanan yang
      // lahir, jadi tidak ada yang perlu diatomkan.
      const targetPenawaran = stateRef.current.myPenawaran.find((p) => p.id === id);
      if (targetPenawaran) {
        updateSingleDemoPenawaran({
          ...targetPenawaran,
          status: statusBaru,
          harga_per_kg: hargaBaru ?? targetPenawaran.harga_per_kg,
        });
      }

      setState((s) => ({
        ...s,
        myPenawaran: s.myPenawaran.map((p) =>
          p.id === id
            ? { ...p, status: statusBaru, harga_per_kg: hargaBaru ?? p.harga_per_kg }
            : p,
        ),
      }));

      if (supabase) {
        const payload: Database["public"]["Tables"]["penawaran"]["Update"] = {
          status: statusBaru,
        };
        if (hargaBaru !== undefined) payload.harga_per_kg = hargaBaru;
        const { error } = await supabase.from("penawaran").update(payload).eq("id", id);
        if (error) throw new Error(pesanGalat(error) ?? "Balasan penawaran gagal dikirim.");
      }
    },
    []
  );

  const verifikasiSerahTerima = useCallback(
    (orderId: string, kode: string, beratAktualKg?: number): boolean => {
      // Berat yang tidak masuk akal diabaikan, bukan menggagalkan verifikasi:
      // kode yang benar tidak boleh ditolak gara-gara kolom timbangan.
      const berat =
        beratAktualKg != null && Number.isFinite(beratAktualKg) && beratAktualKg > 0
          ? beratAktualKg
          : undefined;
      let ok = false;
      let updatedOrder: Order | undefined;

      const clean = (x: string) => x.replace(/[\s-]/g, "").toUpperCase();

      setState((s) => {
        const target = s.orders.find((o) => o.id === orderId);
        if (!target) {
          const all = getStoredDemoOrders();
          const demoTarget = all.find((o) => o.id === orderId);
          if (
            demoTarget &&
            (demoTarget.status_kasus ?? "normal") === "normal" &&
            clean(kode) === clean(demoTarget.kode)
          ) {
            ok = true;
            updatedOrder = {
              ...demoTarget,
              status: "selesai",
              berat_aktual_kg: berat ?? demoTarget.berat_aktual_kg,
            };
          }
          return s;
        }
        if (
          (target.status_kasus ?? "normal") !== "normal" ||
          clean(kode) !== clean(target.kode)
        ) return s;
        ok = true;
        updatedOrder = {
          ...target,
          status: "selesai",
          berat_aktual_kg: berat ?? target.berat_aktual_kg,
        };
        return {
          ...s,
          orders: s.orders.map((o) =>
            o.id === orderId ? updatedOrder! : o,
          ),
        };
      });

      if (updatedOrder) {
        updateSingleDemoOrder(updatedOrder);
      }

      const sesi = stateRef.current.sesi;
      if (ok && isSupabaseConfigured && sesi?.userId) {
        // Pencocokan resmi terjadi di server (RPC security definer). Berat
        // aktual ikut ditulis di sana supaya ia tidak bisa berubah tanpa kode
        // yang benar — angka inilah yang mengkalibrasi faktor densitas (F-101).
        void getSupabase().then((supabase) =>
          supabase
            ?.rpc("verifikasi_serah_terima", {
              p_order_id: orderId,
              p_kode: kode,
              p_berat_aktual_kg: berat ?? undefined,
            })
            .then(({ data, error }) => {
              if (error || data !== true)
                console.warn(
                  "[pantas] verifikasi serah terima di DB gagal:",
                  error?.message ?? "kode ditolak server",
                );
            }),
        );
      }
      return ok;
    },
    [],
  );

  const setOrderStatus = useCallback((orderId: string, status: StatusPesanan) => {
    const targetDikenal =
      stateRef.current.orders.find((o) => o.id === orderId) ??
      getStoredDemoOrders().find((o) => o.id === orderId);
    if (targetDikenal && (targetDikenal.status_kasus ?? "normal") !== "normal") return;

    let updatedOrder: Order | undefined;
    setState((s) => {
      const nextOrders = s.orders.map((o) => {
        if (o.id === orderId) {
          updatedOrder = { ...o, status };
          return updatedOrder;
        }
        return o;
      });
      return { ...s, orders: nextOrders };
    });

    if (updatedOrder) {
      updateSingleDemoOrder(updatedOrder);
    } else {
      const all = getStoredDemoOrders();
      const demoTarget = all.find((o) => o.id === orderId);
      if (demoTarget) {
        updateSingleDemoOrder({ ...demoTarget, status });
      }
    }

    if (isSupabaseConfigured) {
      void getSupabase().then((supabase) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)?.from("orders").update({ status }).eq("id", orderId),
      );
    }
  }, []);

  const temukanOrderLokal = useCallback(
    (orderId: string) =>
      stateRef.current.orders.find((o) => o.id === orderId) ??
      getStoredDemoOrders().find((o) => o.id === orderId),
    [],
  );

  const ubahOrderLokal = useCallback(
    (orderId: string, patch: Partial<Order>): Order | undefined => {
      const target =
        stateRef.current.orders.find((o) => o.id === orderId) ??
        getStoredDemoOrders().find((o) => o.id === orderId);
      if (!target) return undefined;

      const updated = { ...target, ...patch };
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, ...patch } : o)),
      }));
      updateSingleDemoOrder(updated);
      return updated;
    },
    [],
  );

  const ajukanPembatalan = useCallback(
    async (orderId: string, alasan: string): Promise<HasilAksiTransaksi> => {
      const target = temukanOrderLokal(orderId);
      const aktor = stateRef.current.sesi?.userId;
      const { hasil, patch } = await import("./transaksi-actions").then((m) =>
        m.ajukanPembatalanOrder(target, aktor, alasan),
      );
      if (patch) ubahOrderLokal(orderId, patch);
      return hasil;
    },
    [temukanOrderLokal, ubahOrderLokal],
  );

  const tanggapiPembatalan = useCallback(
    async (orderId: string, setuju: boolean): Promise<HasilAksiTransaksi> => {
      const target = temukanOrderLokal(orderId);
      const aktor = stateRef.current.sesi?.userId;
      const { hasil, patch } = await import("./transaksi-actions").then((m) =>
        m.tanggapiPembatalanOrder(target, aktor, setuju),
      );
      if (patch) ubahOrderLokal(orderId, patch);
      return hasil;
    },
    [temukanOrderLokal, ubahOrderLokal],
  );

  const bukaSengketa = useCallback(
    async (orderId: string, alasan: string): Promise<HasilAksiTransaksi> => {
      const target = temukanOrderLokal(orderId);
      const aktor = stateRef.current.sesi?.userId;
      const { hasil, patch } = await import("./transaksi-actions").then((m) =>
        m.bukaSengketaOrder(target, aktor, alasan),
      );
      if (patch) ubahOrderLokal(orderId, patch);
      return hasil;
    },
    [temukanOrderLokal, ubahOrderLokal],
  );

  const tandaiPembayaran = useCallback(
    async (orderId: string): Promise<HasilAksiTransaksi> => {
      const target = temukanOrderLokal(orderId);
      const aktor = stateRef.current.sesi?.userId;
      const { hasil, patch } = await import("./transaksi-actions").then((m) =>
        m.tandaiPembayaranOrder(target, aktor),
      );
      if (patch) ubahOrderLokal(orderId, patch);
      return hasil;
    },
    [temukanOrderLokal, ubahOrderLokal],
  );

  const konfirmasiPembayaran = useCallback(
    async (orderId: string): Promise<HasilAksiTransaksi> => {
      const target = temukanOrderLokal(orderId);
      const aktor = stateRef.current.sesi?.userId;
      const { hasil, patch } = await import("./transaksi-actions").then((m) =>
        m.konfirmasiPembayaranOrder(target, aktor),
      );
      if (patch) ubahOrderLokal(orderId, patch);
      return hasil;
    },
    [temukanOrderLokal, ubahOrderLokal],
  );

  const updateListing = useCallback((id: string, updates: Partial<Listing>) => {
    setState((s) => ({
      ...s,
      myListings: s.myListings.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));

    if (isSupabaseConfigured) {
      void (async () => {
        const supabase = await getSupabase();
        if (!supabase) return;
        const payload: Partial<Database["public"]["Tables"]["listings"]["Update"]> = {};
        if (updates.nama !== undefined) payload.nama = updates.nama;
        if (updates.berat_kg !== undefined) payload.berat_kg = updates.berat_kg;
        if (updates.harga_per_kg !== undefined) payload.harga_per_kg = updates.harga_per_kg;
        if (updates.stok_kg !== undefined) payload.stok_kg = updates.stok_kg;
        if (updates.satuan !== undefined) payload.satuan = updates.satuan;
        if (updates.status !== undefined) {
          payload.status =
            updates.status === "dijeda"
              ? "ditutup"
              : updates.status === "terjual"
                ? "habis"
                : updates.status;
        }
        if (Object.keys(payload).length > 0) {
          const { error } = await supabase.from("listings").update(payload).eq("id", id);
          if (error) console.warn("[pantas] update listing di DB gagal:", error.message);
        }
      })();
    }
  }, []);

  /**
   * `lastScanId` dan `lastGradingId` ikut dikosongkan bila menunjuk pindaian
   * yang dihapus: keduanya dipakai layar hasil dan penerbitan listing untuk
   * menunjuk laporan mutu, dan menunjuk ke arsip yang sudah tidak ada
   * menghasilkan listing tanpa sertifikat atau layar hasil yang menilai ulang
   * ketiadaan foto.
   */
  const hapusScan = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      scans: s.scans.filter((x) => x.id !== id),
      lastScanId: s.lastScanId === id ? null : s.lastScanId,
      lastGradingId: s.lastGradingId === id ? null : s.lastGradingId,
    }));
  }, []);

  const deleteListing = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      myListings: s.myListings.filter((l) => l.id !== id),
    }));

    if (isSupabaseConfigured) {
      void (async () => {
        const supabase = await getSupabase();
        if (!supabase) return;
        // Coba hapus baris. Jika listing memiliki riwayat pesanan/penawaran aktif,
        // trigger cegah_hapus_listing_bertransaksi akan menolak hard delete (23503).
        // Fallback otomatis ke soft-delete ("ditutup") agar data integritas transaksi terlindungi.
        const { error } = await supabase.from("listings").delete().eq("id", id);
        if (error) {
          await supabase.from("listings").update({ status: "ditutup" }).eq("id", id);
        }
      })();
    }
  }, []);

  const toggleListingStatus = useCallback((id: string, status: "tayang" | "dijeda" | "terjual") => {
    setState((s) => ({
      ...s,
      myListings: s.myListings.map((l) => (l.id === id ? { ...l, status } : l)),
    }));

    if (isSupabaseConfigured) {
      void (async () => {
        const supabase = await getSupabase();
        if (!supabase) return;
        const dbStatus = status === "dijeda" ? "ditutup" : status === "terjual" ? "habis" : status;
        const { error } = await supabase.from("listings").update({ status: dbStatus }).eq("id", id);
        if (error) console.warn("[pantas] toggle status listing di DB gagal:", error.message);
      })();
    }
  }, []);

  const completeTour = useCallback(async () => {
    setState((s) => ({
      ...s,
      sesi: s.sesi ? { ...s.sesi, turSelesai: true } : null,
    }));

    const sesi = stateRef.current.sesi;
    const supabase = await getSupabase();
    if (supabase && sesi?.userId) {
      await supabase
        .from("profiles")
        .update({ tur_selesai: true })
        .eq("id", sesi.userId);
    }
  }, []);

  const restartTour = useCallback(() => {
    setState((s) => ({
      ...s,
      sesi: s.sesi ? { ...s.sesi, turSelesai: false } : null,
    }));
  }, []);

  /**
   * Antrekan satu kabar dari seberang.
   *
   * Dibatasi lima: yang keenam berarti pengguna sedang tidak melihat layarnya,
   * dan menumpuk antrean sampai panjang hanya memaksa dia menutup kartu satu
   * per satu sebelum bisa memakai aplikasinya lagi. Yang terbaru menang.
   */
  const dorongPeristiwa = useCallback((e: Peristiwa) => {
    setState((s) => {
      /*
       * Satu kabar per kejadian, walau sumbernya dua.
       *
       * Perubahan yang sama bisa tiba dua kali: sekali lewat kanal realtime,
       * sekali lagi lewat `segarkan` yang berjalan tepat setelahnya. Keduanya
       * benar dan keduanya dibutuhkan — yang tidak boleh adalah pengguna
       * menutup kartu yang sama dua kali.
       */
      const kunci = (x: Peristiwa) => `${x.jenis}:${x.orderId ?? x.nama}`;
      const kembar = s.peristiwa.some(
        (x) => kunci(x) === kunci(e) && e.waktu - x.waktu < 10_000,
      );
      if (kembar) return s;
      return { ...s, peristiwa: [...s.peristiwa, e].slice(-5) };
    });
  }, []);

  const tutupPeristiwa = useCallback((id: string) => {
    setState((s) => ({ ...s, peristiwa: s.peristiwa.filter((e) => e.id !== id) }));
  }, []);

  const simpanLokasiKebun = useCallback(
    async (lat: number, lng: number, lokasi?: string): Promise<void> => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Koordinat tidak valid.");
      }

      // Lot yang sudah tayang ikut pindah: `jarak_km` di state lokal dihitung
      // dari koordinat lot, dan tanpa pembaruan ini layar listing petani masih
      // menulis "lokasi belum diketahui" sampai hidrasi berikutnya.
      setState((s) => ({
        ...s,
        sesi: s.sesi ? { ...s.sesi, lokasi: lokasi ?? s.sesi.lokasi } : null,
        myListings: s.myListings.map((l) => ({ ...l, lat, lng })),
      }));

      const uid = stateRef.current.sesi?.userId;
      const supabase = await getSupabase();
      if (!supabase || !uid) return;

      const payload: Database["public"]["Tables"]["profiles"]["Update"] = {
        lat,
        lng,
      };
      if (lokasi) payload.lokasi = lokasi;

      const { error } = await supabase.from("profiles").update(payload).eq("id", uid);
      if (error) throw new Error(pesanGalat(error) ?? "Lokasi kebun gagal disimpan.");
    },
    [],
  );

  const refreshPesanBelumDibaca = useCallback(async () => {
    const uid = stateRef.current.sesi?.userId;
    const hitungan = uid
      ? await hitungPesanBelumDibaca(uid)
      : { total: 0, pesanan: 0, penawaran: 0 };
    setState((s) =>
      s.pesanBelumDibaca.total === hitungan.total &&
        s.pesanBelumDibaca.pesanan === hitungan.pesanan &&
        s.pesanBelumDibaca.penawaran === hitungan.penawaran
        ? s
        : { ...s, pesanBelumDibaca: hitungan },
    );
  }, []);

  const refreshAntreanPindai = useCallback(async () => {
    const n = await hitungAntrean();
    setState((s) => (s.antreanPindai === n ? s : { ...s, antreanPindai: n }));
  }, []);

  // Hitung sekali per sesi, lalu ikuti INSERT realtime. Dipasang di provider
  // supaya badge tetap bertambah saat pengguna berada di layar mana pun.
  const uidSesi = state.sesi?.userId;
  useEffect(() => {
    // Tanpa sesi tidak ada yang perlu dihitung; `logout()` sudah mengembalikan
    // seluruh state ke INITIAL, jadi badge-nya ikut nol di sana.
    if (!uidSesi) return;
    let batal = false;
    void (async () => {
      const hitungan = await hitungPesanBelumDibaca(uidSesi);
      if (!batal) setState((s) => ({ ...s, pesanBelumDibaca: hitungan }));
    })();
    const lepas = subscribePesanMasuk(uidSesi, (pesan) => {
      setState((s) => {
        const b = s.pesanBelumDibaca;
        const keOrder = Boolean(pesan.order_id);
        return {
          ...s,
          pesanBelumDibaca: {
            total: b.total + 1,
            pesanan: b.pesanan + (keOrder ? 1 : 0),
            penawaran: b.penawaran + (keOrder ? 0 : 1),
          },
        };
      });
    });
    return () => {
      batal = true;
      lepas();
    };
  }, [uidSesi]);

  /**
   * Pesanan mengikuti perubahan di basis data, bukan hanya keadaan saat aplikasi
   * dibuka.
   *
   * Hidrasi di atas berjalan sekali per pengguna dan dijaga `hydratedFor`, jadi
   * status yang berubah di ponsel lawan transaksi tidak pernah sampai — persis
   * mengapa satu layar bisa menampilkan "Pesanan Selesai" sementara layar
   * seberangnya masih "Menunggu Konfirmasi" sampai dimuat ulang paksa.
   */
  useEffect(() => {
    if (!uidSesi) return;
    let batal = false;

    /*
     * Ambil ulang pesanan dan penawaran milik pengguna ini.
     *
     * Realtime hanya mengabarkan perubahan yang terjadi selagi kanalnya hidup.
     * Apa pun yang lewat sebelum itu — saat soket belum tersambung, saat sinyal
     * hilang di kebun, saat ponsel terkunci — tidak akan pernah datang sendiri.
     * Fungsi inilah yang menyusulnya, dan ia dipanggil tiap kali kanal hidup
     * lagi serta tiap kali tab kembali terlihat. Ia yang menggantikan kebiasaan
     * memuat ulang halaman secara manual.
     */
    const segarkan = async () => {
      const supabase = await getSupabase();
      if (!supabase || batal) return;

      const [pesananRes, penawaranRes] = await Promise.all([
        supabase
          .from("orders")
          .select(ORDER_SELECT)
          .order("created_at", { ascending: false }),
        supabase
          .from("penawaran")
          .select(PENAWARAN_SELECT)
          .or(`petani_id.eq.${uidSesi},pembeli_id.eq.${uidSesi}`)
          .order("created_at", { ascending: false }),
      ]);
      if (batal) return;

      const pesananBaru = pesananRes.error
        ? null
        : ((pesananRes.data ?? []) as unknown as OrderRow[]).map(rowToOrder);
      const penawaranBaru = penawaranRes.error
        ? null
        : ((penawaranRes.data ?? []) as unknown as PenawaranRow[]).map(
            rowToPenawaran,
          );

      /*
       * Selisihnya dihitung terhadap `stateRef`, bukan di dalam updater
       * `setState`.
       *
       * Updater dijalankan React saat render — bukan saat dipanggil — dan di
       * mode ketat bisa dijalankan dua kali. Mengumpulkan peristiwa di dalamnya
       * berarti daftarnya masih kosong pada baris yang membacanya, lalu terisi
       * ganda di render berikutnya: kabar yang hilang dan kabar yang dobel,
       * dari satu kekeliruan yang sama.
       */
      const sebelumnya = stateRef.current;
      const peran = sebelumnya.sesi?.role;
      const peristiwa: Peristiwa[] = [];

      if (pesananBaru) {
        const lama = new Map(sebelumnya.orders.map((o) => [o.id, o]));
        for (const o of pesananBaru) {
          const sebelum = lama.get(o.id);
          if (!sebelum) peristiwa.push(peristiwaPesananBaru(o, peran));
          else if (sebelum.status !== o.status)
            peristiwa.push(peristiwaStatusPesanan(o, peran));
        }
      }

      if (penawaranBaru) {
        const lama = new Map(sebelumnya.myPenawaran.map((p) => [p.id, p]));
        for (const p of penawaranBaru) {
          const sebelum = lama.get(p.id);
          if (!sebelum) {
            if (peran === "petani") peristiwa.push(peristiwaPenawaranBaru(p));
          } else if (sebelum.status !== p.status) {
            const e = peristiwaPenawaranBerubah(p, peran);
            if (e) peristiwa.push(e);
          }
        }
      }

      setState((s) => {
        let next = s;
        if (pesananBaru) {
          // Pesanan lokal yang belum ada di basis data (mode demo) tetap tinggal.
          const gabung = new Map(pesananBaru.map((o) => [o.id, o]));
          for (const o of s.orders) if (!gabung.has(o.id)) gabung.set(o.id, o);
          const orders = Array.from(gabung.values());
          saveStoredDemoOrders(orders);
          next = { ...next, orders };
        }
        if (penawaranBaru) next = { ...next, myPenawaran: penawaranBaru };
        return next;
      });

      for (const e of peristiwa) dorongPeristiwa(e);
    };

    const terapkanPesanan = (baris: Record<string, unknown>) => {
      const id = baris.id as string;
      const dikenal = stateRef.current.orders.find((o) => o.id === id);

      if (dikenal) {
        const statusBaru = baris.status as StatusPesanan;
        // Baris realtime tidak membawa nama kedua pihak — itu hasil join. Untuk
        // pesanan yang sudah ada di layar, hanya kolomnya sendiri yang ditimpa
        // supaya nama yang sudah benar tidak berubah jadi "Pembeli"/"Petani".
        const updatedOrder: Order = {
          ...dikenal,
          status: statusBaru,
          berat_aktual_kg:
            baris.berat_aktual_kg == null
              ? dikenal.berat_aktual_kg
              : Number(baris.berat_aktual_kg),
        };
        setState((s) => ({
          ...s,
          orders: s.orders.map((o) => (o.id === id ? updatedOrder : o)),
        }));
        updateSingleDemoOrder(updatedOrder);
        // Hanya perubahan yang datang dari seberang yang diumumkan. Kalau
        // status di layar sudah sama, kitalah yang barusan menulisnya.
        if (dikenal.status !== statusBaru) {
          dorongPeristiwa(
            peristiwaStatusPesanan(updatedOrder, stateRef.current.sesi?.role),
          );
        }
        return;
      }

      // Pesanan yang belum pernah dilihat klien ini — pembeli yang penawarannya
      // baru saja diterima, misalnya. Baris utuhnya diambil sekali agar namanya
      // ikut.
      void (async () => {
        const supabase = await getSupabase();
        if (!supabase || batal) return;
        const { data } = await supabase
          .from("orders")
          .select(ORDER_SELECT)
          .eq("id", id)
          .maybeSingle();
        if (!data || batal) return;
        const order = rowToOrder(data as unknown as OrderRow);
        // Diperiksa terhadap `stateRef`, bukan di dalam updater: nilai yang
        // ditulis di dalam updater belum ada saat baris sesudahnya berjalan.
        const sudahAda = stateRef.current.orders.some((o) => o.id === order.id);
        setState((s) =>
          s.orders.some((o) => o.id === order.id)
            ? s
            : { ...s, orders: [order, ...s.orders] },
        );
        updateSingleDemoOrder(order);
        if (!sudahAda) {
          dorongPeristiwa(peristiwaPesananBaru(order, stateRef.current.sesi?.role));
        }
      })();
    };

    const terapkanPenawaran = (baris: Record<string, unknown>) => {
      const id = baris.id as string;
      const dikenal = stateRef.current.myPenawaran.find((p) => p.id === id);

      if (dikenal) {
        const statusBaru = baris.status as Penawaran["status"];
        const diperbarui: Penawaran = {
          ...dikenal,
          status: statusBaru,
          harga_per_kg: Number(baris.harga_per_kg ?? dikenal.harga_per_kg),
          order_id: (baris.order_id as string | null) ?? dikenal.order_id ?? null,
        };
        setState((s) => ({
          ...s,
          myPenawaran: s.myPenawaran.map((p) => (p.id === id ? diperbarui : p)),
        }));
        if (dikenal.status !== statusBaru) {
          const e = peristiwaPenawaranBerubah(
            diperbarui,
            stateRef.current.sesi?.role,
          );
          if (e) dorongPeristiwa(e);
        }
        return;
      }

      void (async () => {
        const supabase = await getSupabase();
        if (!supabase || batal) return;
        const { data } = await supabase
          .from("penawaran")
          .select(PENAWARAN_SELECT)
          .eq("id", id)
          .maybeSingle();
        if (!data || batal) return;
        const penawaran = rowToPenawaran(data as unknown as PenawaranRow);
        const sudahAda = stateRef.current.myPenawaran.some(
          (p) => p.id === penawaran.id,
        );
        setState((s) =>
          s.myPenawaran.some((p) => p.id === penawaran.id)
            ? s
            : { ...s, myPenawaran: [penawaran, ...s.myPenawaran] },
        );
        if (!sudahAda && stateRef.current.sesi?.role === "petani") {
          dorongPeristiwa(peristiwaPenawaranBaru(penawaran));
        }
      })();
    };

    /*
     * Satu status untuk dua kanal, dan yang ditampilkan adalah yang terburuk
     * dari keduanya. Mengaku "hidup" selagi salah satunya putus persis
     * kebohongan yang membuat orang percaya pada layar yang sudah basi.
     */
    const status: Record<string, StatusLangganan> = {};
    const setStatus = (nama: string) => (nilaiBaru: StatusLangganan) => {
      status[nama] = nilaiBaru;
      const semua = Object.values(status);
      const nilai: StatusLangganan = semua.includes("terputus")
        ? "terputus"
        : semua.includes("menyambung")
          ? "menyambung"
          : "hidup";
      setState((st) =>
        st.statusLangganan === nilai ? st : { ...st, statusLangganan: nilai },
      );
    };

    // Satu `segarkan` untuk dua kanal, ditahan sebentar supaya dua kanal yang
    // hidup berbarengan tidak mengambil ulang dua kali.
    let tundaSegar: ReturnType<typeof setTimeout> | null = null;
    const segarkanTertahan = () => {
      if (tundaSegar) clearTimeout(tundaSegar);
      tundaSegar = setTimeout(() => {
        tundaSegar = null;
        void segarkan();
      }, 250);
    };

    const lepasPesanan = langgananBaris({
      nama: "pesanan",
      tabel: "orders",
      uid: uidSesi,
      kolom: ["pembeli_id", "petani_id"],
      onUbah: terapkanPesanan,
      onSegar: segarkanTertahan,
      onStatus: setStatus("pesanan"),
    });

    const lepasPenawaran = langgananBaris({
      nama: "penawaran",
      tabel: "penawaran",
      uid: uidSesi,
      kolom: ["pembeli_id", "petani_id"],
      onUbah: terapkanPenawaran,
      onSegar: segarkanTertahan,
      onStatus: setStatus("penawaran"),
    });

    return () => {
      batal = true;
      if (tundaSegar) clearTimeout(tundaSegar);
      lepasPesanan();
      lepasPenawaran();
    };
  }, [uidSesi, dorongPeristiwa]);

  const value = useMemo(
    () => ({
      ...state,
      ready,
      masuk,
      daftar,
      kirimResetPassword,
      gantiPassword,
      logout,
      setLastCapture,
      setLastCaptures,
      addScan,
      hapusScan,
      publishListings,
      updateListing,
      deleteListing,
      toggleListingStatus,
      setInquiryQty,
      clearInquiry,
      buatPenawaran,
      balasPenawaran,
      createOrder,
      verifikasiSerahTerima,
      setOrderStatus,
      ajukanPembatalan,
      tanggapiPembatalan,
      bukaSengketa,
      tandaiPembayaran,
      konfirmasiPembayaran,
      refreshPesanBelumDibaca,
      refreshAntreanPindai,
      completeTour,
      restartTour,
      simpanLokasiKebun,
      tutupPeristiwa,
    }),
    [
      state,
      ready,
      masuk,
      daftar,
      kirimResetPassword,
      gantiPassword,
      logout,
      setLastCapture,
      setLastCaptures,
      addScan,
      hapusScan,
      publishListings,
      updateListing,
      deleteListing,
      toggleListingStatus,
      setInquiryQty,
      clearInquiry,
      buatPenawaran,
      balasPenawaran,
      createOrder,
      verifikasiSerahTerima,
      setOrderStatus,
      ajukanPembatalan,
      tanggapiPembatalan,
      bukaSengketa,
      tandaiPembayaran,
      konfirmasiPembayaran,
      refreshPesanBelumDibaca,
      refreshAntreanPindai,
      completeTour,
      restartTour,
      simpanLokasiKebun,
      tutupPeristiwa,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
