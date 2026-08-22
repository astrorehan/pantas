import { cx } from "./ui";
import type { PesanBelumDibaca } from "@/lib/data";
import type { NavItem } from "./nav-config";

/**
 * Jumlah pesan belum dibaca untuk satu item nav (F-33), atau 0 kalau item itu
 * memang tidak memuat percakapan. Fungsi biasa, bukan hook: ia dipanggil di
 * dalam `items.map`, tempat hook tidak boleh berada.
 */
export function badgeCount(
  hitungan: PesanBelumDibaca,
  badge: NavItem["badge"],
): number {
  return badge ? (hitungan[badge] ?? 0) : 0;
}

/**
 * Titik/angka pada item nav. Angkanya juga diucapkan lewat teks tersembunyi,
 * karena badge berwarna saja bukan informasi bagi pembaca layar (F-96).
 *
 * Modul tersendiri karena dua permukaan navigasi memakainya: nav utama di
 * `app-shell` dan sub-tab "Jual" di `sub-nav`.
 */
export function UnreadBadge({ n, className }: { n: number; className?: string }) {
  if (n <= 0) return null;
  // Pembungkus ikut memikul `className`: tiap item nav memasang badge dua kali
  // (satu untuk rail, satu untuk sidebar) dan hanya salah satunya terlihat per
  // breakpoint. Kalau teks sr-only berada di luar pembungkus, `hidden` tidak
  // menjangkaunya dan pembaca layar mengumumkan angkanya dua kali.
  return (
    <span
      className={cx(
        // `text-canvas`, bukan `text-white`: di tema gelap `danger` adalah merah
        // muda terang dan putih di atasnya hanya 2,2:1 — angkanya praktis hilang
        // justru di badge yang tugasnya menarik perhatian.
        "type-body-sm tnum flex min-w-[18px] items-center justify-center rounded-full bg-danger px-1 py-px font-bold leading-none text-canvas",
        className,
      )}
    >
      <span aria-hidden>{n > 9 ? "9+" : n}</span>
      <span className="sr-only">{n} pesan belum dibaca</span>
    </span>
  );
}
