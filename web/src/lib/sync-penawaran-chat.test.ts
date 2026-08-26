import { beforeEach, describe, expect, it } from "vitest";
import {
  rowToListing,
  DEMO_PENAWARAN_KEY,
  DEMO_PESAN_KEY,
  getStoredDemoPenawaran,
  updateSingleDemoPenawaran,
  getStoredDemoPesan,
  tambahDemoPesan,
} from "./data";
import type { Penawaran, Pesan } from "./types";

// Mock localStorage for Node test environment
const mockStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof globalThis.window === "undefined") {
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: mockStorage,
  };
}
if (typeof globalThis.localStorage === "undefined") {
  (globalThis as unknown as { localStorage: unknown }).localStorage = mockStorage;
}

describe("rowToListing status preservation", () => {
  it("preserves database status accurately in converted Listing object", () => {
    const rawRow = {
      id: "PNT-L-TEST",
      nama: "Tomat Super",
      komoditas: "tomato_sayur",
      grade: "A",
      berat_kg: 100,
      harga_per_kg: 5000,
      gambar: "/img/tomat.jpg",
      petani: "Pak Warsono",
      petani_id: "a0000000-0000-4000-a000-000000000001",
      status: "ditutup",
      lokasi: "Sleman",
      lat: -7.65,
      lng: 110.42,
      created_at: new Date().toISOString(),
      grading_id: null,
      hash_audit: null,
      komposisi: null,
      panen_terakhir: null,
      rating: 4.8,
      satuan: "kg",
      stok_kg: 100,
      transaksi: 10,
      alamat: null,
      catatan_ai: null,
    };

    const listing = rowToListing(rawRow);
    expect(listing.status).toBe("ditutup");
  });

  it("defaults status to 'tayang' when row status is null or missing", () => {
    const rawRow = {
      id: "PNT-L-TEST-2",
      nama: "Cabai Rawit",
      komoditas: "chili_rawit",
      grade: "B",
      berat_kg: 50,
      harga_per_kg: 40000,
      gambar: "/img/cabai.jpg",
      petani: "Pak Warsono",
      petani_id: "a0000000-0000-4000-a000-000000000001",
      status: null,
      lokasi: "Sleman",
      lat: -7.65,
      lng: 110.42,
      created_at: new Date().toISOString(),
      grading_id: null,
      hash_audit: null,
      komposisi: null,
      panen_terakhir: null,
      rating: 5,
      satuan: "kg",
      stok_kg: 50,
      transaksi: 5,
      alamat: null,
      catatan_ai: null,
    };

    const listing = rowToListing(rawRow);
    expect(listing.status).toBe("tayang");
  });
});

describe("Demo Penawaran Sync & Persistence", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("loads and caches default DEMO_PENAWARAN when localStorage is empty", async () => {
    const penawaran = await getStoredDemoPenawaran();
    expect(penawaran.length).toBeGreaterThan(0);
    expect(mockStorage.getItem(DEMO_PENAWARAN_KEY)).not.toBeNull();
  });

  it("updates single demo offer and persists to localStorage", async () => {
    await getStoredDemoPenawaran();
    const updatedOffer: Penawaran = {
      id: "PNW-001",
      listing_id: "PNT-L-0401",
      pembeli_id: "b0000000-0000-4000-b000-000000000001",
      petani_id: "a0000000-0000-4000-a000-000000000001",
      kuantitas_kg: 150,
      harga_per_kg: 4500,
      tanggal_ambil: "2026-08-30",
      status: "diterima",
      created_at: new Date().toISOString(),
      pembeli_nama: "Rina Pradita",
      petani_nama: "Pak Warsono",
    };

    await updateSingleDemoPenawaran(updatedOffer);
    const stored = await getStoredDemoPenawaran();
    const found = stored.find((p) => p.id === "PNW-001");
    expect(found?.status).toBe("diterima");
    expect(found?.harga_per_kg).toBe(4500);
  });

  it("adds new demo offer when id is not yet present", async () => {
    await getStoredDemoPenawaran();
    const newOffer: Penawaran = {
      id: "PNW-TEST-999",
      listing_id: "PNT-L-0402",
      pembeli_id: "b0000000-0000-4000-b000-000000000001",
      petani_id: "a0000000-0000-4000-a000-000000000001",
      kuantitas_kg: 80,
      harga_per_kg: 5000,
      status: "terkirim",
      created_at: new Date().toISOString(),
    };

    await updateSingleDemoPenawaran(newOffer);
    const stored = await getStoredDemoPenawaran();
    const found = stored.find((p) => p.id === "PNW-TEST-999");
    expect(found).toBeDefined();
    expect(found?.kuantitas_kg).toBe(80);
  });
});

describe("Demo Chat Pesan Sync & Persistence", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("loads and caches default DEMO_PESAN when storage is empty", async () => {
    const pesanList = await getStoredDemoPesan();
    expect(pesanList.length).toBeGreaterThan(0);
    expect(mockStorage.getItem(DEMO_PESAN_KEY)).not.toBeNull();
  });

  it("adds new demo message and persists without duplicate ids", async () => {
    await getStoredDemoPesan();
    const testMsg: Pesan = {
      id: "MSG-TEST-123",
      order_id: "PNT-0501",
      pengirim_id: "b0000000-0000-4000-b000-000000000001",
      penerima_id: "a0000000-0000-4000-a000-000000000001",
      isi: "Pesan uji coba demo sync",
      dibaca: false,
      created_at: new Date().toISOString(),
      pengirim_nama: "Rina Pradita",
    };

    await tambahDemoPesan(testMsg);
    const stored = await getStoredDemoPesan();
    const found = stored.find((p) => p.id === "MSG-TEST-123");
    expect(found).toBeDefined();
    expect(found?.isi).toBe("Pesan uji coba demo sync");

    // Add again, should not create duplicate
    await tambahDemoPesan(testMsg);
    const storedAgain = await getStoredDemoPesan();
    const count = storedAgain.filter((p) => p.id === "MSG-TEST-123").length;
    expect(count).toBe(1);
  });
});
