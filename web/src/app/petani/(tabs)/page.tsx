"use client";

/* eslint-disable @next/next/no-img-element -- scans/listings can be data URLs */

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CloudOff,
  ScanLine,
} from "lucide-react";
import { BrandBar } from "@/components/chrome";
import { useLangkahKartu } from "@/components/order-bits";
import { formatAngka } from "@/lib/format";
import { Container } from "@/components/container";
import {
  ButtonLink,
  Card,
  EmptyState,
  GradeBadge,
} from "@/components/ui";
import { HeroCard } from "@/components/ui/hero-card";
import { RingkasBaris } from "@/components/ui/ringkas-baris";
import type { RingkasItem } from "@/components/ui/ringkas-baris";
import { langkahBerikutnya } from "@/lib/langkah-berikutnya";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

import { useEffect } from "react";

/**
 * Beranda petani: satu layar, satu pertanyaan — "sekarang saya harus apa?"
 *
 * Layar ini dulu menjawab pertanyaan lain: berapa. Ia membuka dengan kartu
 * langkah berikutnya, lalu dua ubin angka, lalu seluruh listing dikelompokkan
 * per grade — salinan tab Jual yang ditempel di bawah beranda. Petani yang
 * membuka aplikasi sambil berdiri di kebun harus menggulir melewati katalog
 * dirinya sendiri untuk sampai ke apa pun yang bisa dikerjakan.
 *
 * Sekarang: satu tindakan besar, satu baris ringkasan, satu bukti kerja
 * terakhir. Daftar lot ada di tab Jual, satu ketukan jauhnya, tempat ia
 * memang tinggal.
 */
export default function DashboardPetani() {
  const t = useTranslations("petani_beranda");
  const tc = useTranslations("common");
  const tLangkah = useTranslations("langkah_berikutnya");
  const langkahKartu = useLangkahKartu();
  const store = useStore();

  const lastScan = store.scans[0];
  const pesananMasuk = store.orders.filter((o) => {
    const kasus = o.status_kasus ?? "normal";
    return kasus !== "dibatalkan" && !(o.status === "selesai" && kasus === "normal");
  }).length;
  const penawaranMasuk = store.myPenawaran.filter(
    (p) => p.status === "terkirim" || p.status === "ditawar_balik",
  ).length;

  // Modern Web API: App Badging API for PWA notifications
  useEffect(() => {
    if ("setAppBadge" in navigator) {
      if (pesananMasuk > 0) {
        navigator.setAppBadge(pesananMasuk).catch(() => {});
      } else if ("clearAppBadge" in navigator) {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  }, [pesananMasuk]);

  const langkah = langkahBerikutnya({
    antreanPindai: store.antreanPindai,
    penawaranPerluJawaban: penawaranMasuk,
    pesananPerluDiproses: pesananMasuk,
    pindaianTersimpan: store.scans.length,
    listingAktif: store.myListings.length,
  });

  /**
   * `langkah.id` menyusun kunci kamus saat render, jadi TypeScript tidak bisa
   * mempersempitnya ke union kunci `langkah_berikutnya`. Penyempitan dipusatkan
   * di sini supaya tiga pemakaian di bawah tidak masing-masing membawa `any`.
   */
  const kunciLangkah = (akhiran: "title" | "desc" | "cta") =>
    `${langkah.id}_${akhiran}` as Parameters<typeof tLangkah>[0];

  /**
   * Yang benar-benar menunggu jawaban petani, pesanan lebih dulu.
   *
   * Pesanan mendahului penawaran karena ia sudah jadi transaksi: pembeli sudah
   * berkomitmen dan sedang menunggu, sementara penawaran masih bisa ditawar
   * balik. Empat baris, bukan seluruhnya — sisanya dihitung di satu baris di
   * bawah dan dibuka lewat tautan di kepala bagian.
   */
  const antreanPenuh = [
    ...store.orders
      .filter((o) => {
        const kasus = o.status_kasus ?? "normal";
        return kasus !== "dibatalkan" && !(o.status === "selesai" && kasus === "normal");
      })
      .map((o) => {
        const l = langkahKartu(o.status, "petani");
        return {
          key: `pesanan-${o.id}`,
          href: `/petani/pesanan/${o.id}`,
          judul: t("todo_order", { id: o.id, name: o.nama }),
          langkah: l?.teks ?? "",
        };
      }),
    ...store.myPenawaran
      .filter((p) => p.status === "terkirim" || p.status === "ditawar_balik")
      .map((p) => ({
        key: `penawaran-${p.id}`,
        href: "/petani/penawaran",
        judul: t("todo_offer", {
          name: p.pembeli_nama ?? tc("buyer"),
          qty: formatAngka(p.kuantitas_kg),
        }),
        langkah: t("todo_offer_next"),
      })),
  ];
  const antrean = antreanPenuh.slice(0, 4);
  const sisaAntrean = antreanPenuh.length - antrean.length;

  /**
   * Ringkasan hanya menyebut yang berisi. Baris "0 penawaran" tidak memberi
   * tahu petani apa pun yang tidak sudah ia ketahui dari layar yang sepi, dan
   * angka nol yang dipajang justru membuat aplikasi tampak menganggur.
   */
  const ringkas: RingkasItem[] = [
    {
      nilai: store.myListings.length,
      label: t("active_lots_label"),
      href: "/petani/listing",
      hrefLabel: t("active_lots_link", { count: store.myListings.length }),
    },
    ...(penawaranMasuk > 0
      ? [
          {
            nilai: penawaranMasuk,
            label: t("offers_waiting_label"),
            href: "/petani/penawaran",
            hrefLabel: t("offers_waiting_link", { count: penawaranMasuk }),
            sorot: true,
          },
        ]
      : []),
    ...(pesananMasuk > 0
      ? [
          {
            nilai: pesananMasuk,
            label: t("orders_running_label"),
            href: "/petani/pesanan",
            hrefLabel: t("orders_running_link", { count: pesananMasuk }),
            sorot: true,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Modern Speculation Rules API for instant 0ms prefetch of petani subpages */}
      <script
        type="speculationrules"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            prerender: [
              {
                source: "list",
                urls: [
                  "/petani/pindai",
                  "/petani/listing",
                  "/petani/riwayat",
                  "/petani/pesanan",
                  "/petani/dampak",
                ],
              },
            ],
          }),
        }}
      />

      <BrandBar
        title={t("title")}
        right={
          <>
            <Link
              href="/petani/pesanan"
              aria-label={`${t("notif_label")}, ${pesananMasuk} ${t("orders_active")}`}
              className="tap focus-ring relative grid size-11 place-items-center rounded-md text-field-muted hover:bg-field-hover hover:text-field-ink md:text-muted md:hover:bg-sunken md:hover:text-ink"
            >
              <Bell aria-hidden className="size-5" />
              {pesananMasuk > 0 && (
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-grade-b ring-2 ring-field md:ring-canvas" />
              )}
            </Link>
            {/* On desktop the primary action belongs in the bar, not in a FAB
                floating over content the mouse can already reach. */}
            <div className="hidden md:block">
              <ButtonLink
                href="/petani/pindai"
                data-tour="pindai-cta"
                variant="primary"
              >
                <ScanLine aria-hidden className="size-4" />
                {t("start_scan")}
              </ButtonLink>
            </div>
          </>
        }
      />

      <main id="konten" className="flex-1 pb-24 pt-4 md:pb-8">
        <Container className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          <HeroCard
            data-tour="langkah-berikutnya"
            className="container-card lg:col-span-12"
            tone={langkah.menunggu ? "menunggu" : "aksi"}
            icon={
              langkah.menunggu ? (
                <CloudOff aria-hidden className="size-6" />
              ) : (
                <ScanLine aria-hidden className="size-6" />
              )
            }
            eyebrow={langkah.menunggu ? tLangkah("eyebrow_waiting") : tLangkah("eyebrow_next")}
            title={tLangkah(kunciLangkah("title"), { count: langkah.jumlah ?? 0 })}
            description={tLangkah(kunciLangkah("desc"))}
            cta={{ label: tLangkah(kunciLangkah("cta")), href: langkah.href }}
          />

          <RingkasBaris items={ringkas} className="lg:col-span-12" />

          {/* Kolom kiri dijadikan satu wadah, bukan dua butir grid lepas. */}
          <div className="flex flex-col gap-5 lg:col-span-8">
            {/* --- Pindaian terakhir --------------------------------------- */}
            <section aria-labelledby="heading-last-scan">
              <div className="flex items-end justify-between gap-3 pb-3">
                <h2 id="heading-last-scan" className="type-heading-md text-ink">{t("last_scan")}</h2>
                <Link
                  href="/petani/riwayat"
                  className="type-body-md focus-ring hit-44 rounded-xs font-bold text-brand hover:underline"
                >
                  {tc("view_history")}
                </Link>
              </div>

              {lastScan ? (
                <Link
                  href="/petani/riwayat"
                  data-tour="hasil-terakhir"
                  className="tap tap-press focus-ring block rounded-lg"
                >
                  <Card
                    variant="interactive"
                    className="rise overflow-hidden p-0 sm:flex sm:items-stretch"
                  >
                    <div className="relative aspect-16/10 sm:aspect-16/9 sm:w-1/2 sm:shrink-0">
                      <img
                        src={lastScan.gambar}
                        alt={`${lastScan.komoditas_label} hasil pindai terakhir`}
                        width={640}
                        height={360}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        className="absolute inset-0 size-full object-cover"
                      />
                      <span className="absolute left-3 top-3">
                        <GradeBadge grade={lastScan.grade_dominan} />
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-center gap-1 p-4 sm:p-5">
                      <p className="type-heading-lg text-ink">
                        {lastScan.komoditas_label}
                      </p>
                      <p className="type-body-md text-muted first-letter:uppercase">
                        {tc("dominant_grade")} {lastScan.grade_dominan}
                      </p>
                      <span className="type-body-md inline-flex items-center gap-1 pt-1 font-bold text-brand">
                        {t("open_report")}
                        <ArrowRight aria-hidden className="size-4" />
                      </span>
                    </div>
                  </Card>
                </Link>
              ) : (
                <EmptyState
                  icon={<ScanLine />}
                  title={t("no_scan_title")}
                  description={t("no_scan_desc")}
                  action={
                    <ButtonLink href="/petani/pindai" size="lg">
                      <ScanLine aria-hidden className="size-4" />
                      {t("start_scan_btn")}
                    </ButtonLink>
                  }
                />
              )}
            </section>

            {/* --- Antrean kerja (hanya desktop) ---------------------------- */}
            <section aria-labelledby="heading-todo" className="hidden lg:block">
              <div className="flex items-end justify-between gap-3 pb-3">
                <h2 id="heading-todo" className="type-heading-md text-ink">{t("todo_title")}</h2>
                <Link
                  href="/petani/pesanan"
                  className="type-body-md focus-ring hit-44 rounded-xs font-bold text-brand hover:underline"
                >
                  {t("todo_see_all")}
                </Link>
              </div>

              {antrean.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 />}
                  title={t("todo_empty_title")}
                  description={t("todo_empty_desc")}
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {antrean.map((b) => (
                    <li key={b.key} className="min-w-0">
                      <Link
                        href={b.href}
                        className="tap tap-press focus-ring flex items-center gap-3 rounded-md bg-surface p-4 shadow-e2 hover:-translate-y-0.5 hover:shadow-e4"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="type-body-md block truncate font-bold text-ink">
                            {b.judul}
                          </span>
                          <span className="type-body-sm block truncate pt-0.5 font-bold text-brand">
                            {b.langkah}
                          </span>
                        </span>
                        <ArrowRight aria-hidden className="size-4 shrink-0 text-label" />
                      </Link>
                    </li>
                  ))}
                  {sisaAntrean > 0 && (
                    <li className="type-body-sm ps-1 pt-1 text-muted">
                      {t("todo_more", { count: sisaAntrean })}
                    </li>
                  )}
                </ul>
              )}
            </section>
          </div>

          {/* --- Pintasan ------------------------------------------------- */}
          <aside aria-labelledby="heading-shortcuts" className="flex flex-col gap-3 lg:col-span-4 lg:pt-11">
            <h2 id="heading-shortcuts" className="sr-only">{t("title")} Pintasan</h2>
            <PintasanBaris
              href="/petani/listing"
              judul={t("shortcut_my_lots")}
              keterangan={t("shortcut_my_lots_desc")}
            />
            <PintasanBaris
              href="/petani/riwayat"
              judul={t("shortcut_scan_history")}
              keterangan={t("shortcut_scan_history_desc")}
            />
            {/* Penjemputan adalah kerja harian, bukan preferensi akun — dulu
                satu-satunya pintunya ada di tab Akun, di sebelah "Dampak". */}
            <PintasanBaris
              href="/petani/logistik"
              judul={t("shortcut_logistics")}
              keterangan={t("shortcut_logistics_desc")}
            />
            <PintasanBaris
              href="/petani/dampak"
              judul={t("shortcut_impact")}
              keterangan={t("shortcut_impact_desc")}
            />
          </aside>
        </Container>
      </main>
    </>
  );
}

function PintasanBaris({
  href,
  judul,
  keterangan,
}: {
  href: string;
  judul: string;
  keterangan: string;
}) {
  return (
    <Link
      href={href}
      className="tap tap-press focus-ring flex items-center gap-3 rounded-md bg-surface p-4 shadow-e2 hover:-translate-y-0.5 hover:shadow-e4"
    >
      <span className="min-w-0 flex-1">
        <span className="type-body-lg block font-bold text-ink">{judul}</span>
        <span className="type-body-md block pt-0.5 text-muted">
          {keterangan}
        </span>
      </span>
      <ArrowRight aria-hidden className="size-4 shrink-0 text-label" />
    </Link>
  );
}
