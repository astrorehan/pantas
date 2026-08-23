"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Flame,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge, Card, cx } from "@/components/ui";
import type { BadgeTone } from "@/components/ui";
import { useTranslations } from "@/lib/i18n";

/**
 * Panel kesehatan layanan (F-92).
 *
 * Aturan tunggal berkas ini: tidak ada angka yang tidak diukur. Versi lama
 * menampilkan "42 ms / 118 ms" dan lencana hijau "AI ENGINE: ONLINE" sebagai
 * nilai bawaan JSX — terbaca sebagai telemetri, padahal literal, dan tetap
 * hijau meski engine-nya tidak pernah dihubungi. Kolom yang belum punya jawaban
 * sekarang berbunyi "belum ada data"; layanan yang mati berwarna merah.
 */

type StatusLayanan = "online" | "lambat" | "mati" | "tidak_dikonfigurasi";

interface Telemetri {
  status: StatusLayanan;
  timestamp: string;
  ai_engine: {
    status: StatusLayanan;
    rtt_ms: number | null;
    galat: string | null;
    versi: string | null;
    latensi_ms: { p50: number; p95: number; maks: number } | null;
    inferensi: {
      tercatat: number;
      sukses: number;
      rasio_sukses: number | null;
      jendela: number;
    } | null;
    model_hangat: string[] | null;
    model_tersedia: string[] | null;
    sejak: string | null;
  };
  database: {
    status: StatusLayanan;
    rtt_ms: number | null;
    galat: string | null;
    proyek: string | null;
  };
}

const NADA: Record<StatusLayanan, BadgeTone> = {
  online: "brand",
  lambat: "warn",
  mati: "danger",
  tidak_dikonfigurasi: "neutral",
};

const IKON = {
  online: CheckCircle2,
  lambat: AlertTriangle,
  mati: XCircle,
  tidak_dikonfigurasi: AlertTriangle,
} as const;

/**
 * Satu panggilan, tanpa menyentuh state. Dipisah supaya effect pertama bisa
 * menunggu hasilnya sebelum setState pertama: `setState` sinkron di badan
 * effect memicu render berjenjang, dan aturan `react-hooks/set-state-in-effect`
 * memblokirnya di CI.
 */
async function ambilTelemetri(): Promise<
  { ok: true; data: Telemetri } | { ok: false; pesan: string }
> {
  try {
    const res = await fetch("/api/health", { cache: "no-store" });
    return { ok: true, data: (await res.json()) as Telemetri };
  } catch (e) {
    // Endpoint-nya sendiri tak terjangkau — bukan layanan hilirnya. Bedakan,
    // supaya operator tidak mengejar engine yang sebenarnya sehat.
    return { ok: false, pesan: e instanceof Error ? e.message : String(e) };
  }
}

export function AiHealthPanel() {
  const t = useTranslations("admin");
  const [memuat, setMemuat] = useState(true);
  const [telemetri, setTelemetri] = useState<Telemetri | null>(null);
  const [galatJaringan, setGalatJaringan] = useState<string | null>(null);
  const [dicekPada, setDicekPada] = useState<string | null>(null);

  const terapkan = useCallback(
    (hasil: Awaited<ReturnType<typeof ambilTelemetri>>) => {
      if (hasil.ok) {
        setTelemetri(hasil.data);
        setGalatJaringan(null);
        setDicekPada(new Date().toLocaleTimeString("id-ID"));
      } else {
        setGalatJaringan(hasil.pesan);
        setTelemetri(null);
      }
      setMemuat(false);
    },
    [],
  );

  const cek = useCallback(async () => {
    setMemuat(true);
    terapkan(await ambilTelemetri());
  }, [terapkan]);

  /*
   * Otomatis saat panel muncul. Sebelumnya operator harus menekan "Ping
   * Sekarang" dulu, dan sampai ia menekannya layar menampilkan nilai bawaan
   * yang tampak seperti hasil pengukuran — jadi keadaan paling berbahaya
   * (belum pernah dicek) justru yang paling meyakinkan.
   */
  useEffect(() => {
    let aktif = true;
    void ambilTelemetri().then((hasil) => {
      if (aktif) terapkan(hasil);
    });
    return () => {
      aktif = false;
    };
  }, [terapkan]);

  const ai = telemetri?.ai_engine;
  const db = telemetri?.database;
  const status: StatusLayanan = galatJaringan ? "mati" : (telemetri?.status ?? "mati");
  const StatusIkon = IKON[status];

  return (
    <Card variant="raised" className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-tint text-brand">
            <Activity className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="type-heading-md flex flex-wrap items-center gap-2 text-ink">
              {t("ai_health_title")}
            </h2>
            <p className="type-body-sm text-muted">{t("ai_health_desc")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge tone={NADA[status]} icon={<StatusIkon className="size-3.5" />}>
            {t(`status_${status}`)}
          </Badge>
          <button
            type="button"
            onClick={() => void cek()}
            disabled={memuat}
            className={cx(
              "tap focus-ring type-body-sm inline-flex min-h-11 items-center gap-1.5 rounded-md bg-sunken px-3 font-bold text-ink transition-colors hover:bg-line/40 sm:min-h-9",
              memuat && "cursor-wait opacity-60",
            )}
          >
            <RefreshCw className={cx("size-4 text-brand", memuat && "animate-spin")} />
            <span>{memuat ? t("btn_pinging") : t("btn_ping")}</span>
          </button>
        </div>
      </div>

      {galatJaringan && (
        <p className="type-body-sm rounded-md bg-danger-tint px-3 py-2 font-bold text-danger">
          {t("health_unreachable", { pesan: galatJaringan })}
        </p>
      )}

      <div className="grid gap-4 border-y border-line py-4 sm:grid-cols-2 lg:grid-cols-4">
        <BidangTelemetri
          ikon={<Cpu className="size-3.5 text-brand" />}
          label={t("ai_version_label")}
          nilai={ai?.versi ? `PANTAS Engine ${ai.versi}` : t("no_data")}
          catatan={
            ai?.rtt_ms != null
              ? t("ai_rtt", { val: ai.rtt_ms })
              : (ai?.galat ?? t("ai_version_desc"))
          }
          peringatan={ai?.status === "mati" || ai?.status === "tidak_dikonfigurasi"}
        />

        <BidangTelemetri
          ikon={<Clock className="size-3.5 text-brand" />}
          label={t("ai_latency_label")}
          nilai={
            ai?.latensi_ms
              ? t("ai_latency_val", { p50: ai.latensi_ms.p50, p95: ai.latensi_ms.p95 })
              : t("no_data")
          }
          catatan={
            ai?.latensi_ms
              ? t("ai_latency_desc")
              : t("ai_latency_empty")
          }
        />

        <BidangTelemetri
          ikon={<Flame className="size-3.5 text-brand" />}
          label={t("ai_warm_label")}
          nilai={
            ai?.model_hangat
              ? t("ai_warm_count", {
                  hangat: ai.model_hangat.length,
                  total: ai.model_tersedia?.length ?? ai.model_hangat.length,
                })
              : t("no_data")
          }
          catatan={
            ai?.inferensi && ai.inferensi.rasio_sukses != null
              ? t("ai_success_rate", {
                  val: Math.round(ai.inferensi.rasio_sukses * 100),
                  n: ai.inferensi.tercatat,
                })
              : t("ai_warm_desc")
          }
        />

        <BidangTelemetri
          ikon={<ShieldCheck className="size-3.5 text-brand" />}
          label={t("db_label")}
          nilai={db?.proyek ? `Supabase · ${db.proyek}` : t("no_data")}
          catatan={
            db?.rtt_ms != null
              ? t("db_rtt", { val: db.rtt_ms })
              : (db?.galat ?? t("no_data"))
          }
          peringatan={db?.status === "mati" || db?.status === "tidak_dikonfigurasi"}
        />
      </div>

      <div className="type-body-sm flex flex-wrap items-center justify-between gap-2 text-muted">
        <span>{t("ai_footer_note")}</span>
        <span className="type-mono-sm text-label">
          {dicekPada ? t("db_last_checked", { val: dicekPada }) : t("btn_pinging")}
        </span>
      </div>
    </Card>
  );
}

function BidangTelemetri({
  ikon,
  label,
  nilai,
  catatan,
  peringatan,
}: {
  ikon: React.ReactNode;
  label: string;
  nilai: string;
  catatan: string;
  peringatan?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="type-label flex items-center gap-1 text-label">
        {ikon} {label}
      </span>
      <span className="type-body-md font-bold text-ink">{nilai}</span>
      <span className={cx("type-body-sm", peringatan ? "text-danger" : "text-muted")}>
        {catatan}
      </span>
    </div>
  );
}
