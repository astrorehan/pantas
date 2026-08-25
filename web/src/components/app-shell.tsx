"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { haptic } from "@/lib/haptic";
import { cx } from "./ui";
import { Logo } from "./chrome";
import { BERANDA, NAV, isActive } from "./nav-config";
import { UnreadBadge, badgeCount } from "./unread-badge";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import type { Role } from "@/lib/types";

export const NAV_KEY_MAP: Record<string, string> = {
  Beranda: "beranda",
  Pindai: "pindai",
  Listing: "listing",
  Logistik: "logistik",
  Riwayat: "riwayat",
  Penawaran: "penawaran",
  Pesanan: "pesanan",
  Dampak: "dampak",
  Akun: "akun",
  Katalog: "katalog",
  Peta: "peta",
  Inquiry: "inquiry",
  Ringkasan: "ringkasan",
  Moderasi: "moderasi",
  "Jejak Audit": "jejak_audit",
  "Konsolidasi Rute": "konsolidasi_rute",
  "Portal Demo": "portal_demo",
  Jual: "jual",
  "Bagian Jual": "jual_section",
};

/**
 * Kunci kamus untuk varian pendek `NavItem.short`.
 *
 * Terpisah dari `NAV_KEY_MAP` karena label panjang dan label pendek adalah dua
 * kalimat berbeda dalam tiap bahasa — "Konsolidasi Rute" / "Route
 * Consolidation" versus "Rute" / "Routes" — jadi memendekkan di sisi tampilan
 * (memotong huruf, mengambil kata pertama) hanya benar dalam bahasa Indonesia.
 */
export const NAV_SHORT_KEY_MAP: Record<string, string> = {
  Rute: "rute",
  Audit: "audit",
  Demo: "demo",
};

/**
 * Index routes that must match exactly or every child would light them up.
 * `/admin` belongs here for the same reason the other two do: without it,
 * "Ringkasan" stayed highlighted while the operator was on `/admin/rute`.
 */
const ROOTS = ["/petani", "/pembeli", "/admin"];

/* ------------------------------------------------------------------ Side nav */

/**
 * Rail melayang, bukan dinding.
 *
 * Sidebar 256px penuh tinggi memakai 20% layar sebagai bidang hijau pekat —
 * hampir dua kali luas kartu aksi yang seharusnya jadi tujuan mata. Rail 88px
 * yang di-inset, dibulatkan, dan diberi bayangan menurunkannya ke 5% dan
 * memberi konten 168px lebih lebar. Bentuk itemnya sengaja sama persis dengan
 * bottom nav ponsel — ikon dalam keping, label di bawahnya — supaya kedua
 * breakpoint memakai satu bahasa, bukan dua.
 *
 * Tanpa garis pemisah di dalam: panel selebar 68px yang sudah dipotong garis
 * horizontal terbaca seperti tumpukan kotak kecil, bukan satu benda.
 */
function SideNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const { pesanBelumDibaca } = useStore();
  const t = useTranslations("nav");
  const items = NAV[role];

  return (
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-rail p-2.5 md:flex">
      <div className="on-field flex h-full w-full flex-col rounded-lg bg-field shadow-e3">
        <div className="flex h-16 shrink-0 items-center justify-center">
          <Link
            href={BERANDA[role]}
            aria-label="Beranda PANTAS"
            className="focus-ring rounded-sm text-field-ink"
          >
            <Logo />
          </Link>
        </div>

        <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-2">
          <ul className="flex flex-col gap-1">
            {items.map(({ href, label, short, icon: Icon, badge, match }) => {
              const active = isActive(pathname, href, ROOTS, match);
              const belumDibaca = badgeCount(pesanBelumDibaca, badge);
              const navKey = NAV_KEY_MAP[label];
              const displayLabel = navKey ? t(navKey as Parameters<typeof t>[0]) : label;
              const shortKey = short ? NAV_SHORT_KEY_MAP[short] : undefined;
              const displayShort = short
                ? shortKey
                  ? t(shortKey as Parameters<typeof t>[0])
                  : short
                : displayLabel;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    prefetch={true}
                    aria-current={active ? "page" : undefined}
                    data-tour={href}
                    /*
                      Nama lengkapnya tetap yang diumumkan meski yang tampak
                      versi pendek. Aman untuk kendali suara: tiap label pendek
                      adalah potongan utuh dari label panjangnya ("Rute" di
                      dalam "Konsolidasi Rute"), jadi menyebut yang terlihat
                      tetap cocok (WCAG 2.5.3).
                    */
                    aria-label={displayShort === displayLabel ? undefined : displayLabel}
                    onClick={() => haptic.selection()}
                    className="group tap focus-ring flex flex-col items-center gap-1 rounded-md py-1.5"
                  >
                    {/*
                      Keping hanya memeluk ikon, label berdiri bebas di
                      bawahnya. Sebelumnya keping membungkus ikon *dan* label
                      jadi satu blok pucat — bentuknya mengikuti panjang teks,
                      jadi tiap tab punya lebar sorotan berbeda dan tidak satu
                      pun terlihat disengaja. Ini pola yang sama dengan tab
                      aktif di bottom nav ponsel.
                    */}
                    <span
                      className={cx(
                        "relative flex h-9 w-12 items-center justify-center rounded-full transition-colors duration-150",
                        active
                          ? "bg-field-active text-on-field-active"
                          : "text-field-muted group-hover:bg-field-hover group-hover:text-field-ink",
                      )}
                    >
                      <Icon
                        aria-hidden
                        className="size-5"
                        strokeWidth={active ? 2.4 : 2}
                      />
                      <UnreadBadge
                        n={belumDibaca}
                        className="absolute -end-1 -top-1"
                      />
                    </span>
                    <span
                      className={cx(
                        "type-body-sm text-center transition-colors duration-150",
                        active
                          ? "font-bold text-field-ink"
                          : "text-field-muted group-hover:text-field-ink",
                      )}
                    >
                      {displayShort}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/*
          Palet duduk di dasar, bukan di puncak. Di puncak ia berdiri di antara
          logo dan tab pertama — memotong satu-satunya daftar yang dicari mata
          begitu halaman muncul. Di dasar ia mengisi ruang kosong yang tersisa
          di bawah lima tab, dan mengikuti kebiasaan rail lain: yang jarang
          dipakai turun ke bawah.
        */}
        <div className="p-2">
          <TombolPalet tone="field" className="w-full justify-center" />
        </div>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------- Bottom nav */

/**
 * Mounted by the `(tabs)` layouts and by the admin console. Focused flows —
 * pindai, harga, listing-tayang — deliberately have no tab bar: they own their
 * footer action and a tab bar there is an invitation to abandon a half-finished
 * scan.
 */
export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const { pesanBelumDibaca } = useStore();
  const t = useTranslations("nav");
  const items = NAV[role].filter((i) => i.inBottomNav);

  return (
    <nav
      aria-label="Navigasi utama"
      className="on-field fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] inset-x-4 z-40 max-w-md mx-auto md:hidden"
    >
      <div className="relative rounded-full glass-pill backdrop-blur-md backdrop-saturate-150 px-2 transition-all">
        <ul className="flex items-end justify-around h-[64px] pb-2">
          {items.map(({ href, label, short, icon: Icon, badge, match, isCenterCTA }) => {
            const active = isActive(pathname, href, ROOTS, match);
            const belumDibaca = badgeCount(pesanBelumDibaca, badge);
            const navKey = NAV_KEY_MAP[label];
            const fullLabel = navKey ? t(navKey as Parameters<typeof t>[0]) : label;
            const shortKey = short ? NAV_SHORT_KEY_MAP[short] : undefined;
            /*
              Slot bilah bawah selebar ~70px pada 360px. Label admin adalah
              kalimat, bukan satu kata, jadi tanpa varian pendek "Konsolidasi
              Rute" pecah dua baris dan baris atasnya naik ke belakang keping
              CTA. Varian pendeknya dibaca dari kamus, bukan dipotong: memotong
              huruf hanya benar dalam satu bahasa.
            */
            const displayLabel = short
              ? shortKey
                ? t(shortKey as Parameters<typeof t>[0])
                : short
              : fullLabel;

            if (isCenterCTA) {
              return (
                <li key={href} className="relative flex flex-col items-center justify-end flex-1 h-full">
                  <Link
                    href={href}
                    prefetch={true}
                    aria-current={active ? "page" : undefined}
                    data-tour={href}
                    /*
                      Labelnya berdiri di luar tautan supaya keping bundar tetap
                      bundar, jadi tautan ini tidak punya teks sendiri — dan
                      ikonnya `aria-hidden`. Tanpa `aria-label`, aksi paling
                      penting di layar petani diumumkan pembaca layar sebagai
                      tautan tanpa nama. Yang diumumkan versi lengkapnya; label
                      pendek yang tampak selalu potongan utuh darinya, jadi
                      menyebut yang terlihat tetap cocok (WCAG 2.5.3).
                    */
                    aria-label={fullLabel}
                    onClick={() => haptic.selection()}
                    className={cx(
                      "group absolute bottom-[24px] tap focus-ring flex h-[68px] w-[68px] items-center justify-center rounded-full transition-all duration-150 active:scale-75 hover:scale-105",
                      // Dulu isian brand bergradien. Di atas pil yang kini
                      // sendirinya hijau, tombol hijau lenyap — jadi ia ikut
                      // aturan yang sama dengan tab aktif: keping terang.
                      "bg-field-active text-on-field-active shadow-e4 active:shadow-none",
                    )}
                  >
                    <span className="relative">
                      <Icon className="size-8 stroke-[2] transition-transform duration-150 group-active:scale-[0.80]" aria-hidden />
                      <UnreadBadge n={belumDibaca} className="absolute -end-2 -top-2" />
                    </span>
                  </Link>
                  {/* `aria-hidden` karena teks yang sama sudah jadi nama
                      tautannya di atas; dibiarkan terbaca, butir daftar ini
                      mengumumkan "Pindai" dua kali. */}
                  <span
                    aria-hidden
                    className={cx(
                      "text-xs tracking-tight font-semibold whitespace-nowrap",
                      active ? "text-field-ink" : "text-field-muted",
                    )}
                  >
                    {displayLabel}
                  </span>
                </li>
              );
            }

            return (
              <li key={href} className="flex-1 h-full">
                <Link
                  href={href}
                  prefetch={true}
                  aria-current={active ? "page" : undefined}
                  data-tour={href}
                  aria-label={displayLabel === fullLabel ? undefined : fullLabel}
                  onClick={() => haptic.selection()}
                  className="tap focus-ring flex flex-col items-center justify-end h-full gap-1 group"
                >
                  <span
                    className={cx(
                      "tap relative flex h-[34px] w-[52px] items-center justify-center rounded-full transition-all duration-150 group-active:scale-75",
                      active
                        ? "bg-field-active text-on-field-active shadow-e1"
                        : "text-field-muted group-hover:text-field-ink group-hover:bg-field-hover"
                    )}
                  >
                    <Icon
                      aria-hidden
                      className="size-6 transition-transform duration-150 group-active:scale-75"
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <UnreadBadge
                      n={belumDibaca}
                      className="absolute -end-1 -top-1"
                    />
                  </span>
                  <span
                    className={cx(
                      "text-xs tracking-tight whitespace-nowrap transition-all duration-150 group-active:scale-90",
                      active ? "font-semibold text-field-ink" : "font-medium text-field-muted group-hover:text-field-ink"
                    )}
                  >
                    {displayLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

/* ----------------------------------------------------------------- AppShell */

/**
 * Exactly one navigation is mounted per breakpoint (F-75): bottom tabs below
 * `md`, an icon rail at `md`, a labelled sidebar from `lg` up. They are
 * separate trees rather than one that restyles, so a screen reader is never
 * offered two "Navigasi utama" landmarks at once — `SideNav` is `md:flex` and
 * `BottomNav` is `md:hidden`, and the ranges do not overlap.
 */
import dynamic from "next/dynamic";
import { TombolPalet } from "./palet-perintah";

const CoachmarkTour = dynamic(
  () => import("./coachmark-tour").then((m) => m.CoachmarkTour),
  { ssr: false },
);

const PaletPerintah = dynamic(
  () => import("./palet-perintah").then((m) => m.PaletPerintah),
  { ssr: false },
);

/*
 * Dimuat belakangan seperti dua tetangganya, dan `ssr: false` bukan sekadar
 * penghematan: isinya adalah kabar yang baru lahir di peramban, jadi ia memang
 * tidak punya bentuk di HTML server.
 */
const SiaranLangsung = dynamic(
  () => import("./siaran-langsung").then((m) => m.SiaranLangsung),
  { ssr: false },
);

export function AppShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  // Global tactile tap delegator for raw buttons, tabs, or tap elements without Button component
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest("button, [role='button'], a.tap, a.tap-press, .tap, .tap-press");
      if (!el) return;
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return;
      if (el.getAttribute("data-haptic-handled") === "true") return;
      haptic.light();
    };
    window.addEventListener("click", handleGlobalClick, { capture: true, passive: true });
    return () => window.removeEventListener("click", handleGlobalClick, { capture: true });
  }, []);

  return (
    <div className="min-h-dvh bg-canvas w-full max-w-full overflow-x-clip relative">
      <SideNav role={role} />

      {/*
        `pb-28` menyisakan ruang untuk pil navigasi bawah — tapi pil itu hanya
        dipasang oleh layout `(tabs)`. Alur terfokus seperti /petani/pindai
        tidak punya bottom nav, jadi paddingnya murni ruang mati: 112px yang
        ikut membuat layar kamera bisa digulir. Layar yang mengaku setinggi
        viewport menandai dirinya `data-layar="penuh"` dan paddingnya lepas di
        sini, di berkas yang sama tempat ia dipasang.
      */}
      <div
        id="konten"
        className="flex min-h-dvh flex-col md:ps-rail w-full max-w-full overflow-x-clip pb-28 has-[[data-layar=penuh]]:pb-0 md:pb-0"
      >
        {children}
      </div>
      <CoachmarkTour />
      <PaletPerintah />
      {/* Di sini, bukan per layar: kabar dari seberang bisa tiba kapan saja,
          dan petani yang sedang membuka Riwayat tetap perlu tahu tawarannya
          sudah jadi pesanan. */}
      <SiaranLangsung />
    </div>
  );
}

