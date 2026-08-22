/**
 * Checklist penanganan rantai dingin (F-52).
 *
 * PRD §EP-F: untuk komoditas yang menuntutnya, petani mendapat daftar
 * penanganan sebelum penjemputan — naungan, wadah berventilasi, batas
 * penumpukan, dan jendela waktu maksimum — yang dicentang saat penjemputan,
 * disimpan di `pengiriman.checklist`, lalu tampil di halaman lacak sebagai
 * bukti penanganan.
 *
 * Angka batasnya berbeda per komoditas, jadi daftarnya dibangun dari profil,
 * bukan ditulis tetap di layar: cabai rawit menumpuk jauh lebih rapuh daripada
 * wortel, dan checklist yang sama untuk keduanya berarti salah satunya salah.
 */

export interface ProfilRantaiDingin {
  /** Komoditas ini memang menuntut penanganan rantai dingin. */
  wajib: boolean;
  /** Batas penumpukan peti sebelum lapisan bawah memar. */
  maks_lapis: number;
  /** Jendela waktu panen → berangkat, dalam jam. */
  jendela_jam: number;
  /**
   * Kunci i18n alasan batas tumpukan — ikut ditampilkan supaya bukan aturan
   * buta. Kunci, bukan kalimat: alasannya dulu ditulis Indonesia di sini lalu
   * disuntikkan sebagai parameter `{reason}`, sehingga layar berbahasa Inggris
   * menampilkan empat baris Inggris dan satu baris Indonesia di tengahnya.
   */
  alasanKey: string;
}

/**
 * Kunci profil adalah keluarga komoditas (potongan pertama id engine), bukan
 * varietasnya: `chili_rawit` dan `chili_merah_besar` ditangani sama.
 */
const PROFIL: Record<string, ProfilRantaiDingin> = {
  tomato: {
    wajib: true,
    maks_lapis: 3,
    jendela_jam: 6,
    alasanKey: "stack_reason_tomato",
  },
  chili: {
    wajib: true,
    maks_lapis: 4,
    jendela_jam: 8,
    alasanKey: "stack_reason_chili",
  },
  cucumber: {
    wajib: true,
    maks_lapis: 3,
    jendela_jam: 8,
    alasanKey: "stack_reason_cucumber",
  },
  carrot: {
    wajib: false,
    maks_lapis: 6,
    jendela_jam: 24,
    alasanKey: "stack_reason_carrot",
  },
};

/** Profil bawaan untuk komoditas yang belum punya entri sendiri. */
const PROFIL_BAWAAN: ProfilRantaiDingin = {
  wajib: true,
  maks_lapis: 3,
  jendela_jam: 8,
  alasanKey: "stack_reason_default",
};

/** Kata Indonesia → keluarga engine, untuk baris yang menyimpan label tampilan. */
const DARI_LABEL: [RegExp, string][] = [
  [/tomat/, "tomato"],
  [/cabai|cabe/, "chili"],
  [/timun|mentimun/, "cucumber"],
  [/wortel/, "carrot"],
];

/**
 * Keluarga komoditas dari id engine (`chili_rawit`) maupun label tampilan
 * ("Cabai Merah Besar"). Keduanya beredar di basis data: `gradings.komoditas`
 * menyimpan id, sedangkan `pengiriman.komoditas` menyimpan label yang dibaca
 * manusia.
 */
export function keluargaKomoditas(komoditas: string): string {
  const teks = (komoditas ?? "").toLowerCase().trim();
  const prefiks = teks.split("_")[0];
  if (PROFIL[prefiks]) return prefiks;
  for (const [pola, keluarga] of DARI_LABEL) {
    if (pola.test(teks)) return keluarga;
  }
  return "";
}

export function profilRantaiDingin(komoditas: string): ProfilRantaiDingin {
  return PROFIL[keluargaKomoditas(komoditas)] ?? PROFIL_BAWAAN;
}

export interface ItemChecklist {
  /** Kunci yang tersimpan di `pengiriman.checklist`; stabil, jangan diubah. */
  id: string;
  /** i18n key prefix (e.g. "naungan" → t("checklist_naungan_label")) */
  labelKey: string;
  labelParams?: Record<string, string | number>;
  detailKey: string;
  detailParams?: Record<string, string | number>;
}

export function checklistUntuk(komoditas: string): ItemChecklist[] {
  const p = profilRantaiDingin(komoditas);
  return [
    {
      id: "naungan",
      labelKey: "checklist_naungan_label",
      detailKey: "checklist_naungan_detail",
    },
    {
      id: "ventilasi",
      labelKey: "checklist_ventilasi_label",
      detailKey: "checklist_ventilasi_detail",
    },
    {
      id: "tumpukan",
      labelKey: "checklist_tumpukan_label",
      labelParams: { layers: p.maks_lapis },
      detailKey: p.alasanKey,
    },
    {
      id: "jendela",
      labelKey: "checklist_jendela_label",
      labelParams: { hours: p.jendela_jam },
      detailKey: "checklist_jendela_detail",
    },
    {
      id: "dokumen",
      labelKey: "checklist_dokumen_label",
      detailKey: "checklist_dokumen_detail",
    },
  ];
}

export interface RingkasanChecklist {
  selesai: number;
  total: number;
  lengkap: boolean;
  /** Item yang belum dicentang, untuk ditampilkan apa adanya. */
  tertinggal: ItemChecklist[];
}

/**
 * Ringkasan yang dibaca layar logistik dan halaman lacak.
 *
 * Kunci asing di dalam `checklist` diabaikan: baris tersimpan bisa berasal dari
 * versi daftar yang lebih lama, dan itu tidak boleh membuat pengiriman terlihat
 * seperti melebihi 100%.
 */
export function ringkasChecklist(
  tercentang: Record<string, boolean> | undefined,
  daftar: ItemChecklist[],
): RingkasanChecklist {
  const tertinggal = daftar.filter((i) => !tercentang?.[i.id]);
  return {
    selesai: daftar.length - tertinggal.length,
    total: daftar.length,
    lengkap: tertinggal.length === 0,
    tertinggal,
  };
}
