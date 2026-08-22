"use client";

import Link from "next/link";
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  Database,
  BarChart3,
  Eye,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { Container } from "@/components/container";
import {
  PageHero,
  PublicPage,
  Section,
} from "@/components/marketing/page-shell";
import { REPO_URL } from "@/components/marketing/site-chrome";
import { Badge, Card, ButtonLink } from "@/components/ui";
import {
  METRIK_DIEVALUASI_PADA,
  METRIK_KOMODITAS,
} from "@/lib/metrik-model.generated";
import { useLocale, useTranslations } from "@/lib/i18n";

/** Nama tampil per komoditas — larik metrik menyimpan label Indonesia saja. */
const LABEL_KOMODITAS = {
  tomato: "data_tomato_label",
  cucumber: "data_cucumber_label",
  carrot: "data_carrot_label",
  chili: "data_chili_label",
} as const;

/** Jumlah potongan berlabel per komoditas — angka yang sama dengan `data_subtitle`. */
const DATASET = [
  { id: "tomato", jumlah: 1860 },
  { id: "carrot", jumlah: 1158 },
  { id: "cucumber", jumlah: 594 },
  { id: "chili", jumlah: 246 },
] as const;

export default function ModelTransparencyPage() {
  const t = useTranslations("tentang_model");
  const { locale } = useLocale();

  /**
   * `2026-08-02T09:42:39+00:00` -> `2 Agustus 2026` / `2 August 2026`.
   *
   * Ikut bahasa aktif. Sebelumnya `id-ID` dipaku di sini, jadi pembaca yang
   * memilih Inggris menemukan satu tanggal berbahasa Indonesia di tengah
   * halaman yang sudah diterjemahkan seluruhnya.
   */
  const formatTanggal = (iso: string): string =>
    iso
      ? new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Jakarta",
        })
      : t("eval_date_unknown");

  const tagLocale = locale === "en" ? "en-GB" : "id-ID";
  const angka = new Intl.NumberFormat(tagLocale);
  /**
   * Persen ikut bahasa pembaca.
   *
   * Angkanya dulu sudah diformat gaya Indonesia di berkas generated, jadi
   * halaman berbahasa Inggris menampilkan "97,5%" bersebelahan dengan
   * "1,860" — koma yang sama, dua arti berbeda, di satu layar.
   */
  const persen = new Intl.NumberFormat(tagLocale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const GERBANG_BLUR = [
    {
      variance: "< 12",
      status: t("blur_status_reject"),
      warnaBadge: "danger" as const,
      keterangan: t("blur_desc_reject"),
    },
    {
      variance: "12 – 35",
      status: t("blur_status_warn"),
      warnaBadge: "warn" as const,
      keterangan: t("blur_desc_warn"),
    },
    {
      variance: "> 35",
      status: t("blur_status_normal"),
      warnaBadge: "brand" as const,
      keterangan: t("blur_desc_normal"),
    },
  ];

  const KETERBATASAN_MODEL = ([1, 2, 3, 4] as const).map((n) => ({
    judul: t(`limit_${n}_title`),
    keterangan: t(`limit_${n}_desc`),
  }));

  return (
    <PublicPage>
      <PageHero
        titleId="model-judul"
        badge={t("badge")}
        badgeIcon={<Cpu aria-hidden className="size-3.5" />}
        title={t("title")}
        lead={t("subtitle")}
        actions={
          <ButtonLink
            href={`${REPO_URL}/blob/main/ai_engine/model.py`}
            variant="outline"
            size="md"
          >
            <FileText aria-hidden className="size-4" />
            {t("btn_source_code")}
          </ButtonLink>
        }
      >
        <Link
          href="/tentang"
          className="tap focus-ring inline-flex items-center gap-1.5 font-bold text-brand hover:underline"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {t("back_link")}
        </Link>
      </PageHero>

      {/* Spesifikasi Arsitektur & Dataset */}
      <section aria-labelledby="arsitektur-judul" className="py-14 lg:py-20">
        <Container className="grid gap-8 lg:grid-cols-2">
          <Card variant="raised" className="flex flex-col gap-5 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-tint text-brand">
                <Layers aria-hidden className="size-6" />
              </span>
              <div>
                <h2 id="arsitektur-judul" className="type-heading-md text-ink">
                  {t("arch_title")}
                </h2>
                <p className="type-body-sm text-muted">{t("arch_subtitle")}</p>
              </div>
            </div>

            <p className="type-body-md text-ink">{t("arch_desc")}</p>

            <ul className="flex flex-col gap-3 border-t border-line pt-4">
              {([1, 2] as const).map((n) => (
                <li key={n} className="type-body-sm flex items-start gap-2.5 text-ink">
                  <CheckCircle2
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-brand"
                  />
                  <div>
                    <strong className="text-ink">{t(`arch_t${n}_title`)}</strong>{" "}
                    {t(`arch_t${n}_desc`)}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card variant="raised" className="flex flex-col gap-5 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-tint text-brand">
                <Database aria-hidden className="size-6" />
              </span>
              <div>
                <h2 className="type-heading-md text-ink">{t("data_title")}</h2>
                <p className="type-body-sm text-muted">{t("data_subtitle")}</p>
              </div>
            </div>

            <p className="type-body-md text-ink">{t("data_desc")}</p>

            <div className="grid grid-cols-2 gap-3 border-t border-line pt-4 text-center sm:grid-cols-4">
              {DATASET.map(({ id, jumlah }) => (
                <div key={id} className="rounded-md bg-sunken p-3">
                  <span className="type-heading-md tnum block font-bold text-brand">
                    {angka.format(jumlah)}
                  </span>
                  <span className="type-label block pt-1 text-muted">
                    {t(LABEL_KOMODITAS[id])}
                  </span>
                </div>
              ))}
            </div>

            <p className="type-body-sm pt-1 text-muted">{t("data_note")}</p>
          </Card>
        </Container>
      </section>

      {/* Metrik Akurasi per Komoditas */}
      <Section
        id="metrik"
        eyebrow={t("eval_subtitle")}
        eyebrowIcon={<BarChart3 aria-hidden className="size-3.5" />}
        title={t("eval_title")}
        lead={t("eval_desc", { date: formatTanggal(METRIK_DIEVALUASI_PADA) })}
        tone="surface"
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {METRIK_KOMODITAS.map(
            ({ id, jumlahVal, akurasi, f1, presisi, recall, kelas }: (typeof METRIK_KOMODITAS)[number]) => (
              <Card
                key={id}
                variant="raised"
                className="flex flex-col justify-between gap-5 p-6"
              >
                <div>
                  <span className="type-label block text-brand">
                    {t("eval_target_commodity")}
                  </span>
                  <h3 className="type-heading-md pt-1 text-ink">
                    {t(LABEL_KOMODITAS[id as keyof typeof LABEL_KOMODITAS])}
                  </h3>
                  <p className="type-mono-sm pt-1 text-muted">
                    {t("eval_class_label")}{" "}
                    {kelas.map((k) => t(`class_${k}`)).join(", ")}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 border-y border-line py-4 text-center">
                  {(
                    [
                      [f1, "F1-Score"],
                      [presisi, "Precision"],
                      [recall, "Recall"],
                    ] as const
                  ).map(([nilai, nama]) => (
                    <div key={nama}>
                      <span className="type-heading-md tnum block font-bold text-ink">
                        {persen.format(nilai)}
                      </span>
                      <span className="type-label block text-muted">{nama}</span>
                    </div>
                  ))}
                </div>

                <p className="type-body-sm text-muted">
                  {t("eval_metric_acc_desc", {
                    acc: persen.format(akurasi),
                    count: jumlahVal,
                    note: jumlahVal < 50 ? t("eval_metric_acc_note_few") : "",
                  })}
                </p>
              </Card>
            ),
          )}
        </div>

        <p className="type-body-sm max-w-3xl text-muted">{t("eval_metric_warning")}</p>
      </Section>

      {/* Gerbang Kualitas & Blur 3-Tingkat */}
      <Section
        id="blur"
        eyebrow={t("blur_badge")}
        eyebrowIcon={<Eye aria-hidden className="size-3.5" />}
        title={t("blur_title")}
        lead={t("blur_desc")}
      >
        <div className="grid gap-6 md:grid-cols-3">
          {GERBANG_BLUR.map(({ variance, status, warnaBadge, keterangan }) => (
            <Card key={variance} variant="raised" className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <span className="type-mono-md font-bold text-ink">Var: {variance}</span>
                <Badge tone={warnaBadge}>{status}</Badge>
              </div>
              <p className="type-body-sm text-muted">{keterangan}</p>
            </Card>
          ))}
        </div>
        {/* Dua gerbang, dua ambang. Menyebut satu saja membuat pembaca mengira
            angka di layar ini adalah satu-satunya yang menolak foto. */}
        <p className="type-body-sm max-w-3xl text-label">{t("blur_engine_note")}</p>
      </Section>

      {/* Keterbatasan yang Diakui secara Jujur */}
      <Section
        id="keterbatasan"
        eyebrow={t("limit_badge")}
        eyebrowIcon={<ShieldAlert aria-hidden className="size-3.5" />}
        title={t("limit_title")}
        lead={t("limit_desc")}
        tone="surface"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {KETERBATASAN_MODEL.map(({ judul, keterangan }) => (
            <Card key={judul} variant="raised" className="flex items-start gap-4 p-6">
              <AlertTriangle
                aria-hidden
                className="mt-1 size-6 shrink-0 text-clay-600 dark:text-clay-400"
              />
              <div>
                <h3 className="type-heading-sm text-ink">{judul}</h3>
                <p className="type-body-sm pt-1 text-muted">{keterangan}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </PublicPage>
  );
}
