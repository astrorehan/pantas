/**
 * Bahan demo yang hanya dipakai ketika Supabase tidak menjawab.
 *
 * Berkas ini terpisah dari data.ts karena data.ts ikut di setiap route:
 * `KOMODITAS` dan tipenya dipakai di mana-mana, jadi apa pun yang tinggal
 * bersamanya ikut terunduh oleh petani yang datanya sudah nyata dan tidak
 * akan pernah menyentuh baris-baris ini. Isinya sekitar 3 KB gzip — cukup
 * untuk melewatkan anggaran NFR-05 di rute terberat (/petani/pindai).
 *
 * Fungsi di data.ts memuatnya lewat `await import("./demo-data")` di jalur
 * fallback, sesudah Supabase gagal; jadi bundel utama tidak pernah membawanya
 * dan mode demo cuma membayar satu chunk kecil saat benar-benar dipakai.
 */

import type { Penawaran, Pengiriman, Pesan, Rute, Ulasan } from "./types";

export const DEMO_PENGIRIMAN: Pengiriman[] = [
  {
    id: "SHIP-001",
    order_id: "ORD-9021",
    metode: "konsolidasi",
    alamat_jemput: "Kebun Warsono, Harjobinangun, Pakem, Sleman",
    lat: -7.658,
    lng: 110.422,
    status: "dijadwalkan",
    ongkos_estimasi: 45000,
    petani: "Pak Warsono",
    komoditas: "Tomat Sayur Merapi",
    berat_kg: 850,
    // Sengaja belum lengkap (F-52): halaman lacak harus memperlihatkan bahwa
    // langkah tanpa centang tampil apa adanya, bukan disembunyikan supaya
    // buktinya terlihat sempurna.
    checklist: { naungan: true, ventilasi: true, tumpukan: true, dokumen: true },
  },
  {
    id: "SHIP-002",
    order_id: "ORD-9024",
    metode: "konsolidasi",
    alamat_jemput: "Kelompok Tani Merapi Asri, Wukirsari, Cangkringan, Sleman",
    lat: -7.635,
    lng: 110.453,
    status: "dijadwalkan",
    ongkos_estimasi: 38000,
    petani: "Bu Siti Rahayu",
    komoditas: "Tomat Ceri Merapi",
    berat_kg: 620,
  },
  {
    id: "SHIP-003",
    order_id: "ORD-9028",
    metode: "konsolidasi",
    alamat_jemput: "Kelompok Tani Budi Makmur, Banjararum, Kalibawang, Kulon Progo",
    lat: -7.735,
    lng: 110.22,
    status: "dijadwalkan",
    ongkos_estimasi: 62000,
    petani: "Pak Budi Santosa",
    komoditas: "Cabai Merah Besar",
    berat_kg: 300,
  },
  {
    id: "SHIP-004",
    order_id: "ORD-9035",
    metode: "konsolidasi",
    alamat_jemput: "Koperasi Tani Makmur, Turi, Sleman",
    lat: -7.640,
    lng: 110.370,
    status: "dijadwalkan",
    ongkos_estimasi: 25000,
    petani: "Bu Marni",
    komoditas: "Timun Hijau",
    berat_kg: 400,
  },
  {
    id: "SHIP-005",
    order_id: "ORD-9040",
    metode: "konsolidasi",
    alamat_jemput: "Kebun Hijau Asri, Ngemplak, Sleman",
    lat: -7.695,
    lng: 110.448,
    status: "dijadwalkan",
    ongkos_estimasi: 32000,
    petani: "Pak Joko",
    komoditas: "Cabai Rawit Merah",
    berat_kg: 150,
  },
  {
    // Petani ini mengantar sendiri ke depot — armada tidak menjemputnya, jadi
    // dia tidak boleh muncul di perencana rute (lihat pengirimanKonsolidasi).
    id: "SHIP-006",
    order_id: "ORD-9044",
    metode: "jemput_mandiri",
    alamat_jemput: "Kebun Sumarno, Sewon, Bantul",
    lat: -7.879,
    lng: 110.353,
    status: "dijadwalkan",
    ongkos_estimasi: 0,
    petani: "Pak Sumarno",
    komoditas: "Timun Suri",
    berat_kg: 120,
  },
  /*
   * Dua baris di bawah memakai id pesanan yang benar-benar ada di DEMO_ORDERS,
   * bukan "ORD-90xx" seperti baris di atasnya.
   *
   * Baris lama itu menggambarkan armada koperasi secara umum dan order_id-nya
   * tidak cocok dengan satu pun pesanan demo, jadi layar pesanan tidak pernah
   * bisa menemukan penjemputan miliknya sendiri dan hanya bisa melompat ke
   * "pengiriman pertama" — yang milik batch lain. Dua baris ini menutup
   * lompatan itu: PNT-0505 masih menunggu armada, PNT-0504 sudah di jalan.
   */
  {
    id: "SHIP-007",
    order_id: "PNT-0505",
    metode: "konsolidasi",
    alamat_jemput: "Kebun Warsono, Harjobinangun, Pakem, Sleman",
    lat: -7.658,
    lng: 110.422,
    status: "dijadwalkan",
    ongkos_estimasi: 28000,
    petani: "Pak Warsono",
    komoditas: "Cabai Merah Keriting",
    berat_kg: 150,
  },
  {
    id: "SHIP-008",
    order_id: "PNT-0504",
    metode: "kurir_mitra",
    alamat_jemput: "Kebun Warsono, Harjobinangun, Pakem, Sleman",
    lat: -7.658,
    lng: 110.422,
    status: "dalam_perjalanan",
    ongkos_estimasi: 18000,
    petani: "Pak Warsono",
    komoditas: "Cabai Rawit Merah",
    berat_kg: 60,
    checklist: {
      naungan: true,
      ventilasi: true,
      tumpukan: true,
      jendela: true,
      dokumen: true,
    },
  },
];

/**
 * Jam berangkat armada dari depot pada rute demo — dipakai untuk membentuk
 * `perkiraan_tiba` tiap perhentian supaya layar petani punya angka nyata.
 */
function jamHariIni(jam: number, menit: number): string {
  const t = new Date();
  t.setHours(jam, menit, 0, 0);
  return t.toISOString();
}

export const DEMO_RUTE: Rute[] = [
  {
    id: "RUTE-DIY-01",
    nomor: 12,
    tanggal: new Date().toISOString().slice(0, 10),
    kendaraan: "Pickup L300 (Kapasitas 1.5 Ton)",
    kapasitas_kg: 1500,
    status: "berjalan",
    jarak_km: 38.5,
    jarak_individual_km: 74.2,
    // Tiga perhentian, total 1.400 kg — pas di bawah kapasitas 1.500 kg.
    item: [
      { urutan: 1, perkiraan_tiba: jamHariIni(8, 30), pengiriman: DEMO_PENGIRIMAN[0] },
      { urutan: 2, perkiraan_tiba: jamHariIni(9, 5), pengiriman: DEMO_PENGIRIMAN[3] },
      { urutan: 3, perkiraan_tiba: jamHariIni(9, 40), pengiriman: DEMO_PENGIRIMAN[4] },
    ],
  },
];

export const DEMO_PENAWARAN: Penawaran[] = [
  {
    id: "PNW-001",
    listing_id: "PNT-L-0401",
    pembeli_id: "b0000000-0000-4000-b000-000000000001",
    petani_id: "a0000000-0000-4000-a000-000000000001",
    kuantitas_kg: 150,
    harga_per_kg: 4100,
    tanggal_ambil: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    catatan: "Mohon dikemas dalam peti kayu, truk kami ambil jam 09.00.",
    status: "terkirim",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "PNW-002",
    listing_id: "PNT-L-0422",
    pembeli_id: "b0000000-0000-4000-b000-000000000001",
    petani_id: "a0000000-0000-4000-a000-000000000003",
    kuantitas_kg: 50,
    // Sedikit di bawah harga minta PNT-L-0422 (11.200) — statusnya
    // `ditawar_balik`, jadi angkanya harus terbaca sebagai tawaran menawar,
    // bukan harga baru. Masih di dalam rentang wajar lot itu (10.100–11.800).
    harga_per_kg: 11000,
    tanggal_ambil: new Date(Date.now() + 86400000 * 1).toISOString().slice(0, 10),
    catatan: "Minta kurang sedikit harganya Pak, volume lumayan.",
    status: "ditawar_balik",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  }
];

export const DEMO_PESAN: Pesan[] = [
  {
    id: "MSG-001",
    order_id: "PNT-0101",
    pengirim_id: "demo-pembeli-id",
    penerima_id: "demo-petani-id",
    isi: "Halo Pak Warsono, apakah panen tomat sudah siap dijemput besok pagi?",
    dibaca: true,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    pengirim_nama: "PT Indofood Agritama",
  },
  {
    id: "MSG-002",
    order_id: "PNT-0101",
    pengirim_id: "demo-petani-id",
    penerima_id: "demo-pembeli-id",
    isi: "Siap Pak! Tomat Grade A sudah dipak dalam peti berventilasi. Penjemputan jam 08.30 WIB sangat cocok.",
    dibaca: true,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    pengirim_nama: "Warsono (Petani)",
  },
];

export const DEMO_ULASAN: Ulasan[] = [
  {
    id: "ULS-001",
    order_id: "PNT-0099",
    penilai_id: "demo-pembeli-id",
    dinilai_id: "demo-petani-id",
    bintang: 5,
    komentar: "Kualitas panen tomat Grade A sangat baik, kemasan peti rapi dan tepat waktu saat penjemputan.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    penilai_nama: "PT Indofood Agritama",
  },
];
