"use client";

import Link from "next/link";
import {
  BookOpen,
  FileCode2,
  GitBranch,
  Lock,
  MapPin,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { KartuAkunDemo } from "@/components/marketing/kartu-akun-demo";
import {
  PageHero,
  PublicPage,
  Section,
} from "@/components/marketing/page-shell";
import { REPO_URL } from "@/components/marketing/site-chrome";
import { Card } from "@/components/ui";
import { DEMO_PASSWORD, SKRIP_DEMO } from "@/lib/demo";
import { useTranslations } from "@/lib/i18n";

/**
 * The five screens worth opening first, in the order the script visits them.
 *
 * Every one of these sits behind `RequireRole`, so a visitor who has not
 * signed in yet lands on `/masuk` instead. That is stated on the card rather
 * than discovered by clicking — see `screens_desc` and the per-row lock.
 */
const LAYAR = [
  { href: "/petani", labelKey: "screen_1_label", isiKey: "screen_1_desc" },
  { href: "/petani/riwayat", labelKey: "screen_2_label", isiKey: "screen_2_desc" },
  { href: "/petani/harga", labelKey: "screen_3_label", isiKey: "screen_3_desc" },
  { href: "/pembeli/peta", labelKey: "screen_4_label", isiKey: "screen_4_desc" },
  { href: "/pembeli/pesanan", labelKey: "screen_5_label", isiKey: "screen_5_desc" },
];

const DOKUMEN = [
  { href: REPO_URL, ikon: GitBranch, labelKey: "doc_1_label", isiKey: "doc_1_desc" },
  {
    href: `${REPO_URL}/blob/main/docs/PRD.md`,
    ikon: FileCode2,
    labelKey: "doc_2_label",
    isiKey: "doc_2_desc",
  },
  {
    href: `${REPO_URL}/blob/main/README.md`,
    ikon: BookOpen,
    labelKey: "doc_3_label",
    isiKey: "doc_3_desc",
  },
];

export default function DemoPage() {
  const t = useTranslations("demo");

  return (
    <PublicPage>
      <PageHero
        titleId="demo-judul"
        badge={t("badge")}
        badgeIcon={<Sparkles aria-hidden className="size-3.5" />}
        title={t("hero_title")}
        lead={
          <>
            {t("hero_desc")}{" "}
            <code className="type-mono-sm rounded-sm bg-sunken px-1.5 py-0.5 text-ink">
              {DEMO_PASSWORD}
            </code>
            {t("hero_desc_end")}
          </>
        }
      >
        <p className="type-body-sm max-w-3xl text-label">{t("hero_note")}</p>
      </PageHero>

      {/* Tanpa eyebrow: satu-satunya kandidatnya adalah `badge`, yang sudah
          terbaca sebagai lencana hero beberapa sentimeter di atasnya. */}
      <Section id="akun" title={t("select_role")}>
        <KartuAkunDemo />
      </Section>

      <Section
        id="skrip"
        eyebrow={t("script_badge")}
        eyebrowIcon={<PlayCircle aria-hidden className="size-3.5" />}
        title={t("script_title")}
        tone="surface"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <ol className="flex flex-col">
            {SKRIP_DEMO.map((n) => (
              <li key={n} className="flex gap-4 pb-5 last:pb-0">
                <span className="type-mono-sm flex w-12 shrink-0 justify-end pt-0.5 font-bold text-brand">
                  {t(`script_s${n}_time`)}
                </span>
                <span>
                  <span className="type-heading-sm block text-ink">
                    {t(`script_s${n}_title`)}
                  </span>
                  <span className="type-body-md block pt-1 text-muted">
                    {t(`script_s${n}_desc`)}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-4">
            <h3 className="type-heading-md text-ink">{t("screens_title")}</h3>
            <p className="type-body-md flex items-start gap-2 rounded-md border border-line bg-sunken p-3 text-muted">
              <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-label" />
              <span>{t("screens_desc")}</span>
            </p>
            <ul className="flex flex-col gap-2">
              {LAYAR.map(({ href, labelKey, isiKey }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="tap focus-ring flex flex-col gap-0.5 rounded-md border border-line bg-canvas p-3 transition-all hover:border-brand/40 hover:shadow-e1"
                  >
                    <span className="type-body-md flex items-center gap-2 font-bold text-ink">
                      <MapPin aria-hidden className="size-4 shrink-0 text-brand" />
                      {t(labelKey)}
                      <Lock
                        aria-label={t("needs_session")}
                        className="ms-auto size-3.5 shrink-0 text-label"
                      />
                    </span>
                    <span className="type-body-sm ps-6 text-muted">{t(isiKey)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section
        id="dokumen"
        eyebrow={t("docs_badge")}
        eyebrowIcon={<FileCode2 aria-hidden className="size-3.5" />}
        title={t("docs_title")}
      >
        <ul className="grid gap-4 md:grid-cols-3">
          {DOKUMEN.map(({ href, ikon: Ikon, labelKey, isiKey }) => (
            <li key={href}>
              <Card
                variant="interactive"
                className="group h-full transition-all duration-300 hover:border-brand/30 hover:shadow-lg"
              >
                <a
                  href={href}
                  className="focus-ring flex h-full flex-col gap-2 rounded-md p-5"
                >
                  <Ikon aria-hidden className="size-5 text-brand" />
                  <span className="type-heading-sm text-ink transition-colors group-hover:text-brand">
                    {t(labelKey)}
                  </span>
                  <span className="type-body-md text-muted">{t(isiKey)}</span>
                </a>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
    </PublicPage>
  );
}
