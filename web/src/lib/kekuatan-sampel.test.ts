import { describe, expect, it } from "vitest";
import {
  MAKS_LIPAT,
  MIN_OBJEK_CUKUP,
  MIN_OBJEK_KLAIM,
  nilaiSampel,
} from "./kekuatan-sampel";

/**
 * Batch dari tangkapan layar yang memicu perbaikan ini: satu tomat, komposisi
 * 100% C, perkiraan berat isi foto ±0,05 kg, lalu diterbitkan sebagai 120 kg.
 */
const SATU_TOMAT = { objek: 1, berat_klaim_kg: 120, sampel_kg: 0.05 };

describe("nilaiSampel", () => {
  it("menolak klaim komposisi dari satu butir", () => {
    const p = nilaiSampel(SATU_TOMAT);
    expect(p.tingkat).toBe("sangat_tipis");
    expect(p.boleh_klaim_komposisi).toBe(false);
    expect(p.boleh_pisah_grade).toBe(false);
  });

  it("menghitung kelipatan ekstrapolasi yang sebenarnya", () => {
    // 120 kg dari 0,05 kg yang difoto.
    expect(nilaiSampel(SATU_TOMAT).lipat).toBe(2400);
  });

  it("tetap menandai sampel tipis meski jumlah butirnya cukup", () => {
    // 12 butir ≈ 0,6 kg, tapi yang dijual 500 kg — 833×.
    const p = nilaiSampel({ objek: 12, berat_klaim_kg: 500, sampel_kg: 0.6 });
    expect(p.lipat).toBeGreaterThan(MAKS_LIPAT);
    expect(p.tingkat).toBe("tipis");
    // Tipis masih boleh mengklaim komposisi; yang hilang hanya kesunyiannya.
    expect(p.boleh_klaim_komposisi).toBe(true);
  });

  it("meloloskan sampel yang cukup dan proporsional", () => {
    const p = nilaiSampel({ objek: 24, berat_klaim_kg: 50, sampel_kg: 1.2 });
    expect(p.tingkat).toBe("cukup");
    expect(p.lipat).toBe(42);
  });

  it("menempatkan batas pada nilai yang didokumentasikan", () => {
    const pada = (objek: number) =>
      nilaiSampel({ objek, berat_klaim_kg: 10, sampel_kg: 1 }).tingkat;
    expect(pada(MIN_OBJEK_KLAIM - 1)).toBe("sangat_tipis");
    expect(pada(MIN_OBJEK_KLAIM)).toBe("tipis");
    expect(pada(MIN_OBJEK_CUKUP - 1)).toBe("tipis");
    expect(pada(MIN_OBJEK_CUKUP)).toBe("cukup");
  });

  it("masih menilai jumlah butir tanpa estimasi berat", () => {
    // Laporan lama tersimpan sebelum estimasi berat ada.
    const p = nilaiSampel({ objek: 1, berat_klaim_kg: 120, sampel_kg: null });
    expect(p.lipat).toBeNull();
    expect(p.tingkat).toBe("sangat_tipis");
  });

  it("tidak menghitung kelipatan sebelum berat jual diisi", () => {
    const p = nilaiSampel({ objek: 20, berat_klaim_kg: 0, sampel_kg: 1 });
    expect(p.lipat).toBeNull();
    expect(p.tingkat).toBe("cukup");
  });

  it("memberi margin yang mengecil seiring bertambahnya butir", () => {
    const margin = (objek: number) =>
      nilaiSampel({ objek, berat_klaim_kg: 0 }).margin_poin_persen;
    expect(margin(1)).toBe(100);
    expect(margin(10)).toBe(32);
    expect(margin(100)).toBe(10);
    // Batch kosong tidak boleh membagi dengan nol.
    expect(margin(0)).toBe(100);
  });

  it("tidak percaya jumlah butir yang tidak masuk akal", () => {
    expect(nilaiSampel({ objek: -5, berat_klaim_kg: 10 }).objek).toBe(0);
    expect(nilaiSampel({ objek: 7.9, berat_klaim_kg: 10 }).objek).toBe(7);
  });
});
