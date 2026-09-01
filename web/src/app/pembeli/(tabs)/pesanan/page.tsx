"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronRight, ShoppingCart } from "lucide-react";
import { BrandBar } from "@/components/chrome";
import { Container } from "@/components/container";
import {
  useLangkahKartu,
  useOrderStatus,
  useTanggalRingkas,
} from "@/components/order-bits";
import {
  ButtonLink,
  Card,
  EmptyState,
  GradeBadge,
  Tabs,
  TabItem,
  cx,
} from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { useStore, type Order } from "@/lib/store";
import { LISTINGS } from "@/lib/data";
import { PenawaranChat } from "@/components/penawaran-chat";
import { KartuOngkos } from "@/components/kartu-ongkos";
import { useTranslations } from "@/lib/i18n";

/**
 * Daftar pesanan dan penawaran pembeli.
 */
export default function PesananListPage() {
  const store = useStore();
  const t = useTranslations("pembeli_pesanan");
  const tPesanan = useTranslations("pesanan");
  const tTransaksi = useTranslations("transaksi");
  const { getStatusLabel } = useOrderStatus();
  const tanggalRingkas = useTanggalRingkas();
  const langkahKartu = useLangkahKartu();
  const [activeTab, setActiveTab] = useState("pesanan");
  const [statusFilter, setStatusFilter] = useState<"berjalan" | "selesai">("berjalan");
  const [penawaranFilter, setPenawaranFilter] = useState<"semua" | "aktif" | "arsip">("semua");

  const { berjalan, selesai } = useMemo(() => {
    const berjalan: Order[] = [];
    const selesai: Order[] = [];
    for (const o of store.orders) {
      const kasus = o.status_kasus ?? "normal";
      const arsip = kasus === "dibatalkan" || (o.status === "selesai" && kasus === "normal");
      (arsip ? selesai : berjalan).push(o);
    }
    return { berjalan, selesai };
  }, [store.orders]);

  const penawaran = store.myPenawaran;
  const penawaranAktif = useMemo(
    () => penawaran.filter((p) => p.status === "terkirim" || p.status === "ditawar_balik"),
    [penawaran],
  );
  const penawaranArsip = useMemo(
    () => penawaran.filter((p) => p.status === "diterima" || p.status === "ditolak" || p.status === "kedaluwarsa"),
    [penawaran],
  );

  const statusMapPenawaran: Record<string, string> = {
    terkirim: t("status_waiting"),
    ditawar_balik: t("status_countered"),
    diterima: t("status_accepted"),
    ditolak: t("status_rejected"),
    kedaluwarsa: t("status_expired"),
  };

  const tabItems: TabItem[] = [
    {
      value: "pesanan",
      label: tPesanan("tab_pesanan"),
      count: berjalan.length + selesai.length,
    },
    { value: "penawaran", label: t("tab_penawaran"), count: penawaran.length },
  ];

  const SARINGAN = [
    { value: "berjalan" as const, label: t("tab_active"), count: berjalan.length },
    { value: "selesai" as const, label: t("tab_done"), count: selesai.length },
  ];

  const SARINGAN_PENAWARAN = [
    { value: "semua" as const, label: t("filter_all"), count: penawaran.length },
    { value: "aktif" as const, label: t("filter_active"), count: penawaranAktif.length },
    { value: "arsip" as const, label: t("filter_archive"), count: penawaranArsip.length },
  ];

  const daftar = statusFilter === "selesai" ? selesai : berjalan;
  const daftarPenawaran =
    penawaranFilter === "aktif"
      ? penawaranAktif
      : penawaranFilter === "arsip"
        ? penawaranArsip
        : penawaran;

  return (
    <>
      <BrandBar title={t("title")} />

      <main className="flex-1 py-4">
        <Container>
          <h1 className="type-heading-lg text-ink md:sr-only">{t("title")}</h1>

          <Tabs
            items={tabItems}
            value={activeTab}
            onChange={setActiveTab}
            label={tPesanan("tab_group_label")}
            className="mt-1"
          />

          {activeTab === "pesanan" && (
            <div
              role="group"
              aria-label={tPesanan("filter_label")}
              className="scroll-x flex gap-2 pt-3 pb-4"
            >
              {SARINGAN.map(({ value, label, count }) => {
                const aktif = statusFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={aktif}
                    onClick={() => setStatusFilter(value)}
                    className={cx(
                      "tap focus-ring type-body-md flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 font-bold sm:min-h-9",
                      aktif
                        ? "border-brand bg-brand text-on-brand"
                        : "border-line bg-surface text-muted hover:text-ink",
                    )}
                  >
                    {label}
                    <span className="tnum opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === "penawaran" && (
            <div
              role="group"
              aria-label={t("filter_archive")}
              className="scroll-x flex gap-2 pt-3 pb-4"
            >
              {SARINGAN_PENAWARAN.map(({ value, label, count }) => {
                const aktif = penawaranFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={aktif}
                    onClick={() => setPenawaranFilter(value)}
                    className={cx(
                      "tap focus-ring type-body-md flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 font-bold sm:min-h-9",
                      aktif
                        ? "border-brand bg-brand text-on-brand"
                        : "border-line bg-surface text-muted hover:text-ink",
                    )}
                  >
                    {label}
                    <span className="tnum opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab !== "penawaran" &&
            (daftar.length === 0 ? (
              <EmptyState
                className="mt-4"
                icon={statusFilter === "selesai" ? <CheckCircle2 /> : <ShoppingCart />}
                title={
                  statusFilter === "selesai"
                    ? t("empty_done_title")
                    : t("empty_active_title")
                }
                description={
                  statusFilter === "selesai"
                    ? t("empty_done_desc")
                    : t("empty_active_desc")
                }
                action={
                  statusFilter === "selesai" ? undefined : (
                    <ButtonLink href="/pembeli" size="lg">
                      {t("btn_browse_catalog")}
                    </ButtonLink>
                  )
                }
              />
            ) : (
              <ul className="grid gap-3 pt-1 lg:grid-cols-2 2xl:grid-cols-3">
                {daftar.map((o) => {
                  const tanggal = tanggalRingkas(o.tanggal);
                  const kasus = o.status_kasus ?? "normal";
                  const langkah = kasus === "normal" ? langkahKartu(o.status, "pembeli") : null;
                  const labelKasus =
                    kasus === "pembatalan_diajukan"
                      ? tTransaksi("cancel_requested_title")
                      : kasus === "dibatalkan"
                        ? tTransaksi("cancelled_title")
                        : kasus === "sengketa"
                          ? tTransaksi("dispute_title")
                          : null;
                  return (
                    // `min-w-0`: butir grid punya lebar minimum otomatis
                    // sebesar min-content-nya, dan min-content dari baris meta
                    // yang `truncate` adalah seluruh kalimatnya — teks
                    // `white-space: nowrap` tidak punya titik putus. Tanpa ini
                    // kartunya melebar melewati tepi layar alih-alih
                    // memotong teksnya.
                    <li key={o.id} className="min-w-0">
                      <Link
                        href={`/pembeli/pesanan/${o.id}`}
                        className="tap tap-press focus-ring block h-full rounded-md"
                      >
                        <Card variant="interactive" className="h-full p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="type-body-md truncate font-bold text-ink">
                                {o.nama}
                              </p>
                              <p className="type-body-sm tnum truncate pt-0.5 text-muted">
                                #{o.id} • {o.berat_kg} kg •{" "}
                                {t("farmer_label", { name: o.petani })}
                              </p>
                              {tanggal && (
                                <p className="type-body-sm tnum pt-0.5 text-label">
                                  {tPesanan("card_date_label", { tanggal })}
                                </p>
                              )}
                            </div>
                            <GradeBadge grade={o.grade} size="sm" />
                          </div>

                          <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
                            <p
                              className={`type-body-sm font-bold ${
                                kasus === "dibatalkan" || kasus === "sengketa"
                                  ? "text-danger"
                                  : kasus === "pembatalan_diajukan"
                                    ? "text-clay-700 dark:text-clay-300"
                                    : o.status === "selesai"
                                      ? "text-brand"
                                      : "text-grade-b"
                              }`}
                            >
                              {labelKasus ?? getStatusLabel(o.status)}
                            </p>
                            <p className="type-heading-sm tnum flex items-center gap-1 text-ink">
                              {formatRupiah(o.total)}
                              <ChevronRight aria-hidden className="size-4 text-label" />
                            </p>
                          </div>

                          {/* Untuk pembeli ketiga keadaan yang belum selesai
                              berarti menunggu, bukan mengerjakan — jadi
                              kalimatnya redup, bukan tebal seperti pada layar
                              petani, dan memang menyebut siapa yang ditunggu. */}
                          {langkah && (
                            <p className="type-body-sm flex items-center gap-1.5 pt-3 text-muted">
                              <ArrowRight aria-hidden className="size-3.5 shrink-0" />
                              {langkah.teks}
                            </p>
                          )}
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ))}

          {activeTab === "penawaran" && (
            <>
              {daftarPenawaran.length === 0 ? (
                <EmptyState
                  className="mt-4"
                  icon={<ShoppingCart />}
                  title={
                    penawaranFilter === "arsip"
                      ? t("empty_archive_title")
                      : t("empty_offers_title")
                  }
                  description={
                    penawaranFilter === "arsip"
                      ? t("empty_archive_desc")
                      : t("empty_offers_desc")
                  }
                />
              ) : (
                <ul className="grid gap-3 pt-1 lg:grid-cols-2 2xl:grid-cols-3">
                  {daftarPenawaran.map((p) => {
                    const l =
                      store.myListings.find((x) => x.id === p.listing_id) ??
                      LISTINGS.find((x) => x.id === p.listing_id);

                    // `order_id` ditulis oleh RPC `terima_penawaran` (migrasi
                    // 0017). Sebelum kolom itu ada, sisi pembeli mencocokkan
                    // penawaran dengan pesanan lewat nama dan berat — dan sering
                    // tidak menemukan apa-apa, karena pesanannya memang tidak
                    // pernah sampai ke basis data.
                    const relatedOrder = p.order_id
                      ? store.orders.find((o) => o.id === p.order_id)
                      : undefined;

                    return (
                      <li key={p.id}>
                        <Card className="h-full p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="type-body-md truncate font-bold text-ink">
                                {/* Nama dari join `listings` menang: pembeli
                                    tidak punya lot orang lain di state-nya,
                                    jadi `l` kosong untuk hampir setiap lot di
                                    luar data demo. */}
                                {p.listing_nama ?? l?.nama ?? t("deleted_commodity")}
                              </p>
                              <p className="type-body-sm tnum pt-0.5 text-muted">
                                {p.kuantitas_kg} kg • {t("price_label")}:{" "}
                                {formatRupiah(p.harga_per_kg)}/kg
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
                            <p
                              className={`type-body-sm font-bold ${
                                p.status === "diterima"
                                  ? relatedOrder?.status === "selesai"
                                    ? "text-brand"
                                    : "text-info"
                                  : p.status === "ditolak"
                                    ? "text-danger"
                                    : "text-grade-b"
                              }`}
                            >
                              {p.status === "diterima" && relatedOrder
                                ? `${t("status_accepted")} • ${
                                    relatedOrder.status === "selesai"
                                      ? t("order_linked_done")
                                      : t("order_linked_active")
                                  }`
                                : statusMapPenawaran[p.status] ?? p.status}
                            </p>
                          </div>

                          {l && (
                            <div className="mt-3">
                              {/* Tanpa `konsolidasi`, kartu ini menghitung
                                  tarif penuh. Catatan lamanya menjanjikan
                                  potongan 35% yang tidak pernah masuk ke
                                  totalnya — rute konsolidasi baru diputuskan
                                  koperasi belakangan, jadi janjinya dicabut
                                  alih-alih angkanya dipalsukan. */}
                              <KartuOngkos
                                judul={t("freight_title")}
                                jarakKm={l.jarak_km}
                                beratKg={p.kuantitas_kg}
                              />
                            </div>
                          )}

                          {p.status === "diterima" && (
                            <div
                              className={cx(
                                "mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3",
                                relatedOrder?.status === "selesai"
                                  ? "border-brand/20 bg-brand/5"
                                  : "border-info/20 bg-info/5",
                              )}
                            >
                              <div className="min-w-0">
                                <p className="type-body-sm font-bold text-ink">
                                  {relatedOrder?.status === "selesai"
                                    ? t("order_linked_done")
                                    : t("order_linked_active")}{" "}
                                  {relatedOrder ? `(#${relatedOrder.id})` : ""}
                                </p>
                                <p className="type-body-sm text-muted">
                                  {relatedOrder?.status === "selesai"
                                    ? t("order_desc_done")
                                    : relatedOrder
                                      ? t("order_desc_active", {
                                          status: getStatusLabel(relatedOrder.status),
                                        })
                                      : t("order_desc_done")}
                                </p>
                              </div>
                              {relatedOrder ? (
                                <ButtonLink
                                  href={`/pembeli/pesanan/${relatedOrder.id}`}
                                  size="sm"
                                  variant={
                                    relatedOrder.status === "selesai"
                                      ? "secondary"
                                      : "primary"
                                  }
                                  className="shrink-0"
                                >
                                  {t("btn_view_order", { id: relatedOrder.id })}
                                </ButtonLink>
                              ) : (
                                <ButtonLink
                                  href="/pembeli/pesanan"
                                  size="sm"
                                  variant="secondary"
                                  className="shrink-0"
                                >
                                  {t("tab_pesanan")}
                                </ButtonLink>
                              )}
                            </div>
                          )}

                          <PenawaranChat
                            penawaran={p}
                            lawanNama={p.petani_nama ?? l?.petani ?? t("farmer_fallback")}
                            namaLot={p.listing_nama ?? l?.nama ?? t("lot_fallback")}
                          />
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </Container>
      </main>
    </>
  );
}
