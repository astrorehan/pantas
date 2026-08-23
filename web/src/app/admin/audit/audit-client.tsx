"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  ScanLine,
  ScrollText,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
} from "lucide-react";
import { Badge, EmptyState, Skeleton, cx } from "@/components/ui";
import { getAuditLog, type BarisAudit } from "@/lib/data-admin";
import { useLocale, useTranslations } from "@/lib/i18n";

/**
 * Jejak audit (F-62).
 *
 * Tabel `audit_log` sudah ada sejak migrasi 0004 dan policy-nya menyebut peran
 * admin sebagai satu-satunya pembaca — tapi tidak ada satu pun layar yang
 * pernah membacanya, jadi setiap baris yang ditulis sistem selama ini masuk ke
 * ruangan tanpa pintu. Ini pintunya.
 *
 * Dirender di klien karena kebijakan barisnya bergantung `auth.uid()`, dan
 * klien Supabase di sisi server berjalan tanpa sesi: dirender di server,
 * halaman ini akan selalu kosong justru bagi operator yang berhak melihatnya.
 */

const INTL: Record<string, string> = { id: "id-ID", en: "en-US" };

/**
 * Aksi yang punya nama manusia di kamus. Yang tidak terdaftar tetap tampil —
 * dengan kode mentahnya — karena baris audit yang ditulis versi berikutnya
 * tidak boleh menghilang dari layar hanya karena terjemahannya belum ada.
 */
const AKSI_DIKENAL = {
  "listing.sembunyikan": { ikon: EyeOff, kunci: "aksi_listing_sembunyikan" },
  "listing.pulihkan": { ikon: Eye, kunci: "aksi_listing_pulihkan" },
  "listing.terbit": { ikon: Store, kunci: "aksi_listing_terbit" },
  "rute.status": { ikon: Truck, kunci: "aksi_rute_status" },
  "pesanan.status": { ikon: ShoppingCart, kunci: "aksi_pesanan_status" },
  "pesanan.serah_terima": { ikon: CheckCircle2, kunci: "aksi_pesanan_serah_terima" },
  "grading.simpan": { ikon: ScanLine, kunci: "aksi_grading_simpan" },
  "harga_acuan.ubah": { ikon: TrendingUp, kunci: "aksi_harga_acuan_ubah" },
} as const;

type AksiDikenal = keyof typeof AKSI_DIKENAL;

export function AuditClient() {
  const t = useTranslations("admin_audit");
  const { locale } = useLocale();
  const [baris, setBaris] = useState<BarisAudit[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [entitas, setEntitas] = useState<string>("semua");

  useEffect(() => {
    let aktif = true;
    getAuditLog()
      .then((hasil) => {
        if (aktif) setBaris(hasil);
      })
      .finally(() => {
        if (aktif) setMemuat(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  const jenis = useMemo(
    () => ["semua", ...new Set(baris.map((b) => b.entitas))],
    [baris],
  );
  const terlihat = useMemo(
    () => (entitas === "semua" ? baris : baris.filter((b) => b.entitas === entitas)),
    [baris, entitas],
  );

  const waktu = (iso: string) =>
    new Date(iso).toLocaleString(INTL[locale] ?? "id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (memuat && baris.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (baris.length === 0) {
    return (
      <EmptyState
        icon={<ScrollText className="size-8" />}
        title={t("empty_title")}
        description={t("empty_desc")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {jenis.length > 2 && (
        <div role="group" aria-label={t("filter_label")} className="flex flex-wrap gap-2">
          {jenis.map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => setEntitas(j)}
              aria-pressed={entitas === j}
              className={cx(
                "tap tap-press focus-ring type-body-sm inline-flex min-h-11 items-center rounded-full border px-3.5 font-bold sm:min-h-9",
                entitas === j
                  ? "border-brand bg-brand text-on-brand"
                  : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {j === "semua" ? t("filter_all") : j}
            </button>
          ))}
        </div>
      )}

      <ol className="flex flex-col gap-2">
        {terlihat.map((b) => {
          const dikenal = AKSI_DIKENAL[b.aksi as AksiDikenal] ?? null;
          const Ikon = dikenal?.ikon ?? ScrollText;
          const alasan = typeof b.meta?.alasan === "string" ? b.meta.alasan : null;
          const dari = b.meta?.dari == null ? null : String(b.meta.dari);
          const ke = b.meta?.ke == null ? null : String(b.meta.ke);

          return (
            <li
              key={b.id}
              className="flex min-w-0 gap-3 rounded-md border border-line bg-surface p-4"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sunken text-brand">
                <Ikon aria-hidden className="size-4" />
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="type-body-md font-bold text-ink">
                    {dikenal ? t(dikenal.kunci) : b.aksi}
                  </span>
                  {b.entitas_id && (
                    <span className="type-mono-sm text-label">{b.entitas_id}</span>
                  )}
                  {dari && ke && (
                    <Badge tone="neutral">
                      {dari} → {ke}
                    </Badge>
                  )}
                </div>

                {alasan && (
                  <p className="type-body-sm border-s-2 border-line ps-2.5 text-ink">
                    “{alasan}”
                  </p>
                )}

                <span className="type-body-sm text-muted">
                  {t("by_line", {
                    aktor: b.aktor_nama ?? t("actor_unknown"),
                    waktu: waktu(b.created_at),
                  })}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="type-body-sm text-muted">{t("limit_note", { val: baris.length })}</p>
    </div>
  );
}
