import { describe, expect, it } from "vitest";
import { jarakKm, keTitik, titikTengah, titikValid, urutTerdekat } from "./jarak";

/** Koordinat nyata dari seed: pembeli di Umbulharjo, kebun di Pakem. */
const PEMBELI = { lat: -7.7956, lng: 110.3695 };
const PAKEM = { lat: -7.6497, lng: 110.421 };
/** Profil Bandung yang tertinggal dari seed lama. */
const LEMBANG = { lat: -6.8118, lng: 107.6175 };

describe("titikValid", () => {
  it("menolak koordinat yang tidak ada", () => {
    expect(titikValid(null, null)).toBe(false);
    expect(titikValid(undefined, undefined)).toBe(false);
    expect(titikValid(-7.6, null)).toBe(false);
    expect(titikValid(null, 110.4)).toBe(false);
  });

  it("menolak (0, 0), nilai yang ditulis kode sendiri saat kolomnya kosong", () => {
    expect(titikValid(0, 0)).toBe(false);
  });

  it("menerima nol pada satu sumbu saja — khatulistiwa dan Greenwich itu nyata", () => {
    expect(titikValid(0, 110.4)).toBe(true);
    expect(titikValid(-7.6, 0)).toBe(true);
  });

  it("menolak angka di luar batas bola bumi dan NaN", () => {
    expect(titikValid(91, 110)).toBe(false);
    expect(titikValid(-7, 181)).toBe(false);
    expect(titikValid(NaN, 110)).toBe(false);
    expect(titikValid(-7, Infinity)).toBe(false);
  });

  it("menerima koordinat seed yang sah", () => {
    expect(titikValid(PAKEM.lat, PAKEM.lng)).toBe(true);
  });
});

describe("keTitik", () => {
  it("meneruskan koordinat sah apa adanya", () => {
    expect(keTitik(PAKEM.lat, PAKEM.lng)).toEqual(PAKEM);
  });

  it("mengubah koordinat kosong jadi null, bukan jadi titik", () => {
    expect(keTitik(null, null)).toBeNull();
    expect(keTitik(0, 0)).toBeNull();
  });
});

describe("jarakKm", () => {
  it("menghitung jarak nyata Umbulharjo–Pakem", () => {
    // ±17 km lewat garis lurus; angka inilah yang tampil di layar pembeli.
    expect(jarakKm(PEMBELI, PAKEM)).toBeCloseTo(17.2, 1);
  });

  it("menunjukkan bahwa profil Bandung memang ratusan kilometer jauhnya", () => {
    const km = jarakKm(PEMBELI, LEMBANG);
    expect(km).not.toBeNull();
    expect(km as number).toBeGreaterThan(300);
  });

  it("nol untuk titik yang sama", () => {
    expect(jarakKm(PAKEM, PAKEM)).toBe(0);
  });

  it("simetris", () => {
    expect(jarakKm(PEMBELI, PAKEM)).toBe(jarakKm(PAKEM, PEMBELI));
  });

  it("null bila salah satu ujungnya tidak diketahui — bukan 0", () => {
    expect(jarakKm(null, PAKEM)).toBeNull();
    expect(jarakKm(PEMBELI, null)).toBeNull();
    expect(jarakKm(null, null)).toBeNull();
  });
});

describe("urutTerdekat", () => {
  it("mendahulukan yang dekat", () => {
    const lot = [{ km: 322.6 }, { km: 10.9 }, { km: 17.2 }];
    expect(urutTerdekat(lot, (l) => l.km).map((l) => l.km)).toEqual([
      10.9, 17.2, 322.6,
    ]);
  });

  it("menaruh jarak yang tidak diketahui di belakang, bukan di depan", () => {
    // Inilah bug yang dulu: jarak kosong ditulis 0 dan naik ke puncak daftar.
    const lot = [
      { id: "tanpa-koordinat", km: null },
      { id: "jauh", km: 322.6 },
      { id: "dekat", km: 10.9 },
    ];
    expect(urutTerdekat(lot, (l) => l.km).map((l) => l.id)).toEqual([
      "dekat",
      "jauh",
      "tanpa-koordinat",
    ]);
  });

  it("tetap stabil saat semua jaraknya tidak diketahui", () => {
    const lot = [{ id: "a", km: null }, { id: "b", km: null }];
    expect(urutTerdekat(lot, (l) => l.km).map((l) => l.id)).toEqual(["a", "b"]);
  });

  it("tidak mengubah array aslinya", () => {
    const lot = [{ km: 30 }, { km: 10 }];
    urutTerdekat(lot, (l) => l.km);
    expect(lot[0].km).toBe(30);
  });
});

describe("titikTengah", () => {
  it("null bila tidak ada satu pun koordinat", () => {
    expect(titikTengah([])).toBeNull();
  });

  it("titik itu sendiri bila hanya ada satu", () => {
    expect(titikTengah([PAKEM])).toEqual(PAKEM);
  });

  it("berada di antara dua titik", () => {
    const tengah = titikTengah([PEMBELI, PAKEM]);
    expect(tengah?.lat).toBeCloseTo((PEMBELI.lat + PAKEM.lat) / 2, 6);
    expect(tengah?.lng).toBeCloseTo((PEMBELI.lng + PAKEM.lng) / 2, 6);
  });
});
