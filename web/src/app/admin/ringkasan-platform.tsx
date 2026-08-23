"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  ScanLine,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { Badge, Card, Skeleton, cx } from "@/components/ui";
import { getRingkasanPlatform } from "@/lib/data-admin";
import { formatRupiah, formatRupiahRingkas } from "@/lib/format";
import type { RingkasanPlatform, StatusPesanan } from "@/lib/types";
import { useTranslations } from "@/lib/i18n";

/**
 * Keadaan platform hari ini (F-90).
 *
 * Dirender di klien dengan alasan yang sama seperti `DaftarRute`, tapi lebih
 * keras: kueri pesanan dan grading tunduk pada RLS, dan klien Supabase di sisi
 * server berjalan tanpa sesi. Dirender di server, panel ini akan menampilkan
 * nol pesanan kepada operator yang justru sedang mengawasi pesanan — bukan
 * karena tidak ada, melainkan karena `auth.uid()` di sana null.
 */

const URUT_STATUS: StatusPesanan[] = [
  "dipesan",
  "dikonfirmasi",
  "serah_terima",
  "selesai",
];

const WARNA_STATUS: Record<StatusPesanan, string> = {
  dipesan: "bg-grade-c",
  dikonfirmasi: "bg-brand",
  serah_terima: "bg-clay-500",
  selesai: "bg-grade-a",
};

export function RingkasanPlatformPanel() {
  const t = useTranslations("admin");
  const [data, setData] = useState<RingkasanPlatform | null>(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    let aktif = true;
    getRingkasanPlatform()
      .then((hasil) => {
        if (aktif) setData(hasil);
      })
      .finally(() => {
        if (aktif) setMemuat(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  if (memuat && !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  const berjalan = data.pesanan.total - data.pesanan.selesai;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="type-heading-md text-ink">{t("platform_title")}</h2>
        {data.sumber === "demo" && (
          <Badge tone="warn">{t("source_demo")}</Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UbinPlatform
          ikon={<Users className="size-4 text-brand" />}
          label={t("platform_users")}
          nilai={String(data.pengguna.total)}
          catatan={t("platform_users_desc", {
            petani: data.pengguna.petani,
            pembeli: data.pengguna.pembeli,
          })}
          jejak={
            data.pengguna.demo > 0
              ? t("platform_users_demo", { val: data.pengguna.demo })
              : null
          }
        />

        <UbinPlatform
          ikon={<Store className="size-4 text-brand" />}
          label={t("platform_listings")}
          nilai={String(data.listing.tayang)}
          catatan={t("platform_listings_desc", { total: data.listing.total })}
          jejak={
            data.listing.disembunyikan > 0
              ? t("platform_listings_hidden", { val: data.listing.disembunyikan })
              : null
          }
          href="/admin/moderasi"
          hrefLabel={t("platform_listings_link")}
        />

        <UbinPlatform
          ikon={<Wallet className="size-4 text-brand" />}
          label={t("platform_gmv")}
          nilai={formatRupiahRingkas(data.gmv_selesai)}
          catatan={formatRupiah(data.gmv_selesai)}
          jejak={
            data.gmv_berjalan > 0
              ? t("platform_gmv_running", { val: formatRupiahRingkas(data.gmv_berjalan) })
              : null
          }
        />

        <UbinPlatform
          ikon={<ScanLine className="size-4 text-brand" />}
          label={t("platform_grading")}
          nilai={String(data.grading_24j)}
          catatan={t("platform_grading_desc")}
        />
      </div>

      {/* Pesanan per status — satu bilah, bukan empat ubin. Yang dicari operator
          adalah bentuk antreannya: apakah menumpuk di satu tahap. */}
      <Card variant="raised" className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="type-heading-sm flex items-center gap-2 text-ink">
            <ClipboardList className="size-4 text-brand" /> {t("platform_orders")}
          </h3>
          <span className="type-body-sm text-muted">
            {t("platform_orders_running", { berjalan, total: data.pesanan.total })}
          </span>
        </div>

        {data.pesanan.total === 0 ? (
          <p className="type-body-sm text-muted">{t("platform_orders_empty")}</p>
        ) : (
          <>
            <div
              className="flex h-2.5 w-full overflow-hidden rounded-full bg-sunken"
              role="img"
              aria-label={URUT_STATUS.map(
                (s) => `${t(`status_pesanan_${s}`)}: ${data.pesanan[s]}`,
              ).join(", ")}
            >
              {URUT_STATUS.map((s) =>
                data.pesanan[s] > 0 ? (
                  <span
                    key={s}
                    className={WARNA_STATUS[s]}
                    style={{ width: `${(data.pesanan[s] / data.pesanan.total) * 100}%` }}
                  />
                ) : null,
              )}
            </div>

            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {URUT_STATUS.map((s) => (
                <li key={s} className="type-body-sm flex items-center gap-1.5 text-muted">
                  <span className={cx("size-2.5 shrink-0 rounded-full", WARNA_STATUS[s])} />
                  {t(`status_pesanan_${s}`)}
                  <span className="tnum font-bold text-ink">{data.pesanan[s]}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </section>
  );
}

function UbinPlatform({
  ikon,
  label,
  nilai,
  catatan,
  jejak,
  href,
  hrefLabel,
}: {
  ikon: React.ReactNode;
  label: string;
  nilai: string;
  catatan: string;
  jejak?: string | null;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <Card
      variant="raised"
      className={cx(
        "relative flex flex-col gap-1 p-5",
        href && "tap hover:-translate-y-0.5 hover:shadow-e4",
      )}
    >
      {href && (
        <Link
          href={href}
          aria-label={hrefLabel}
          className="focus-ring absolute inset-0 z-0 rounded-md"
        />
      )}
      <span className="type-label flex items-center gap-1.5 text-label">
        {ikon} {label}
        {href && <ArrowRight aria-hidden className="ms-auto size-4 text-label" />}
      </span>
      <span className="type-display-md tnum text-ink">{nilai}</span>
      <span className="type-body-sm text-muted">{catatan}</span>
      {jejak && <span className="type-body-sm font-bold text-brand">{jejak}</span>}
    </Card>
  );
}
