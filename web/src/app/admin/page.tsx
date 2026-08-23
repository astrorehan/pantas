import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Leaf,
  Package,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Truck,
} from "lucide-react";
import { Container } from "@/components/container";
import { Badge, Card } from "@/components/ui";
import { getDampakAgregat, getFaktorEmisi, getPengirimanList, getRuteList } from "@/lib/data";
import { faktorUntuk, formatFaktor, KUNCI_LAINNYA } from "@/lib/emisi";
import { formatRupiah } from "@/lib/format";
import { AiHealthPanel } from "./ai-health-panel";
import { RingkasanPlatformPanel } from "./ringkasan-platform";
import { DaftarRute } from "@/components/daftar-rute";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Dashboard Operator & Admin Koperasi",
  description: "Panel konsol pusat untuk pemantauan platform, perencana konsolidasi rute logistik, dan agregat dampak.",
};

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");
  const dampak = await getDampakAgregat();
  const pengiriman = await getPengirimanList();
  const rute = await getRuteList();
  // View agregat tidak memecah volume per komoditas, jadi kartu ini memakai
  // baris cadangan — faktor dan sitasinya tetap datang dari `emisi_faktor`.
  const faktorAgregat = faktorUntuk(KUNCI_LAINNYA, await getFaktorEmisi());

  return (
    <Container className="flex flex-col gap-8 py-6 lg:py-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <Badge tone="brand" icon={<ShieldCheck className="size-4" />}>
            {t("badge")}
          </Badge>
          <h1 className="type-display-md pt-2 text-ink">{t("title")}</h1>
        </div>

        <Link
          href="/admin/rute"
          className="tap focus-ring inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-brand px-5 font-bold text-white hover:bg-brand-deep"
        >
          <Truck className="size-5" /> {t("btn_route_planner")}
        </Link>
      </div>

      {/* Panel Kesehatan Layanan AI & Database (F-90 & F-92) */}
      <AiHealthPanel />

      {/* Keadaan platform hari ini (F-90) */}
      <RingkasanPlatformPanel />

      {/* Dua tugas operator yang punya layarnya sendiri. Keduanya menulis ke
          audit_log, jadi tautannya berpasangan dengan jejaknya. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TautanTugas
          href="/admin/moderasi"
          ikon={<ShieldAlert className="size-5 text-brand" />}
          judul={t("nav_moderasi")}
          desc={t("nav_moderasi_desc")}
        />
        <TautanTugas
          href="/admin/audit"
          ikon={<ScrollText className="size-5 text-brand" />}
          judul={t("nav_audit")}
          desc={t("nav_audit_desc")}
        />
      </div>

      {/* Klaim dampak kumulatif */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="type-heading-md text-ink">{t("impact_title")}</h2>
          {/* Kalau tidak disebut, empat angka ini terbaca bertentangan dengan
              panel di atasnya: view `dampak_agregat` membuang akun demo (0004),
              panel platform tidak. Pada basis data yang isinya seed, selisihnya
              adalah seluruh isinya. */}
          <p className="type-body-sm max-w-3xl text-muted">{t("impact_note")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="raised" className="flex flex-col gap-2 p-5">
            <span className="type-label flex items-center gap-1.5 text-label">
              <TrendingUp className="size-4 text-brand" /> {t("stat_tx_done")}
            </span>
            <span className="type-display-md text-ink">{dampak.transaksi_selesai}</span>
            <span className="type-body-sm text-muted">{t("stat_tx_val", { val: formatRupiah(dampak.nilai_transaksi) })}</span>
          </Card>

          <Card variant="raised" className="flex flex-col gap-2 p-5">
            <span className="type-label flex items-center gap-1.5 text-label">
              <Package className="size-4 text-brand" /> {t("stat_volume")}
            </span>
            <span className="type-display-md text-ink">{t("val_ton", { val: (dampak.kg_tersalurkan / 1000).toFixed(1) })}</span>
            <span className="type-body-sm text-muted">{t("val_kg_harvest", { val: dampak.kg_tersalurkan.toLocaleString("id-ID") })}</span>
          </Card>

          <Card variant="raised" className="flex flex-col gap-2 p-5">
            <span className="type-label flex items-center gap-1.5 text-label">
              <Truck className="size-4 text-brand" /> {t("stat_distance_saved")}
            </span>
            <span className="type-display-md text-ink">{dampak.km_dihemat} km</span>
            <span className="type-body-sm text-muted">{t("stat_distance_desc")}</span>
          </Card>

          <Card variant="raised" className="flex flex-col gap-2 p-5">
            <span className="type-label flex items-center gap-1.5 text-label">
              <Leaf className="size-4 text-brand" /> {t("stat_co2_saved")}
            </span>
            <span className="type-display-md text-ink">{t("val_ton", { val: dampak.co2e_ton_dihemat })}</span>
            <span className="type-body-sm text-muted" title={faktorAgregat.catatan ?? undefined}>
              {formatFaktor(faktorAgregat.faktor)} {faktorAgregat.satuan}, {faktorAgregat.sumber}
            </span>
          </Card>
        </div>
      </section>

      {/*
        Pengiriman & Perencana Rute Quick Nav.

        `min-w-0` pada kedua anak bukan hiasan. Jalur grid `auto` tidak pernah
        menyusut di bawah min-content butirnya selama butir itu masih
        `min-width: auto`, dan min-content kartu kiri adalah baris alamat
        penjemputan yang ber-`truncate` — satu string nowrap sepanjang 409px.
        Hasilnya jalur selebar 449px di viewport 390px; `overflow-x: clip` di
        cangkang menyembunyikan gejalanya, jadi halaman tidak menggulir tapi
        sisi kanan kartu terpotong diam-diam.
      */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card variant="raised" className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="type-heading-md flex min-w-0 items-center gap-2 text-ink">
              <Truck className="size-5 shrink-0 text-brand" /> {t("pending_pickup_title")}
            </h2>
            <span className="type-mono-sm shrink-0 font-bold text-brand">{t("pending_pickup_count", { count: pengiriman.length })}</span>
          </div>
          <p className="type-body-md text-muted">
            {t("pending_pickup_desc")}
          </p>

          <ul className="flex flex-col divide-y divide-line">
            {pengiriman.map((p) => (
              <li key={p.id} className="type-body-sm flex items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <span className="block truncate font-bold text-ink">{p.petani} · {p.komoditas}</span>
                  <span className="block truncate text-muted">{p.alamat_jemput}</span>
                </div>
                <span className="type-mono-sm shrink-0 font-bold text-ink">{p.berat_kg} kg</span>
              </li>
            ))}
          </ul>

          <Link
            href="/admin/rute"
            className="type-body-md inline-flex min-h-11 items-center gap-1 font-bold text-brand hover:underline sm:min-h-9"
          >
            {t("link_open_route_planner")} <ArrowRight className="size-4" />
          </Link>
        </Card>

        <DaftarRute awal={rute} />
      </div>
    </Container>
  );
}

function TautanTugas({
  href,
  ikon,
  judul,
  desc,
}: {
  href: string;
  ikon: React.ReactNode;
  judul: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="tap focus-ring flex items-center gap-3 rounded-md bg-surface p-5 shadow-e2 hover:-translate-y-0.5 hover:shadow-e4"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-tint">
        {ikon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="type-heading-sm block text-ink">{judul}</span>
        <span className="type-body-sm block text-muted">{desc}</span>
      </span>
      <ArrowRight aria-hidden className="size-4 shrink-0 text-label" />
    </Link>
  );
}
