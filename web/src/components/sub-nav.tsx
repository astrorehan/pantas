"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";
import { Container } from "./container";
import { isActive } from "./nav-config";
import type { NavItem } from "./nav-config";
import { UnreadBadge, badgeCount } from "./unread-badge";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import { NAV_KEY_MAP } from "./app-shell";

/**
 * Tab antar-layar di bawah bilah atas.
 *
 * Sengaja tautan di dalam `<nav>`, bukan `role="tablist"`: setiap tab adalah
 * dokumen tersendiri dengan URL-nya sendiri, dan pola tablist menjanjikan
 * panel yang bertukar di tempat — janji yang tidak ditepati navigasi halaman,
 * sehingga pembaca layar akan salah menduga apa yang terjadi setelah diaktifkan.
 */
export function SubNav({
  items,
  label,
  roots = [],
  layout = "sticky",
}: {
  items: NavItem[];
  /** Nama aksesibel daftar tab — mis. "Bagian Jual". */
  label: string;
  /** Rute indeks yang harus cocok persis, bukan cocok awalan. */
  roots?: string[];
  /**
   * `inline` menempatkan tab sebagai segmented control di dalam konten.
   *
   * Di ponsel, `sticky` berarti tiga lapis chrome menetap sekaligus —
   * `BrandBar` 56px, bilah ini 44px, lalu pil navigasi bawah — dan ±112px dari
   * layar 640px habis sebelum baris pertama isi muncul. Petani bekerja di
   * layar itu; juri melihatnya di layar itu. Jadi di bawah `md` bilah ini ikut
   * menggulir bersama halaman, dan dari `md` ke atas — di mana tinggi layar
   * bukan barang langka — ia kembali menetap di bawah bilah atas.
   */
  layout?: "sticky" | "inline";
}) {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const { pesanBelumDibaca } = useStore();
  const inline = layout === "inline";

  const navLabelKey = NAV_KEY_MAP[label];
  const displayNavLabel = navLabelKey
    ? tNav(navLabelKey as Parameters<typeof tNav>[0])
    : label;

  const daftar = (
    <ul
      className={cx(
        "scroll-x flex",
        inline
          ? "gap-1 rounded-md border border-line bg-sunken p-1 md:gap-1 md:rounded-none md:border-0 md:bg-transparent md:p-0"
          : "gap-1",
      )}
    >
      {items.map(({ href, label: teks, icon: Icon, badge }) => {
        const aktif = isActive(pathname, href, roots);
        const belumDibaca = badgeCount(pesanBelumDibaca, badge);
        const itemKey = NAV_KEY_MAP[teks];
        const displayTeks = itemKey
          ? tNav(itemKey as Parameters<typeof tNav>[0])
          : teks;
        return (
          <li key={href} className={inline ? "flex-1 md:flex-none" : undefined}>
            <Link
              href={href}
              prefetch={true}
              aria-current={aktif ? "page" : undefined}
              data-tour={href}
              className={cx(
                "tap focus-ring type-body-md flex min-h-11 shrink-0 items-center gap-2 font-bold whitespace-nowrap",
                inline
                  ? cx(
                      "justify-center rounded-sm px-2 md:-mb-px md:justify-start md:rounded-none md:border-b-2 md:px-3",
                      aktif
                        ? "bg-surface text-ink shadow-e1 md:bg-transparent md:border-brand md:text-brand md:shadow-none"
                        : "text-muted hover:text-ink md:border-transparent",
                    )
                  : cx(
                      "-mb-px border-b-2 px-3",
                      aktif
                        ? "border-brand text-brand"
                        : "border-transparent text-muted hover:text-ink",
                    ),
              )}
            >
              <Icon
                aria-hidden
                className={cx("size-4", inline && "hidden sm:block")}
                strokeWidth={aktif ? 2.4 : 2}
              />
              {displayTeks}
              <UnreadBadge n={belumDibaca} />
            </Link>
          </li>
        );
      })}
    </ul>
  );

  if (inline) {
    return (
      <nav
        aria-label={displayNavLabel}
        className="md:sticky md:top-16 md:z-10 md:-ms-rail md:ps-rail md:border-b md:border-line/60 md:glass-panel md:backdrop-blur-lg md:backdrop-saturate-150"
      >
        <Container className="pt-4 md:pt-0">{daftar}</Container>
      </nav>
    );
  }

  return (
    <nav
      aria-label={displayNavLabel}
      className="sticky top-14 z-10 border-b border-line/60 glass-panel backdrop-blur-lg backdrop-saturate-150 md:top-16 md:-ms-rail md:ps-rail"
    >
      <Container>{daftar}</Container>
    </nav>
  );
}
