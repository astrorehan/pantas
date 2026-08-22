import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Jalur kirim chat (F-33).
 *
 * Yang dikunci di sini bukan bentuk datanya, melainkan satu aturan: begitu
 * Supabase terpasang, contoh demo tidak boleh menyentuh percakapan sungguhan.
 * Sebelumnya `kirimPesan` mengembalikan pesan karangan saat insert ditolak, jadi
 * antarmuka menggambar gelembung "terkirim" untuk kalimat yang tidak pernah
 * sampai — kegagalan paling mahal yang bisa dimiliki fitur chat.
 */

const keadaan: { configured: boolean; client: unknown } = {
  configured: false,
  client: null,
};

vi.mock("./supabase", () => ({
  get isSupabaseConfigured() {
    return keadaan.configured;
  },
  getSupabase: async () => keadaan.client,
}));

const { getPesanList, kirimPesan } = await import("./data");
// Bahan demo dimuat data.ts lewat `import()` di jalur fallback; tes memakai
// modul yang sama supaya `DEMO_PESAN` di sini benar-benar array yang ditulisi.
const { DEMO_PESAN } = await import("./demo-data");

/** Klien palsu yang meniru rantai postgrest sependek yang dipakai data.ts. */
function klienGagal(pesanGalat: string) {
  const galat = { error: { message: pesanGalat }, data: null };
  const rantai = {
    select: () => rantai,
    eq: () => rantai,
    order: async () => galat,
    single: async () => galat,
    insert: () => rantai,
  };
  return { from: () => rantai };
}

const KIRIMAN = {
  order_id: "PNT-0101",
  pengirim_id: "a",
  penerima_id: "b",
  isi: "halo",
};

beforeEach(() => {
  keadaan.configured = false;
  keadaan.client = null;
});

describe("kirimPesan", () => {
  it("mengembalikan null saat Supabase menolak insert, tanpa menulis ke data demo", async () => {
    keadaan.configured = true;
    keadaan.client = klienGagal("new row violates row-level security policy");
    const sebelum = DEMO_PESAN.length;

    await expect(kirimPesan(KIRIMAN)).resolves.toBeNull();
    expect(DEMO_PESAN).toHaveLength(sebelum);
  });

  it("mengembalikan null saat klien gagal dimuat padahal env-nya terpasang", async () => {
    keadaan.configured = true;
    keadaan.client = null;
    const sebelum = DEMO_PESAN.length;

    await expect(kirimPesan(KIRIMAN)).resolves.toBeNull();
    expect(DEMO_PESAN).toHaveLength(sebelum);
  });

  it("tetap memakai data demo saat backend memang tidak dikonfigurasi", async () => {
    const sebelum = DEMO_PESAN.length;
    const hasil = await kirimPesan(KIRIMAN);

    expect(hasil?.isi).toBe("halo");
    expect(DEMO_PESAN).toHaveLength(sebelum + 1);
    DEMO_PESAN.length = sebelum;
  });
});

describe("getPesanList", () => {
  it("melempar galat alih-alih menampilkan percakapan demo", async () => {
    keadaan.configured = true;
    keadaan.client = klienGagal("connection terminated");

    await expect(getPesanList({ order_id: "PNT-0101" })).rejects.toThrow();
  });

  it("melempar galat saat klien gagal dimuat padahal env-nya terpasang", async () => {
    keadaan.configured = true;
    keadaan.client = null;

    await expect(getPesanList({ order_id: "PNT-0101" })).rejects.toThrow();
  });

  it("mengembalikan percakapan demo hanya saat backend tidak dikonfigurasi", async () => {
    const list = await getPesanList({ order_id: "PNT-0101" });

    expect(list.length).toBeGreaterThan(0);
    expect(list.every((p) => p.order_id === "PNT-0101")).toBe(true);
  });
});
