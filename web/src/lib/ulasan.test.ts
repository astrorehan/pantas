/**
 * Tes aturan ulasan (F-42).
 *
 * Aturan di sini menggandakan kebijakan RLS `ulasan` di migrasi 0011 — tes ini
 * yang menjaga keduanya tetap sama, supaya tombol tidak pernah tampil untuk
 * ulasan yang akan ditolak basis data.
 */

import { describe, expect, it } from "vitest";
import {
  bolehMenilai,
  lawanTransaksi,
  ringkasUlasan,
  type PesananUntukUlasan,
} from "./ulasan";

const PESANAN: PesananUntukUlasan = {
  id: "PNT-0001",
  status: "selesai",
  petani_id: "uid-petani",
  pembeli_id: "uid-pembeli",
  petani: "Pak Warsono",
  pembeli: "CV Saus Nusantara",
};

describe("lawanTransaksi", () => {
  it("memberi pembeli kepada petani dan sebaliknya", () => {
    expect(lawanTransaksi(PESANAN, "uid-petani")).toEqual({
      id: "uid-pembeli",
      nama: "CV Saus Nusantara",
      peran: "pembeli",
    });
    expect(lawanTransaksi(PESANAN, "uid-pembeli")?.peran).toBe("petani");
  });

  it("menolak pihak ketiga dan sesi tanpa uid", () => {
    expect(lawanTransaksi(PESANAN, "uid-lain")).toBeNull();
    expect(lawanTransaksi(PESANAN, undefined)).toBeNull();
  });

  it("menolak pesanan demo yang tidak menyimpan id kedua pihak", () => {
    const tanpaId: PesananUntukUlasan = { ...PESANAN, pembeli_id: undefined };
    expect(lawanTransaksi(tanpaId, "uid-petani")).toBeNull();
  });
});

describe("bolehMenilai", () => {
  it("mengizinkan kedua pihak sesudah pesanan selesai", () => {
    expect(bolehMenilai(PESANAN, "uid-petani", [])).toEqual({
      boleh: true,
      alasan: null,
    });
    expect(bolehMenilai(PESANAN, "uid-pembeli", []).boleh).toBe(true);
  });

  it("menolak sebelum pesanan selesai", () => {
    const berjalan = { ...PESANAN, status: "dikirim" };
    expect(bolehMenilai(berjalan, "uid-petani", [])).toEqual({
      boleh: false,
      alasan: "belum_selesai",
    });
  });

  it("menolak pihak ketiga", () => {
    expect(bolehMenilai(PESANAN, "uid-lain", []).alasan).toBe("bukan_pihak");
  });

  it("menolak penilaian kedua dari orang yang sama", () => {
    const sudah = [{ penilai_id: "uid-petani" }];
    expect(bolehMenilai(PESANAN, "uid-petani", sudah).alasan).toBe("sudah_menilai");
    // Lawannya belum menilai, jadi haknya tidak ikut hangus.
    expect(bolehMenilai(PESANAN, "uid-pembeli", sudah).boleh).toBe(true);
  });
});

describe("ringkasUlasan", () => {
  it("menghitung rata-rata satu desimal seperti trigger profiles.rating", () => {
    expect(ringkasUlasan([{ bintang: 5 }, { bintang: 4 }, { bintang: 4 }])).toEqual({
      rata: 4.3,
      jumlah: 3,
    });
  });

  it("tidak mengarang bintang untuk profil tanpa ulasan", () => {
    expect(ringkasUlasan([])).toEqual({ rata: 0, jumlah: 0 });
  });

  it("membulatkan ke atas pada setengah", () => {
    expect(ringkasUlasan([{ bintang: 4 }, { bintang: 5 }]).rata).toBe(4.5);
  });
});
