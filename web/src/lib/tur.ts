/**
 * Isi dan geometri tur berpandu (F-04).
 *
 * Dipisahkan dari komponennya karena dua hal di sini layak diuji tanpa DOM:
 * daftar langkah per peran (tur pembeli tidak boleh menunjuk layar petani) dan
 * penempatan tooltip terhadap tepi layar — bagian yang paling mudah rusak diam
 * -diam saat langkah baru ditambahkan.
 */

import type { Role } from "./types";
export interface LangkahTur {
  id: string;
  judul: string;
  deskripsi: string;
  judulKey?: string;
  deskripsiKey?: string;
  /**
   * Kandidat selector target, dicoba berurutan; yang pertama terlihat dipakai.
   * Fallback bukan kemewahan: kartu hasil terakhir belum ada pada akun yang
   * belum pernah memindai, dan sejak nav petani diringkas jadi lima tujuan,
   * beberapa layar hanya punya jangkar di layar tempat ia kini bersarang —
   * Dampak di Akun, misalnya. Langkah tanpa target yang terlihat dilewati.
   */
  target: string[];
}

/**
 * Lima langkah petani persis seperti PRD §EP-A F-04. Peran lain memakai
 * kerangka yang sama dengan tujuan yang memang ada di layarnya — tur yang
 * menunjuk tombol milik peran lain lebih buruk daripada tur yang lebih pendek.
 */
const LANGKAH: Record<Role, LangkahTur[]> = {
  petani: [
    {
      id: "pindai",
      judul: "Mulai dari sini: Pindai",
      deskripsi:
        "Letakkan koin Rp500 di sebelah panen, potret, dan mesin menilai ukuran, warna, serta cacatnya dalam hitungan detik.",
      judulKey: "farmer_pindai_title",
      deskripsiKey: "farmer_pindai_desc",
      // Jangkarnya kini item nav "Pindai", yang selalu ada di bilah bawah.
      // Tombol `pindai-cta` yang lama sudah tidak dipakai: beranda hanya punya
      // satu ajakan, dan isinya berganti menurut keadaan petani.
      target: ['[data-tour="/petani/pindai"]'],
    },
    {
      id: "hasil-terakhir",
      judul: "Hasil pindaian terakhir",
      deskripsi:
        "Kartu ini selalu menampilkan batch terbaru beserta grade dominannya. Ketuk untuk membuka laporan per objek.",
      judulKey: "farmer_hasil_title",
      deskripsiKey: "farmer_hasil_desc",
      target: ['[data-tour="hasil-terakhir"]', '[data-tour="/petani/riwayat"]'],
    },
    {
      id: "dampak",
      judul: "Dampak panen Anda",
      deskripsi:
        "Berapa kilogram panen yang terselamatkan dari susut, dan berapa kg CO₂e yang tidak jadi terlepas, dihitung dari transaksi Anda sendiri. Dibuka lewat Akun.",
      judulKey: "farmer_dampak_title",
      deskripsiKey: "farmer_dampak_desc",
      target: ['[data-tour="/petani/dampak"]', '[data-tour="/petani/akun"]'],
    },
    {
      id: "tema",
      judul: "Tema terang atau gelap",
      deskripsi:
        "Pengalihnya ada di Akun → Tampilan, di desktop maupun di ponsel. Berguna saat memindai di bawah matahari.",
      judulKey: "farmer_tema_title",
      deskripsiKey: "farmer_tema_desc",
      /* `[data-tour="tema"]` tidak pernah dirender di mana pun — pengalih tema
         hidup di layar Akun, bukan di chrome. Yang menyorot langkah ini selama
         ini adalah cadangannya, dan cadangan itu memang tujuan yang benar. */
      target: ['[data-tour="/petani/akun"]'],
    },
    {
      id: "palet",
      judul: "Palet perintah",
      deskripsi:
        "Tekan Ctrl atau ⌘ + K untuk melompat ke layar mana pun, mencari lot, atau membuka kode pesanan tanpa mengetuk menu.",
      judulKey: "palet_title",
      deskripsiKey: "palet_desc",
      target: ['[data-tour="palet"]'],
    },
  ],
  pembeli: [
    {
      id: "katalog",
      judul: "Katalog panen bermutu",
      deskripsi:
        "Cari komoditas, petani, atau lokasi. Setiap lot membawa laporan grading yang bisa Anda buka sebelum menawar.",
      judulKey: "buyer_katalog_title",
      deskripsiKey: "buyer_katalog_desc",
      target: ['input[type="search"]', '[data-tour="/pembeli"]'],
    },
    {
      id: "inquiry",
      judul: "Keranjang inquiry",
      deskripsi:
        "Kumpulkan beberapa lot lebih dulu, lalu kirim satu penawaran sekaligus ke petaninya.",
      judulKey: "buyer_inquiry_title",
      deskripsiKey: "buyer_inquiry_desc",
      target: ['[data-tour="/pembeli/inquiry"]'],
    },
    {
      id: "pesanan",
      judul: "Pesanan & serah terima",
      deskripsi:
        "Status pesanan, percakapan dengan petani, dan kode serah terima 6 digit ada di layar ini.",
      judulKey: "buyer_pesanan_title",
      deskripsiKey: "buyer_pesanan_desc",
      target: ['[data-tour="/pembeli/pesanan"]'],
    },
    {
      id: "tema",
      judul: "Tema terang atau gelap",
      deskripsi:
        "Pengalihnya ada di Akun → Tampilan, di desktop maupun di ponsel.",
      judulKey: "farmer_tema_title",
      deskripsiKey: "buyer_tema_desc",
      target: ['[data-tour="/pembeli/akun"]'],
    },
    {
      id: "palet",
      judul: "Palet perintah",
      deskripsi:
        "Tekan Ctrl atau ⌘ + K untuk melompat ke layar mana pun atau membuka kode pesanan tanpa mengetuk menu.",
      judulKey: "palet_title",
      deskripsiKey: "palet_desc",
      target: ['[data-tour="palet"]'],
    },
  ],
  admin: [
    {
      id: "ringkasan",
      judul: "Ringkasan platform",
      deskripsi:
        "Angka agregat lintas petani dan pembeli: volume tergrading, transaksi, dan dampak penyelamatkan panen.",
      judulKey: "admin_ringkasan_title",
      deskripsiKey: "admin_ringkasan_desc",
      target: ['[data-tour="/admin"]'],
    },
    {
      id: "rute",
      judul: "Konsolidasi rute",
      deskripsi:
        "Gabungkan penjemputan beberapa petani jadi satu rute armada, lengkap dengan penghematan BBM dan CO₂e-nya.",
      judulKey: "admin_rute_title",
      deskripsiKey: "admin_rute_desc",
      target: ['[data-tour="/admin/rute"]'],
    },
    /* Tidak ada langkah tema di konsol admin. Peran ini tidak punya layar Akun,
       jadi pengalih tema memang tidak terjangkau dari sini — dan langkahnya
       menyasar `[data-tour="tema"]` yang tidak pernah ada, sehingga tur
       melewatinya diam-diam sejak awal. Yang dihapus hanya janji, bukan
       kemampuan. */
    {
      id: "palet",
      judul: "Palet perintah",
      deskripsi:
        "Tekan Ctrl atau ⌘ + K untuk melompat ke layar mana pun tanpa mengetuk menu.",
      judulKey: "palet_title",
      deskripsiKey: "palet_desc",
      target: ['[data-tour="palet"]'],
    },
  ],
};

export function langkahTur(role: Role): LangkahTur[] {
  return LANGKAH[role];
}

/* ------------------------------------------------------------------ Geometri */

export interface Kotak {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface PosisiTooltip {
  top: number;
  left: number;
  arah: "atas" | "bawah";
}

/**
 * Tempatkan kartu penjelasan relatif terhadap elemen yang disorot.
 *
 * Aturannya: di bawah target bila muat, kalau tidak di atasnya, dan selalu
 * dijepit ke dalam viewport. Penjepitan itulah alasan fungsi ini ada — tanpa
 * itu, sorotan pada item nav paling kanan mendorong kartunya keluar layar,
 * dan pada ponsel 360px hampir semua target melakukannya.
 */
export function posisiTooltip(
  target: Kotak,
  viewport: { width: number; height: number },
  tooltip: { width: number; height: number },
  jarak = 12,
): PosisiTooltip {
  const ruangBawah = viewport.height - (target.top + target.height);
  const ruangAtas = target.top;
  const muatBawah = ruangBawah >= tooltip.height + jarak;
  // Saat tidak muat di kedua sisi, pilih yang lebih lapang: kartu terpotong
  // sedikit masih terbaca, kartu di luar layar tidak.
  const arah: "atas" | "bawah" =
    muatBawah || ruangBawah >= ruangAtas ? "bawah" : "atas";

  const top =
    arah === "bawah"
      ? target.top + target.height + jarak
      : target.top - tooltip.height - jarak;

  const tengah = target.left + target.width / 2 - tooltip.width / 2;
  const maksKiri = Math.max(jarak, viewport.width - tooltip.width - jarak);
  const left = Math.min(Math.max(jarak, tengah), maksKiri);

  return {
    top: Math.min(Math.max(jarak, top), Math.max(jarak, viewport.height - tooltip.height - jarak)),
    left,
    arah,
  };
}
