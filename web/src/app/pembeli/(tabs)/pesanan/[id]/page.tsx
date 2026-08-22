"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Info, PartyPopper, Printer, ScanLine, Star } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { QrKode, StatusHero } from "@/components/order-bits";
import { Button, ButtonLink, Card, GradeBadge, SectionLabel } from "@/components/ui";
import { formatRupiah, num } from "@/lib/format";
import { getUlasanPesanan } from "@/lib/data";
import { bolehMenilai, lawanTransaksi } from "@/lib/ulasan";
import type { StatusPesanan, Ulasan } from "@/lib/types";
import { useStore } from "@/lib/store";
import { ChatWindow } from "@/components/chat-window";
import { RatingModal } from "@/components/rating-modal";
import { useTranslations } from "@/lib/i18n";

/*
 * Sama seperti di layar pesanan petani: modal cetak menarik `@/lib/qr` dan
 * `PrintModal` ke first-load, padahal ia hanya terbuka kalau pembeli benar-benar
 * mencetak tanda terima. Gerbang `showReceiptModal &&` yang menahan chunk-nya —
 * `dynamic` sendirian tetap mengunduh begitu komponennya terpasang.
 */
const PrintableReceiptModal = dynamic(
  () => import("@/components/printable-receipt-modal").then((m) => m.PrintableReceiptModal),
  { ssr: false },
);

/**
 * Kartu kode saat serah terima benar-benar berlangsung — satu-satunya saat kode
 * itu berguna, jadi satu-satunya saat ia diberi warna merek.
 */
const kartuKodeAktif = "border-brand/30 p-5 surface-brand";

export default function PesananDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const router = useRouter();
  const order = store.orders.find((o) => o.id === id);

  const t = useTranslations("pembeli_pesanan");
  const tPes = useTranslations("pesanan");
  const tProd = useTranslations("produk");

  const [showRating, setShowRating] = useState(false);
  const [ulasanPesanan, setUlasanPesanan] = useState<Ulasan[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  /**
   * Kode serah terima sebelum waktunya ditutup di balik satu ketukan.
   *
   * Ia dulu tergambar penuh sejak pesanan baru dibuat, padahal baru berguna
   * saat komoditasnya benar-benar diserahkan. Kode yang terpampang berhari-hari
   * di layar yang dibawa ke mana-mana adalah kode yang bisa terfoto orang lain,
   * dan satu-satunya hal yang dijaganya adalah bukti bahwa barangnya sudah
   * diterima.
   */
  const [bukaKodeAwal, setBukaKodeAwal] = useState(false);

  const uid = store.sesi?.userId;
  const lawan = order ? lawanTransaksi(order, uid) : null;
  const izin = order
    ? bolehMenilai(order, uid, ulasanPesanan)
    : { boleh: false, alasan: "bukan_pihak" as const };
  const sudahUlas = izin.alasan === "sudah_menilai";

  useEffect(() => {
    if (store.ready && !order) router.replace("/pembeli/pesanan");
  }, [store.ready, order, router]);

  useEffect(() => {
    if (!order || order.status !== "selesai") return;
    let batal = false;
    void getUlasanPesanan(order.id).then((d) => {
      if (!batal) setUlasanPesanan(d);
    });
    return () => {
      batal = true;
    };
  }, [order]);

  if (!order) return null;

  const langkah = (
    {
      dipesan: t("next_dipesan"),
      dikonfirmasi: t("next_dikonfirmasi"),
      serah_terima: t("next_serah_terima"),
      selesai: t("next_selesai"),
    } satisfies Record<StatusPesanan, string>
  )[order.status];

  const saatnyaSerahTerima = order.status === "serah_terima";

  const wa = `https://wa.me/?text=${encodeURIComponent(
    `Halo ${order.petani}, saya pembeli pesanan ${order.nama} #${order.id} di PANTAS.`,
  )}`;

  return (
    <>
      <BackBar
        title={t("detail_title", { id: order.id })}
        href="/pembeli/pesanan"
        parentLabel={t("tab_pesanan")}
      />

      <main className="flex-1 py-4">
        <Container className="flex flex-col gap-6">
          <StatusHero
            status={order.status}
            lawanLabel={t("seller_label", { name: order.petani })}
            langkah={langkah}
          />

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-6">
              {order.status === "selesai" ? (
                <Card className="flex flex-col items-center p-6 text-center">
                  <PartyPopper aria-hidden className="size-8 text-brand" />
                  <p className="type-heading-sm pt-3 text-ink">
                    {t("status_selesai_title")}
                  </p>
                  <p className="type-body-md pt-1 text-muted">
                    {t("status_selesai_desc")}
                  </p>

                  <div className="w-full pt-4">
                    {sudahUlas ? (
                      <p className="type-body-sm flex items-center justify-center gap-1.5 rounded-md bg-sunken py-2 font-bold text-muted">
                        <Star aria-hidden className="size-4 fill-grade-b text-grade-b" />
                        {tPes("review_sent")}
                      </p>
                    ) : izin.boleh ? (
                      <Button
                        onClick={() => setShowRating(true)}
                        variant="primary"
                        block
                        className="gap-2"
                      >
                        <Star aria-hidden className="size-4" />
                        {tPes("review_btn", { name: lawan?.nama ?? "petani" })}
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ) : saatnyaSerahTerima || bukaKodeAwal ? (
                <Card className={saatnyaSerahTerima ? kartuKodeAktif : "p-5"}>
                  <div className="flex items-center justify-center gap-2">
                    <ScanLine aria-hidden className="size-4 text-brand" />
                    <SectionLabel>{t("code_title")}</SectionLabel>
                  </div>
                  <div className="flex justify-center pt-4">
                    <QrKode value={order.kode} />
                  </div>
                  <p className="type-heading-md pt-4 text-center font-mono tracking-[0.2em] text-ink">
                    {order.kode}
                  </p>
                  <p className="type-body-sm mx-auto max-w-xs pt-2 text-center text-muted">
                    {t("code_desc")}
                  </p>
                </Card>
              ) : (
                <Card className="flex flex-col items-center p-6 text-center">
                  <ScanLine aria-hidden className="size-8 text-line" />
                  <p className="type-heading-sm pt-3 text-ink">
                    {t("code_early_title")}
                  </p>
                  <p className="type-body-md max-w-xs pt-1 text-muted">
                    {t("code_early_desc")}
                  </p>
                  <div className="pt-4">
                    <Button
                      onClick={() => setBukaKodeAwal(true)}
                      variant="outline"
                      size="sm"
                    >
                      {t("code_reveal")}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Order summary */}
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-heading-sm text-ink">{order.nama}</p>
                    <div className="flex items-center gap-2 pt-1.5">
                      <GradeBadge grade={order.grade} size="sm" />
                      <span className="type-body-sm tnum text-muted">
                        • {order.berat_kg} kg
                      </span>
                    </div>
                    {order.berat_aktual_kg != null && (
                      <p className="type-body-sm tnum pt-1 text-muted">
                        {t("actual_weight_label")}: {num(order.berat_aktual_kg, 2)} kg
                      </p>
                    )}
                  </div>
                  <div className="text-end">
                    <SectionLabel>{t("price_per_kg")}</SectionLabel>
                    <p className="type-body-md tnum pt-0.5 font-bold text-ink">
                      {formatRupiah(order.harga_per_kg)}/kg
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="type-heading-sm text-ink">{t("total_label")}</span>
                  <span className="type-heading-lg tnum text-brand">
                    {formatRupiah(order.total)}
                  </span>
                </div>

                {order.status !== "selesai" && (
                  <p className="type-body-sm mt-3 flex gap-2 rounded-md bg-sunken p-3 text-muted">
                    <Info aria-hidden className="size-4 shrink-0" />
                    {tProd("payment_note")}
                  </p>
                )}
              </Card>
            </div>

            {/* Chat Dalam Aplikasi (F-33) */}
            <div className="flex flex-col gap-2">
              <ChatWindow
                orderId={order.id}
                currentUserId={store.sesi?.userId ?? ""}
                currentUserName={store.sesi?.nama ?? order.pembeli}
                recipientId={order.petani_id ?? ""}
                recipientName={order.petani}
                title={t("chat_farmer")}
              />
            </div>
          </div>
        </Container>
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-surface py-3">
        <Container className="flex flex-wrap items-center justify-end gap-3">
          <Button
            onClick={() => setShowReceiptModal(true)}
            variant="primary"
            size="lg"
            className="w-full gap-2 md:w-auto"
          >
            <Printer className="size-4" /> {tPes("btn_print_receipt")}
          </Button>
          <ButtonLink
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="lg"
            className="w-full md:w-auto"
          >
            {t("btn_wa_fallback")}
          </ButtonLink>
        </Container>
      </footer>

      {/* Ulasan pasca transaksi (F-42) */}
      {lawan && (
        <RatingModal
          isOpen={showRating}
          onClose={() => setShowRating(false)}
          orderId={order.id}
          penilaiId={uid ?? ""}
          dinilaiId={lawan.id}
          dinilaiNama={lawan.nama}
          onSuccess={() => void getUlasanPesanan(order.id).then(setUlasanPesanan)}
        />
      )}

      {/* Modal Cetak Tanda Terima Digital PDF (F-41) */}
      {showReceiptModal && (
        <PrintableReceiptModal
          order={order}
          isOpen
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </>
  );
}
