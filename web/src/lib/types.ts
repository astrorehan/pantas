/**
 * Shapes mirror the payload returned by `PantasModel.predict` in
 * ai_engine/model.py. Keep the Indonesian field names — they are the wire
 * format the Python engine already emits, and renaming here would just add a
 * translation layer at the boundary.
 */

export type Grade = "A" | "B" | "C" | "REJECT";

export type Role = "petani" | "pembeli" | "admin";

export interface Kalibrasi {
  referensi: string;
  px_per_mm2: number;
  valid: boolean;
  /**
   * Hasil gerbang kewajaran skala (`ai_engine/plausibilitas.py`). Opsional
   * karena laporan yang tersimpan sebelum gerbang itu ada tidak memuatnya —
   * dan `diperiksa: false` berarti tidak ada dasar untuk menilai (komoditas
   * belum punya rentang, atau tidak ada objek terukur), bukan lolos.
   */
  plausibilitas?: {
    diperiksa: boolean;
    masuk_akal: boolean;
    komoditas: string;
    median_luas_mm2?: number;
    rentang_wajar_mm2?: [number, number];
    faktor_meleset?: number;
    alasan: string | null;
  };
}

/**
 * Satu temuan cacat pada sebuah objek, dari `GradingEngine.evaluate`.
 *
 * `tipe` memisahkan cacat kosmetik (menurunkan grade maksimal ke B) dari
 * patologis (memicu REJECT dan menjadi saksi bagi veto YOLO-2).
 */
export interface CacatObjek {
  jenis: string;
  tipe: "kosmetik" | "patologis";
  /** Opsional: contoh terekam di contoh-grading.ts tidak menyimpan bidang ini. */
  luas_persen?: number;
}

export interface ObjekGrading {
  id: number;
  grade: string;
  ukuran_mm2: number | null;
  solidity: number;
  cacat: CacatObjek[];
  alasan_grade: string[];
  /** YOLO 2 pathology verdict per object (e.g. "busuk" triggers a REJECT veto). */
  yolo2_kondisi: string;
  yolo2_conf: number;
  bbox: [number, number, number, number];
}

/**
 * Estimasi berat dari luas terkalibrasi (F-101), dari
 * ai_engine/weight_estimator.py.
 *
 * Bentuknya sengaja bercabang: engine tidak pernah mengarang angka ketika
 * kalibrasi koin gagal atau komoditasnya belum punya faktor, ia mengembalikan
 * alasannya. Layar hasil menampilkan alasan itu, bukan nol.
 */
export type EstimasiBerat =
  | { tersedia: false; alasan: string }
  | {
    tersedia: true;
    gram: number;
    kg: number;
    /** Batas rentang keyakinan; angka ini tidak boleh disajikan tanpa keduanya. */
    min_kg: number;
    max_kg: number;
    luas_total_mm2: number;
    faktor_gram_per_mm2: number;
    rel_ketidakpastian: number;
    /** 0 berarti faktornya turunan geometri, belum tervalidasi timbangan. */
    n_sampel_kalibrasi: number;
    sumber_faktor: string;
    objek_terukur: number;
    objek_total: number;
  };

export interface RingkasanBatch {
  komposisi: Partial<Record<Grade, number>>;
  skor_keseragaman: number;
  /** Opsional: laporan tersimpan dari sebelum F-101 tidak memuatnya. */
  estimasi_berat?: EstimasiBerat;
}

export interface GradingSuccess {
  status: "success";
  komoditas: string;
  objek_terdeteksi: number;
  kalibrasi: Kalibrasi;
  ringkasan_batch: RingkasanBatch;
  objek: ObjekGrading[];
  hash_audit: string;
  /** JPEG data URL dari FastAPI /predict — foto dengan bounding box & grade. */
  annotated_img?: string;
}

export interface GradingError {
  status: "error";
  message: string;
  /**
   * True bila kegagalannya soal koneksi/layanan, bukan penilaian engine
   * (F-14). Foto yang ditolak karena blur tidak akan pernah lolos dengan
   * mencoba lagi, jadi hanya galat berlabel inilah yang boleh masuk antrean.
   */
  luring?: boolean;
}

export type GradingResult = GradingSuccess | GradingError;

/* --------------------------------------------------- Pindai multi-foto (F-12) */

/** Satu foto dalam antrean, beserta hasilnya apa adanya dari engine. */
export interface FotoHasil {
  indeks: number;
  nama?: string | null;
  hasil: GradingResult;
}

/**
 * Ringkasan gabungan seluruh foto, dari `ai_engine/batch_aggregate.py`.
 *
 * Bukan salinan `GradingSuccess`: kalibrasinya menyebut berapa foto yang
 * terkalibrasi (bukan satu `px_per_mm2`), tiap objek membawa nomor foto
 * asalnya, dan foto yang ditolak engine tercatat, bukan hilang.
 */
export interface AgregatBatch {
  status: "success" | "error";
  komoditas: string;
  foto_terproses: number;
  foto_gagal: { indeks: number; message: string }[];
  objek_terdeteksi: number;
  kalibrasi: {
    referensi: string;
    /** True hanya bila *setiap* foto yang berhasil punya koin terdeteksi. */
    valid: boolean;
    foto_terkalibrasi: number;
  };
  ringkasan_batch: RingkasanBatch;
  objek: (ObjekGrading & { foto: number })[];
  /** Menutupi payload gabungan; absen bila tidak ada foto yang berhasil. */
  hash_audit?: string;
  message?: string;
  /** Sama artinya dengan `GradingError.luring` — layak dicoba lagi nanti. */
  luring?: boolean;
}

export interface GradingMulti {
  status: "success" | "error";
  komoditas: string;
  foto: FotoHasil[];
  agregat: AgregatBatch;
}

/**
 * Laporan yang tersimpan di `gradings.hasil`: satu foto atau agregat multi-foto.
 * Bedakan dengan `"foto_terproses" in laporan`.
 */
export type LaporanGrading = GradingSuccess | AgregatBatch;

/** True bila laporan itu agregat pindai multi-foto (F-12). */
export function isAgregat(l: LaporanGrading): l is AgregatBatch {
  return "foto_terproses" in l;
}

/** Price recommendation, derived from batch grade + market reference. */
export interface RekomendasiHarga {
  komoditas_label: string;
  grade_dominan: Grade;
  grade_dominan_label: string;
  harga_acuan: number;
  harga_acuan_sumber: string;
  skor_kualitas: number;
  /**
   * Bobot grade batch, ditimbang seluruh komposisinya — bukan bobot grade
   * dominan saja (F-104, lihat `bobotEfektif`). Ikut ditampilkan di layar harga
   * karena PRD §14.2 sifat 3 menuntut setiap suku rumusnya terbaca petani.
   */
  bobot_grade: number;
  pengali: number;
  min: number;
  max: number;
}

export interface Listing {
  id: string;
  nama: string;
  komoditas: string;
  grade: Grade;
  berat_kg: number;
  harga_per_kg: number;
  gambar: string;
  petani: string;
  /** UUID profil petani (ada bila listing datang dari Supabase). */
  petani_id?: string;
  lokasi: string;
  /**
   * Jarak dari pembeli, atau `null` bila kebunnya belum berkoordinat.
   *
   * `null` bukan nol: lihat lib/jarak.ts. Layar yang menampilkannya wajib
   * menangani kedua kemungkinan.
   */
  jarak_km: number | null;
  rating: number;
  transaksi: number;
  lat: number | null;
  lng: number | null;
  satuan?: string;
  stok_kg?: number;
  panen_terakhir?: string;
  komposisi?: Partial<Record<Grade, number>>;
  catatan_ai?: string;
  alamat?: string;
  hash_audit?: string;
  grading_id?: string;
  status?: "tayang" | "habis" | "ditutup" | "disembunyikan" | "dijeda" | "terjual";
}

export interface DampakStats {
  periode: string;
  kg_terselamatkan: number;
  co2e_ton: number;
  pendapatan_tambahan: number;
  transaksi_selesai: number;
  mingguan: { minggu: string; kg: number }[];
  per_komoditas: { nama: string; kg: number }[];
}

export interface DampakAgregat {
  transaksi_selesai: number;
  kg_tersalurkan: number;
  nilai_transaksi: number;
  km_dihemat: number;
  co2e_ton_dihemat: number;
}

/**
 * Keadaan platform yang dilihat operator koperasi (F-90).
 *
 * Bedakan dari `DampakAgregat`: itu klaim dampak kumulatif sejak hari pertama,
 * ini potret hari ini. Keduanya hidup berdampingan di konsol karena menjawab
 * pertanyaan berbeda — "sudah sebesar apa" versus "sedang terjadi apa".
 */
export interface RingkasanPlatform {
  pengguna: {
    petani: number;
    pembeli: number;
    admin: number;
    total: number;
    /** Bagian dari `total` yang berasal dari seed demo, bukan pendaftar nyata. */
    demo: number;
  };
  listing: {
    tayang: number;
    disembunyikan: number;
    /** Termasuk yang habis dan ditutup petani. */
    total: number;
  };
  pesanan: Record<StatusPesanan, number> & { total: number };
  /** Nilai pesanan berstatus `selesai` — uang yang benar-benar berpindah. */
  gmv_selesai: number;
  /** Nilai pesanan yang masih berjalan; belum boleh diklaim sebagai dampak. */
  gmv_berjalan: number;
  /** Pindaian dalam 24 jam terakhir — denyut nadi engine, bukan totalnya. */
  grading_24j: number;
  /** `demo` berarti angka di layar bukan isi basis data. Ditampilkan apa adanya. */
  sumber: "supabase" | "demo";
}

export type StatusPesanan = "dipesan" | "dikonfirmasi" | "serah_terima" | "selesai";

export interface Pesanan {
  id: string;
  kode: string;
  status: StatusPesanan;
  nama: string;
  grade: Grade;
  berat_kg: number;
  harga_per_kg: number;
  total: number;
}

export type StatusPengiriman = "dijadwalkan" | "dijemput" | "dalam_perjalanan" | "tiba" | "diterima" | "batal";

export interface Pengiriman {
  id: string;
  order_id: string;
  metode: "jemput_mandiri" | "konsolidasi" | "kurir_mitra";
  jendela_mulai?: string;
  jendela_selesai?: string;
  alamat_jemput: string;
  lat: number;
  lng: number;
  status: StatusPengiriman;
  checklist?: Record<string, boolean>;
  ongkos_estimasi?: number;
  catatan?: string;
  petani?: string;
  komoditas?: string;
  berat_kg?: number;
}

/** Satu perhentian dalam rute konsolidasi, sesudah pengurutan nearest-neighbour. */
export interface RuteItem {
  /** Urutan kunjungan, 1 = perhentian pertama sesudah depot. */
  urutan: number;
  /** ISO. Dihitung perencana dari urutan + kecepatan rata-rata + waktu muat. */
  perkiraan_tiba?: string;
  pengiriman: Pengiriman;
}

export interface Rute {
  id: string;
  /**
   * Nomor urut terbaca manusia — inilah yang dikutip di layar petani
   * ("Rute #12"). `id` berupa uuid dan tidak pernah ditampilkan.
   */
  nomor: number;
  tanggal: string;
  kendaraan: string;
  kapasitas_kg: number;
  status: "draf" | "terkunci" | "berjalan" | "selesai";
  jarak_km: number;
  jarak_individual_km: number;
  item: RuteItem[];
}

export interface Penawaran {
  id: string;
  listing_id: string;
  pembeli_id: string;
  petani_id: string;
  kuantitas_kg: number;
  harga_per_kg: number;
  tanggal_ambil?: string;
  catatan?: string;
  status: "terkirim" | "ditawar_balik" | "diterima" | "ditolak" | "kedaluwarsa";
  created_at: string;
  /**
   * Pesanan yang lahir dari penawaran ini, diisi oleh RPC `terima_penawaran`
   * (migrasi 0017).
   *
   * Sebelum kolom ini ada, kedua layar mencocokkan penawaran dengan pesanan
   * lewat tebakan — nama komoditas, berat, nama petani — yang meleset begitu
   * ada dua lot mirip dan tidak punya jawaban sama sekali di sisi pembeli.
   * `status === "diterima"` sekarang selalu berpasangan dengan `order_id`.
   */
  order_id?: string | null;
  /**
   * Nama kedua pihak, ikut terbawa dari join `profiles`. Chat penawaran (F-33)
   * menyapa lawan bicara dengan nama, bukan dengan peran generik.
   */
  pembeli_nama?: string;
  petani_nama?: string;
  /**
   * Nama lot yang ditawar, ikut terbawa dari join `listings`.
   *
   * Kedua layar dulu mencari namanya di `myListings` atau di larik demo
   * `LISTINGS`. Petani memang punya lotnya sendiri di sana, tapi pembeli tidak
   * pernah — jadi setiap penawaran ke lot yang bukan bawaan demo tampil
   * sebagai "Komoditas dihapus" di layar pembeli, padahal lotnya masih tayang.
   */
  listing_nama?: string;
}

export interface Ulasan {
  id: string;
  order_id: string;
  penilai_id: string;
  dinilai_id: string;
  bintang: number;
  komentar?: string;
  created_at: string;
  penilai_nama?: string;
}

export interface Pesan {
  id: string;
  order_id?: string;
  penawaran_id?: string;
  pengirim_id: string;
  penerima_id: string;
  isi: string;
  dibaca: boolean;
  created_at: string;
  pengirim_nama?: string;
}



/* ----------------------------------------------------------------------- */
/* Peristiwa langsung                                                        */
/* ----------------------------------------------------------------------- */

/**
 * Perubahan yang datang dari seberang selagi layar terbuka.
 *
 * Bukan sekadar data yang berubah — itu sudah diurus store. Ini adalah
 * perubahan yang pantas *diberitahukan*, karena orang lain baru saja
 * melakukan sesuatu terhadap transaksi yang sedang dilihat pengguna. Penawaran
 * yang berubah jadi pesanan adalah momen paling penting di produk ini, dan
 * sebelumnya ia terjadi tanpa satu pun tanda di layar pihak seberang.
 *
 * Peristiwa yang disebabkan oleh pengguna sendiri tidak pernah masuk ke sini:
 * store hanya membangkitkannya ketika status di layar berbeda dari status yang
 * datang, dan tindakan sendiri sudah menuliskan status itu lebih dulu.
 */
export type JenisPeristiwa =
  /** Pembeli: tawaran diterima petani, pesanannya lahir. */
  | "penawaran_diterima"
  | "penawaran_ditolak"
  | "penawaran_ditawar_balik"
  /** Petani: tawaran baru masuk. */
  | "penawaran_baru"
  /** Pesanan yang belum pernah dilihat klien ini. */
  | "pesanan_baru"
  /** Pesanan yang statusnya maju. */
  | "pesanan_status";

export interface Peristiwa {
  id: string;
  jenis: JenisPeristiwa;
  /** Nama lot atau komoditas — yang dikenali orang, bukan id-nya. */
  nama: string;
  orderId?: string;
  status?: StatusPesanan;
  kuantitas_kg?: number;
  harga_per_kg?: number;
  total?: number;
  /** Lawan transaksi, bila diketahui. */
  lawan?: string;
  /** Tujuan tombol utama. */
  href?: string;
  waktu: number;
}
