import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { KOMODITAS } from "@/lib/komoditas.generated";
import type { Database } from "@/lib/database.types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron Endpoint `/api/cron/harga` ([F-22]).
 *
 * Menyegarkan `public.harga_acuan` — tabel yang dibaca `rekomendasiHarga()`
 * untuk menghitung rentang wajar. Menulisnya butuh service role: RLS di
 * `0001_init.sql` hanya mengizinkan baca publik.
 *
 * Dua sumber angka, dan yang mana yang dipakai selalu dinyatakan apa adanya
 * di kolom `sumber` sehingga ikut tampil di layar harga petani:
 *
 *   1. `PIHPS_FEED_URL` diisi  -> ambil dari sana, sumber "PIHPS DIY".
 *   2. Tidak diisi             -> pakai tabel bawaan di bawah, dan tiap baris
 *                                 membawa `sumber`-nya sendiri: cabai dikutip
 *                                 dari harga produsen Bapanas, sisanya
 *                                 dinyatakan sebagai estimasi. Tidak ada baris
 *                                 yang boleh mengaku tarikan PIHPS.
 *
 * ⚠ Bila feed diisi nanti, pastikan yang ditarik adalah **harga tingkat
 * produsen**, bukan harga eceran — lihat catatan di `HARGA_SIMULASI`.
 */

/** Bentuk yang diharapkan dari `PIHPS_FEED_URL`. */
interface BarisFeed {
  komoditas: string;
  harga: number;
}

interface BarisHarga {
  komoditas: string;
  label: string;
  harga: number;
  sumber: string;
}

/**
 * Cadangan saat feed tidak dikonfigurasi. Kuncinya wajib sama dengan kolom
 * `komoditas` di tabel — kalau meleset, barisnya cuma menambah sampah yang
 * tidak pernah terbaca `rekomendasiHarga()`.
 *
 * ⚠ Semua angka di sini adalah **harga di tingkat petani** (farm gate), bukan
 * harga eceran pasar. Ini koreksi terhadap versi sebelumnya, yang memakai harga
 * konsumen sebagai `harga_acuan` sementara pengali kualitas tertinggi cuma 1,06
 * — akibatnya petani grade A disarankan menjual seharga ~106% harga konsumen,
 * sekitar 2× lipat harga yang sebenarnya bisa ia dapat. Rumus di `lib/harga.ts`
 * tidak disentuh: yang salah bukan pengalinya, melainkan level pasar acuannya.
 *
 * `sumber` ditulis per baris karena tidak semuanya punya derajat bukti yang
 * sama, dan kolom itu tampil apa adanya di layar harga petani:
 *
 *   - Cabai merah besar/keriting/rawit — rata-rata harga produsen nasional
 *     Bapanas 2025 (Open Data Badan Pangan Nasional, dataset "Rata-rata Harga
 *     Pangan Bulanan Tingkat Produsen Nasional"). Ini satu-satunya baris yang
 *     benar-benar tersitasi.
 *   - Sisanya — tomat, timun, wortel, cabai hijau — tidak ada dalam daftar
 *     pangan pokok strategis nasional, jadi tidak ada angka produsen resmi yang
 *     bisa dikutip. Angkanya estimasi kalibrasi, dan `sumber` mengatakannya
 *     begitu. Jangan pernah menuliskannya sebagai "PIHPS DIY".
 */
const SUMBER_BAPANAS = "Bapanas, harga produsen nasional 2025";
const SUMBER_ESTIMASI = "Estimasi kalibrasi PANTAS, tingkat petani";

const HARGA_SIMULASI: Record<string, { harga: number; sumber: string }> = {
  tomato: { harga: 5000, sumber: SUMBER_ESTIMASI },
  tomato_sayur: { harga: 5000, sumber: SUMBER_ESTIMASI },
  tomato_beef: { harga: 4800, sumber: SUMBER_ESTIMASI },
  tomato_ceri: { harga: 11000, sumber: SUMBER_ESTIMASI },
  tomato_merah: { harga: 5200, sumber: SUMBER_ESTIMASI },
  chili: { harga: 34000, sumber: SUMBER_BAPANAS },
  chili_rawit: { harga: 52000, sumber: SUMBER_BAPANAS },
  chili_merah_besar: { harga: 34000, sumber: SUMBER_BAPANAS },
  chili_merah_keriting: { harga: 30000, sumber: SUMBER_BAPANAS },
  chili_hijau_besar: { harga: 18000, sumber: SUMBER_ESTIMASI },
  cucumber: { harga: 3500, sumber: SUMBER_ESTIMASI },
  cucumber_lokal: { harga: 3500, sumber: SUMBER_ESTIMASI },
  cucumber_baby: { harga: 6500, sumber: SUMBER_ESTIMASI },
  carrot: { harga: 6000, sumber: SUMBER_ESTIMASI },
};

/** Label tampil, diambil dari daftar komoditas yang sama dengan sisa aplikasi. */
const LABEL = new Map(KOMODITAS.map((k) => [k.id, k.label]));
const LABEL_DASAR: Record<string, string> = {
  tomato: "Tomat",
  chili: "Cabai",
  cucumber: "Timun",
  carrot: "Wortel",
};

function labelUntuk(komoditas: string): string {
  return LABEL.get(komoditas) ?? LABEL_DASAR[komoditas] ?? komoditas;
}

/**
 * Menarik feed harga eksternal. Mengembalikan `null` bila tidak dikonfigurasi
 * atau gagal — pemanggil lalu jatuh ke angka simulasi, dan `sumber` yang
 * tertulis ikut berubah supaya perbedaannya terlihat, bukan tersembunyi.
 */
async function ambilFeed(url: string): Promise<BarisHarga[] | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`feed menjawab ${res.status}`);
    const json: unknown = await res.json();
    const baris = Array.isArray(json)
      ? (json as BarisFeed[])
      : ((json as { data?: BarisFeed[] }).data ?? []);
    const bersih = baris.filter(
      (b) => typeof b?.komoditas === "string" && Number.isFinite(b?.harga) && b.harga > 0,
    );
    if (bersih.length === 0) throw new Error("feed tidak memuat baris yang sah");
    return bersih.map((b) => ({
      komoditas: b.komoditas,
      label: labelUntuk(b.komoditas),
      harga: Math.round(b.harga),
      sumber: "PIHPS DIY",
    }));
  } catch (e) {
    console.warn("[pantas] PIHPS_FEED_URL gagal dibaca, pakai angka simulasi:", e);
    return null;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const isCronAuthorized =
    process.env.NODE_ENV !== "production" ||
    !process.env.CRON_SECRET ||
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCronAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid CRON_SECRET token" },
      { status: 401 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    // Gagal dengan berisik. Menjawab 200 tanpa menulis apa pun persis cara
    // sebuah cron mati diam-diam selama berminggu-minggu.
    return NextResponse.json(
      {
        success: false,
        error:
          "NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi, jadi harga_acuan tidak dapat ditulis.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const feedUrl = process.env.PIHPS_FEED_URL;
  const dariFeed = feedUrl ? await ambilFeed(feedUrl) : null;
  const baris: BarisHarga[] =
    dariFeed ??
    Object.entries(HARGA_SIMULASI).map(([komoditas, { harga, sumber }]) => ({
      komoditas,
      label: labelUntuk(komoditas),
      harga,
      sumber,
    }));

  const waktu = new Date().toISOString();
  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("harga_acuan")
    .upsert(
      baris.map((b) => ({ ...b, updated_at: waktu })),
      { onConflict: "komoditas" },
    )
    .select("komoditas");

  if (error) {
    return NextResponse.json(
      { success: false, error: `Gagal menulis harga_acuan: ${error.message}` },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      success: true,
      timestamp: waktu,
      // Sejak angka cadangan dipisah per level bukti, satu proses bisa menulis
      // lebih dari satu `sumber` — melaporkan baris pertama saja menyembunyikan
      // sisanya.
      sumber: [...new Set(baris.map((b) => b.sumber))],
      dari_feed: dariFeed !== null,
      komoditas_diperbarui: data?.length ?? 0,
      komoditas: data?.map((d) => d.komoditas) ?? [],
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-PANTAS-Cron-Job": "refresh-harga-acuan",
      },
    },
  );
}
