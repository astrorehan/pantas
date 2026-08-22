/**
 * Aturan siapa boleh menilai siapa, dan ringkasan rating (F-42).
 *
 * Murni dan tanpa DOM supaya bisa diuji langsung: aturannya harus sama persis
 * dengan kebijakan RLS di `supabase/migrations/0011_ulasan_pihak_pesanan.sql`.
 * Kalau keduanya berbeda, tombol "Beri Ulasan" akan tampil lalu ditolak basis
 * data — kegagalan yang paling membingungkan bagi pengguna.
 */

import type { Ulasan } from "./types";

/** Bagian pesanan yang menentukan hak menilai; sengaja bukan tipe Order penuh. */
export interface PesananUntukUlasan {
  id: string;
  status: string;
  petani_id?: string;
  pembeli_id?: string;
  petani: string;
  pembeli: string;
}

export interface LawanTransaksi {
  id: string;
  nama: string;
  /** Peran lawan, dipakai untuk label tombol. */
  peran: "petani" | "pembeli";
}

/**
 * Pihak seberang bagi `uid` pada sebuah pesanan, atau null bila `uid` bukan
 * salah satu pihaknya.
 */
export function lawanTransaksi(
  pesanan: PesananUntukUlasan,
  uid: string | undefined,
): LawanTransaksi | null {
  if (!uid) return null;
  if (pesanan.petani_id && uid === pesanan.petani_id) {
    return pesanan.pembeli_id
      ? { id: pesanan.pembeli_id, nama: pesanan.pembeli, peran: "pembeli" }
      : null;
  }
  if (pesanan.pembeli_id && uid === pesanan.pembeli_id) {
    return pesanan.petani_id
      ? { id: pesanan.petani_id, nama: pesanan.petani, peran: "petani" }
      : null;
  }
  return null;
}

export type AlasanTolak =
  | "belum_selesai"
  | "bukan_pihak"
  | "sudah_menilai"
  | null;

/**
 * Boleh menilai bila pesanan sudah `selesai`, `uid` adalah salah satu pihaknya,
 * dan ia belum pernah menilai pesanan itu (tabel `ulasan` menjaga keunikan
 * pasangan order + penilai).
 */
export function bolehMenilai(
  pesanan: PesananUntukUlasan,
  uid: string | undefined,
  ulasanPesanan: Pick<Ulasan, "penilai_id">[],
): { boleh: boolean; alasan: AlasanTolak } {
  if (!lawanTransaksi(pesanan, uid)) return { boleh: false, alasan: "bukan_pihak" };
  if (pesanan.status !== "selesai") return { boleh: false, alasan: "belum_selesai" };
  if (ulasanPesanan.some((u) => u.penilai_id === uid))
    return { boleh: false, alasan: "sudah_menilai" };
  return { boleh: true, alasan: null };
}

export interface RingkasanUlasan {
  /** Rata-rata dibulatkan satu desimal, sama dengan trigger `profiles.rating`. */
  rata: number;
  jumlah: number;
}

/**
 * Ringkasan yang ditampilkan pada profil. Nol ulasan menghasilkan `rata: 0`,
 * bukan 5: profil baru yang mengaku bintang lima adalah klaim yang tidak
 * ditopang satu transaksi pun.
 */
export function ringkasUlasan(daftar: Pick<Ulasan, "bintang">[]): RingkasanUlasan {
  if (daftar.length === 0) return { rata: 0, jumlah: 0 };
  const total = daftar.reduce((n, u) => n + u.bintang, 0);
  return {
    rata: Math.round((total / daftar.length) * 10) / 10,
    jumlah: daftar.length,
  };
}
