/**
 * Tes estimasi ongkos angkut (F-53).
 *
 * Rumusnya ditampilkan ke pembeli, jadi yang dijaga bukan hanya angka totalnya
 * tapi juga sifat-sifat yang membuat angka itu masuk akal: monoton terhadap
 * jarak dan berat, tidak pernah di bawah biaya keberangkatan, dan konsolidasi
 * hanya memotong komponen jarak.
 */

import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { TARIF, hitungOngkos, ongkosPerKg } from "./ongkos";

const jarak = () => fc.double({ min: 0, max: 300, noNaN: true });
const berat = () => fc.double({ min: 0, max: 5000, noNaN: true });

describe("hitungOngkos", () => {
  it("menjumlahkan ketiga suku sesuai rumus PRD", () => {
    const o = hitungOngkos({ jarak_km: 20, berat_kg: 100 });
    // 15.000 + 3.500×20 + 250×100 = 110.000
    expect(o.subtotal).toBe(110_000);
    expect(o.total).toBe(110_000);
    expect(o.diskon).toBe(0);
  });

  it("memotong hanya komponen jarak saat konsolidasi", () => {
    const mandiri = hitungOngkos({ jarak_km: 20, berat_kg: 100 });
    const gabung = hitungOngkos({ jarak_km: 20, berat_kg: 100, konsolidasi: true });
    // 3.500 × 20 × 0,35 = 24.500
    expect(gabung.diskon).toBe(24_500);
    expect(gabung.total).toBe(mandiri.total - 24_500);
  });

  it("membawa rumus tiap suku untuk ditampilkan", () => {
    const o = hitungOngkos({ jarak_km: 12.5, berat_kg: 80 });
    expect(o.suku.map((s) => s.label)).toEqual([
      "Biaya keberangkatan",
      "Jarak tempuh",
      "Bobot muatan",
    ]);
    expect(o.suku[1].rumus).toContain("12,5 km");
    expect(o.suku[2].rumus).toContain("80 kg");
  });

  it("tidak pernah lebih murah daripada biaya keberangkatan", () => {
    fc.assert(
      fc.property(jarak(), berat(), fc.boolean(), (j, b, k) => {
        const o = hitungOngkos({ jarak_km: j, berat_kg: b, konsolidasi: k });
        return o.total >= TARIF.dasar;
      }),
      { numRuns: 500 },
    );
  });

  it("monoton: jarak atau berat yang lebih besar tidak pernah lebih murah", () => {
    fc.assert(
      fc.property(jarak(), jarak(), berat(), berat(), (j1, j2, b1, b2) => {
        const kecil = hitungOngkos({
          jarak_km: Math.min(j1, j2),
          berat_kg: Math.min(b1, b2),
        });
        const besar = hitungOngkos({
          jarak_km: Math.max(j1, j2),
          berat_kg: Math.max(b1, b2),
        });
        return besar.total >= kecil.total;
      }),
      { numRuns: 500 },
    );
  });

  it("konsolidasi tidak pernah lebih mahal daripada jemput mandiri", () => {
    fc.assert(
      fc.property(jarak(), berat(), (j, b) => {
        const mandiri = hitungOngkos({ jarak_km: j, berat_kg: b });
        const gabung = hitungOngkos({ jarak_km: j, berat_kg: b, konsolidasi: true });
        return gabung.total <= mandiri.total;
      }),
      { numRuns: 500 },
    );
  });

  it("memperlakukan angka rusak sebagai nol, bukan potongan", () => {
    const o = hitungOngkos({ jarak_km: -50, berat_kg: -10 });
    expect(o.total).toBe(TARIF.dasar);
  });

  it("membulatkan ke 500 terdekat", () => {
    const o = hitungOngkos({ jarak_km: 3.3, berat_kg: 7 });
    expect(o.total % 500).toBe(0);
  });
});

describe("ongkosPerKg", () => {
  it("membagi total dengan berat", () => {
    const o = hitungOngkos({ jarak_km: 20, berat_kg: 100 });
    expect(ongkosPerKg(o, 100)).toBe(1_100);
  });

  it("tidak menghasilkan Infinity untuk berat nol", () => {
    expect(ongkosPerKg(hitungOngkos({ jarak_km: 10, berat_kg: 0 }), 0)).toBe(0);
  });
});
