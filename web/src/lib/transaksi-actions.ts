import { pesanGalat } from "./data";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { Order } from "./store";
import type { HasilAksiTransaksi } from "./types";

export interface HasilTransisiTransaksi {
  hasil: HasilAksiTransaksi;
  patch?: Partial<Order>;
}

const gagal = (pesan: string): HasilTransisiTransaksi => ({
  hasil: { berhasil: false, pesan },
});

async function clientTransaksi() {
  if (!isSupabaseConfigured) return null;
  return getSupabase();
}

export async function ajukanPembatalanOrder(
  target: Order | undefined,
  aktor: string | undefined,
  alasan: string,
): Promise<HasilTransisiTransaksi> {
  const alasanBersih = alasan.trim();
  if (!target || !aktor) return gagal("Pesanan atau sesi tidak ditemukan.");
  if (alasanBersih.length < 10 || alasanBersih.length > 500) {
    return gagal("Alasan harus 10–500 karakter.");
  }
  if (target.status === "selesai" || (target.status_kasus ?? "normal") !== "normal") {
    return gagal("Pesanan tidak dapat dibatalkan pada keadaan ini.");
  }

  const supabase = await clientTransaksi();
  if (isSupabaseConfigured && !supabase) return gagal("Layanan transaksi tidak tersedia.");
  if (supabase) {
    const { error } = await supabase.rpc("ajukan_pembatalan_order", {
      p_order_id: target.id,
      p_alasan: alasanBersih,
    });
    if (error) return gagal(pesanGalat(error) ?? "Pembatalan gagal disimpan.");
  }

  const sekarang = new Date().toISOString();
  const langsung = target.status === "dipesan";
  return {
    hasil: { berhasil: true },
    patch: {
      status_kasus: langsung ? "dibatalkan" : "pembatalan_diajukan",
      alasan_kasus: alasanBersih,
      diminta_oleh: aktor,
      diminta_pada: sekarang,
      ditanggapi_oleh: langsung ? aktor : undefined,
      ditanggapi_pada: langsung ? sekarang : undefined,
    },
  };
}

export async function tanggapiPembatalanOrder(
  target: Order | undefined,
  aktor: string | undefined,
  setuju: boolean,
): Promise<HasilTransisiTransaksi> {
  if (!target || !aktor) return gagal("Pesanan atau sesi tidak ditemukan.");
  if (target.status_kasus !== "pembatalan_diajukan" || target.diminta_oleh === aktor) {
    return gagal("Permintaan ini harus dijawab oleh pihak lawan.");
  }

  const supabase = await clientTransaksi();
  if (isSupabaseConfigured && !supabase) return gagal("Layanan transaksi tidak tersedia.");
  if (supabase) {
    const { error } = await supabase.rpc("tanggapi_pembatalan_order", {
      p_order_id: target.id,
      p_setuju: setuju,
    });
    if (error) return gagal(pesanGalat(error) ?? "Jawaban pembatalan gagal disimpan.");
  }

  return {
    hasil: { berhasil: true },
    patch: {
      status_kasus: setuju ? "dibatalkan" : "normal",
      ditanggapi_oleh: aktor,
      ditanggapi_pada: new Date().toISOString(),
      ...(setuju
        ? {}
        : { alasan_kasus: undefined, diminta_oleh: undefined, diminta_pada: undefined }),
    },
  };
}

export async function bukaSengketaOrder(
  target: Order | undefined,
  aktor: string | undefined,
  alasan: string,
): Promise<HasilTransisiTransaksi> {
  const alasanBersih = alasan.trim();
  if (!target || !aktor) return gagal("Pesanan atau sesi tidak ditemukan.");
  if (alasanBersih.length < 10 || alasanBersih.length > 500) {
    return gagal("Alasan harus 10–500 karakter.");
  }
  if (target.status === "dipesan" || (target.status_kasus ?? "normal") !== "normal") {
    return gagal("Sengketa belum dapat dibuka pada keadaan ini.");
  }

  const supabase = await clientTransaksi();
  if (isSupabaseConfigured && !supabase) return gagal("Layanan transaksi tidak tersedia.");
  if (supabase) {
    const { error } = await supabase.rpc("buka_sengketa_order", {
      p_order_id: target.id,
      p_alasan: alasanBersih,
    });
    if (error) return gagal(pesanGalat(error) ?? "Sengketa gagal disimpan.");
  }

  return {
    hasil: { berhasil: true },
    patch: {
      status_kasus: "sengketa",
      alasan_kasus: alasanBersih,
      diminta_oleh: aktor,
      diminta_pada: new Date().toISOString(),
      ditanggapi_oleh: undefined,
      ditanggapi_pada: undefined,
    },
  };
}

export async function tandaiPembayaranOrder(
  target: Order | undefined,
  aktor: string | undefined,
): Promise<HasilTransisiTransaksi> {
  if (!target || !aktor || target.pembeli_id !== aktor) {
    return gagal("Hanya pembeli pesanan ini yang dapat menandai pembayaran.");
  }
  if (
    target.status === "dipesan" ||
    (target.status_kasus ?? "normal") !== "normal" ||
    (target.status_pembayaran ?? "belum_dibayar") !== "belum_dibayar"
  ) {
    return gagal("Pembayaran belum dapat ditandai pada keadaan ini.");
  }

  const supabase = await clientTransaksi();
  if (isSupabaseConfigured && !supabase) return gagal("Layanan transaksi tidak tersedia.");
  if (supabase) {
    const { error } = await supabase.rpc("tandai_pembayaran_order", { p_order_id: target.id });
    if (error) return gagal(pesanGalat(error) ?? "Status pembayaran gagal disimpan.");
  }

  return {
    hasil: { berhasil: true },
    patch: {
      status_pembayaran: "ditandai_dibayar",
      pembayaran_ditandai_pada: new Date().toISOString(),
    },
  };
}

export async function konfirmasiPembayaranOrder(
  target: Order | undefined,
  aktor: string | undefined,
): Promise<HasilTransisiTransaksi> {
  if (!target || !aktor || target.petani_id !== aktor) {
    return gagal("Hanya petani pesanan ini yang dapat mengonfirmasi pembayaran.");
  }
  if (
    (target.status_kasus ?? "normal") !== "normal" ||
    target.status_pembayaran !== "ditandai_dibayar"
  ) {
    return gagal("Pembayaran belum ditandai oleh pembeli.");
  }

  const supabase = await clientTransaksi();
  if (isSupabaseConfigured && !supabase) return gagal("Layanan transaksi tidak tersedia.");
  if (supabase) {
    const { error } = await supabase.rpc("konfirmasi_pembayaran_order", {
      p_order_id: target.id,
    });
    if (error) return gagal(pesanGalat(error) ?? "Konfirmasi pembayaran gagal disimpan.");
  }

  return {
    hasil: { berhasil: true },
    patch: {
      status_pembayaran: "dikonfirmasi",
      pembayaran_dikonfirmasi_pada: new Date().toISOString(),
    },
  };
}
