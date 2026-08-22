"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Truck } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  SkeletonCard,
  cx,
} from "@/components/ui";
import { getPengirimanList, pengirimanMilikPetani } from "@/lib/data";
import { formatAngka } from "@/lib/format";
import { checklistUntuk, ringkasChecklist } from "@/lib/rantai-dingin";
import {
  kunciMetode,
  kunciStatus,
  nadaStatus,
  pengirimanBerjalan,
} from "@/lib/pengiriman-tampilan";
import type { Pengiriman } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

/**
 * Daftar penjemputan milik satu petani.
 *
 * Sebelumnya `/petani/logistik` langsung merender satu muatan — selalu baris
 * pertama yang dikembalikan basis data — sehingga petani dengan dua pengiriman
 * berjalan tidak punya cara memilih yang mana. Layar ini yang memilih; detail
 * dan checklistnya pindah ke `/petani/logistik/[id]`.
 *
 * Komponen klien karena penyaringan pemilik butuh sesi: tabel `pengiriman`
 * dibaca publik (halaman lacak memerlukannya tanpa login), jadi tanpa saringan
 * di sini layar ini akan memajang muatan petani lain.
 */
export default function DaftarLogistikPage() {
  const t = useTranslations("logistik");
  const store = useStore();
  const [semua, setSemua] = useState<Pengiriman[] | null>(null);

  useEffect(() => {
    let aktif = true;
    void getPengirimanList().then((d) => {
      if (aktif) setSemua(d);
    });
    return () => {
      aktif = false;
    };
  }, []);

  const milikSaya = semua
    ? pengirimanMilikPetani(semua, {
        nama: store.sesi?.nama,
        orderIds: store.orders.map((o) => o.id),
      })
    : [];
  const berjalan = milikSaya.filter(pengirimanBerjalan);
  const selesai = milikSaya.filter((p) => !pengirimanBerjalan(p));

  return (
    <>
      <BackBar title={t("back_title")} href="/petani" />

      <Container className="flex flex-col gap-6 py-6 lg:py-10">
        <header className="flex flex-col gap-2">
          <Badge tone="brand" icon={<Truck aria-hidden className="size-4" />}>
            {t("badge")}
          </Badge>
          <h1 className="type-display-md text-ink">{t("list_heading")}</h1>
          <p className="type-body-md max-w-prose text-muted">{t("list_lead")}</p>
        </header>

        {semua === null ? (
          <div className="flex flex-col gap-3" aria-busy>
            <span className="sr-only">{t("list_loading")}</span>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : milikSaya.length === 0 ? (
          <EmptyState
            icon={<Truck />}
            title={t("list_empty_title")}
            description={t("list_empty_desc")}
            action={
              <ButtonLink href="/petani/pesanan" size="lg">
                {t("list_empty_cta")}
              </ButtonLink>
            }
          />
        ) : (
          <>
            {berjalan.length > 0 && (
              <Bagian
                judul={t("list_active")}
                hitungan={t("list_count", { count: berjalan.length })}
                daftar={berjalan}
              />
            )}
            {selesai.length > 0 && (
              <Bagian
                judul={t("list_done")}
                hitungan={t("list_count", { count: selesai.length })}
                daftar={selesai}
              />
            )}
          </>
        )}
      </Container>
    </>
  );
}

function Bagian({
  judul,
  hitungan,
  daftar,
}: {
  judul: string;
  hitungan: string;
  daftar: Pengiriman[];
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="type-heading-md text-ink">{judul}</h2>
        <span className="type-body-sm tnum text-muted">{hitungan}</span>
      </div>
      <ul className="grid gap-3 lg:grid-cols-2">
        {daftar.map((p) => (
          <li key={p.id}>
            <KartuPengiriman pengiriman={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function KartuPengiriman({ pengiriman }: { pengiriman: Pengiriman }) {
  const t = useTranslations("logistik");
  const daftar = checklistUntuk(pengiriman.komoditas ?? "");
  const ringkas = ringkasChecklist(pengiriman.checklist, daftar);
  const persen = Math.round((ringkas.selesai / ringkas.total) * 100);

  return (
    <Link
      href={`/petani/logistik/${pengiriman.id}`}
      className="tap tap-press focus-ring block h-full rounded-lg"
      aria-label={`${pengiriman.komoditas ?? ""} — ${t("open_detail")}`}
    >
      <Card
        variant="interactive"
        className="rise flex h-full flex-col gap-4 p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="type-heading-md truncate text-ink">
              {pengiriman.komoditas}
            </p>
            <p className="type-body-sm pt-0.5 text-muted">
              {t("order_id", { id: pengiriman.order_id })}
            </p>
          </div>
          <Badge tone={nadaStatus(pengiriman.status)}>
            {t(kunciStatus(pengiriman.status) as Parameters<typeof t>[0])}
          </Badge>
        </div>

        <div className="type-body-sm flex flex-col gap-1.5 text-muted">
          <span className="flex items-start gap-1.5">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-label" />
            <span className="min-w-0">{pengiriman.alamat_jemput}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Truck aria-hidden className="size-4 shrink-0 text-label" />
            {t(kunciMetode(pengiriman.metode) as Parameters<typeof t>[0])}
            {" · "}
            {t("kg_unit", { val: formatAngka(pengiriman.berat_kg ?? 0) })}
          </span>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span
              className={cx(
                "type-body-sm tnum font-bold",
                ringkas.lengkap ? "text-brand-deep" : "text-muted",
              )}
            >
              {t("completed_count", {
                done: ringkas.selesai,
                total: ringkas.total,
              })}
            </span>
            <span className="type-body-sm inline-flex items-center gap-1 font-bold text-brand">
              {t("open_detail")}
              <ArrowRight aria-hidden className="size-4" />
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
            <div
              className={cx(
                "h-full rounded-full",
                ringkas.lengkap ? "bg-brand" : "bg-brand-deep",
              )}
              style={{ width: `${persen}%` }}
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}
