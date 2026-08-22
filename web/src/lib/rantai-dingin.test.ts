/**
 * Tes checklist rantai dingin (F-52).
 *
 * Yang dijaga: batas penanganan mengikuti komoditasnya (satu daftar untuk semua
 * berarti salah untuk sebagian), id item stabil karena ia yang tersimpan di
 * `pengiriman.checklist`, dan ringkasan tidak pernah melaporkan lebih dari yang
 * sebenarnya dicentang.
 */

import { describe, expect, it } from "vitest";
import {
  checklistUntuk,
  keluargaKomoditas,
  profilRantaiDingin,
  ringkasChecklist,
} from "./rantai-dingin";

describe("profilRantaiDingin", () => {
  it("memakai profil keluarga, bukan varietas", () => {
    expect(profilRantaiDingin("chili_rawit")).toEqual(
      profilRantaiDingin("chili_merah_besar"),
    );
  });

  it("membedakan komoditas rapuh dari umbi", () => {
    const tomat = profilRantaiDingin("tomato_sayur");
    const wortel = profilRantaiDingin("carrot");
    expect(tomat.wajib).toBe(true);
    expect(wortel.wajib).toBe(false);
    expect(wortel.maks_lapis).toBeGreaterThan(tomat.maks_lapis);
    expect(wortel.jendela_jam).toBeGreaterThan(tomat.jendela_jam);
  });

  it("jatuh ke batas paling hati-hati untuk komoditas tak dikenal", () => {
    const p = profilRantaiDingin("durian_montong");
    expect(p.wajib).toBe(true);
    expect(p.maks_lapis).toBe(3);
  });

  it("tidak meledak untuk id kosong", () => {
    expect(profilRantaiDingin("").maks_lapis).toBe(3);
  });

  it("mengenali label tampilan, bukan hanya id engine", () => {
    // `pengiriman.komoditas` menyimpan label yang dibaca manusia.
    expect(keluargaKomoditas("Cabai Merah Besar")).toBe("chili");
    expect(keluargaKomoditas("Tomat Sayur Merapi")).toBe("tomato");
    expect(keluargaKomoditas("Wortel Grade A")).toBe("carrot");
    expect(profilRantaiDingin("Wortel Grade A").wajib).toBe(false);
  });
});

describe("checklistUntuk", () => {
  it("memakai id yang stabil sebagai kunci penyimpanan", () => {
    expect(checklistUntuk("tomato_sayur").map((i) => i.id)).toEqual([
      "naungan",
      "ventilasi",
      "tumpukan",
      "jendela",
      "dokumen",
    ]);
  });

  it("menyimpan angka batas komoditasnya di labelParams", () => {
    const cabai = checklistUntuk("chili_rawit");
    expect(cabai.find((i) => i.id === "tumpukan")?.labelParams?.layers).toBe(4);
    expect(cabai.find((i) => i.id === "jendela")?.labelParams?.hours).toBe(8);

    const tomat = checklistUntuk("tomato_sayur");
    expect(tomat.find((i) => i.id === "tumpukan")?.labelParams?.layers).toBe(3);
    expect(tomat.find((i) => i.id === "jendela")?.labelParams?.hours).toBe(6);
  });
});

describe("ringkasChecklist", () => {
  const daftar = checklistUntuk("tomato_sayur");

  it("menghitung yang tercentang dan menyebut yang tertinggal", () => {
    const r = ringkasChecklist({ naungan: true, ventilasi: true }, daftar);
    expect(r.selesai).toBe(2);
    expect(r.total).toBe(5);
    expect(r.lengkap).toBe(false);
    expect(r.tertinggal.map((i) => i.id)).toEqual([
      "tumpukan",
      "jendela",
      "dokumen",
    ]);
  });

  it("menganggap checklist kosong sebagai belum satu pun dikerjakan", () => {
    expect(ringkasChecklist(undefined, daftar).selesai).toBe(0);
    expect(ringkasChecklist({}, daftar).lengkap).toBe(false);
  });

  it("mengabaikan kunci asing dari versi daftar lama", () => {
    const r = ringkasChecklist(
      { naungan: true, item_lama_yang_sudah_dihapus: true },
      daftar,
    );
    expect(r.selesai).toBe(1);
    expect(r.selesai).toBeLessThanOrEqual(r.total);
  });

  it("lengkap hanya bila seluruh item dicentang", () => {
    const semua = Object.fromEntries(daftar.map((i) => [i.id, true]));
    const r = ringkasChecklist(semua, daftar);
    expect(r.lengkap).toBe(true);
    expect(r.tertinggal).toEqual([]);
  });

  it("nilai false diperlakukan sama dengan belum dicentang", () => {
    expect(ringkasChecklist({ naungan: false }, daftar).selesai).toBe(0);
  });
});
