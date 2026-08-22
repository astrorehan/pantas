"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Coins,
  Factory,
  Handshake,
  Layers,
  QrCode,
  Route,
  ScanLine,
  ShieldCheck,
  Tag,
  TrendingDown,
  Truck,
  HandPlatter,
  UploadCloud,
  Workflow,
} from "lucide-react";
import { Container } from "@/components/container";
import { ButtonLink, Card, GradeBadge, cx } from "@/components/ui";
import { METRIK_KOMODITAS } from "@/lib/metrik-model.generated";

import { useLocale, useTranslations } from "@/lib/i18n";
import { Section, SumberAngka } from "./page-shell";

export { Section } from "./page-shell";

/* ---------------------------------------------------------------------- Hero */

/**
 * Grade chips floated over the harvest photo. They are the product's actual
 * output vocabulary, so the first thing a visitor sees is the thing PANTAS
 * makes — a measured verdict per object — rather than a stock hero.
 */
const CHIPS = [
  { grade: "A" as const, top: "58%", left: "48%", delay: "300ms", mm2: "3.480 mm²" },
  { grade: "B" as const, top: "66%", left: "74%", delay: "560ms", mm2: "2.610 mm²" },
  { grade: "C" as const, top: "78%", left: "38%", delay: "820ms", mm2: "1.420 mm²" },
];

export function Hero() {
  const t = useTranslations("landing");

  return (
    <section aria-labelledby="hero-judul" className="relative overflow-hidden border-b border-line bg-gradient-to-b from-surface via-surface to-sunken/40">
      {/* Ambient background glow with animation */}
      <div className="pulse-glow absolute top-0 right-1/4 size-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
      <div className="pulse-glow absolute bottom-0 left-10 size-80 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

      <Container className="relative z-10 grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 lg:py-24">
        <div className="rise flex flex-col items-start gap-6">
          <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand-tint/70 px-3.5 py-1.5 text-xs font-bold text-brand backdrop-blur-md shadow-xs">
            {t("badge")}
          </span>

          {/* Tanpa `{" "}` di antara potongan: `hero_title_1` sudah berakhir
              dengan spasi dan `hero_title_2` mulai dengan koma, jadi pemisah
              tambahan membuat judul terbaca "ukuran , bukan". */}
          <h1 id="hero-judul" className="type-display-lg text-ink font-display tracking-tight leading-[1.12]">
            {t("hero_title_1")}
            <span className="bg-gradient-to-r from-brand via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {t("hero_title_accent")}
            </span>
            {t("hero_title_2")}
          </h1>

          <p className="type-body-lg max-w-xl text-muted leading-relaxed">
            {t("hero_desc")}
          </p>

          <div className="flex flex-wrap gap-3.5 pt-2">
            <ButtonLink href="/demo" size="xl" className="shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/35 hover:-translate-y-0.5 transition-all">
              {t("btn_demo")}
            </ButtonLink>
            <ButtonLink href="/masuk" size="xl" variant="ghost" className="border-line-strong hover:bg-surface shadow-xs">
              {t("btn_login")}
            </ButtonLink>
          </div>

          <p className="type-body-sm text-label">
            {t("hero_nologin")}{" "}
            <a
              href="#bukti"
              className="focus-ring rounded-xs font-bold text-brand hover:underline"
            >
              {t("hero_nologin_link")}
            </a>{" "}
            {t("hero_nologin_suffix")}
          </p>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line/80 bg-sunken shadow-2xl transition-all duration-500 group hover:border-brand/40">
          <Image
            src="/img/tomat-rumahkaca.jpg"
            alt={t("hero_img_alt")}
            fill
            priority
            sizes="(min-width: 1024px) 46vw, 92vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Floating AI HUD Chips */}
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            {CHIPS.map(({ grade, top, left, delay, mm2 }) => (
              <span
                key={grade}
                style={{ top, left, animationDelay: delay }}
                className="float-slow absolute inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/60 bg-surface/90 px-2.5 py-1 text-xs shadow-lg backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10"
              >
                {/* Pelatnya saja: keping ini sudah punya pil, bingkai, dan
                    paddingnya sendiri, dan menumpuk padding di atas penanda
                    mendorong pelatnya lepas dari tepi sehingga siluet tag-nya
                    hilang. */}
                <GradeBadge grade={grade} size="sm" variant="mark" />
                <span className="type-body-sm tnum font-extrabold text-ink whitespace-nowrap">{mm2}</span>
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------- Masalah dalam angka */

export function MasalahAngka() {
  const t = useTranslations("landing");
  const sumber = t("masalah_sumber");
  const angka = [
    { nilai: t("masalah_stat1_val"), unit: t("masalah_stat1_unit"), label: t("masalah_stat1_label") },
    { nilai: t("masalah_stat2_val"), unit: t("masalah_stat2_unit"), label: t("masalah_stat2_label") },
    { nilai: t("masalah_stat3_val"), unit: t("masalah_stat3_unit"), label: t("masalah_stat3_label") },
  ];

  return (
    <Section
      id="masalah"
      eyebrow={t("masalah_eyebrow")}
      eyebrowIcon={<TrendingDown aria-hidden className="size-3.5" />}
      title={t("masalah_title")}
      lead={t("masalah_lead")}
    >
      <dl className="grid gap-5 sm:grid-cols-3">
        {angka.map(({ nilai, unit, label }) => (
          <Card key={label} className="group relative overflow-hidden flex flex-col gap-1.5 p-6 transition-all duration-300 hover:shadow-xl hover:border-brand/30 hover:-translate-y-1">
            <div className="absolute top-0 right-0 size-24 bg-gradient-to-bl from-brand/10 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <dd className="type-display-md tnum font-display bg-gradient-to-r from-brand via-emerald-600 to-teal-600 bg-clip-text text-transparent">{nilai}</dd>
            <dd className="type-body-sm font-bold text-muted">{unit}</dd>
            <dt className="type-body-md pt-2 text-ink font-semibold">{label}</dt>
          </Card>
        ))}
      </dl>
      {/* Satu rujukan untuk tiga angka, bukan baris sumber identik yang
          diulang di tiap kartu — pengulangan itu membaca sebagai tiga sumber
          berbeda yang kebetulan sama bunyinya. */}
      <SumberAngka>{sumber}</SumberAngka>
    </Section>
  );
}

/* ----------------------------------------------------------------------- Fitur */

export function Fitur() {
  const t = useTranslations("landing");
  const fitur = [
    { ikon: ScanLine, judul: t("fitur1_title"), isi: t("fitur1_desc"), tuju: "#bukti", aksi: t("fitur1_action") },
    { ikon: Tag, judul: t("fitur2_title"), isi: t("fitur2_desc"), tuju: "/demo", aksi: t("fitur2_action") },
    { ikon: Factory, judul: t("fitur3_title"), isi: t("fitur3_desc"), tuju: "/demo", aksi: t("fitur3_action") },
    { ikon: Handshake, judul: t("fitur4_title"), isi: t("fitur4_desc"), tuju: "/demo", aksi: t("fitur4_action") },
    { ikon: Route, judul: t("fitur5_title"), isi: t("fitur5_desc"), tuju: "/tentang", aksi: t("fitur5_action") },
    { ikon: QrCode, judul: t("fitur6_title"), isi: t("fitur6_desc"), tuju: "/tentang/model", aksi: t("fitur6_action") },
  ];

  return (
    <Section
      id="fitur"
      eyebrow={t("fitur_eyebrow")}
      eyebrowIcon={<Layers aria-hidden className="size-3.5" />}
      title={t("fitur_title")}
      lead={t("fitur_lead")}
      tone="sunken"
    >
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {fitur.map(({ ikon: Ikon, judul, isi, tuju, aksi }) => (
          <li key={judul}>
            <Card variant="interactive" className="group h-full transition-all duration-300 hover:shadow-xl hover:border-brand/30 hover:-translate-y-1">
              <Link
                href={tuju}
                className="focus-ring flex h-full flex-col gap-4 rounded-xl p-6"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-brand-tint text-brand shadow-xs transition-all duration-300 group-hover:bg-brand group-hover:text-white group-hover:scale-110">
                  <Ikon aria-hidden className="size-5 shrink-0" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="type-heading-sm text-ink group-hover:text-brand transition-colors duration-200">{judul}</h3>
                  <p className="type-body-md pt-2 text-muted leading-relaxed">{isi}</p>
                </div>
                <div className="mt-auto pt-2">
                  <span className="type-body-sm inline-flex items-center gap-1 font-bold text-brand group-hover:translate-x-1 transition-transform">
                    {aksi}
                    <ArrowRight aria-hidden className="size-4" />
                  </span>
                </div>
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------ Cara kerja */

const LANGKAH = [
  { ikon: HandPlatter, judul: "langkah1_title", isi: "langkah1_desc" },
  { ikon: ScanLine, judul: "langkah2_title", isi: "langkah2_desc" },
  { ikon: UploadCloud, judul: "langkah3_title", isi: "langkah3_desc" },
  { ikon: Handshake, judul: "langkah4_title", isi: "langkah4_desc" },
];

export function CaraKerja() {
  const t = useTranslations("landing");
  return (
    <Section
      id="cara-kerja"
      eyebrow={t("cara_kerja_eyebrow")}
      eyebrowIcon={<Workflow aria-hidden className="size-3.5" />}
      title={t("cara_kerja_title")}
      tone="surface"
    >
      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {LANGKAH.map(({ ikon: Ikon, judul, isi }, i) => (
          <li key={judul}>
            <Card className="group flex h-full flex-col gap-3 p-5 transition-all duration-300 hover:border-brand/30 hover:shadow-lg">
              <div className="flex items-center gap-3">
                <span className="type-heading-sm tnum flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand-deep transition-colors group-hover:bg-brand group-hover:text-white">
                  {i + 1}
                </span>
                <Ikon aria-hidden className="size-5 text-brand" strokeWidth={2} />
              </div>
              <h3 className="type-heading-sm text-ink">{t(judul)}</h3>
              <p className="type-body-md text-muted">{t(isi)}</p>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------ Kedalaman teknis */

/** Bentuk minimal `useTranslations()` yang benar-benar dipakai di sini. */
type Terjemah = (key: string) => string;

/** Hand-drawn SVG — §6.2 rules out chart/diagram libraries for bundle budget. */
function DiagramPipeline({ t }: { t: Terjemah }) {
  const tahap = [
    { x: 8, label: t("diagram_label1"), sub: "Laplacian" },
    { x: 158, label: t("diagram_label2"), sub: "px/mm²" },
    { x: 308, label: t("diagram_label3"), sub: "masking" },
    { x: 458, label: t("diagram_label4"), sub: "OpenCV" },
    { x: 608, label: t("diagram_label5"), sub: "veto patologi" },
    { x: 758, label: t("diagram_label6"), sub: "SHA-256" },
  ];

  return (
    <div className="scroll-x rounded-lg border border-line bg-surface p-4 w-full max-w-full min-w-0 overflow-x-auto">
      <svg
        viewBox="0 0 900 130"
        role="img"
        aria-label={t("diagram_alt")}
        className="h-auto w-full min-w-[34rem] sm:min-w-[42rem] max-w-none"
      >
        {tahap.map(({ x, label, sub }, i) => (
          <g key={label}>
            <rect
              x={x}
              y={30}
              width={126}
              height={64}
              rx={10}
              fill="var(--surface-sunken)"
              stroke="var(--border-subtle)"
            />
            <text
              x={x + 63}
              y={57}
              textAnchor="middle"
              fill="var(--text-primary)"
              className="type-body-sm"
              style={{ fontWeight: 700 }}
            >
              {label}
            </text>
            <text
              x={x + 63}
              y={76}
              textAnchor="middle"
              fill="var(--text-secondary)"
              className="type-body-sm"
            >
              {sub}
            </text>
            {i < tahap.length - 1 && (
              <path
                d={`M${x + 128} 62 L${x + 154} 62`}
                stroke="var(--accent-primary)"
                strokeWidth={2}
                markerEnd="url(#pantas-arrow)"
              />
            )}
          </g>
        ))}
        <defs>
          <marker
            id="pantas-arrow"
            viewBox="0 0 8 8"
            refX={6}
            refY={4}
            markerWidth={6}
            markerHeight={6}
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 z" fill="var(--accent-primary)" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

/**
 * Metrik segmentasi YOLO-1, dicatat manual dari keluaran training.
 *
 * Berbeda dari YOLO-2 yang punya `metrik-model.generated.ts` dan skrip
 * regenerasinya, angka di sini belum punya berkas sumber di repo — tidak ada
 * `ai_engine/outputs/metrik_yolo1.json`. Karena itu tabelnya membawa catatan
 * sumber di layar, dan kolom jumlah gambar latih yang memang perkiraan ditandai
 * `±` alih-alih dibulatkan jadi angka yang terlihat pasti.
 */
const YOLO1 = [
  { k: "chili", p: "97,8%", r: "94,5%", m: "97,4%", n: "6.675" },
  { k: "cucumber", p: "95,9%", r: "89,8%", m: "96,0%", n: "±1.250" },
  { k: "tomato", p: "94,5%", r: "84,5%", m: "90,3%", n: "±9.790" },
  { k: "carrot", p: "91,1%", r: "78,1%", m: "87,4%", n: "±788" },
];

export function KedalamanTeknis() {
  const t = useTranslations("landing");
  const { locale } = useLocale();
  const persen = new Intl.NumberFormat(locale === "en" ? "en-GB" : "id-ID", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  /* Angka di dalam kalimat peringatan ikut dibaca dari metrik yang sama.
     Ditulis tangan, ia akan basi persis seperti klaim "96,5%" sebelumnya. */
  const cari = (id: string) => METRIK_KOMODITAS.find((m) => m.id === id);

  return (
    <Section
      id="teknis"
      eyebrow={t("kedalaman_eyebrow")}
      eyebrowIcon={<BarChart3 aria-hidden className="size-3.5" />}
      title={t("kedalaman_title")}
      lead={t("kedalaman_desc")}
      tone="surface"
    >
      <DiagramPipeline t={t} />

      <div className="grid w-full max-w-full min-w-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="w-full max-w-full min-w-0 overflow-hidden p-4 sm:p-5">
          <h3 className="type-heading-sm text-ink">
            {t("tech_yolo1_title")}
          </h3>
          <p className="type-body-sm pt-1 pb-3 text-muted">
            {t("tech_yolo1_desc")}
          </p>
          <div className="-mx-4 w-full max-w-full overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[270px] sm:min-w-[28rem] border-collapse">
              <thead>
                <tr className="border-b border-line">
                  {[t("tech_yolo1_th_commodity"), "Precision", "Recall", "mAP50 (mask)", t("tech_yolo1_th_train")].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="whitespace-nowrap px-1.5 py-2 text-start text-xs font-bold text-muted sm:text-sm"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {YOLO1.map(({ k, p, r, m, n }) => (
                  <tr key={k} className="border-b border-line last:border-0">
                    <th scope="row" className="whitespace-nowrap px-1.5 py-2 text-start text-xs font-bold text-ink sm:text-sm">
                      {t(`tech_yolo1_data_${k}`)}
                    </th>
                    <td className="tnum px-1.5 py-2 text-xs text-ink sm:text-sm">{p}</td>
                    <td className="tnum px-1.5 py-2 text-xs text-ink sm:text-sm">{r}</td>
                    <td className="tnum px-1.5 py-2 text-xs text-ink sm:text-sm">{m}</td>
                    <td className="tnum px-1.5 py-2 text-xs text-muted sm:text-sm">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <SumberAngka>{t("tech_yolo1_sumber")}</SumberAngka>
        </Card>

        <Card className="flex w-full max-w-full min-w-0 flex-col gap-3 overflow-hidden p-4 sm:p-5">
          <h3 className="type-heading-sm text-ink">
            {t("tech_yolo2_title")}
          </h3>
          <p className="type-body-md text-muted">{t("tech_yolo2_desc")}</p>

          {/* Angkanya dibaca dari metrik-model.generated.ts — sumber yang sama
              dengan kartu di /tentang/model. Waktu kalimat ini masih ditulis
              tangan, landing mengklaim tomat 96,5% sementara halaman model
              menampilkan 97,5% untuk evaluasi yang sama. */}
          <ul className="flex flex-col gap-1.5">
            {METRIK_KOMODITAS.map(({ id, akurasi, jumlahVal }) => (
              <li
                key={id}
                className="type-body-sm flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-0"
              >
                <span className="font-bold text-ink">{t(`tech_yolo1_data_${id}`)}</span>
                <span className="tnum text-muted">
                  {t("tech_yolo2_akurasi", {
                    acc: persen.format(akurasi),
                    n: jumlahVal,
                  })}
                </span>
              </li>
            ))}
          </ul>

          {/* Kejujuran soal keterbatasan adalah bagian dari klaimnya (R-14, R-15). */}
          <p className="type-body-sm flex items-start gap-2 break-words rounded-md border border-line bg-sunken p-3 text-muted">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-clay-600 dark:text-clay-400" />
            <span>
              <strong className="text-ink">{t("tech_yolo2_caveat_title")}</strong>{" "}
              {t("tech_yolo2_caveat", {
                nCabai: cari("chili")?.jumlahVal ?? 0,
                akurasiWortel: persen.format(cari("carrot")?.akurasi ?? 0),
              })}
            </span>
          </p>
        </Card>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------- Dampak & keberlanjutan */

/**
 * Angka faktor di sini dibaca dari tabel `emisi_faktor` (F-106), bukan
 * konstanta: klaim di landing dan angka di layar dampak petani harus berasal
 * dari baris yang sama, kalau tidak pembaca bisa menemukan dua versi.
 */
export function DampakTema() {
  const t = useTranslations("landing");
  const pilar = [
    { ikon: ShieldCheck, judul: t("dampak_pilar1_title"), isi: t("dampak_pilar1_desc") },
    { ikon: Route, judul: t("dampak_pilar2_title"), isi: t("dampak_pilar2_desc") },
    { ikon: Truck, judul: t("dampak_pilar3_title"), isi: t("dampak_pilar3_desc") },
    { ikon: Coins, judul: t("dampak_pilar4_title"), isi: t("dampak_pilar4_desc") },
  ];

  return (
    <Section
      id="dampak"
      eyebrow={t("dampak_eyebrow")}
      eyebrowIcon={<ShieldCheck aria-hidden className="size-3.5" />}
      title={t("dampak_title")}
      tone="surface"
    >
      <ul className="grid gap-4 md:grid-cols-2">
        {pilar.map(({ ikon: Ikon, judul, isi }) => (
          <li key={judul}>
            <Card className="flex h-full gap-4 p-5 transition-all duration-300 hover:border-brand/30 hover:shadow-lg">
              <Ikon aria-hidden className="mt-0.5 size-6 shrink-0 text-brand" strokeWidth={2} />
              <div>
                <h3 className="type-heading-sm text-ink">{judul}</h3>
                <p className="type-body-md pt-1 text-muted">{isi}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------------------- Penutup */

export function AjakanPenutup() {
  const t = useTranslations("landing");

  return (
    <section aria-labelledby="penutup-judul" className="py-16 lg:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-brand-dark via-brand-deep to-emerald-950 p-8 sm:p-14 text-white shadow-2xl">
          {/* Decorative ambient background glows */}
          <div className="pulse-glow absolute -top-24 -right-24 size-96 rounded-full bg-brand/30 blur-3xl pointer-events-none" />
          <div className="pulse-glow absolute -bottom-24 -left-24 size-80 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 id="penutup-judul" className="type-display-md text-white font-display">
                {t("ajakan_title")}
              </h2>
              <p className="type-body-lg pt-3 text-white/80 leading-relaxed">
                {t("ajakan_desc")}
              </p>
            </div>
            <ButtonLink
              href="/demo"
              size="xl"
              variant="ghost"
              className={cx(
                "shrink-0 border-0 bg-white text-emerald-950 font-extrabold shadow-xl",
                "hover:bg-emerald-50 hover:text-emerald-950 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300",
              )}
            >
              {t("ajakan_btn")}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
