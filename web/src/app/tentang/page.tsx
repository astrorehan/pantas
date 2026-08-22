"use client";

import Link from "next/link";
import {
  Sparkles,
  Scale,
  Truck,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Users,
  BarChart3,
} from "lucide-react";
import { Container } from "@/components/container";
import { CaraKerja, KedalamanTeknis } from "@/components/marketing/sections";
import {
  PageHero,
  PublicPage,
  SECTION_PAD,
  Section,
} from "@/components/marketing/page-shell";
import { Badge, Card, ButtonLink, cx } from "@/components/ui";
import { useTranslations } from "@/lib/i18n";

export default function TentangPage() {
  const t = useTranslations("tentang");

  /**
   * Tujuan tiap pilar sengaja hanya menunjuk permukaan publik.
   *
   * Pilar 2 dan 3 sebelumnya menaut ke `/petani/harga` dan `/admin/rute` —
   * keduanya dijaga `RequireRole`, jadi pengunjung yang belum masuk selalu
   * mendarat di `/masuk` tanpa pernah melihat yang dijanjikan tombolnya.
   * Sekarang keduanya lewat `/demo`, dan labelnya menyebut kebutuhan sesi itu
   * alih-alih menyembunyikannya.
   */
  const PILAR_INOVASI = [
    {
      id: "pilar-1",
      nomor: "01",
      ikon: Cpu,
      label: t("p1_label"),
      judul: t("p1_title"),
      deskripsi: t("p1_desc"),
      butir: [t("p1_b1"), t("p1_b2"), t("p1_b3")],
      href: "/tentang/model",
      cta: t("p1_cta"),
    },
    {
      id: "pilar-2",
      nomor: "02",
      ikon: Scale,
      label: t("p2_label"),
      judul: t("p2_title"),
      deskripsi: t("p2_desc"),
      butir: [t("p2_b1"), t("p2_b2"), t("p2_b3")],
      href: "/demo",
      cta: t("p2_cta"),
    },
    {
      id: "pilar-3",
      nomor: "03",
      ikon: Truck,
      label: t("p3_label"),
      judul: t("p3_title"),
      deskripsi: t("p3_desc"),
      butir: [t("p3_b1"), t("p3_b2"), t("p3_b3")],
      href: "/demo",
      cta: t("p3_cta"),
    },
  ];

  /**
   * Empat angka, empat rujukan.
   *
   * Sebelumnya kartu-kartu ini menayangkan "30-40%" potongan tengkulak dan
   * "1,840+" foto latih tanpa satu pun sumber, dan angka 62,8% diberi label
   * berbeda dari label yang dipakai angka yang sama di landing. Sekarang tiap
   * kartu menyebut asalnya, dan yang tidak bisa dirujuk sudah dikeluarkan.
   */
  const MASALAH_ANGKA = (["m1", "m2", "m3", "m4"] as const).map((k) => ({
    angka: t(`${k}_angka`),
    label: t(`${k}_label`),
    keterangan: t(`${k}_desc`),
    sumber: t(`${k}_sumber`),
  }));

  return (
    <PublicPage>
      <PageHero
        titleId="tentang-judul"
        badge={t("badge")}
        badgeIcon={<Sparkles aria-hidden className="size-3.5" />}
        title={t("title")}
        lead={t("subtitle")}
        actions={
          <>
            <ButtonLink href="/tentang/model" size="lg">
              {t("btn_model_card")}
            </ButtonLink>
            <ButtonLink href="/demo" variant="outline" size="lg">
              {t("btn_try_demo")}
            </ButtonLink>
          </>
        }
      />

      <Section
        id="angka"
        eyebrow={t("pillar_badge")}
        eyebrowIcon={<BarChart3 aria-hidden className="size-3.5" />}
        title={t("why_built_title")}
        lead={t("why_built_desc")}
      >
        {/* Di atas kartunya, bukan di bawah: kalimatnya menyebut "di bawah",
            dan janji itu hanya benar kalau ia dibaca lebih dulu. */}
        <p className="type-body-sm text-label">{t("stats_note")}</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MASALAH_ANGKA.map(({ angka, label, keterangan, sumber }) => (
            <Card
              key={label}
              variant="raised"
              className="group flex flex-col gap-3 p-6 transition-all duration-300 hover:border-brand/30 hover:shadow-lg"
            >
              <div>
                <span className="type-display-md tnum font-display block bg-gradient-to-r from-brand via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {angka}
                </span>
                <span className="type-heading-sm block pt-1 text-ink">{label}</span>
              </div>
              <p className="type-body-sm text-muted">{keterangan}</p>
              <p className="type-body-sm mt-auto border-t border-line pt-3 text-label">
                {sumber}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Mekanisme empat langkah — pindah dari landing (lihat src/app/page.tsx) */}
      <CaraKerja />

      <Section
        id="pilar"
        eyebrow={t("pillar_badge")}
        eyebrowIcon={<ShieldCheck aria-hidden className="size-3.5" />}
        title={t("pillar_title")}
        lead={t("pillar_desc")}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {PILAR_INOVASI.map(
            ({ id, nomor, ikon: Ikon, label, judul, deskripsi, butir, href, cta }) => (
              <Card
                key={id}
                variant="raised"
                className="group flex flex-col justify-between gap-6 p-6 transition-all duration-300 hover:border-brand/30 hover:shadow-xl sm:p-8"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-full bg-brand-tint text-brand transition-all duration-300 group-hover:bg-brand group-hover:text-white">
                      <Ikon aria-hidden className="size-6" />
                    </span>
                    <span className="type-mono-sm font-bold text-label">
                      {t("pillar_prefix")} #{nomor}
                    </span>
                  </div>

                  <div>
                    <span className="type-label block text-brand">{label}</span>
                    <h3 className="type-heading-md pt-1 text-ink">{judul}</h3>
                    <p className="type-body-sm pt-2 text-muted">{deskripsi}</p>
                  </div>

                  <ul className="flex flex-col gap-2.5 border-t border-line pt-4">
                    {butir.map((b) => (
                      <li key={b} className="type-body-sm flex items-start gap-2.5 text-ink">
                        <CheckCircle2
                          aria-hidden
                          className="mt-0.5 size-4 shrink-0 text-brand"
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={href}
                  className="tap focus-ring inline-flex items-center justify-between gap-3 rounded-md bg-sunken px-4 py-3 font-bold text-ink transition-colors hover:bg-brand-tint hover:text-brand-deep"
                >
                  <span>{cta}</span>
                  <ArrowRight
                    aria-hidden
                    className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </Card>
            ),
          )}
        </div>
      </Section>

      {/* Kedalaman teknis — pindah dari landing bersama CaraKerja */}
      <KedalamanTeknis />

      <section aria-labelledby="cta-judul" className={cx(SECTION_PAD)}>
        <Container className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <Badge tone="brand" icon={<Users aria-hidden className="size-3.5" />}>
            {t("cta_badge")}
          </Badge>
          <h2 id="cta-judul" className="type-display-md font-display text-ink">
            {t("cta_title")}
          </h2>
          <p className="type-body-lg text-muted">{t("cta_desc")}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <ButtonLink href="/demo" size="lg">
              {t("btn_demo")}
            </ButtonLink>
            <ButtonLink href="/masuk" variant="outline" size="lg">
              {t("btn_login")}
            </ButtonLink>
          </div>
        </Container>
      </section>
    </PublicPage>
  );
}
