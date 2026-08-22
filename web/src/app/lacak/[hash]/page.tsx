/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Minus,
  Scale,
  ShieldCheck,
  Snowflake,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/container";
import { PublicPage } from "@/components/marketing/page-shell";
import { Badge, Card, GradeBadge, cx } from "@/components/ui";
import { localeDariCookie } from "@/i18n/request";
import { getChecklistUntukHash, getGradingByHash } from "@/lib/data";
import { checklistUntuk, ringkasChecklist } from "@/lib/rantai-dingin";
import { EstimasiBeratCard } from "@/components/estimasi-berat-card";
import { PrintCrateLabelButton } from "@/components/print-crate-label-button";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }>;
}): Promise<Metadata> {
  const { hash } = await params;
  const decoded = decodeURIComponent(hash);
  const record = await getGradingByHash(decoded);
  const t = await getTranslations("lacak");


  if (!record) {
    return { title: t("not_found_title") };
  }

  return {
    title: t("page_title", { name: record.komoditas_label }),
    description: t("page_desc", {
      grade: record.grade_dominan,
      count: record.objek_terdeteksi,
      hash: record.hash_audit,
    }),
  };
}

export default async function LacakPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const decoded = decodeURIComponent(hash);
  const record = await getGradingByHash(decoded);
  const t = await getTranslations("lacak");
  const tLogistik = await getTranslations("logistik");

  if (!record) {
    notFound();
  }

  const penanganan = await getChecklistUntukHash(decoded);
  const daftarPenanganan = penanganan
    ? checklistUntuk(penanganan.komoditas)
    : [];
  const ringkasPenanganan = penanganan
    ? ringkasChecklist(penanganan.checklist, daftarPenanganan)
    : null;

  // Tanggal ikut bahasa yang dipilih pengunjung, sama seperti teks di
  // sekitarnya — `id-ID` yang dipaku di sini dulu adalah satu-satunya kalimat
  // Indonesia yang tersisa ketika sisanya sudah berbahasa Inggris.
  const locale = await localeDariCookie();
  const dateFormatted = new Date(record.created_at).toLocaleDateString(
    locale === "en" ? "en-GB" : "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  /** `sha256:` diikuti 64 digit heksadesimal — bentuk yang benar-benar dihitung. */
  const hashAsli = /^sha256:[0-9a-f]{64}$/i.test(record.hash_audit ?? "");

  const payloadKanonik = JSON.stringify(
    {
      status: "success",
      komoditas: record.komoditas,
      objek_terdeteksi: record.objek_terdeteksi,
      kalibrasi: record.kalibrasi,
      ringkasan_batch: record.ringkasan_batch,
    },
    null,
    2
  );

  return (
    <PublicPage>
      <div className="py-14 lg:py-20">
        <Container className="flex flex-col gap-8">
          <div>
            <Link
              href="/"
              className="type-body-sm inline-flex items-center gap-1.5 text-muted hover:text-ink"
            >
              <ArrowLeft className="size-4" /> {t("back_home")}
            </Link>
          </div>

          {/* Header Banner Audit */}
          <Card variant="raised" className="flex flex-col gap-6 p-6 sm:p-8 border-brand/30 bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Lencana "Terverifikasi SHA-256" hanya untuk rekaman yang
                  memang membawa digest; data demo mendapat lencana netral. */}
              <Badge
                tone={hashAsli ? "brand" : "neutral"}
                icon={
                  hashAsli ? (
                    <ShieldCheck className="size-4" />
                  ) : (
                    <AlertTriangle className="size-4" />
                  )
                }
              >
                {hashAsli ? t("verified_badge") : t("verified_badge_demo")}
              </Badge>
              <span className="type-mono-sm text-label">{t("public_access")}</span>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="type-display-md text-ink">{record.komoditas_label}</h1>
              <p className="type-body-lg text-muted">
                {t("scanned_on", {
                  date: dateFormatted,
                  farmer: record.petani_nama ?? "",
                  kabupaten: record.petani_kabupaten ?? "",
                })}
              </p>
            </div>
          </Card>

          {record.gambar_url && (
            <Card variant="raised" className="overflow-hidden border-line">
              <div className="relative aspect-video w-full lg:aspect-[21/9]">
                <img
                  src={record.gambar_url}
                  alt={t("img_alt")}
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
            </Card>
          )}

          {/* Grid Informasi Mutu & Kalibrasi */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Kartu Ringkasan Batch */}
            <Card variant="raised" className="flex flex-col gap-5 p-6">
              <h2 className="type-heading-md text-ink flex items-center gap-2">
                <Sparkles className="size-5 text-brand" /> {t("summary_heading")}
              </h2>

              <div className="flex items-center gap-4 py-2 border-y border-line">
                <div className="flex flex-col">
                  <span className="type-label text-label">{t("dominant_grade")}</span>
                  <div className="pt-1">
                    <GradeBadge grade={record.grade_dominan} size="lg" />
                  </div>
                </div>
                <div className="h-10 w-px bg-line" />
                <div className="flex flex-col">
                  <span className="type-label text-label">{t("total_objects")}</span>
                  <span className="type-heading-lg text-ink">{t("unit_val", { val: record.objek_terdeteksi })}</span>
                </div>
                <div className="h-10 w-px bg-line" />
                <div className="flex flex-col">
                  <span className="type-label text-label">{t("uniformity")}</span>
                  <span className="type-heading-lg text-ink">
                    {Math.round(record.ringkasan_batch.skor_keseragaman * 100)}%
                  </span>
                </div>
                {record.foto_terproses != null && record.foto_terproses > 1 && (
                  <>
                    <div className="h-10 w-px bg-line" />
                    <div className="flex flex-col">
                      <span className="type-label text-label">{t("photo_angle")}</span>
                      <span className="type-heading-lg text-ink">
                        {record.foto_terproses}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <span className="type-label text-label">{t("grade_composition")}</span>
                <ul className="flex flex-col gap-2">
                  {Object.entries(record.ringkasan_batch.komposisi).map(([g, rasio]) => (
                    <li key={g} className="flex items-center justify-between text-muted type-body-md">
                      <span className="font-bold text-ink">{t("grade_ratio", { grade: g })}</span>
                      <span>
                        {t("ratio_detail", {
                          pct: Math.round((rasio ?? 0) * 100),
                          count: Math.round((rasio ?? 0) * record.objek_terdeteksi),
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Kartu Kalibrasi Skala Metrik */}
            <Card variant="raised" className="flex flex-col gap-5 p-6">
              <h2 className="type-heading-md text-ink flex items-center gap-2">
                <Scale className="size-5 text-brand" /> {t("calib_heading")}
              </h2>

              <div className="rounded-md border border-line bg-sunken p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="type-label text-label">{t("ref_object")}</span>
                  <span className="type-body-md font-bold text-ink">{record.kalibrasi.referensi}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="type-label text-label">{t("calib_status")}</span>
                  {record.kalibrasi.valid ? (
                    <span className="type-body-sm flex items-center gap-1 font-bold text-brand">
                      <CheckCircle2 className="size-4" /> {t("calib_valid")}
                    </span>
                  ) : (
                    <span className="type-body-sm flex items-center gap-1 font-bold text-danger">
                      <AlertTriangle className="size-4" /> {t("calib_failed")}
                    </span>
                  )}
                </div>
                {record.kalibrasi.px_per_mm2 != null ? (
                  <div className="flex items-center justify-between">
                    <span className="type-label text-label">{t("pixel_density")}</span>
                    <span className="type-mono-sm text-ink">{record.kalibrasi.px_per_mm2} px/mm²</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="type-label text-label">{t("calib_photo_count")}</span>
                    <span className="type-mono-sm text-ink">
                      {t("photo_ratio", {
                        done: record.kalibrasi.foto_terkalibrasi ?? 0,
                        total: record.foto_terproses ?? 0,
                      })}
                    </span>
                  </div>
                )}
              </div>

              <p className="type-body-sm text-muted">
                {t("calib_desc")}
              </p>
            </Card>

            <EstimasiBeratCard
              estimasi={record.ringkasan_batch.estimasi_berat}
            />
          </div>

          {penanganan && (
            <Card variant="raised" className="flex flex-col gap-4 p-6 border-line bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="type-heading-md flex items-center gap-2 text-ink">
                  <Snowflake aria-hidden className="size-5 text-brand" />
                  {t("cold_chain_heading")}
                </h2>
                <span className="type-body-sm tnum rounded-full bg-sunken px-3 py-1 font-bold text-muted">
                  {t("steps_completed", {
                    done: ringkasPenanganan?.selesai ?? 0,
                    total: ringkasPenanganan?.total ?? 0,
                  })}
                </span>
              </div>

              <ul className="flex flex-col gap-2">
                {daftarPenanganan.map((item) => {
                  const dilakukan = Boolean(penanganan.checklist[item.id]);
                  return (
                    <li
                      key={item.id}
                      className="type-body-md flex items-start gap-2.5 text-ink"
                    >
                      {dilakukan ? (
                        <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                      ) : (
                        <Minus aria-hidden className="mt-0.5 size-4 shrink-0 text-label" />
                      )}
                      <span className={dilakukan ? undefined : "text-muted"}>
                        {tLogistik(item.labelKey as Parameters<typeof tLogistik>[0], item.labelParams as Parameters<typeof tLogistik>[1])}
                        <span className="sr-only">
                          {dilakukan ? t("step_done_sr") : t("step_not_done_sr")}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="type-body-sm text-label">
                {t("cold_chain_note")}
              </p>
            </Card>
          )}

          {/* Blok Verifikasi SHA-256 Audit Hash */}
          <Card variant="raised" className="flex flex-col gap-4 p-6 border-line bg-surface">
            <h2 className="type-heading-md text-ink">{t("crypto_audit_heading")}</h2>
            <p className="type-body-md text-muted">
              {t("crypto_audit_desc")}
            </p>

            {/* Hash demo bukan digest: `seed_demo.sql` dan mode tanpa kamera
                menuliskan penanda tetap. Menampilkannya sebagai bukti
                kriptografis membuat satu-satunya fitur pengemban kepercayaan
                di produk ini jadi hiasan. */}
            {!hashAsli && (
              <p className="type-body-sm flex items-start gap-2 rounded-md border border-line bg-sunken p-3 text-muted">
                <AlertTriangle
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-clay-600 dark:text-clay-400"
                />
                <span>{t("hash_placeholder_note")}</span>
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-sunken p-4">
              <code
                className={cx(
                  "type-mono-sm break-all font-bold",
                  hashAsli ? "text-brand" : "text-muted",
                )}
              >
                {record.hash_audit}
              </code>
              <PrintCrateLabelButton
                nama={record.komoditas_label}
                komoditas={record.komoditas}
                grade={record.grade_dominan}
                hashAudit={record.hash_audit}
                label={t("print_crate")}
              />
            </div>

            <div className="mt-4 border-t border-line pt-4 flex flex-col gap-3">
              <h3 className="type-label text-label flex items-center gap-2">
                <ShieldCheck className="size-4 text-brand" /> {t("canonical_json_title")}
              </h3>
              <p className="type-body-sm text-muted">
                {t("canonical_json_desc")}
              </p>
              <pre className="overflow-x-auto rounded-md bg-ink p-4 text-canvas type-mono-sm shadow-inner">
                <code>{payloadKanonik}</code>
              </pre>
            </div>
          </Card>

        </Container>
      </div>
    </PublicPage>
  );
}

