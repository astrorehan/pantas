/**
 * Tes tur berpandu (F-04).
 *
 * Dua hal yang dijaga: setiap langkah menunjuk layar milik perannya sendiri,
 * dan kartu penjelasan tidak pernah keluar dari viewport — termasuk pada ponsel
 * 360px, tempat hampir semua target berada dekat tepi layar.
 */

import { describe, expect, it } from "vitest";
import { langkahTur, posisiTooltip, type Kotak } from "./tur";
import type { Role } from "./types";

const PERAN: Role[] = ["petani", "pembeli", "admin"];

describe("langkahTur", () => {
  it("memberi setiap peran langkah dengan judul, deskripsi, dan target", () => {
    for (const peran of PERAN) {
      const langkah = langkahTur(peran);
      // Tiga, bukan empat. Konsol admin tidak punya layar Akun, jadi ia tidak
      // punya pengalih tema untuk disorot; langkah temanya dulu menyasar
      // `[data-tour="tema"]` yang tidak pernah dirender, jadi tur melewatinya
      // diam-diam dan angka empat di sini menghitung langkah yang tak pernah
      // tampil. Jumlah pastinya dikunci per peran oleh tes-tes di bawah.
      expect(langkah.length).toBeGreaterThanOrEqual(3);
      for (const l of langkah) {
        expect(l.judul.length).toBeGreaterThan(0);
        expect(l.deskripsi.length).toBeGreaterThan(0);
        expect(l.target.length).toBeGreaterThan(0);
      }
    }
  });

  it("mengikuti kelima sorotan yang diminta PRD untuk petani", () => {
    expect(langkahTur("petani").map((l) => l.id)).toEqual([
      "pindai",
      "hasil-terakhir",
      "dampak",
      "tema",
      "palet",
    ]);
  });

  it("melewatkan langkah tema pada admin, yang tidak punya layar Akun", () => {
    expect(langkahTur("admin").map((l) => l.id)).toEqual([
      "ringkasan",
      "rute",
      "palet",
    ]);
  });

  it("menyorot layar Akun untuk langkah tema, tempat pengalihnya benar-benar ada", () => {
    for (const peran of ["petani", "pembeli"] as const) {
      const tema = langkahTur(peran).find((l) => l.id === "tema");
      expect(tema?.target).toEqual([`[data-tour="/${peran}/akun"]`]);
    }
  });

  it("tidak pernah menunjuk route peran lain", () => {
    const awalan: Record<Role, string> = {
      petani: "/petani",
      pembeli: "/pembeli",
      admin: "/admin",
    };
    for (const peran of PERAN) {
      const asing = PERAN.filter((p) => p !== peran).map((p) => awalan[p]);
      for (const l of langkahTur(peran)) {
        for (const t of l.target) {
          expect(asing.some((a) => t.includes(a))).toBe(false);
        }
      }
    }
  });

  it("memakai id langkah yang unik per peran", () => {
    for (const peran of PERAN) {
      const id = langkahTur(peran).map((l) => l.id);
      expect(new Set(id).size).toBe(id.length);
    }
  });
});

describe("posisiTooltip", () => {
  const layar = { width: 1280, height: 800 };
  const kartu = { width: 320, height: 180 };
  const target: Kotak = { top: 200, left: 600, width: 120, height: 40 };

  it("menaruh kartu di bawah target bila ruangnya cukup", () => {
    const p = posisiTooltip(target, layar, kartu);
    expect(p.arah).toBe("bawah");
    expect(p.top).toBe(252);
  });

  it("memindahkannya ke atas bila bawah tidak muat", () => {
    const bawah: Kotak = { top: 720, left: 600, width: 120, height: 40 };
    const p = posisiTooltip(bawah, layar, kartu);
    expect(p.arah).toBe("atas");
    expect(p.top).toBeLessThan(720);
  });

  it("memusatkan kartu terhadap target", () => {
    const p = posisiTooltip(target, layar, kartu);
    expect(p.left).toBe(600 + 60 - 160);
  });

  it("menjepit kartu ke dalam layar untuk target di tepi kanan", () => {
    const kanan: Kotak = { top: 100, left: 1240, width: 40, height: 40 };
    const p = posisiTooltip(kanan, layar, kartu);
    expect(p.left + kartu.width).toBeLessThanOrEqual(layar.width);
    expect(p.left).toBeGreaterThanOrEqual(0);
  });

  it("menjepit kartu ke dalam layar untuk target di tepi kiri", () => {
    const kiri: Kotak = { top: 100, left: 0, width: 40, height: 40 };
    expect(posisiTooltip(kiri, layar, kartu).left).toBeGreaterThanOrEqual(12);
  });

  it("tetap di dalam layar pada ponsel 360px, target mana pun", () => {
    const ponsel = { width: 360, height: 640 };
    const kartuPonsel = { width: 336, height: 200 };
    const kandidat: Kotak[] = [
      { top: 0, left: 0, width: 90, height: 56 },
      { top: 300, left: 135, width: 90, height: 56 },
      { top: 584, left: 270, width: 90, height: 56 },
      { top: 620, left: 340, width: 20, height: 20 },
    ];
    for (const k of kandidat) {
      const p = posisiTooltip(k, ponsel, kartuPonsel);
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.left + kartuPonsel.width).toBeLessThanOrEqual(ponsel.width);
      expect(p.top).toBeGreaterThanOrEqual(0);
      expect(p.top + kartuPonsel.height).toBeLessThanOrEqual(ponsel.height);
    }
  });
});
