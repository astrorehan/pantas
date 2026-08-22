/**
 * Indeks dan pencocokan palet perintah (F-84).
 *
 * Lapisan ini sengaja murni: `bangunPerintah` hanya memetakan state jadi daftar
 * perintah, dan `saringPerintah` hanya memberi peringkat. Efek sampingnya —
 * navigasi, ganti tema, keluar — dieksekusi komponen, sehingga peringkat hasil
 * pencarian bisa diuji tanpa DOM (lihat `palet-perintah.test.ts`).
 */

import { KOMODITAS } from "./komoditas.generated";
import type { Role } from "./types";

/** Aksi yang tidak berupa navigasi; komponen yang menerjemahkannya. */
export type AksiPerintah = "tema" | "keluar" | "pintasan" | "pindai";

export type KelompokPerintah =
  | "aksi"
  | "rute"
  | "komoditas"
  | "listing"
  | "pesanan";

export const LABEL_KELOMPOK: Record<KelompokPerintah, string> = {
  aksi: "Aksi cepat",
  rute: "Halaman",
  komoditas: "Komoditas",
  listing: "Listing saya",
  pesanan: "Pesanan",
};

export interface Perintah {
  id: string;
  label: string;
  /** Baris kedua: kode pesanan, harga listing, kelompok komoditas. */
  keterangan?: string;
  kelompok: KelompokPerintah;
  /**
   * Kata yang ikut dicocokkan tapi tidak ditampilkan — "gelap" harus menemukan
   * "Ganti tema", dan nama komoditas dalam bahasa engine ("chili_rawit") harus
   * menemukan labelnya.
   */
  alias?: string[];
  href?: string;
  aksi?: AksiPerintah;
}

/** Listing/pesanan diambil seperlunya saja supaya lapisan ini tidak ikut memuat tipe UI. */
export interface ListingRingkas {
  id: string;
  nama: string;
  grade: string;
  harga_per_kg: number;
}

export interface PesananRingkas {
  id: string;
  kode: string;
  nama: string;
  status: string;
}

export interface SumberPerintah {
  role: Role;
  listings: ListingRingkas[];
  pesanan: PesananRingkas[];
}

/**
 * Route yang diindeks per peran.
 *
 * Bukan `NAV` dari nav-config: navigasi hanya memuat tujuan tingkat atas,
 * sedangkan palet justru berguna untuk layar dalam yang tidak punya tab —
 * /petani/harga, /petani/riwayat/banding, /petani/listing-tayang.
 */
const RUTE: Record<Role, { href: string; label: string; alias?: string[] }[]> = {
  petani: [
    { href: "/petani", label: "Beranda", alias: ["dashboard", "ringkasan"] },
    { href: "/petani/pindai", label: "Pindai panen", alias: ["kamera", "grading", "foto"] },
    { href: "/petani/hasil", label: "Hasil pindaian terakhir", alias: ["laporan", "grading"] },
    { href: "/petani/harga", label: "Rekomendasi harga", alias: ["harga", "kalkulator"] },
    { href: "/petani/listing", label: "Listing saya", alias: ["lot", "jual"] },
    { href: "/petani/listing-tayang", label: "Terbitkan listing", alias: ["publish", "tayang"] },
    { href: "/petani/riwayat", label: "Riwayat pindaian", alias: ["histori"] },
    { href: "/petani/riwayat/banding", label: "Bandingkan pindaian", alias: ["compare", "banding"] },
    { href: "/petani/logistik", label: "Logistik & pengiriman", alias: ["rute", "armada"] },
    { href: "/petani/penawaran", label: "Penawaran masuk", alias: ["tawar", "nego"] },
    { href: "/petani/pesanan", label: "Pesanan", alias: ["order", "transaksi"] },
    { href: "/petani/dampak", label: "Dampak & emisi", alias: ["co2", "karbon", "food loss"] },
    { href: "/petani/akun", label: "Akun & pengaturan", alias: ["profil", "setelan"] },
  ],
  pembeli: [
    { href: "/pembeli", label: "Katalog panen", alias: ["beranda", "cari", "belanja"] },
    { href: "/pembeli/peta", label: "Peta sebaran petani", alias: ["lokasi", "map"] },
    { href: "/pembeli/inquiry", label: "Keranjang inquiry", alias: ["keranjang", "permintaan"] },
    { href: "/pembeli/pesanan", label: "Pesanan & penawaran", alias: ["order", "tawar"] },
    { href: "/pembeli/akun", label: "Akun & pengaturan", alias: ["profil", "setelan"] },
  ],
  admin: [
    { href: "/admin", label: "Ringkasan konsol", alias: ["dashboard"] },
    { href: "/admin/moderasi", label: "Moderasi listing", alias: ["sembunyikan", "takedown", "laporan"] },
    { href: "/admin/audit", label: "Jejak audit", alias: ["log", "riwayat tindakan"] },
    { href: "/admin/rute", label: "Konsolidasi rute", alias: ["logistik", "armada"] },
    { href: "/demo", label: "Portal demo", alias: ["juri", "presentasi"] },
  ],
};

/** Halaman publik yang relevan untuk ketiga peran. */
const RUTE_UMUM = [
  { href: "/tentang", label: "Tentang PANTAS", alias: ["about", "profil produk"] },
  { href: "/tentang/model", label: "Kartu penjelasan model AI", alias: ["model card", "akurasi"] },
];

/** Layar pesanan milik peran aktif; admin tidak punya, jadi tidak diindeks. */
export const RUTE_PESANAN: Record<Role, string | null> = {
  petani: "/petani/pesanan",
  pembeli: "/pembeli/pesanan",
  admin: null,
};

export function bangunPerintah({
  role,
  listings,
  pesanan,
}: SumberPerintah): Perintah[] {
  const out: Perintah[] = [];

  // Aksi cepat lebih dulu: dengan kotak pencarian kosong, inilah yang paling
  // sering dicari, dan urutannya menentukan apa yang terlihat tanpa mengetik.
  if (role === "petani") {
    out.push({
      id: "aksi:pindai",
      label: "Pindai baru",
      keterangan: "Buka kamera dan mulai grading batch",
      kelompok: "aksi",
      alias: ["scan", "kamera", "foto", "grading"],
      aksi: "pindai",
    });
  }
  out.push(
    {
      id: "aksi:tema",
      label: "Ganti tema",
      keterangan: "Terang, gelap, atau ikut sistem",
      kelompok: "aksi",
      alias: ["gelap", "terang", "dark", "light", "mode"],
      aksi: "tema",
    },
    {
      id: "aksi:pintasan",
      label: "Daftar pintasan keyboard",
      keterangan: "Tekan ?",
      kelompok: "aksi",
      alias: ["shortcut", "keyboard", "bantuan"],
      aksi: "pintasan",
    },
    {
      id: "aksi:keluar",
      label: "Keluar",
      keterangan: "Akhiri sesi dan kembali ke halaman masuk",
      kelompok: "aksi",
      alias: ["logout", "sign out"],
      aksi: "keluar",
    },
  );

  for (const r of [...RUTE[role], ...RUTE_UMUM]) {
    out.push({
      id: `rute:${r.href}`,
      label: r.label,
      keterangan: r.href,
      kelompok: "rute",
      alias: r.alias,
      href: r.href,
    });
  }

  // Komoditas hanya berarti bila ada layar yang menerimanya: petani memakainya
  // untuk memilih target pindaian, pembeli untuk memfilter katalog. Konsol
  // admin tidak punya keduanya.
  if (role === "petani" || role === "pembeli") {
    for (const k of KOMODITAS) {
      out.push({
        id: `komoditas:${k.id}`,
        label: k.label,
        keterangan:
          role === "petani"
            ? `Pindai ${k.label.toLowerCase()}`
            : `Cari ${k.label.toLowerCase()} di katalog`,
        kelompok: "komoditas",
        alias: [k.id, k.kelompok],
        href:
          role === "petani"
            ? `/petani/pindai?komoditas=${k.id}`
            : `/pembeli?q=${encodeURIComponent(k.label)}`,
      });
    }
  }

  if (role === "petani") {
    for (const l of listings) {
      out.push({
        id: `listing:${l.id}`,
        label: l.nama,
        keterangan: `Grade ${l.grade} • Rp${l.harga_per_kg.toLocaleString("id-ID")}/kg • ${l.id}`,
        kelompok: "listing",
        alias: [l.id, `grade ${l.grade}`],
        href: `/petani/listing?fokus=${encodeURIComponent(l.id)}`,
      });
    }
  }

  const rutePesanan = RUTE_PESANAN[role];
  if (rutePesanan) {
    for (const p of pesanan) {
      out.push({
        id: `pesanan:${p.id}`,
        label: p.kode,
        keterangan: `${p.nama} • ${p.status.replace(/_/g, " ")}`,
        kelompok: "pesanan",
        alias: [p.nama, p.status],
        href: `${rutePesanan}/${p.id}`,
      });
    }
  }

  return out;
}

/* --------------------------------------------------------------- Pencocokan */

function normalkan(teks: string): string {
  return teks
    .toLowerCase()
    .normalize("NFD")
    // Tanda diakritik dibuang supaya "cabe" tetap menemukan entri yang ditulis
    // dengan aksen dari sumber lain.
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/**
 * Skor satu kandidat terhadap kueri, makin besar makin cocok; 0 berarti tidak
 * cocok sama sekali.
 *
 * Peringkatnya bertingkat, bukan satu heuristik samar: label yang diawali kueri
 * selalu mengalahkan yang hanya memuatnya di tengah, dan pencocokan longgar
 * (subsequence, "gtm" → "Ganti tema") ditaruh paling bawah supaya ia menambah
 * jangkauan tanpa pernah menggeser hasil yang jelas.
 */
function skor(teks: string, kueri: string): number {
  const t = normalkan(teks);
  if (!t) return 0;
  if (t === kueri) return 100;
  if (t.startsWith(kueri)) return 80;
  // Awal kata: "har" harus menemukan "Rekomendasi harga".
  if (t.split(/[\s\-/•·]+/).some((kata) => kata.startsWith(kueri))) return 60;
  if (t.includes(kueri)) return 40;

  let i = 0;
  for (const huruf of t) {
    if (huruf === kueri[i]) i++;
    if (i === kueri.length) return 20;
  }
  return 0;
}

/** Skor gabungan label + keterangan + alias, dengan bobot menurun. */
export function skorPerintah(p: Perintah, kueri: string): number {
  const q = normalkan(kueri);
  if (!q) return 1;

  let terbaik = skor(p.label, q);
  for (const a of p.alias ?? []) {
    // Alias tidak ditampilkan, jadi kecocokannya tidak boleh terasa sekuat
    // kecocokan pada label yang benar-benar dibaca pengguna.
    terbaik = Math.max(terbaik, skor(a, q) - 5);
  }
  if (p.keterangan) terbaik = Math.max(terbaik, skor(p.keterangan, q) - 10);
  return Math.max(terbaik, 0);
}

/**
 * Daftar hasil terurut. Urutan indeks dipertahankan untuk skor sama (sort
 * stabil), sehingga hasil tidak berpindah-pindah saat pengguna mengetik.
 */
export function saringPerintah(
  daftar: Perintah[],
  kueri: string,
  batas = 40,
): Perintah[] {
  const q = normalkan(kueri);
  if (!q) return daftar.slice(0, batas);

  return daftar
    .map((p, i) => ({ p, i, s: skorPerintah(p, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, batas)
    .map((x) => x.p);
}

/** Hasil dikelompokkan untuk render, tanpa mengubah urutan peringkat. */
export function kelompokkan(
  hasil: Perintah[],
): { kelompok: KelompokPerintah; items: Perintah[] }[] {
  const urut: KelompokPerintah[] = [
    "aksi",
    "rute",
    "komoditas",
    "listing",
    "pesanan",
  ];
  return urut
    .map((kelompok) => ({
      kelompok,
      items: hasil.filter((p) => p.kelompok === kelompok),
    }))
    .filter((g) => g.items.length > 0);
}
