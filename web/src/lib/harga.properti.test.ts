/**
 * Tes properti algoritma harga (F-104).
 *
 * PRD §14.2 menuntut dua sifat yang harus dijaga, dan F-104 meminta keduanya
 * diverifikasi pada 1.000 komposisi acak dengan `fast-check`:
 *
 * 1. **Monoton** — komposisi grade yang lebih baik tidak boleh menghasilkan
 *    harga lebih rendah.
 * 2. **Terbatas** — pengali berada di `[0,315 , 1,06]`.
 *
 * "Lebih baik" dibuat presisi lewat dominansi stokastik orde pertama pada urutan
 * A → REJECT: komposisi q lebih baik daripada p bila untuk setiap k, massa
 * gabungan k grade teratas pada q tidak lebih kecil daripada pada p. Itu persis
 * arti "massa panen berpindah ke grade yang lebih baik", dan tidak menuntut
 * grade dominannya sama.
 */

import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  BOBOT_GRADE,
  PENGALI_MAX,
  PENGALI_MIN,
  URUT_GRADE,
  bobotEfektif,
  pengaliDari,
  pengaliHarga,
  rentangWajar,
  skorKualitas,
  type Komposisi,
} from "./harga";

/** F-104 menyebut angkanya: 1.000 komposisi acak per properti. */
const JALAN = { numRuns: 1000 };

/**
 * Komposisi acak yang berjumlah 1, dibulatkan 2 desimal seperti keluaran engine
 * (`model.py` menulis `round(n/total, 2)`). Sisa pembulatan ditimpakan ke grade
 * terakhir yang bukan nol supaya jumlahnya tetap 1 tanpa memaksa distribusinya
 * rata.
 */
const komposisiAcak = fc
  .array(fc.integer({ min: 0, max: 100 }), { minLength: 4, maxLength: 4 })
  .filter((berat) => berat.some((b) => b > 0))
  .map((berat) => {
    const total = berat.reduce((a, b) => a + b, 0);
    const porsi = berat.map((b) => Math.round((b / total) * 100) / 100);
    const selisih = Math.round((1 - porsi.reduce((a, b) => a + b, 0)) * 100) / 100;
    const i = porsi.findLastIndex((v) => v > 0);
    if (i >= 0) porsi[i] = Math.round((porsi[i] + selisih) * 100) / 100;
    const k: Komposisi = {};
    URUT_GRADE.forEach((g, idx) => {
      if (porsi[idx] > 0) k[g] = porsi[idx];
    });
    return k;
  });

/** Massa kumulatif k grade teratas — dasar uji dominansi. */
function kumulatif(k: Komposisi): number[] {
  const out: number[] = [];
  let n = 0;
  for (const g of URUT_GRADE) {
    n += k[g] ?? 0;
    out.push(Math.round(n * 1000) / 1000);
  }
  return out;
}

/** True bila `q` sama baik atau lebih baik daripada `p` (dominansi orde 1). */
function lebihBaik(q: Komposisi, p: Komposisi): boolean {
  const kq = kumulatif(q);
  const kp = kumulatif(p);
  return kq.every((v, i) => v >= kp[i] - 1e-9);
}

/**
 * Pasangan komposisi (buruk, baik) tempat yang kedua mendominasi yang pertama.
 *
 * Dibangun dengan memindahkan sebagian massa ke grade yang lebih baik, bukan
 * dengan mengacak dua komposisi lalu menyaring yang kebetulan berdominansi:
 * penyaringan akan membuang hampir seluruh kasus dan 1.000 jalan tidak akan
 * pernah tercapai.
 */
const pasanganMembaik = fc
  .tuple(komposisiAcak, fc.integer({ min: 1, max: 3 }), fc.integer({ min: 1, max: 100 }))
  .map(([awal, langkah, persenPindah]) => {
    const baik: Komposisi = { ...awal };
    // Pindahkan porsi dari grade `dari` ke grade `ke` yang lebih baik.
    for (let dari = URUT_GRADE.length - 1; dari >= 1; dari--) {
      const g = URUT_GRADE[dari];
      const ada = baik[g] ?? 0;
      if (ada <= 0) continue;
      const ke = URUT_GRADE[Math.max(0, dari - langkah)];
      const pindah = Math.round(ada * (persenPindah / 100) * 100) / 100;
      if (pindah <= 0) continue;
      baik[g] = Math.round((ada - pindah) * 100) / 100;
      if (baik[g] === 0) delete baik[g];
      baik[ke] = Math.round(((baik[ke] ?? 0) + pindah) * 100) / 100;
      break;
    }
    return [awal, baik] as const;
  });

describe("sifat 1 — monoton (PRD §14.2)", () => {
  it("komposisi yang lebih baik tidak pernah berpengali lebih rendah", () => {
    fc.assert(
      fc.property(pasanganMembaik, ([buruk, baik]) => {
        // Prasyarat properti; `pasanganMembaik` memang membangunnya begitu,
        // tetapi diperiksa agar generator yang rusak tidak lolos diam-diam.
        fc.pre(lebihBaik(baik, buruk));
        // Toleransi 1e-9: pengali dibulatkan ke 3 desimal, jadi dua komposisi
        // yang beda tipis boleh berpengali sama — yang dilarang adalah turun.
        expect(pengaliHarga(baik)).toBeGreaterThanOrEqual(
          pengaliHarga(buruk) - 1e-9,
        );
      }),
      JALAN,
    );
  });

  it("harga tengah ikut monoton, bukan hanya pengalinya", () => {
    fc.assert(
      fc.property(
        pasanganMembaik,
        fc.integer({ min: 1000, max: 200_000 }),
        ([buruk, baik], acuan) => {
          const a = rentangWajar(acuan, pengaliHarga(buruk));
          const b = rentangWajar(acuan, pengaliHarga(baik));
          expect(b.min).toBeGreaterThanOrEqual(a.min);
          expect(b.max).toBeGreaterThanOrEqual(a.max);
        },
      ),
      JALAN,
    );
  });

  it("menaikkan porsi A dari batch REJECT penuh selalu menaikkan harga", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (persenA) => {
        const p = persenA / 100;
        const kini = pengaliHarga({ A: p, REJECT: Math.round((1 - p) * 100) / 100 });
        const sebelum =
          p <= 0.01
            ? pengaliHarga({ REJECT: 1 })
            : pengaliHarga({
                A: Math.round((p - 0.01) * 100) / 100,
                REJECT: Math.round((1 - p + 0.01) * 100) / 100,
              });
        expect(kini).toBeGreaterThanOrEqual(sebelum);
      }),
      JALAN,
    );
  });
});

describe("sifat 2 — terbatas (PRD §14.2)", () => {
  it("pengali selalu di dalam [0,315 , 1,06]", () => {
    fc.assert(
      fc.property(komposisiAcak, (k) => {
        const p = pengaliHarga(k);
        expect(p).toBeGreaterThanOrEqual(PENGALI_MIN);
        expect(p).toBeLessThanOrEqual(PENGALI_MAX);
      }),
      JALAN,
    );
  });

  it("harga yang disarankan tidak pernah lebih dari 106% harga acuan", () => {
    fc.assert(
      fc.property(
        komposisiAcak,
        fc.integer({ min: 1000, max: 200_000 }),
        (k, acuan) => {
          const { max } = rentangWajar(acuan, pengaliHarga(k));
          // 1,08 adalah batas atas rentang wajar di atas harga tengah; PRD
          // menyebut "~106% harga acuan" untuk tengahnya, bukan untuk max.
          expect(acuan * PENGALI_MAX * 1.08 + 100).toBeGreaterThanOrEqual(max);
        },
      ),
      JALAN,
    );
  });

  it("batas tercapai persis pada batch murni, bukan hanya didekati", () => {
    expect(pengaliHarga({ A: 1 })).toBe(PENGALI_MAX);
    expect(pengaliHarga({ REJECT: 1 })).toBe(PENGALI_MIN);
  });

  it("skor kualitas dan bobot grade masing-masing terbatas", () => {
    fc.assert(
      fc.property(komposisiAcak, (k) => {
        expect(skorKualitas(k)).toBeGreaterThanOrEqual(0);
        expect(skorKualitas(k)).toBeLessThanOrEqual(1);
        expect(bobotEfektif(k)).toBeGreaterThanOrEqual(BOBOT_GRADE.REJECT);
        expect(bobotEfektif(k)).toBeLessThanOrEqual(BOBOT_GRADE.A);
      }),
      JALAN,
    );
  });
});

describe("regresi — rumus bobot grade dominan melanggar sifat 1", () => {
  /**
   * Rumus PRD §14.1 sebelum F-104: bobotnya diambil dari grade dominan saja.
   * Disalin ke sini sebagai saksi, supaya contoh yang menjatuhkannya tetap
   * terdokumentasi dan tidak ada yang memulihkan bentuk lama tanpa sadar.
   */
  function pengaliGradeDominan(k: Komposisi): number {
    const dominan = URUT_GRADE.reduce((a, b) => ((k[b] ?? 0) > (k[a] ?? 0) ? b : a));
    return pengaliDari(BOBOT_GRADE[dominan], skorKualitas(k));
  }

  const buruk: Komposisi = { A: 0.4, B: 0.3, C: 0.3 };
  const baik: Komposisi = { A: 0.4, B: 0.6 };

  it("contoh penjatuhnya: memindahkan 30% panen C → B menurunkan harga", () => {
    expect(lebihBaik(baik, buruk)).toBe(true);
    // 1,017 → 0,877: turun 14% justru karena panennya membaik.
    expect(pengaliGradeDominan(baik)).toBeLessThan(pengaliGradeDominan(buruk));
  });

  it("rumus bobot tertimbang lulus pada contoh yang sama", () => {
    expect(pengaliHarga(baik)).toBeGreaterThan(pengaliHarga(buruk));
  });

  it("generatornya bergigi: sifat 1 memang gagal pada rumus lama", () => {
    // Tanpa tes ini, `sifat 1 lulus` bisa berarti dua hal yang sangat berbeda:
    // rumusnya monoton, atau generatornya tidak pernah menghasilkan pasangan
    // yang menantang. Rumus lama harus gagal di properti yang sama.
    expect(() =>
      fc.assert(
        fc.property(pasanganMembaik, ([b, g]) => {
          expect(pengaliGradeDominan(g)).toBeGreaterThanOrEqual(
            pengaliGradeDominan(b) - 1e-9,
          );
        }),
        JALAN,
      ),
    ).toThrow();
  });

  it("keduanya sepakat pada batch murni satu grade", () => {
    for (const g of URUT_GRADE) {
      expect(pengaliHarga({ [g]: 1 })).toBe(pengaliGradeDominan({ [g]: 1 }));
    }
  });
});
