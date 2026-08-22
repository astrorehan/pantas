"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { useLocale, useTranslations } from "@/lib/i18n";
import type { StatusPesanan } from "@/lib/types";

export const STEPS: { id: StatusPesanan }[] = [
  { id: "dipesan" },
  { id: "dikonfirmasi" },
  { id: "serah_terima" },
  { id: "selesai" },
];

export const STATUS_LABEL: Record<StatusPesanan, string> = {
  dipesan: "dipesan",
  dikonfirmasi: "dikonfirmasi",
  serah_terima: "serah_terima",
  selesai: "selesai",
};

/** Peringkat tahap; cerminan `urutan_status_pesanan` di migrasi 0013. */
export function urutanStatus(status: StatusPesanan): number {
  return STEPS.findIndex((s) => s.id === status);
}

export function useOrderStatus() {
  const t = useTranslations("pesanan");
  const getStepLabel = (id: StatusPesanan, fallback?: string) => {
    switch (id) {
      case "dipesan":
        return t("step_dipesan");
      case "dikonfirmasi":
        return t("step_dikonfirmasi");
      case "serah_terima":
        return t("step_serah_terima");
      case "selesai":
        return t("step_selesai");
      default:
        return fallback ?? "";
    }
  };
  const getStatusLabel = (id: StatusPesanan, fallback?: string) => {
    switch (id) {
      case "dipesan":
        return t("status_dipesan");
      case "dikonfirmasi":
        return t("status_dikonfirmasi");
      case "serah_terima":
        return t("status_serah_terima");
      case "selesai":
        return t("status_selesai");
      default:
        return fallback ?? "";
    }
  };
  return { getStepLabel, getStatusLabel };
}

const INTL: Record<string, string> = { id: "id-ID", en: "en-US" };

/**
 * Tanggal ringkas untuk kartu daftar — "10 Agu", dan dengan tahun begitu
 * pesanannya bukan dari tahun ini.
 *
 * Kartu pesanan menyebut nomor, berat, lawan transaksi, status, dan total —
 * semuanya kecuali kapan. Dengan enam belas pesanan dalam satu daftar, "kapan"
 * adalah satu-satunya cara pembeli membedakan dua pesanan tomat 200 kg dari
 * petani yang sama.
 */
export function useTanggalRingkas() {
  const { locale } = useLocale();
  return (iso: string | undefined) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const tahunIni = d.getFullYear() === new Date().getFullYear();
    return d.toLocaleDateString(INTL[locale] ?? "id-ID", {
      day: "numeric",
      month: "short",
      ...(tahunIni ? {} : { year: "numeric" }),
    });
  };
}

/**
 * Satu baris: apa yang harus terjadi berikutnya pada pesanan ini, dari sudut
 * pandang yang sedang membacanya.
 *
 * Kartu daftar dulu hanya memasang nama keadaan — "Menunggu Konfirmasi" —
 * yang tidak pernah menyebut siapa yang ditunggu. Bagi petani kalimat itu
 * berarti "kerjakan sekarang"; bagi pembeli, "tidak ada yang perlu Anda
 * lakukan". Halaman detail sudah membedakan keduanya lewat `next_*`; versi
 * sependek satu baris ini membawa perbedaan yang sama ke daftarnya.
 *
 * `null` untuk pesanan selesai: tidak ada langkah berikutnya, dan mengarang
 * satu hanya menambah baris yang tidak berbuat apa-apa.
 */
export function useLangkahKartu() {
  const t = useTranslations("pesanan");
  return (status: StatusPesanan, peran: "petani" | "pembeli") => {
    if (status === "selesai") return null;
    const kunci = `card_next_${peran}_${status}` as
      | "card_next_petani_dipesan"
      | "card_next_petani_dikonfirmasi"
      | "card_next_petani_serah_terima"
      | "card_next_pembeli_dipesan"
      | "card_next_pembeli_dikonfirmasi"
      | "card_next_pembeli_serah_terima";
    return { teks: t(kunci), giliranSaya: peran === "petani" };
  };
}

/**
 * Rel tahap pesanan.
 *
 * Bilah isiannya satu elemen yang melintasi seluruh rel, bukan sekian potong
 * antar-titik: pesanan yang sedang berjalan lebih mudah dibaca sebagai satu
 * perjalanan yang sudah sekian bagian, daripada sebagai empat ruas terpisah
 * yang kebetulan berwarna.
 */
export function StatusStepper({ status }: { status: StatusPesanan }) {
  const { getStepLabel } = useOrderStatus();
  const current = urutanStatus(status);
  const persen = (current / (STEPS.length - 1)) * 100;

  return (
    <ol className="relative flex items-start">
      {/* Rel dasar dan isiannya duduk di belakang titik-titiknya, dipotong di
          tengah titik pertama dan terakhir supaya garisnya tidak menjulur. */}
      <span
        aria-hidden
        className="absolute inset-x-[12.5%] top-3 h-0.5 -translate-y-1/2 rounded-full bg-line"
      />
      <span
        aria-hidden
        className="absolute left-[12.5%] top-3 h-0.5 -translate-y-1/2 rounded-full bg-brand transition-[width] duration-500"
        style={{ width: `${persen * 0.75}%` }}
      />

      {STEPS.map((s, i) => {
        const done = i < current || status === "selesai";
        const active = i === current && status !== "selesai";
        return (
          <li key={s.id} className="relative flex flex-1 flex-col items-center">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                done
                  ? "border-brand bg-brand text-on-brand"
                  : active
                    ? "border-grade-b bg-surface ring-4 ring-grade-b-tint"
                    : "border-line bg-surface"
              }`}
            >
              {done ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : active ? (
                <span className="size-2 rounded-full bg-grade-b" />
              ) : null}
            </span>
            <span
              className={`pt-2 text-center text-[10px] leading-tight ${
                active
                  ? "font-bold text-grade-b"
                  : done
                    ? "font-bold text-brand"
                    : "text-label"
              }`}
            >
              {getStepLabel(s.id)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Kepala halaman pesanan: tahap sekarang, dan — yang selama ini hilang — apa
 * yang harus terjadi berikutnya dan oleh siapa.
 *
 * Judul lama hanya menyebut keadaan ("Menunggu Konfirmasi") tanpa pernah
 * mengatakan siapa yang sedang ditunggu. Kalimat langkah berikutnya datang dari
 * pemanggil karena jawabannya berbeda di dua sisi layar: yang bagi petani
 * berarti "konfirmasi sekarang", bagi pembeli berarti "tunggu petani".
 */
export function StatusHero({
  status,
  lawanLabel,
  langkah,
}: {
  status: StatusPesanan;
  /** Baris kecil di atas judul — "Pembeli: Rina Pradita". */
  lawanLabel: string;
  /** Satu kalimat: apa yang terjadi selanjutnya. */
  langkah: string;
}) {
  const { getStatusLabel } = useOrderStatus();
  const selesai = status === "selesai";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 ${
        selesai
          ? "border-brand/30 surface-brand"
          : "border-line bg-surface"
      }`}
    >
      {/* Sorotan lembut di sudut; menandai kartu ini sebagai kepala halaman
          tanpa menambah satu warna baru ke palet. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-brand/10 blur-2xl"
      />
      <p className="type-label relative text-label">{lawanLabel}</p>
      <h1 className="type-heading-lg relative pt-1 text-ink">
        {getStatusLabel(status)}
      </h1>
      <p className="type-body-md relative max-w-prose pt-2 text-muted">{langkah}</p>

      <div className="relative pt-6">
        <StatusStepper status={status} />
      </div>
    </div>
  );
}

/**
 * Client-rendered because orders now live in localStorage — the server never
 * sees them. Same real, scannable code as before.
 */
export function QrKode({ value, size = "size-44" }: { value: string; size?: string }) {
  const tc = useTranslations("common");
  const [svg, setSvg] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    import("@/lib/qr")
      .then((m) => m.qrSvg(value))
      .then((s) => {
        if (!cancelled) setSvg(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!svg) return <Skeleton className={size} rounded="lg" />;

  return (
    <div
      className={`${size} rounded-lg bg-stone-0 p-3 [&>svg]:size-full`}
      role="img"
      aria-label={tc("qr_code_aria", { value })}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
