import {
  History,
  Home,
  Map,
  Package,
  ScanLine,
  ScrollText,
  ShieldAlert,
  ShoppingCart,
  Store,
  User,
  Handshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  /**
   * Shortened label for the two narrow surfaces — the 88px rail and the ~70px
   * bottom-bar slot — where the full one wraps. Peran admin memerlukannya:
   * labelnya kalimat ("Konsolidasi Rute", "Jejak Audit"), bukan satu kata
   * seperti label petani dan pembeli, dan pada bilah bawah label dua baris
   * naik tepat ke belakang keping bundar CTA di tengah.
   */
  short?: string;
  icon: LucideIcon;
  /** Bottom nav holds five at most; the rest live on the sidebar only. */
  inBottomNav?: boolean;
  /** Primary centerpiece CTA button in floating bottom navigation bar */
  isCenterCTA?: boolean;
  /**
   * Rute lain yang juga menyalakan item ini. Dipakai item yang memayungi
   * beberapa layar — "Jual" menaungi listing, penawaran, dan pesanan — supaya
   * berpindah antar sub-tab tidak membuat nav utama tampak kehilangan posisi.
   */
  match?: string[];
  /**
   * Permukaan chat yang jumlah pesan belum dibacanya ditampilkan sebagai badge
   * di item ini (F-33). Dipilah supaya angkanya menunjuk ke layar tempat
   * percakapan itu benar-benar dibuka.
   */
  badge?: "pesanan" | "penawaran" | "total";
}

/**
 * One nav source per role.
 *
 * Petani sengaja dijaga di lima tujuan. Sebelumnya ada sembilan, dan empat di
 * antaranya hanya muncul di sidebar desktop — padahal petani bekerja dari
 * ponsel, jadi layar-layar itu praktis tak terjangkau sambil tetap menambah
 * beban pilihan. Tiga layar berjualan (listing, penawaran, pesanan) kini satu
 * tujuan "Jual" dengan sub-tab; logistik hanya dibuka dari pesanan yang
 * memerlukannya, dan dampak dari Akun. Lima muat di bilah 360px pada 72px per
 * item — masih di atas target sentuh 44px.
 */
export const NAV: Record<Role, NavItem[]> = {
  petani: [
    { href: "/petani", label: "Beranda", icon: Home, inBottomNav: true },
    {
      href: "/petani/listing",
      label: "Jual",
      icon: Store,
      inBottomNav: true,
      match: ["/petani/penawaran", "/petani/pesanan"],
      badge: "total",
    },
    {
      href: "/petani/pindai",
      label: "Pindai",
      icon: ScanLine,
      inBottomNav: true,
      isCenterCTA: true,
    },
    {
      href: "/petani/riwayat",
      label: "Riwayat",
      icon: History,
      inBottomNav: true,
    },
    { href: "/petani/akun", label: "Akun", icon: User, inBottomNav: true },
  ],
  pembeli: [
    { href: "/pembeli", label: "Katalog", icon: Home, inBottomNav: true },
    { href: "/pembeli/peta", label: "Peta", icon: Map, inBottomNav: true },
    {
      href: "/pembeli/inquiry",
      label: "Inquiry",
      icon: Package,
      inBottomNav: true,
      isCenterCTA: true,
    },
    {
      href: "/pembeli/pesanan",
      label: "Pesanan",
      icon: ShoppingCart,
      inBottomNav: true,
      badge: "total",
    },
    { href: "/pembeli/akun", label: "Akun", icon: User, inBottomNav: true },
  ],
  /**
   * Lima tujuan, sama seperti dua peran lain. Portal Demo bukan pekerjaan
   * operator, jadi slotnya kini dipakai sengketa transaksi: permukaan tempat
   * pembatalan bermasalah benar-benar dapat ditutup dengan resolusi teraudit.
   */
  admin: [
    { href: "/admin", label: "Ringkasan", icon: Home, inBottomNav: true },
    { href: "/admin/moderasi", label: "Moderasi", icon: ShieldAlert, inBottomNav: true },
    {
      href: "/admin/rute",
      label: "Konsolidasi Rute",
      short: "Rute",
      icon: Package,
      inBottomNav: true,
      isCenterCTA: true,
    },
    {
      href: "/admin/audit",
      label: "Jejak Audit",
      short: "Audit",
      icon: ScrollText,
      inBottomNav: true,
    },
    {
      href: "/admin/sengketa",
      label: "Sengketa Transaksi",
      short: "Sengketa",
      icon: Handshake,
      inBottomNav: true,
    },
  ],
};

/**
 * Where each role lands after signing in, and what its brand link points at.
 *
 * This used to be written inline as `role === "petani" ? "/petani" : "/pembeli"`
 * in two places, which sent an admin into the buyer app — the console exists at
 * `/admin`, so the ternary had no branch for the only role it could not guess.
 */
export const BERANDA: Record<Role, string> = {
  petani: "/petani",
  pembeli: "/pembeli",
  admin: "/admin",
};

/**
 * Sub-tab di balik tujuan "Jual". Ketiganya adalah satu pekerjaan bagi petani —
 * menerbitkan lot, menanggapi tawaran, memenuhi pesanan — jadi berpindah di
 * antaranya tidak boleh memaksa kembali ke nav utama lebih dulu.
 */
export const JUAL_TABS: NavItem[] = [
  { href: "/petani/listing", label: "Listing", icon: Store },
  {
    href: "/petani/penawaran",
    label: "Penawaran",
    icon: Handshake,
    badge: "penawaran",
  },
  {
    href: "/petani/pesanan",
    label: "Pesanan",
    icon: ShoppingCart,
    badge: "pesanan",
  },
];

/**
 * Exact match for index routes, prefix match for their children, plus any extra
 * route an item declares in `match` — that list is what keeps "Jual" lit while
 * the farmer is on one of its sibling tabs.
 */
export function isActive(
  pathname: string,
  href: string,
  roots: string[],
  match: string[] = [],
) {
  const cocok = (h: string) =>
    roots.includes(h)
      ? pathname === h
      : pathname === h || pathname.startsWith(`${h}/`);
  return cocok(href) || match.some(cocok);
}
