import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Telemetri operasional untuk panel admin (F-90 & F-92).
 *
 * Versi pertama endpoint ini mengembalikan objek konstanta: "online", p50 42 ms,
 * p95 118 ms, uptime 99,98% — tanpa pernah menghubungi apa pun. Artinya panel
 * yang seharusnya menjadi bukti operasional saat sesi tanya jawab tetap hijau
 * meski engine-nya mati, dan dua angka latensinya adalah literal di berkas ini.
 *
 * Sekarang setiap angka datang dari satu round-trip yang benar-benar terjadi:
 * `GET {PREDICT_URL}/health` ke FastAPI dan satu kueri termurah ke PostgREST.
 * Yang tidak bisa diukur dilaporkan `null`, bukan ditebak.
 */

/** Ambang di mana layanan masih menjawab tapi sudah tidak layak dipakai. */
const AMBANG_MS = { ai: 1500, db: 800 };
const BATAS_WAKTU_MS = 5000;

type StatusLayanan = "online" | "lambat" | "mati" | "tidak_dikonfigurasi";

interface HasilPing {
  status: StatusLayanan;
  /** Round-trip dari server Next, `null` bila panggilannya tidak pernah terjadi. */
  rtt_ms: number | null;
  galat: string | null;
}

/**
 * `AbortSignal.timeout` tidak dipakai: runtime edge Next 16 punya, tapi
 * `fetch` yang gagal DNS-nya bisa menolak sebelum sinyal sempat menyala, dan
 * pesan galatnya jadi "The operation was aborted" — menyembunyikan penyebab
 * sebenarnya dari operator yang justru sedang mencari penyebab.
 */
async function ping(
  url: string,
  init: RequestInit,
  ambang: number,
): Promise<HasilPing & { badan: unknown }> {
  const kendali = new AbortController();
  const jam = setTimeout(() => kendali.abort(), BATAS_WAKTU_MS);
  const mulai = Date.now();

  try {
    const res = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: kendali.signal,
    });
    const rtt = Date.now() - mulai;

    if (!res.ok) {
      return {
        status: "mati",
        rtt_ms: rtt,
        galat: `HTTP ${res.status}`,
        badan: null,
      };
    }

    let badan: unknown = null;
    try {
      badan = await res.json();
    } catch {
      /* layanan hidup tapi balasannya bukan JSON — statusnya tetap sah */
    }

    return {
      status: rtt > ambang ? "lambat" : "online",
      rtt_ms: rtt,
      galat: null,
      badan,
    };
  } catch (e) {
    return {
      status: "mati",
      rtt_ms: null,
      galat:
        e instanceof Error
          ? e.name === "AbortError"
            ? `Tidak menjawab dalam ${BATAS_WAKTU_MS / 1000} detik`
            : e.message
          : "Gagal menghubungi layanan",
      badan: null,
    };
  } finally {
    // Tanpa ini timernya tetap menyala 5 detik sesudah balasan tiba, dan
    // runtime edge menahan permintaannya hidup sampai timer terakhir padam.
    clearTimeout(jam);
  }
}

/** Payload /health milik FastAPI (ai_engine/api.py). Semua bidangnya opsional:
 *  instance lama yang belum di-deploy ulang hanya mengembalikan `{status:"ok"}`. */
interface TelemetriEngine {
  versi?: string;
  model_hangat?: string[];
  model_tersedia?: string[];
  latensi_ms?: { p50: number; p95: number; maks: number } | null;
  inferensi?: {
    tercatat: number;
    sukses: number;
    rasio_sukses: number | null;
    jendela: number;
  };
  sejak?: string;
}

async function cekAiEngine() {
  const dasar = process.env.NEXT_PUBLIC_PREDICT_URL?.replace(/\/$/, "");
  if (!dasar) {
    return {
      status: "tidak_dikonfigurasi" as StatusLayanan,
      rtt_ms: null,
      galat: "NEXT_PUBLIC_PREDICT_URL kosong, grading berjalan di mode demo.",
      telemetri: null,
    };
  }

  const { badan, ...sisa } = await ping(`${dasar}/health`, { method: "GET" }, AMBANG_MS.ai);
  return { ...sisa, telemetri: (badan as TelemetriEngine) ?? null };
}

async function cekDatabase() {
  const dasar = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const kunci = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!dasar || !kunci) {
    return {
      status: "tidak_dikonfigurasi" as StatusLayanan,
      rtt_ms: null,
      galat: "Supabase belum dikonfigurasi, aplikasi memakai data demo.",
      wilayah: null,
    };
  }

  /*
   * `harga_acuan` limit 1: tabel terkecil yang policy-nya terbuka untuk anon,
   * jadi ping ini menguji jalur yang sama dengan yang dipakai layar publik —
   * jaringan, PostgREST, dan RLS sekaligus — tanpa membaca data siapa pun.
   */
  const hasil = await ping(
    `${dasar}/rest/v1/harga_acuan?select=komoditas&limit=1`,
    { method: "GET", headers: { apikey: kunci, Authorization: `Bearer ${kunci}` } },
    AMBANG_MS.db,
  );

  return {
    status: hasil.status,
    rtt_ms: hasil.rtt_ms,
    galat: hasil.galat,
    wilayah: wilayahDariUrl(dasar),
  };
}

/** Nama proyek Supabase, satu-satunya penanda instance yang aman ditampilkan. */
function wilayahDariUrl(url: string): string | null {
  const cocok = /https?:\/\/([^.]+)\./.exec(url);
  return cocok ? cocok[1] : null;
}

/** Status keseluruhan = layanan terburuk. Satu komponen mati berarti sistem mati. */
function gabung(...daftar: StatusLayanan[]): StatusLayanan {
  const urutan: StatusLayanan[] = ["mati", "tidak_dikonfigurasi", "lambat", "online"];
  for (const s of urutan) if (daftar.includes(s)) return s;
  return "online";
}

export async function GET() {
  // Berbarengan: dua layanan yang tidak saling bergantung, dan operator menunggu
  // di depan layar. Berurutan, panel yang sehat pun butuh dua kali lebih lama.
  const [ai, db] = await Promise.all([cekAiEngine(), cekDatabase()]);

  return NextResponse.json(
    {
      status: gabung(ai.status, db.status),
      timestamp: new Date().toISOString(),
      ai_engine: {
        status: ai.status,
        rtt_ms: ai.rtt_ms,
        galat: ai.galat,
        versi: ai.telemetri?.versi ?? null,
        latensi_ms: ai.telemetri?.latensi_ms ?? null,
        inferensi: ai.telemetri?.inferensi ?? null,
        model_hangat: ai.telemetri?.model_hangat ?? null,
        model_tersedia: ai.telemetri?.model_tersedia ?? null,
        sejak: ai.telemetri?.sejak ?? null,
      },
      database: {
        status: db.status,
        rtt_ms: db.rtt_ms,
        galat: db.galat,
        proyek: db.wilayah,
      },
      lingkungan: process.env.NODE_ENV ?? "production",
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
