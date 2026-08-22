"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "./ui";
import { Container } from "./container";

import { useTranslations } from "@/lib/i18n";

/**
 * The PANTAS mark: a leaf crossed by three measuring ticks — the product's one
 * claim in one shape, mutu panen diukur alih-alih ditaksir.
 *
 * This now uses the newly provided Logo Pantas_Rounded.png file.
 */
export function Logo({ className = "size-6" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/Logo%20Pantas_Rounded.png"
      alt="PANTAS"
      aria-hidden
      className={cx("object-contain", className)}
    />
  );
}

/**
 * Bar atas adalah ladang, bukan kartu.
 *
 * Sebelumnya `glass-panel`: panel putih semi-tembus yang meniru permukaan
 * kartu. Efeknya chrome dan konten terbuat dari bahan yang sama, jadi tidak ada
 * satu pun bidang berwarna di layar dan aplikasi terbaca sebagai lembar putih
 * dengan garis. Sekarang ia `--field-base` — hijau pekat — dan `on-field`
 * memindahkan warna focus ring ke green-200, karena aksen hijau di atas ladang
 * hijau hanya 1,42:1 dan navigasi keyboard di sini akan tak terlihat (F-71).
 */
/**
 * Ponsel tetap ladang hijau; dari `md` ke atas bilah ini oat.
 *
 * Di desktop rail hijau sudah memegang chrome. Bilah atas yang ikut hijau
 * menambah pita 1024×65 — 6,5% layar lagi — dan chrome jadi berbentuk L yang
 * mengepung konten dari dua sisi. Satu bidang hijau per layar sudah cukup, dan
 * bidang itu harus kartu aksi, bukan navigasi.
 *
 * `-ms-rail ps-rail` membuat bilah ini melebar sampai x=0 sementara isinya
 * tetap mulai setelah rail. Tanpa itu garis bawahnya berhenti di tepi rail dan
 * ada 10px celah tanpa garis di selokan antara rail dan konten — garis yang
 * terpotong terbaca seperti salah render. Sekarang garisnya utuh selebar
 * layar dan rail melayang di atasnya.
 */
const BAR =
  "sticky top-0 z-20 border-b backdrop-blur-md " +
  "on-field border-field-line bg-field/92 text-field-ink " +
  "md:on-surface md:-ms-rail md:ps-rail md:border-line md:bg-canvas/92 md:text-ink";

/**
 * Top bar for tab destinations.
 *
 * Below `md` it carries the wordmark, because there is no sidebar to carry it.
 * From `md` up the sidebar owns the brand, so the bar becomes the page title —
 * repeating "PANTAS" beside a logo already on screen wastes the only row of
 * vertical space a desktop layout gets for free.
 *
 * Judulnya adalah satu-satunya `<h1>` halaman, di kedua breakpoint: di bawah
 * `md` ia `sr-only`, bukan dilepas. Sebelumnya bar ini menyembunyikan judul di
 * ponsel dan tiap layar menambal sendiri dengan `<h1 class="md:sr-only">` —
 * hasilnya dua `<h1>` berbunyi sama di desktop, dan pembaca layar mendengar
 * nama layar dua kali sebelum sampai ke isinya (NFR-22).
 */
export function BrandBar({
  title,
  right,
}: {
  title?: string;
  right?: ReactNode;
}) {
  return (
    <header className={BAR}>
      <Container className="flex h-14 items-center justify-between gap-3 md:h-16">
        <span className="flex min-w-0 items-center gap-2 text-field-ink md:hidden">
          <Logo />
          <span className="type-heading-md font-display tracking-tight">
            PANTAS
          </span>
        </span>

        {title && (
          <h1 className="type-heading-lg sr-only min-w-0 truncate text-ink md:not-sr-only">
            {title}
          </h1>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {right}
        </div>
      </Container>
    </header>
  );
}

/**
 * Top bar for pushed screens. Mobile gets a back arrow with a centred title;
 * desktop gets a breadcrumb, since a mouse user navigates by trail rather than
 * by a single back affordance (F-82).
 */
export function BackBar({
  title,
  href,
  parentLabel,
  right,
}: {
  title: string;
  href: string;
  /** Name of the destination `href` points at, shown in the desktop trail. */
  parentLabel?: string;
  right?: ReactNode;
}) {
  const tc = useTranslations("common");
  return (
    <header className={BAR}>
      <Container className="h-14 md:h-16">
        {/* Mobile: back arrow + centred title */}
        <div className="grid h-full grid-cols-[auto_1fr_auto] items-center gap-2 md:hidden">
          {/* 44px, bukan 28. Panah ini satu-satunya jalan keluar dari setiap
              layar yang didorong, dan ia duduk di sudut yang paling sulit
              dijangkau ibu jari. `-ms-3` menariknya kembali sehingga ikonnya
              tetap sejajar dengan tepi teks di bawahnya meski bantalannya
              tumbuh. */}
          <Link
            href={href}
            aria-label={tc("back_label")}
            className="tap focus-ring -ms-3 grid size-11 place-items-center rounded-md text-field-ink hover:bg-field-hover"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="type-label truncate text-center text-field-muted">
            {title}
          </h1>
          {/* Selebar sel kiri, supaya judul di tengah benar-benar di tengah. */}
          <span className="min-w-8">{right}</span>
        </div>

        {/* Desktop: breadcrumb + title */}
        <div className="hidden h-full items-center justify-between gap-3 md:flex">
          <div className="min-w-0">
            <nav aria-label={tc("breadcrumb_label")}>
              <ol className="flex items-center gap-1">
                <li>
                  <Link
                    href={href}
                    className="type-body-sm focus-ring rounded-xs text-muted hover:text-ink hover:underline"
                  >
                    {parentLabel ?? tc("back_label")}
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight className="size-3.5 text-muted" />
                </li>
                <li className="type-body-sm min-w-0 truncate font-bold text-ink">
                  {title}
                </li>
              </ol>
            </nav>
          </div>
          {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
        </div>
      </Container>
    </header>
  );
}

/** Section heading inside a page body, with optional right-side actions. */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-wrap items-end justify-between gap-3 pb-1",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="type-heading-md text-ink">{title}</h2>
        {description && (
          <p className="type-body-md pt-0.5 text-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
