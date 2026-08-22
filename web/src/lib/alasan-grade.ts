/**
 * Menerjemahkan alasan grade dari engine ke kalimat yang bisa dipakai petani.
 *
 * `ai_engine/grading_engine.py` menulis alasannya untuk pembaca yang memegang
 * konfigurasi ambang batas: "Ukuran 1390mm2 < ambang Grade B (8000mm2)". Itu
 * benar, dan justru karena benar ia tetap disimpan apa adanya — kalimat itu
 * masih ditampilkan utuh di bagian teknis, tempat pembeli dan verifikator
 * mencarinya, dan tidak ada satu pun karakternya yang diubah di basis data.
 *
 * Yang diterjemahkan hanya salinan yang dibaca petani di kartu "kenapa".
 * Angkanya tetap dibawa: seorang petani boleh saja ingin tahu 1.390 mm² itu
 * berapa, tapi ia tidak boleh harus membaca "ambang" dan "mm2" untuk mengerti
 * bahwa buahnya kekecilan.
 *
 * Pola yang tidak dikenali dikembalikan apa adanya, bukan dibuang. Engine
 * boleh menambah alasan baru kapan saja, dan alasan yang belum sempat
 * diterjemahkan lebih baik muncul dalam bahasa mesin daripada hilang.
 */

export interface AlasanTerbaca {
  /** Kunci pada kamus `alasan`. */
  kunci: string;
  params: Record<string, string | number>;
}

interface Pola {
  re: RegExp;
  kunci: string;
  /** Nama parameter, berurutan sesuai grup tangkapan regex. */
  arg: string[];
}

/* Urutannya penting: pola ukuran "< ambang" dan ">= ambang" harus dicoba
   sebelum pola rentang, karena ketiganya berawal dengan kata yang sama. */
const POLA: Pola[] = [
  {
    re: /^Cacat patologis mencapai ([\d.,]+)% \(Ambang: ([\d.,]+)%\)/i,
    kunci: "busuk_reject",
    arg: ["luas", "ambang"],
  },
  {
    re: /^VETO YOLO 2: Terdeteksi penyakit\/busuk \(([\d.,]+)%\)/i,
    kunci: "veto_penyakit",
    arg: ["keyakinan"],
  },
  {
    re: /^Ukuran (\d+)mm2 >= ambang Grade A \((\d+)mm2\)/i,
    kunci: "ukuran_besar",
    arg: ["ukuran", "ambang"],
  },
  {
    re: /^Ukuran (\d+)mm2 masuk rentang Grade B \((\d+)-(\d+)mm2\)/i,
    kunci: "ukuran_sedang",
    arg: ["ukuran", "bawah", "atas"],
  },
  {
    re: /^Ukuran (\d+)mm2 < ambang Grade B \((\d+)mm2\)/i,
    kunci: "ukuran_kecil",
    arg: ["ukuran", "ambang"],
  },
  {
    re: /^Bentuk terlalu lonjong\/cacat/i,
    kunci: "bentuk_lonjong",
    arg: [],
  },
  {
    re: /^Bentuk kurang bulat/i,
    kunci: "bentuk_kurang_bulat",
    arg: [],
  },
  {
    re: /^Warna belum matang sempurna \(([^)]*)\)/i,
    kunci: "warna_belum_matang",
    arg: ["status"],
  },
  {
    re: /^Terdapat cacat kosmetik/i,
    kunci: "cacat_kosmetik",
    arg: [],
  },
];

/**
 * Angka milimeter persegi dari engine ditulis tanpa pemisah ribuan. 8000
 * terbaca sebagai "delapan nol nol nol" sebelum terbaca sebagai delapan ribu,
 * dan seluruh produk ini memakai titik sebagai pemisah ribuan.
 */
function ribuan(n: string): string {
  return Number(n).toLocaleString("id-ID");
}

const ARG_ANGKA = new Set(["ukuran", "ambang", "bawah", "atas"]);

export function bacaAlasan(mentah: string): AlasanTerbaca | null {
  const teks = mentah.trim();
  for (const { re, kunci, arg } of POLA) {
    const cocok = re.exec(teks);
    if (!cocok) continue;
    const params: Record<string, string | number> = {};
    arg.forEach((nama, i) => {
      const nilai = cocok[i + 1] ?? "";
      params[nama] = ARG_ANGKA.has(nama) ? ribuan(nilai) : nilai;
    });
    return { kunci, params };
  }
  return null;
}
