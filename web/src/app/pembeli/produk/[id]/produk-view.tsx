"use client";

import Image from "next/image";
import { MapPin, QrCode, Share2, Sparkles, Star } from "lucide-react";
import {
  ButtonLink,
  Card,
  GradeBar,
  IconButton,
  SectionLabel,
  toast,
} from "@/components/ui";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { KartuOngkos } from "@/components/kartu-ongkos";
import { formatAngka, formatRupiah, num } from "@/lib/format";
import { keTitik } from "@/lib/jarak";
import type { Listing } from "@/lib/types";
import OrderActions from "./order-actions";
import { useTranslations } from "@/lib/i18n";

export default function ProdukView({ listing: l }: { listing: Listing }) {
  const t = useTranslations("produk");

  const titik = keTitik(l.lat, l.lng);
  const komposisi = l.komposisi ?? {};

  /**
   * Bagikan lewat lembar berbagi bawaan ponsel, atau salin tautannya bila
   * peramban tidak punya Web Share API (setiap peramban desktop).
   */
  async function bagikan() {
    const url = window.location.href;
    const data = { title: l.nama, text: t("share_text", { name: l.nama }), url };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.sukses(t("share_copied"));
    } catch {
      // Membatalkan lembar berbagi melempar AbortError. Itu keputusan pembeli,
      // bukan kegagalan yang perlu dilaporkan.
    }
  }
  const gradeHadir = (["A", "B", "C", "REJECT"] as const).filter(
    (g) => (komposisi[g] ?? 0) > 0,
  );
  const campuran = gradeHadir.length > 1;

  return (
    <>
      <BackBar
        title={l.nama}
        href="/pembeli"
        parentLabel={t("parent_katalog")}
        // Tombol "Simpan" (hati) dulu berdiri di sini tanpa `onClick` dan tanpa
        // apa pun yang menyimpan: ia menerima ketukan, tidak berubah, dan tidak
        // menaruh lot itu di mana-mana. Tombol yang tidak mengerjakan apa-apa
        // lebih buruk daripada tombol yang tidak ada. "Bagikan" dipertahankan
        // karena ia memang bisa dikerjakan, dan sekarang benar-benar mengerjakannya.
        right={
          <IconButton
            label={t("share")}
            size="sm"
            onClick={bagikan}
            className="border-transparent bg-transparent"
          >
            <Share2 aria-hidden className="size-4" />
          </IconButton>
        }
      />

      <main className="flex-1 pb-4">
        <Container className="pt-0 lg:pt-6">
          <div className="-mx-4 grid gap-6 sm:-mx-6 lg:mx-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <div className="relative aspect-4/3 lg:sticky lg:top-24 lg:overflow-hidden lg:rounded-lg">
              <Image
                src={l.gambar}
                alt={l.nama}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority
              />
              <span className="type-body-sm absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-brand-deep px-2.5 py-1 font-bold text-canvas">
                <Sparkles aria-hidden className="size-3" />
                {campuran
                  ? t("dominant_grade", { grade: l.grade })
                  : t("grade_label", { grade: l.grade })}
              </span>
            </div>

            <div className="flex flex-col gap-4 px-4 sm:px-6 lg:px-0">
              <div>
                <h1 className="type-heading-lg text-ink">{l.nama}</h1>
                <p className="type-body-sm flex items-center gap-1 pt-1 text-muted">
                  <MapPin aria-hidden className="size-3.5" />
                  {l.lokasi}
                </p>
                <p className="type-display-md tnum pt-2 text-brand">
                  {formatRupiah(l.harga_per_kg)}
                  <span className="type-body-sm font-medium text-muted">
                    {" "}
                    / {l.satuan ?? "kg"}
                  </span>
                </p>
              </div>

              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-brand-tint">
                      <Sparkles aria-hidden className="size-4 text-brand-deep" />
                    </span>
                    <span className="type-heading-sm text-ink">
                      {t("ai_analysis_title")}
                    </span>
                  </span>
                  <span className="type-label flex items-center gap-1.5 rounded-xs bg-brand-dark px-2 py-1 text-canvas">
                    <span
                      aria-hidden
                      className="size-1.5 animate-pulse rounded-full bg-green-300"
                    />
                    {t("live_scan")}
                  </span>
                </div>

                <div className="pt-4">
                  <SectionLabel>{t("verified_comp_title")}</SectionLabel>
                  <GradeBar komposisi={komposisi} height={10} className="mt-2" />
                  <p className="type-body-sm pt-2 text-muted">
                    {campuran
                      ? t("comp_desc_mixed", { grade: l.grade })
                      : t("comp_desc_pure", { grade: l.grade })}
                  </p>
                </div>

                {l.catatan_ai && (
                  <blockquote className="type-body-md mt-4 border-s-2 border-brand-tint-strong ps-3 text-ink italic">
                    &ldquo;{l.catatan_ai}&rdquo;
                  </blockquote>
                )}

                {l.hash_audit && (
                  <div className="mt-4 border-t border-line pt-4">
                    <ButtonLink
                      href={`/lacak/${encodeURIComponent(l.hash_audit)}`}
                      variant="outline"
                      size="sm"
                      block
                      className="gap-2"
                    >
                      <QrCode aria-hidden className="size-4 text-brand" />{" "}
                      {t("trace_cert")}
                    </ButtonLink>
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <p className="type-heading-sm text-ink">
                  {t("price_stock_title")}
                </p>
                <div className="mt-3 rounded-md bg-brand-tint p-3">
                  <SectionLabel>{t("unit_price")}</SectionLabel>
                  <p className="type-heading-lg tnum pt-1 text-brand-deep">
                    {formatRupiah(l.harga_per_kg)}
                    <span className="type-body-sm font-medium text-muted">
                      {" "}
                      / {l.satuan ?? "kg"}
                    </span>
                  </p>
                  <p className="type-body-sm tnum pt-1 text-muted">
                    {t("stock_available", {
                      val: formatAngka(l.stok_kg ?? l.berat_kg),
                    })}
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <span className="type-body-md flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-deep font-bold text-canvas">
                    {l.petani.split(" ").at(-1)?.[0] ?? "P"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="type-body-md block truncate font-bold text-ink">
                      {l.petani}
                    </span>
                    <span className="type-body-sm block text-muted">
                      {t("verified_partner")}
                    </span>
                    <span className="type-body-sm flex items-center gap-1 pt-0.5 font-bold text-ink">
                      <Star
                        aria-hidden
                        className="size-3 fill-clay-500 text-clay-500"
                      />
                      <span className="tnum">{num(l.rating)}</span>
                      <span className="font-normal text-muted">
                        {t("tx_count", { val: l.transaksi })}
                      </span>
                    </span>
                  </span>
                </div>

                <div className="mt-3 divide-y divide-line border-t border-line">
                  <div className="flex justify-between gap-3 py-2.5">
                    <span className="type-body-sm text-muted">
                      {t("last_harvest")}
                    </span>
                    <span className="type-body-sm font-bold text-ink">
                      {l.panen_terakhir}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 py-2.5">
                    <span className="type-body-sm text-muted">
                      {t("stock_label")}
                    </span>
                    <span className="type-body-sm tnum font-bold text-ink">
                      {formatAngka(l.stok_kg ?? l.berat_kg)} kg
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="relative h-32 bg-brand-dark">
                  <Image
                    src="/img/kebun.jpg"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover opacity-45"
                  />
                  <span className="type-body-sm absolute bottom-2 left-2 flex items-center gap-1 rounded-xs bg-black/60 px-2 py-1 font-bold text-white backdrop-blur-sm">
                    <MapPin aria-hidden className="size-3" />
                    {/* Jarak diukur dari pusat kota di server; menyebutnya
                        "dari lokasi Anda" adalah klaim yang tidak dipegang
                        halaman ini — ia dirender sebelum pembeli membukanya. */}
                    {l.jarak_km === null
                      ? t("km_unknown")
                      : t("km_from_city", { val: num(l.jarak_km) })}
                  </span>
                </div>
                <div className="p-4">
                  <p className="type-body-sm text-muted">{l.alamat}</p>
                  {titik ? (
                    <ButtonLink
                      href={`https://www.google.com/maps/search/?api=1&query=${titik.lat},${titik.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outline"
                      size="sm"
                      block
                      className="mt-3"
                    >
                      {t("open_gmaps")}
                    </ButtonLink>
                  ) : (
                    // Tanpa koordinat, tautan lama membuka Google Maps di
                    // "null,null" — sebuah tombol yang selalu ada dan tidak
                    // pernah menuju ke mana-mana.
                    <p className="type-body-sm mt-3 rounded-md bg-sunken p-3 text-muted">
                      {t("no_coords_note")}
                    </p>
                  )}
                </div>
              </Card>

              <KartuOngkos
                jarakKm={l.jarak_km}
                beratKg={l.stok_kg ?? l.berat_kg}
                catatan={t("ongkos_note", {
                  val: formatAngka(l.stok_kg ?? l.berat_kg),
                })}
              />
            </div>
          </div>
        </Container>
      </main>

      <OrderActions listing={l} />
    </>
  );
}
