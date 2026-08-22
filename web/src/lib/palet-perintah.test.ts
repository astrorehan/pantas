/**
 * Tes indeks & peringkat palet perintah (F-84).
 *
 * Yang dijaga di sini adalah dua hal yang paling mudah rusak diam-diam:
 * isi indeks per peran (palet tidak boleh menawarkan layar yang akan ditolak
 * `RequireRole`) dan urutan hasil (kecocokan awal kata harus selalu di atas
 * kecocokan longgar, kalau tidak kotak pencarian terasa acak).
 */

import { describe, expect, it } from "vitest";
import {
  bangunPerintah,
  kelompokkan,
  saringPerintah,
  type Perintah,
} from "./palet-perintah";

const LISTINGS = [
  { id: "LOT-001", nama: "Tomat Sayur Grade A", grade: "A", harga_per_kg: 9500 },
  { id: "LOT-002", nama: "Cabai Rawit Campur", grade: "B", harga_per_kg: 42000 },
];

const PESANAN = [
  { id: "o1", kode: "PNT-2401", nama: "Tomat Sayur", status: "menunggu_jemput" },
  { id: "o2", kode: "PNT-2402", nama: "Wortel", status: "selesai" },
];

const petani = () =>
  bangunPerintah({ role: "petani", listings: LISTINGS, pesanan: PESANAN });
const pembeli = () =>
  bangunPerintah({ role: "pembeli", listings: [], pesanan: PESANAN });
const admin = () => bangunPerintah({ role: "admin", listings: [], pesanan: [] });

const label = (hasil: Perintah[]) => hasil.map((p) => p.label);

describe("bangunPerintah", () => {
  it("hanya mengindeks route milik peran aktif", () => {
    const rutePembeli = pembeli()
      .filter((p) => p.kelompok === "rute")
      .map((p) => p.href ?? "");

    expect(rutePembeli.some((h) => h.startsWith("/petani"))).toBe(false);
    expect(rutePembeli).toContain("/pembeli/peta");
    // Halaman publik tetap ikut: keduanya dipakai saat presentasi ke juri.
    expect(rutePembeli).toContain("/tentang/model");
  });

  it("menawarkan Pindai baru hanya untuk petani", () => {
    expect(petani().some((p) => p.aksi === "pindai")).toBe(true);
    expect(pembeli().some((p) => p.aksi === "pindai")).toBe(false);
  });

  it("memberi ketiga peran aksi tema, pintasan, dan keluar", () => {
    for (const daftar of [petani(), pembeli(), admin()]) {
      const aksi = daftar.filter((p) => p.kelompok === "aksi").map((p) => p.aksi);
      expect(aksi).toEqual(expect.arrayContaining(["tema", "pintasan", "keluar"]));
    }
  });

  it("tidak mengindeks komoditas atau pesanan untuk admin", () => {
    const daftar = admin();
    expect(daftar.some((p) => p.kelompok === "komoditas")).toBe(false);
    expect(daftar.some((p) => p.kelompok === "pesanan")).toBe(false);
  });

  it("mengarahkan komoditas ke layar yang memang menerimanya", () => {
    const tomatPetani = petani().find((p) => p.id === "komoditas:tomato_sayur");
    const tomatPembeli = pembeli().find((p) => p.id === "komoditas:tomato_sayur");

    expect(tomatPetani?.href).toBe("/petani/pindai?komoditas=tomato_sayur");
    expect(tomatPembeli?.href).toBe("/pembeli?q=Tomat%20Sayur");
  });

  it("menautkan pesanan ke layar pesanan peran aktif", () => {
    expect(petani().find((p) => p.id === "pesanan:o1")?.href).toBe(
      "/petani/pesanan/o1",
    );
    expect(pembeli().find((p) => p.id === "pesanan:o1")?.href).toBe(
      "/pembeli/pesanan/o1",
    );
  });

  it("mengindeks listing sendiri, bukan listing pembeli", () => {
    expect(petani().filter((p) => p.kelompok === "listing")).toHaveLength(2);
    expect(pembeli().some((p) => p.kelompok === "listing")).toBe(false);
  });
});

describe("saringPerintah", () => {
  it("mengembalikan aksi cepat lebih dulu saat kueri kosong", () => {
    expect(saringPerintah(petani(), "")[0].label).toBe("Pindai baru");
  });

  it("mendahulukan awal kata daripada kecocokan di tengah", () => {
    const hasil = saringPerintah(petani(), "harga");
    expect(hasil[0].label).toBe("Rekomendasi harga");
  });

  it("menemukan pesanan lewat kode", () => {
    expect(label(saringPerintah(petani(), "PNT-2402"))).toEqual(["PNT-2402"]);
  });

  it("menemukan listing lewat id lotnya", () => {
    const hasil = saringPerintah(petani(), "LOT-002");
    expect(hasil[0].label).toBe("Cabai Rawit Campur");
  });

  it("menemukan komoditas lewat id engine", () => {
    const hasil = saringPerintah(petani(), "chili_rawit");
    expect(hasil[0].label).toBe("Cabai Rawit Merah");
  });

  it("masih menemukan lewat singkatan longgar", () => {
    // "gtm" bukan substring "Ganti tema"; pencocokan subsequence-lah yang
    // menangkapnya, dan ia harus tetap kalah dari kecocokan yang jelas.
    expect(label(saringPerintah(petani(), "gtm"))).toContain("Ganti tema");
    expect(saringPerintah(petani(), "tema")[0].label).toBe("Ganti tema");
  });

  it("tidak mengembalikan apa pun untuk kueri tanpa kecocokan", () => {
    expect(saringPerintah(petani(), "zzqx")).toEqual([]);
  });

  it("menghormati batas jumlah hasil", () => {
    expect(saringPerintah(petani(), "", 5)).toHaveLength(5);
  });

  it("stabil: hasil tidak berpindah urutan untuk kueri yang sama", () => {
    expect(label(saringPerintah(petani(), "pes"))).toEqual(
      label(saringPerintah(petani(), "pes")),
    );
  });
});

describe("kelompokkan", () => {
  it("membuang kelompok kosong dan menjaga urutan tetap", () => {
    const grup = kelompokkan(saringPerintah(petani(), "tomat"));
    expect(grup.every((g) => g.items.length > 0)).toBe(true);
    expect(grup.map((g) => g.kelompok)).toEqual(
      [...grup.map((g) => g.kelompok)].sort(
        (a, b) =>
          ["aksi", "rute", "komoditas", "listing", "pesanan"].indexOf(a) -
          ["aksi", "rute", "komoditas", "listing", "pesanan"].indexOf(b),
      ),
    );
  });
});
