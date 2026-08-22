"use client";

import type { ReactNode } from "react";
import { Container } from "@/components/container";
import { Badge, cx } from "@/components/ui";
import { SiteFooter, SiteHeader } from "./site-chrome";

/**
 * Rangka bersama untuk seluruh permukaan publik (`/`, `/tentang`,
 * `/tentang/model`, `/demo`, `/lacak/*`).
 *
 * Sebelumnya tiap halaman menulis ulang `<div class="flex min-h-dvh …">`,
 * `<SiteHeader/>`, dan padding section-nya sendiri. Hasilnya tiga skala
 * padding (`py-12 lg:py-16`, `py-14 lg:py-20`, `py-10 lg:py-16`) dan dua pola
 * kepala section (eyebrow teks vs `Badge`) yang hidup berdampingan di satu
 * situs. Semuanya dipusatkan di sini supaya satu perubahan berlaku ke semua.
 */
export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <SiteHeader />
      <main id="konten" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

/** Latar section. `canvas` mengikuti halaman; dua lainnya memberi pita kontras. */
export type SectionTone = "canvas" | "surface" | "sunken";

const TONE: Record<SectionTone, string> = {
  canvas: "",
  surface: "border-y border-line/60 bg-surface",
  sunken: "border-y border-line/60 bg-gradient-to-b from-sunken/40 via-surface to-surface",
};

/** Irama vertikal tunggal untuk semua halaman publik. */
export const SECTION_PAD = "py-14 lg:py-20";

/**
 * Kepala hero halaman. Satu-satunya tempat `<h1>` halaman publik dibentuk,
 * jadi ukuran, urutan badge → judul → lead → aksi tidak bisa lagi berbeda
 * antar halaman.
 */
export function PageHero({
  badge,
  badgeIcon,
  title,
  lead,
  actions,
  children,
  titleId = "judul-halaman",
}: {
  badge?: string;
  badgeIcon?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  titleId?: string;
}) {
  return (
    <section
      aria-labelledby={titleId}
      className="relative overflow-hidden border-b border-line bg-gradient-to-b from-surface via-surface to-sunken/40"
    >
      {/* Cahaya latar yang sama dengan hero landing — sebelumnya hanya landing
          yang punya, sehingga /tentang dan /demo terbaca sebagai situs lain. */}
      <div className="pulse-glow pointer-events-none absolute -top-24 end-1/4 size-96 rounded-full bg-brand/10 blur-3xl" />
      <div className="pulse-glow pointer-events-none absolute -bottom-24 start-10 size-80 rounded-full bg-teal-500/5 blur-3xl" />

      <Container className={cx("relative z-10 flex flex-col items-start gap-5", SECTION_PAD)}>
        {badge && (
          <Badge tone="brand" icon={badgeIcon}>
            {badge}
          </Badge>
        )}
        <h1 id={titleId} className="type-display-md max-w-3xl text-ink font-display tracking-tight">
          {title}
        </h1>
        {lead && <p className="type-body-lg max-w-3xl text-muted leading-relaxed">{lead}</p>}
        {actions && <div className="flex flex-wrap items-center gap-3 pt-2">{actions}</div>}
        {children}
      </Container>
    </section>
  );
}

/**
 * Section isi dengan kepala eyebrow → judul → lead.
 *
 * `eyebrow` dirender sebagai `Badge` bertona brand di semua halaman; versi
 * teks-telanjang `type-label text-brand` yang dipakai landing dan versi
 * `<Badge>` yang dipakai /tentang adalah dua bahasa visual untuk satu peran.
 */
export function Section({
  id,
  eyebrow,
  eyebrowIcon,
  title,
  lead,
  tone = "canvas",
  children,
  className,
}: {
  id: string;
  eyebrow?: string;
  eyebrowIcon?: ReactNode;
  title: string;
  lead?: ReactNode;
  tone?: SectionTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-judul`}
      className={cx(SECTION_PAD, TONE[tone], className)}
    >
      <Container className="flex flex-col gap-8">
        <header className="max-w-3xl">
          {eyebrow && (
            <Badge tone="brand" icon={eyebrowIcon}>
              {eyebrow}
            </Badge>
          )}
          <h2
            id={`${id}-judul`}
            className={cx("type-display-md text-ink font-display tracking-tight", eyebrow && "pt-3")}
          >
            {title}
          </h2>
          {lead && <p className="type-body-lg pt-3 text-muted leading-relaxed">{lead}</p>}
        </header>
        {children}
      </Container>
    </section>
  );
}

/**
 * Catatan sumber di bawah angka klaim.
 *
 * Ada supaya "angka tanpa sumber" jadi sesuatu yang terlihat hilang saat
 * menulis kartu statistik, bukan kelalaian yang diam-diam lolos ke produksi —
 * empat angka di /tentang sempat tayang tanpa satu pun rujukan.
 */
export function SumberAngka({ children }: { children: ReactNode }) {
  return <p className="type-body-sm pt-2 text-label">{children}</p>;
}
