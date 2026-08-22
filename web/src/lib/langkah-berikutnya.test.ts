import { describe, expect, it } from "vitest";
import { langkahBerikutnya } from "./langkah-berikutnya";
import type { RingkasanPetani } from "./langkah-berikutnya";

const KOSONG: RingkasanPetani = {
  antreanPindai: 0,
  penawaranPerluJawaban: 0,
  pesananPerluDiproses: 0,
  pindaianTersimpan: 0,
  listingAktif: 0,
};

function ringkasan(patch: Partial<RingkasanPetani>): RingkasanPetani {
  return { ...KOSONG, ...patch };
}

describe("langkahBerikutnya", () => {
  it("mengajak memindai saat petani belum punya apa pun", () => {
    expect(langkahBerikutnya(KOSONG).id).toBe("pindai_pertama");
  });

  it("mendahulukan penawaran atas pesanan", () => {
    // Keduanya menuntut perhatian; yang kedaluwarsa harus disebut lebih dulu.
    const langkah = langkahBerikutnya(
      ringkasan({ penawaranPerluJawaban: 2, pesananPerluDiproses: 5 }),
    );
    expect(langkah.id).toBe("penawaran");
    expect(langkah.judul).toContain("2");
  });

  it("mendahulukan antrean offline atas segalanya, sebagai kabar", () => {
    const langkah = langkahBerikutnya(
      ringkasan({
        antreanPindai: 3,
        penawaranPerluJawaban: 1,
        pesananPerluDiproses: 1,
      }),
    );
    expect(langkah.id).toBe("antrean");
    // Tidak ada yang bisa dikerjakan petani terhadap koneksi yang putus, jadi
    // kartunya tidak boleh menyamar sebagai tugas.
    expect(langkah.menunggu).toBe(true);
  });

  it("meminta menerbitkan saat ada pindaian tapi belum ada listing", () => {
    expect(langkahBerikutnya(ringkasan({ pindaianTersimpan: 4 })).id).toBe(
      "terbitkan",
    );
  });

  it("mengajak memindai lagi saat listing sudah tayang dan tak ada tunggakan", () => {
    expect(
      langkahBerikutnya(ringkasan({ pindaianTersimpan: 4, listingAktif: 2 }))
        .id,
    ).toBe("pindai_lagi");
  });

  it("selalu menghasilkan tujuan dan ajakan yang terisi", () => {
    const semua = [
      KOSONG,
      ringkasan({ antreanPindai: 1 }),
      ringkasan({ penawaranPerluJawaban: 1 }),
      ringkasan({ pesananPerluDiproses: 1 }),
      ringkasan({ pindaianTersimpan: 1 }),
      ringkasan({ pindaianTersimpan: 1, listingAktif: 1 }),
    ];
    for (const r of semua) {
      const langkah = langkahBerikutnya(r);
      expect(langkah.href.startsWith("/petani")).toBe(true);
      expect(langkah.cta.length).toBeGreaterThan(0);
      expect(langkah.penjelasan.length).toBeGreaterThan(0);
    }
  });
});
