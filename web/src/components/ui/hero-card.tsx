import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cx } from "./cx";
import { ButtonLink } from "./button";

/**
 * Satu kartu, satu tindakan — elemen terbesar di layar yang memilikinya.
 *
 * Beranda petani dulu memajang data lebih dulu (pindaian terakhir, dua angka,
 * grid listing) lalu menyerahkan pertanyaan "jadi sekarang saya harus apa?"
 * kepada petani. Kartu ini menjawabnya di muka. Bentuknya lahir inline di
 * dashboard petani; dipindahkan ke sini supaya layar lain memakai bentuk yang
 * sama alih-alih menciptakan banner versinya sendiri — yang persis bagaimana
 * spanduk "Tindak Lanjut Mendesak" di layar Jual muncul.
 *
 * Nada `aksi` sekarang isian brand padat, bukan kaca bertint.
 *
 * Sejak chrome jadi ladang hijau, kaca bertint kalah: ia hijau samar di antara
 * bar hijau pekat dan kanvas oat, dan yang seharusnya jadi benda terbesar di
 * layar malah jadi yang paling ragu. Hierarkinya sekarang tiga tingkat kejelasan
 * — chrome paling gelap, hero paling terang dan paling jenuh, konten oat —
 * sehingga mata jatuh ke tindakan lebih dulu, bukan ke navigasi.
 */
export function HeroCard({
  icon,
  eyebrow,
  title,
  description,
  cta,
  tone = "aksi",
  className,
  ...rest
}: {
  icon: ReactNode;
  /** Label kecil di atas judul — mis. "Langkah berikutnya". */
  eyebrow: string;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  /**
   * `menunggu` untuk keadaan yang hanya perlu diketahui petani dan tidak bisa
   * ia perbaiki sekarang (antrean pindai offline, misalnya). Warnanya hangat,
   * tombolnya turun jadi `outline`: kabar tidak boleh menuntut ketukan
   * sekeras ajakan.
   */
  tone?: "aksi" | "menunggu";
  className?: string;
} & Omit<React.ComponentProps<"section">, "title">) {
  const menunggu = tone === "menunggu";

  return (
    <section
      className={cx(
        "flex flex-wrap items-center gap-4 rounded-lg p-5 sm:gap-5 sm:p-6",
        menunggu
          ? "surface-warn border border-grade-b/40 shadow-e3"
          : "fill-brand bg-brand shadow-e4",
        className,
      )}
      {...rest}
    >
      <span
        className={cx(
          "flex size-12 shrink-0 items-center justify-center rounded-full sm:size-14",
          menunggu
            ? "bg-surface text-grade-b shadow-e2 ring-1 ring-grade-b/25"
            // Tanpa cincin: isian /15 sudah memisahkan keping, dan cincin /25
            // hanya mencapai 1,8:1 — garis yang mengaku penanda padahal tak
            // terlihat lebih buruk daripada tidak ada garis sama sekali.
            : "bg-on-brand/15 text-on-brand",
        )}
      >
        {icon}
      </span>

      <div className="min-w-52 flex-1">
        <p
          className={cx(
            "type-label",
            menunggu ? "text-label" : "text-on-brand/75",
          )}
        >
          {eyebrow}
        </p>
        <h2
          className={cx(
            "type-heading-lg pt-0.5",
            menunggu ? "text-ink" : "text-on-brand",
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cx(
              "type-body-md pt-1.5",
              menunggu ? "text-muted" : "text-on-brand/85",
            )}
          >
            {description}
          </p>
        )}
      </div>

      {cta && (
        <ButtonLink
          href={cta.href}
          size="lg"
          variant={menunggu ? "outline" : "contrast"}
          className="w-full sm:w-auto"
        >
          {cta.label}
          <ArrowRight aria-hidden className="size-4" />
        </ButtonLink>
      )}
    </section>
  );
}
