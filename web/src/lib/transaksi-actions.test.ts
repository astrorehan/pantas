import { describe, expect, it, vi } from "vitest";
import type { Order } from "./store";

vi.mock("./supabase", () => ({
  isSupabaseConfigured: false,
  getSupabase: vi.fn(),
}));

vi.mock("./data", () => ({
  pesanGalat: (error: unknown) => String(error),
}));

import {
  ajukanPembatalanOrder,
  bukaSengketaOrder,
  konfirmasiPembayaranOrder,
  tandaiPembayaranOrder,
  tanggapiPembatalanOrder,
} from "./transaksi-actions";

const PEMBELI = "00000000-0000-0000-0000-000000000001";
const PETANI = "00000000-0000-0000-0000-000000000002";

function order(patch: Partial<Order> = {}): Order {
  return {
    id: "PNT-TEST",
    kode: "PNT-TEST-11",
    status: "dipesan",
    nama: "Tomat",
    grade: "A",
    berat_kg: 10,
    harga_per_kg: 10_000,
    total: 100_000,
    pembeli: "Pembeli",
    petani: "Petani",
    pembeli_id: PEMBELI,
    petani_id: PETANI,
    tanggal: "2026-09-01T00:00:00.000Z",
    ...patch,
  };
}

describe("lifecycle transaksi", () => {
  it("membatalkan langsung sebelum petani mengonfirmasi", async () => {
    const hasil = await ajukanPembatalanOrder(
      order(),
      PEMBELI,
      "Stok tidak lagi diperlukan",
    );

    expect(hasil.hasil.berhasil).toBe(true);
    expect(hasil.patch?.status_kasus).toBe("dibatalkan");
    expect(hasil.patch?.ditanggapi_oleh).toBe(PEMBELI);
  });

  it("memerlukan jawaban pihak lawan setelah konfirmasi", async () => {
    const diajukan = await ajukanPembatalanOrder(
      order({ status: "dikonfirmasi" }),
      PEMBELI,
      "Jadwal penjemputan tidak cocok",
    );
    expect(diajukan.patch?.status_kasus).toBe("pembatalan_diajukan");

    const menunggu = order({
      status: "dikonfirmasi",
      ...diajukan.patch,
    });
    const jawabanSendiri = await tanggapiPembatalanOrder(menunggu, PEMBELI, true);
    expect(jawabanSendiri.hasil.berhasil).toBe(false);

    const disetujui = await tanggapiPembatalanOrder(menunggu, PETANI, true);
    expect(disetujui.hasil.berhasil).toBe(true);
    expect(disetujui.patch?.status_kasus).toBe("dibatalkan");
  });

  it("hanya membuka sengketa sesudah pesanan dikonfirmasi", async () => {
    const terlaluAwal = await bukaSengketaOrder(
      order(),
      PEMBELI,
      "Barang belum sesuai perjanjian",
    );
    expect(terlaluAwal.hasil.berhasil).toBe(false);

    const aktif = await bukaSengketaOrder(
      order({ status: "serah_terima" }),
      PEMBELI,
      "Barang tidak sesuai mutu pesanan",
    );
    expect(aktif.hasil.berhasil).toBe(true);
    expect(aktif.patch?.status_kasus).toBe("sengketa");
  });

  it("mencatat pembayaran sebagai konfirmasi dua pihak", async () => {
    const aktif = order({ status: "dikonfirmasi" });
    const ditandai = await tandaiPembayaranOrder(aktif, PEMBELI);
    expect(ditandai.patch?.status_pembayaran).toBe("ditandai_dibayar");

    const setelahDitandai = order({ status: "dikonfirmasi", ...ditandai.patch });
    const dikonfirmasi = await konfirmasiPembayaranOrder(setelahDitandai, PETANI);
    expect(dikonfirmasi.hasil.berhasil).toBe(true);
    expect(dikonfirmasi.patch?.status_pembayaran).toBe("dikonfirmasi");
  });

  it("menolak peran yang salah pada aksi pembayaran", async () => {
    const aktif = order({ status: "dikonfirmasi" });
    expect((await tandaiPembayaranOrder(aktif, PETANI)).hasil.berhasil).toBe(false);
    expect(
      (
        await konfirmasiPembayaranOrder(
          order({ status: "dikonfirmasi", status_pembayaran: "ditandai_dibayar" }),
          PEMBELI,
        )
      ).hasil.berhasil,
    ).toBe(false);
  });
});
