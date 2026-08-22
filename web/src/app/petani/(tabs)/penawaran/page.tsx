"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Handshake, RefreshCw } from "lucide-react";
import { BrandBar } from "@/components/chrome";
import { SubNav } from "@/components/sub-nav";
import { JUAL_TABS } from "@/components/nav-config";
import { Container } from "@/components/container";
import { Badge, Button, ButtonLink, Card, Dialog, EmptyState, Input, cx } from "@/components/ui";
import { toast } from "@/components/ui/toast";
import type { BadgeTone } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatRupiah } from "@/lib/format";
import { LISTINGS } from "@/lib/data";
import { PenawaranChat } from "@/components/penawaran-chat";
import { KartuOngkos } from "@/components/kartu-ongkos";
import { useOrderStatus } from "@/components/order-bits";
import { useTranslations } from "@/lib/i18n";
import type { Penawaran } from "@/lib/types";

/**
 * Warna status mengikuti artinya, bukan satu warna untuk semua.
 */
function statusTone(status: string): BadgeTone {
  switch (status) {
    case "diterima":
      return "brand";
    case "terkirim":
    case "ditawar_balik":
      return "warn";
    case "ditolak":
      return "danger";
    default:
      return "neutral";
  }
}

function BarisTawaran({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
      <dt className="type-body-md text-muted">{k}</dt>
      <dd className="type-body-md tnum font-bold text-ink">{v}</dd>
    </div>
  );
}

function fmtWaktu(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}, ${d
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(":", ".")}`;
}

export default function PetaniPenawaranPage() {
  const store = useStore();
  const t = useTranslations("penawaran");
  const tc = useTranslations("common");
  const { getStatusLabel } = useOrderStatus();

  const [filter, setFilter] = useState<"semua" | "aktif" | "arsip">("semua");
  const [targetPenawaran, setTargetPenawaran] = useState<Penawaran | null>(null);
  const [hargaTawarBalik, setHargaTawarBalik] = useState<number>(0);
  const [sedangDibalas, setSedangDibalas] = useState<string | null>(null);

  const handleOpenTawarBalik = (p: Penawaran) => {
    setTargetPenawaran(p);
    setHargaTawarBalik(p.harga_per_kg);
  };

  /**
   * Satu pintu untuk ketiga jawaban.
   *
   * `balasPenawaran` sekarang melempar kalau basis data menolak — menerima
   * penawaran berarti menerbitkan pesanan, dan kegagalannya tidak boleh lagi
   * berakhir sebagai baris konsol sementara layar petani menampilkan pesanan
   * yang tidak pernah ada di sisi pembeli.
   */
  const balas = async (
    p: Penawaran,
    status: "diterima" | "ditolak" | "ditawar_balik",
    harga?: number,
  ) => {
    setSedangDibalas(p.id);
    try {
      await store.balasPenawaran(p.id, status, harga);
      if (status === "diterima") toast.sukses(t("toast_accepted"));
      if (status === "ditolak") toast.sukses(t("toast_rejected"));
      if (status === "ditawar_balik") toast.sukses(t("toast_countered"));
    } catch (e) {
      toast.galat(
        t("toast_reply_failed"),
        e instanceof Error ? e.message : undefined,
      );
    } finally {
      setSedangDibalas(null);
    }
  };

  const handleSendTawarBalik = () => {
    if (!targetPenawaran || hargaTawarBalik <= 0) return;
    void balas(targetPenawaran, "ditawar_balik", Number(hargaTawarBalik));
    setTargetPenawaran(null);
  };

  const getStatus = (status: string) => {
    switch (status) {
      case "terkirim":
        return t("status_waiting");
      case "ditawar_balik":
        return t("status_countered");
      case "diterima":
        return t("status_accepted");
      case "ditolak":
        return t("status_rejected");
      case "kedaluwarsa":
        return t("status_expired");
      default:
        return status;
    }
  };

  const penawaranMasuk = useMemo(
    () =>
      store.myPenawaran.filter(
        (p) =>
          p.petani_id === store.sesi?.userId ||
          p.petani_id === "a0000000-0000-4000-a000-000000000001", // demo fallback
      ),
    [store.myPenawaran, store.sesi?.userId],
  );

  const aktifList = useMemo(
    () => penawaranMasuk.filter((p) => p.status === "terkirim" || p.status === "ditawar_balik"),
    [penawaranMasuk],
  );

  const arsipList = useMemo(
    () =>
      penawaranMasuk.filter(
        (p) => p.status === "diterima" || p.status === "ditolak" || p.status === "kedaluwarsa",
      ),
    [penawaranMasuk],
  );

  const SARINGAN = [
    { value: "semua" as const, label: t("filter_all"), count: penawaranMasuk.length },
    { value: "aktif" as const, label: t("filter_active"), count: aktifList.length },
    { value: "arsip" as const, label: t("filter_archive"), count: arsipList.length },
  ];

  const displayedList =
    filter === "aktif" ? aktifList : filter === "arsip" ? arsipList : penawaranMasuk;

  return (
    <>
      <BrandBar title={t("title")} />
      <SubNav items={JUAL_TABS} label="Bagian Jual" layout="inline" />

      <main className="flex-1 py-4">
        <Container>
          <div
            role="group"
            aria-label={t("filter_archive")}
            className="scroll-x flex gap-2 pb-4"
          >
            {SARINGAN.map(({ value, label, count }) => {
              const aktif = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => setFilter(value)}
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

          {displayedList.length === 0 ? (
            <EmptyState
              icon={<Handshake />}
              title={filter === "arsip" ? t("empty_archive_title") : t("empty_title")}
              description={filter === "arsip" ? t("empty_archive_desc") : t("empty_desc")}
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {displayedList.map((p) => {
                const listing =
                  store.myListings.find((l) => l.id === p.listing_id) ??
                  LISTINGS.find((l) => l.id === p.listing_id);

                // `order_id` ditulis oleh RPC `terima_penawaran` (migrasi 0017),
                // jadi pasangannya tidak lagi ditebak dari nama komoditas dan
                // berat — tebakan yang meleset begitu ada dua lot mirip.
                const relatedOrder = p.order_id
                  ? store.orders.find((o) => o.id === p.order_id)
                  : undefined;

                const isActive = p.status === "terkirim" || p.status === "ditawar_balik";

                return (
                  <li key={p.id}>
                    <Card className="flex flex-col gap-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="type-heading-sm truncate text-ink">
                            {p.listing_nama ?? listing?.nama ?? t("deleted_commodity")}
                          </h2>
                          <p className="type-body-md pt-0.5 text-muted">
                            {t("sent_at", { time: fmtWaktu(p.created_at) })}
                          </p>
                        </div>
                        <Badge
                          tone={
                            p.status === "diterima"
                              ? relatedOrder?.status === "selesai"
                                ? "brand"
                                : "info"
                              : statusTone(p.status)
                          }
                        >
                          {p.status === "diterima" && relatedOrder
                            ? `${t("status_accepted")} • ${
                                relatedOrder.status === "selesai"
                                  ? t("order_linked_done")
                                  : t("order_linked_active")
                              }`
                            : getStatus(p.status)}
                        </Badge>
                      </div>

                      {/* Baris, bukan kisi label/nilai. Empat sel dalam kotak
                          abu-abu memaksa mata melompat zig-zag untuk membaca
                          satu tawaran; satu kolom baris terbaca sekali turun. */}
                      <dl className="flex flex-col divide-y divide-line border-y border-line">
                        <BarisTawaran
                          k={t("qty_label")}
                          v={t("qty_val", { val: p.kuantitas_kg })}
                        />
                        <BarisTawaran
                          k={t("price_label")}
                          v={t("price_val", { val: formatRupiah(p.harga_per_kg) })}
                        />
                        <BarisTawaran
                          k={t("pickup_label")}
                          v={
                            p.tanggal_ambil
                              ? new Date(p.tanggal_ambil).toLocaleDateString("id-ID", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })
                              : t("pickup_waiting")
                          }
                        />
                        {p.catatan && (
                          <BarisTawaran
                            k={t("buyer_note_label")}
                            v={`“${p.catatan}”`}
                          />
                        )}
                      </dl>

                      {/* Ongkos final penawaran (F-53): kuantitasnya sudah
                          pasti di sini, jadi angkanya bukan lagi perkiraan lot
                          penuh seperti di layar katalog. Dilipat karena rincian
                          per suku adalah bukti yang dicari saat diragukan —
                          bukan bacaan wajib tiap kali tawaran dibuka. */}
                      {listing && (
                        <details className="group rounded-md border border-line">
                          <summary className="tap focus-ring type-body-md flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 font-bold text-ink">
                            {t("ongkos_title")}
                            <ChevronDown
                              aria-hidden
                              className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                            />
                          </summary>
                          <div className="border-t border-line p-3">
                            <KartuOngkos
                              judul={t("ongkos_title")}
                              jarakKm={listing.jarak_km}
                              beratKg={p.kuantitas_kg}
                              catatan={t("ongkos_note")}
                            />
                          </div>
                        </details>
                      )}

                      {p.status === "diterima" && (
                        <div
                          className={cx(
                            "flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3",
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
                              href={`/petani/pesanan/${relatedOrder.id}`}
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
                              href="/petani/pesanan"
                              size="sm"
                              variant="secondary"
                              className="shrink-0"
                            >
                              {t("filter_all")}
                            </ButtonLink>
                          )}
                        </div>
                      )}

                      {isActive && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            className="flex-1"
                            disabled={sedangDibalas === p.id}
                            onClick={() => void balas(p, "diterima")}
                          >
                            {sedangDibalas === p.id ? tc("loading") : t("btn_accept")}
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={sedangDibalas === p.id}
                            onClick={() => handleOpenTawarBalik(p)}
                          >
                            <RefreshCw aria-hidden className="size-4 text-brand" />
                            {t("btn_counter")}
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-danger"
                            disabled={sedangDibalas === p.id}
                            onClick={() => void balas(p, "ditolak")}
                          >
                            {t("btn_reject")}
                          </Button>
                        </div>
                      )}

                      <PenawaranChat
                        penawaran={p}
                        lawanNama={p.pembeli_nama ?? "Pembeli"}
                        namaLot={p.listing_nama ?? listing?.nama ?? "lot"}
                      />
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </main>

      {/* Counter Offer Modal */}
      <Dialog
        open={Boolean(targetPenawaran)}
        onClose={() => setTargetPenawaran(null)}
        title={t("counter_title")}
        description={t("counter_desc")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTargetPenawaran(null)}>
              {tc("cancel")}
            </Button>
            <Button onClick={handleSendTawarBalik}>{tc("submit")}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {targetPenawaran && (
            <p className="type-body-md flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-line bg-sunken p-3 text-muted">
              {t("counter_buyer_offer")}
              <span className="type-heading-sm tnum text-ink">
                {formatRupiah(targetPenawaran.harga_per_kg)}/kg ×{" "}
                {targetPenawaran.kuantitas_kg} kg
              </span>
            </p>
          )}

          <Input
            id="harga-tawar-balik"
            type="number"
            label={t("counter_your_price")}
            hint="Rupiah per kg."
            value={hargaTawarBalik}
            onChange={(e) => setHargaTawarBalik(Number(e.target.value))}
            min={1000}
            step={500}
          />

          {/* Pintasan naik harga. Mengetik lima digit di ponsel sambil berdiri
              di kebun adalah bagian tersulit dari menawar; empat tombol ini
              menghapusnya untuk kasus yang paling sering. */}
          {targetPenawaran && (
            <div className="flex flex-col gap-2">
              <p className="type-body-md text-muted">{t("counter_quick_raise")}</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["+ Rp 500", targetPenawaran.harga_per_kg + 500],
                    ["+ Rp 1.000", targetPenawaran.harga_per_kg + 1000],
                    ["+ 5%", Math.round(targetPenawaran.harga_per_kg * 1.05)],
                    ["+ 10%", Math.round(targetPenawaran.harga_per_kg * 1.1)],
                  ] as const
                ).map(([label, nilai]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setHargaTawarBalik(nilai)}
                    className="tap focus-ring type-body-md min-h-11 rounded-full border border-line bg-surface px-3 font-bold text-ink hover:border-line-strong hover:bg-sunken sm:min-h-9"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
