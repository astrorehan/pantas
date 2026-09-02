import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Shared Supabase client (browser + server components).
 *
 * `null` when env vars are absent — every caller falls back to the offline
 * demo data that shipped with the frontend, so the app keeps working without
 * a backend exactly as before (docs/BACKEND.md: demo untuk juri tetap jalan).
 *
 * Diimpor dinamis, dan itu bukan gaya-gayaan: `@supabase/supabase-js` menarik
 * auth, realtime (termasuk klien Phoenix-nya), storage, dan postgrest sekaligus
 * — sekitar 55 KB gzip. Karena `StoreProvider` membungkus seluruh aplikasi,
 * impor statis membuat setiap route — termasuk halaman publik yang tidak pernah
 * menyentuh basis data — membayar 55 KB itu di first-load, dan anggaran NFR-05
 * cuma 180 KB gzip. Sebagai impor dinamis, klien-nya diambil setelah hidrasi,
 * saat kueri pertama benar-benar terjadi.
 *
 * Konsekuensinya: tidak ada lagi `supabase` yang bisa dibaca sinkron. Pemanggil
 * menunggu `getSupabase()`; yang hanya perlu tahu "apakah backend dikonfigurasi"
 * memakai `isSupabaseConfigured` yang tetap sinkron.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

/** Galat aman untuk UI ketika backend nyata diharapkan tetapi tidak menjawab. */
export class BackendUnavailableError extends Error {
  constructor(operation: string, options?: { cause?: unknown }) {
    super(`Layanan data tidak tersedia saat ${operation}. Coba lagi setelah koneksi pulih.`, options);
    this.name = "BackendUnavailableError";
  }
}

/**
 * Demo hanya boleh aktif karena konfigurasi memang sengaja tidak dipasang.
 * Begitu env Supabase ada, kegagalan atau respons tak sah harus terlihat dan
 * tidak boleh diganti diam-diam dengan angka, transaksi, atau bukti contoh.
 */
export function gagalBackend(operation: string, cause?: unknown): never {
  console.error(`[pantas] backend gagal saat ${operation}:`, cause);
  throw new BackendUnavailableError(operation, { cause });
}

export function pastikanModeDemo(operation: string, cause?: unknown): void {
  if (isSupabaseConfigured) gagalBackend(operation, cause);
}

let clientPromise: Promise<SupabaseClient<Database> | null> | null = null;

/**
 * Klien bersama, dimuat sekali lalu dipakai ulang. Mengembalikan `null` bila
 * env belum diisi — bentuk yang sama dengan `supabase` yang lama, jadi cabang
 * fallback demo di pemanggil tidak berubah.
 */
export function getSupabase(): Promise<SupabaseClient<Database> | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient<Database>(url as string, key as string),
  );
  return clientPromise;
}

/**
 * Upload a camera capture (data URL) to the `panen` bucket under the user's
 * folder. Returns the public URL, or null when not configured / upload fails
 * (callers keep the local data URL in that case).
 */
export async function uploadCapture(
  dataUrl: string,
  userId: string,
): Promise<string | null> {
  if (!dataUrl.startsWith("data:")) return null;
  const supabase = await getSupabase();
  if (!supabase) return null;
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${userId}/panen-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("panen").upload(path, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: false,
    });
    if (error) throw error;
    return supabase.storage.from("panen").getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.warn("[pantas] unggah capture gagal, pakai data URL lokal:", e);
    return null;
  }
}
