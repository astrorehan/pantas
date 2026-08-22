/**
 * Satu tindakan yang paling layak dikerjakan petani saat ini.
 *
 * Beranda sebelumnya hanya memajang data — hasil pindai terakhir, dua angka,
 * dan grid listing — lalu menyerahkan pertanyaan "jadi sekarang saya harus
 * apa?" kepada petani, yang menjawabnya dengan menelusuri sembilan item nav.
 * Fungsi ini menjawabnya di muka.
 *
 * Murni dan bebas DOM supaya urutan prioritasnya bisa diuji: urutan itulah
 * bagian yang paling mudah rusak diam-diam saat kondisi baru ditambahkan.
 */

export interface RingkasanPetani {
  /** Pindaian yang tertahan di perangkat karena koneksi putus (F-14). */
  antreanPindai: number;
  /** Penawaran berstatus `terkirim` atau `ditawar_balik`. */
  penawaranPerluJawaban: number;
  /** Pesanan yang belum berstatus `selesai`. */
  pesananPerluDiproses: number;
  /** Pindaian yang tersimpan, apa pun tindak lanjutnya. */
  pindaianTersimpan: number;
  /** Listing yang sedang tayang. */
  listingAktif: number;
}

export interface LangkahBerikutnya {
  id:
    | "antrean"
    | "penawaran"
    | "pesanan"
    | "terbitkan"
    | "pindai_lagi"
    | "pindai_pertama";
  judul: string;
  penjelasan: string;
  /** Label tombol. Kata kerja, bukan nama layar. */
  cta: string;
  href: string;
  /**
   * `menunggu` berarti tidak ada yang bisa dikerjakan petani sekarang — kartunya
   * tampil sebagai kabar, bukan sebagai ajakan yang menuntut ketukan.
   */
  menunggu?: boolean;
  /** Parameter jumlah untuk kunci i18n dinamis. */
  jumlah?: number;
}

/**
 * Urutannya adalah urutan kerugian bila diabaikan, bukan urutan menu.
 *
 * Penawaran didahulukan atas pesanan karena ia kedaluwarsa: pesanan yang
 * terlambat diproses tetap jadi pesanan, tawaran yang terlambat dijawab hilang
 * beserta pembelinya. Antrean offline berada paling atas hanya untuk
 * memberitahu — bukan karena petani bisa berbuat sesuatu terhadapnya.
 */
export function langkahBerikutnya(r: RingkasanPetani): LangkahBerikutnya {
  if (r.antreanPindai > 0) {
    return {
      id: "antrean",
      judul: `${r.antreanPindai} pindaian menunggu koneksi`,
      penjelasan:
        "Tersimpan di perangkat ini dan akan otomatis dinilai begitu sinyal kembali. Anda tidak perlu memindai ulang.",
      cta: "Lihat riwayat",
      href: "/petani/riwayat",
      menunggu: true,
      jumlah: r.antreanPindai,
    };
  }

  if (r.penawaranPerluJawaban > 0) {
    return {
      id: "penawaran",
      judul: `${r.penawaranPerluJawaban} penawaran menunggu jawaban`,
      penjelasan:
        "Pembeli sudah menyebut harga. Tawaran yang tidak dijawab akan kedaluwarsa dengan sendirinya.",
      cta: "Jawab penawaran",
      href: "/petani/penawaran",
      jumlah: r.penawaranPerluJawaban,
    };
  }

  if (r.pesananPerluDiproses > 0) {
    return {
      id: "pesanan",
      judul: `${r.pesananPerluDiproses} pesanan perlu diproses`,
      penjelasan:
        "Konfirmasi, jadwalkan penjemputan, lalu selesaikan serah terima dengan kode dari pembeli.",
      cta: "Proses pesanan",
      href: "/petani/pesanan",
      jumlah: r.pesananPerluDiproses,
    };
  }

  // Sudah pernah memindai tapi belum satu pun lot tayang: hasil grading yang
  // tidak diterbitkan tidak menghasilkan apa pun bagi petani.
  if (r.pindaianTersimpan > 0 && r.listingAktif === 0) {
    return {
      id: "terbitkan",
      judul: "Terbitkan hasil panen Anda",
      penjelasan:
        "Panen Anda sudah dinilai, tapi belum ada yang tayang di marketplace. Tetapkan harga, lalu terbitkan.",
      cta: "Terbitkan listing",
      href: "/petani/hasil",
    };
  }

  if (r.pindaianTersimpan > 0) {
    return {
      id: "pindai_lagi",
      judul: "Pindai panen berikutnya",
      penjelasan:
        "Letakkan koin Rp500 di sebelah panen dan potret. Penilaian mutu keluar dalam hitungan detik.",
      cta: "Mulai pindai",
      href: "/petani/pindai",
    };
  }

  return {
    id: "pindai_pertama",
    judul: "Mulai dari memindai panen",
    penjelasan:
      "Letakkan koin Rp500 di sebelah panen sebagai pembanding ukuran, lalu potret. Mesin menilai ukuran, warna, dan cacatnya.",
    cta: "Mulai pindai",
    href: "/petani/pindai",
  };
}
