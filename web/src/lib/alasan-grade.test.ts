import { describe, expect, it } from "vitest";
import { bacaAlasan } from "./alasan-grade";
import { idMessages } from "./i18n/messages/id";
import { enMessages } from "./i18n/messages/en";

/**
 * Contoh di bawah disalin apa adanya dari f-string di `ai_engine`, bukan
 * ditulis ulang dari ingatan — pemisah desimal, spasi, tanda `->`, dan ejaan
 * "mm2" semuanya ikut. Itulah satu-satunya cara uji ini benar-benar menjaga
 * kecocokan pola: kalau engine mengubah kalimatnya, uji ini yang gagal, bukan
 * petani yang tiba-tiba membaca bahasa mesin lagi.
 */
const DARI_ENGINE = {
  busuk_reject: "Cacat patologis mencapai 42.7% (Ambang: 15%) -> REJECT mutlak",
  veto_penyakit: "VETO YOLO 2: Terdeteksi penyakit/busuk (91.4%)",
  ukuran_besar: "Ukuran 12500mm2 >= ambang Grade A (10000mm2)",
  ukuran_sedang: "Ukuran 9000mm2 masuk rentang Grade B (8000-10000mm2)",
  ukuran_kecil: "Ukuran 1390mm2 < ambang Grade B (8000mm2)",
  bentuk_lonjong: "Bentuk terlalu lonjong/cacat (circularity 0.42 < 0.65)",
  bentuk_kurang_bulat: "Bentuk kurang bulat (circularity 0.71 < 0.80)",
  warna_belum_matang: "Warna belum matang sempurna (hijau) menurunkan grade",
  cacat_kosmetik:
    "Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B",
} as const;

describe("bacaAlasan", () => {
  it("mengenali setiap kalimat yang ditulis ai_engine", () => {
    for (const [kunci, mentah] of Object.entries(DARI_ENGINE)) {
      expect(bacaAlasan(mentah), mentah).toMatchObject({ kunci });
    }
  });

  it("membawa angka ambang dan ukuran, bukan membuangnya", () => {
    expect(bacaAlasan(DARI_ENGINE.ukuran_kecil)?.params).toEqual({
      ukuran: "1.390",
      ambang: "8.000",
    });
    expect(bacaAlasan(DARI_ENGINE.ukuran_sedang)?.params).toEqual({
      ukuran: "9.000",
      bawah: "8.000",
      atas: "10.000",
    });
    expect(bacaAlasan(DARI_ENGINE.busuk_reject)?.params).toEqual({
      luas: "42.7",
      ambang: "15",
    });
    expect(bacaAlasan(DARI_ENGINE.warna_belum_matang)?.params).toEqual({
      status: "hijau",
    });
  });

  it("tidak mengira alasan ukuran kecil sebagai alasan ukuran besar", () => {
    // Ketiganya berawal dengan "Ukuran {n}mm2", jadi urutan pola penting.
    expect(bacaAlasan(DARI_ENGINE.ukuran_besar)?.kunci).toBe("ukuran_besar");
    expect(bacaAlasan(DARI_ENGINE.ukuran_kecil)?.kunci).toBe("ukuran_kecil");
    expect(bacaAlasan(DARI_ENGINE.ukuran_sedang)?.kunci).toBe("ukuran_sedang");
  });

  it("mengembalikan null untuk alasan yang belum dikenali", () => {
    // Engine boleh menambah alasan kapan saja; layar menampilkannya apa adanya
    // daripada menghilangkannya.
    expect(bacaAlasan("Alasan baru yang belum pernah ada")).toBeNull();
    expect(bacaAlasan("")).toBeNull();
  });

  it("punya terjemahan di kedua kamus untuk tiap kunci", () => {
    for (const mentah of Object.values(DARI_ENGINE)) {
      const kunci = bacaAlasan(mentah)!.kunci;
      expect(idMessages.alasan, kunci).toHaveProperty(kunci);
      expect(enMessages.alasan, kunci).toHaveProperty(kunci);
    }
  });

  it("memakai setiap parameter yang dibawa polanya di kedua kamus", () => {
    for (const mentah of Object.values(DARI_ENGINE)) {
      const { kunci, params } = bacaAlasan(mentah)!;
      for (const kamus of [idMessages.alasan, enMessages.alasan]) {
        const teks = (kamus as Record<string, string>)[kunci];
        for (const nama of Object.keys(params)) {
          // Placeholder yang tidak terpakai berarti angka engine hilang
          // diam-diam dari kalimat yang dibaca petani.
          expect(teks, `${kunci} / ${nama}`).toContain(`{${nama}}`);
        }
      }
    }
  });
});
