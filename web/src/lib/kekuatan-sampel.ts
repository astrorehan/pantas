/**
 * Seberapa jauh satu batch pindaian boleh dipakai sebagai klaim mutu.
 *
 * Grading menilai butir yang ada di dalam foto. Listing menjual sekarung
 * panen. Di antara keduanya ada lompatan yang selama ini tidak pernah
 * disebutkan layar mana pun: batch berisi satu tomat menghasilkan komposisi
 * "100% C", dan komposisi itu ikut terbit sebagai keterangan mutu untuk 120 kg
 * yang tidak pernah dilihat model.
 *
 * Modul ini menamai lompatan itu dan memberi batasnya.
 *
 * Dua besaran dipakai, dan keduanya mengukur hal yang berbeda:
 *
 * 1. **Jumlah butir yang dinilai.** Persentase komposisi dari `n` pengamatan
 *    punya galat baku kira-kira `1/√n`. Satu butir berarti setiap grade adalah
 *    0% atau 100% — bukan proporsi, melainkan satu pengamatan tunggal.
 *    Sepuluh butir masih membawa margin ±32 poin persen: "57% B" pada sampel
 *    itu sama saja dengan "di suatu tempat antara 25% dan 89%".
 *
 * 2. **Kelipatan ekstrapolasi** — berat yang diklaim dibagi perkiraan berat
 *    butir di dalam foto. Ini **bukan** batas statistik; sampel acak 1.000
 *    orang memang sah mewakili 200 juta. Yang diukur di sini adalah seberapa
 *    besar bagian panen yang benar-benar dilihat, karena segenggam tomat yang
 *    diambil dari lapisan paling atas satu peti bukan penarikan acak dari
 *    seluruh truk. Di bawah 0,5% panen (200×), foto itu lebih tepat disebut
 *    contoh tampilan daripada sampel.
 *
 * Konsekuensinya sengaja bertingkat, bukan satu tombol larangan: petani
 * memiliki panennya dan berhak menjualnya. Yang tidak boleh adalah PANTAS
 * mencetak klaim yang tidak bisa ditopang datanya.
 */

/** Di bawah ini komposisi bukan proporsi, hanya satu-dua pengamatan. */
export const MIN_OBJEK_KLAIM = 3;

/** Di bawah ini margin tiap persentase komposisi masih ±32 poin persen. */
export const MIN_OBJEK_CUKUP = 10;

/** Di atas ini foto mencakup kurang dari 0,5% berat yang dijual. */
export const MAKS_LIPAT = 200;

export type TingkatSampel = "cukup" | "tipis" | "sangat_tipis";

export interface PenilaianSampel {
  tingkat: TingkatSampel;
  /** Jumlah butir yang benar-benar dinilai engine pada batch ini. */
  objek: number;
  /**
   * Berat klaim dibagi perkiraan berat isi foto, dibulatkan.
   *
   * `null` bila salah satu sisinya belum ada — batch lama tanpa estimasi
   * berat, atau berat jual yang belum diisi. Peringatannya tetap muncul dari
   * jumlah butir; hanya kalimat kelipatannya yang tidak bisa ditulis.
   */
  lipat: number | null;
  /** Margin kasar tiap persentase komposisi, dalam poin persen. */
  margin_poin_persen: number;
  /** Komposisi batch boleh menempel pada listing sebagai keterangan mutu. */
  boleh_klaim_komposisi: boolean;
  /** Batch boleh dipecah jadi satu listing per grade. */
  boleh_pisah_grade: boolean;
}

export function nilaiSampel({
  objek,
  berat_klaim_kg,
  sampel_kg,
}: {
  /** Butir yang dinilai engine, bukan butir yang ada di dalam karung. */
  objek: number;
  /** Berat yang akan diterbitkan; 0 bila petani belum mengisinya. */
  berat_klaim_kg: number;
  /** Perkiraan berat isi foto dari luas terkalibrasi, bila ada. */
  sampel_kg?: number | null;
}): PenilaianSampel {
  const n = Math.max(0, Math.trunc(objek));

  const lipat =
    sampel_kg && sampel_kg > 0 && berat_klaim_kg > 0
      ? Math.round(berat_klaim_kg / sampel_kg)
      : null;

  const tingkat: TingkatSampel =
    n < MIN_OBJEK_KLAIM
      ? "sangat_tipis"
      : n < MIN_OBJEK_CUKUP || (lipat !== null && lipat > MAKS_LIPAT)
        ? "tipis"
        : "cukup";

  return {
    tingkat,
    objek: n,
    lipat,
    margin_poin_persen: n > 0 ? Math.round(100 / Math.sqrt(n)) : 100,
    boleh_klaim_komposisi: tingkat !== "sangat_tipis",
    boleh_pisah_grade: tingkat !== "sangat_tipis",
  };
}
