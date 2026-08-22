"use client";

import { useEffect, useState, useId } from "react";
import type { CSSProperties } from "react";
import type { Grade } from "@/lib/types";
import {
  GRADE_COLOR,
  GRADE_LETTER,
  GRADE_TINT,
  persen,
} from "@/lib/format";
import { useTranslations } from "@/lib/i18n";
import { cx } from "./cx";

/**
 * Each grade gets its own silhouette, not just its own colour: colour-blind
 * users and greyscale printouts must still be able to tell A from REJECT
 * (NFR-24). Paths are drawn on a 12×12 grid.
 *
 * Bentuk ini sekarang bertugas di legenda dan di pelat REJECT saja. Di penanda
 * grade, huruf A/B/C-lah yang memikul beban NFR-24 — dan memikulnya jauh lebih
 * baik: bentuk 8px di dalam isian sewarna praktis tidak terlihat, sedangkan
 * huruf tetap terbaca sampai ke cetakan hitam-putih.
 */
const GRADE_SHAPE: Record<Grade, string> = {
  A: "M6 0.5a5.5 5.5 0 1 1 0 11a5.5 5.5 0 0 1 0-11Z", // circle
  B: "M6 0.5 11.5 6 6 11.5 0.5 6Z", // diamond
  C: "M1 1h10v10H1Z", // square
  REJECT: "M6 0.75 11.6 10.9H0.4Z", // triangle
};

export function GradeMark({
  grade,
  className = "size-3",
  color,
  style,
}: {
  grade: Grade;
  className?: string;
  /** Menimpa isian — dipakai saat bentuknya duduk di atas pelat berwarna. */
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden
      className={cx("shrink-0", className)}
      style={{ fill: color ?? GRADE_COLOR[grade], ...style }}
    >
      <path d={GRADE_SHAPE[grade]} />
    </svg>
  );
}

/** Alias kept for the screens that already say `GradeDot`. */
export const GradeDot = GradeMark;

const KUNCI: Record<Grade, string> = {
  A: "a",
  B: "b",
  C: "c",
  REJECT: "reject",
};

/**
 * Nama panjang untuk pembaca layar, disusun bukan disimpan.
 *
 * "Grade A — Premium" adalah huruf yang sudah ada di `GRADE_LETTER` ditambah
 * kata sifat yang sudah ada di `*_short`, dan "Grade" sendiri tidak
 * diterjemahkan di kedua bahasa. Menyimpannya sebagai kunci tersendiri berarti
 * enam string tambahan di berkas pesan — yang masuk ke chunk bersama dan ikut
 * diunduh oleh setiap route, termasuk yang tidak punya satu pun penanda grade.
 */
function namaPanjang(grade: Grade, t: (k: string) => string): string {
  const huruf = GRADE_LETTER[grade];
  return huruf
    ? `Grade ${huruf}, ${t(`${KUNCI[grade]}_short`)}`
    : t("reject_full");
}

export type GradeBadgeSize = "sm" | "md" | "lg";
export type GradeBadgeVariant = "tag" | "solid" | "outline" | "mark";

/**
 * Ukuran penanda, dalam piksel supaya hubungan antar bagiannya eksplisit.
 *
 * `huruf` sengaja lebih dari separuh tinggi `pelat`: huruf itulah informasinya,
 * dan versi sebelumnya menyetelnya 10px di dalam kotak 20px — hasilnya penanda
 * yang isinya sebagian besar ruang kosong berwarna.
 */
const UKURAN: Record<
  GradeBadgeSize,
  { pelat: number; huruf: number; teks: number; potong: number; padX: number }
> = {
  sm: { pelat: 20, huruf: 13, teks: 10, potong: 4, padX: 8 },
  md: { pelat: 26, huruf: 16, teks: 11, potong: 5, padX: 10 },
  lg: { pelat: 34, huruf: 21, teks: 13, potong: 7, padX: 13 },
};

/**
 * Penanda grade.
 *
 * Bentuknya adalah label yang ditempelkan pada barang, bukan chip status: satu
 * pelat padat berisi huruf mutunya, lalu badan bertint berisi kata sifatnya,
 * dengan dua sudut belakang dipangkas supaya siluetnya tidak bisa tertukar
 * dengan lencana lain mana pun di produk ini.
 *
 * Kenapa hurufnya dipisah ke pelat sendiri: penanda ini muncul di 25 layar,
 * hampir selalu di dalam daftar tempat setiap barisnya juga punya grade. Di
 * sana kata "Grade" tidak pernah membedakan apa pun — hurufnyalah yang
 * membedakan, dan dulu huruf itu diset 10px, huruf terkecil di seluruh kartu.
 *
 * REJECT tidak memakai huruf. Ia bukan tingkat di dalam skala A→C, jadi ia
 * dapat perlakuan yang memang berbeda: segitiga di atas pelat berarsir. Arsir
 * itu satu-satunya tekstur di keluarga ini, yang membuatnya tetap menonjol
 * dalam cetakan hitam-putih maupun bagi mata yang tidak membedakan merah.
 */
export function GradeBadge({
  grade,
  size = "md",
  variant = "tag",
  label,
  className,
}: {
  grade: Grade;
  size?: GradeBadgeSize;
  variant?: GradeBadgeVariant;
  /** Menimpa kata sifat bawaan, mis. "Grade A" pada pil saringan katalog. */
  label?: string;
  className?: string;
}) {
  const t = useTranslations("grade");
  const u = UKURAN[size];
  const warna = GRADE_COLOR[grade];
  const tint = GRADE_TINT[grade];
  const huruf = GRADE_LETTER[grade];
  const teks = label ?? t(`${KUNCI[grade]}_short`);
  const aria = namaPanjang(grade, t);

  const hanyaPelat = variant === "mark";
  const padat = variant === "solid";
  const garis = variant === "outline";

  /* Dua sudut belakang dipangkas. Nilainya ikut ukuran — potongan 6px pada
     penanda setinggi 20px terbaca sebagai rusak, bukan sebagai bentuk. */
  const potong = `polygon(0 0, calc(100% - ${u.potong}px) 0, 100% ${u.potong}px, 100% calc(100% - ${u.potong}px), calc(100% - ${u.potong}px) 100%, 0 100%)`;
  /* `overflow-hidden` bukan opsional: latar pelat dicat oleh anak, dan sudut
     membulat induk tidak memotong anak tanpa ini — tepi depan penanda akan
     siku sementara `border-radius`-nya mengaku bulat. */
  const bentuk: CSSProperties = {
    clipPath: potong,
    borderRadius: "6px 0 0 6px",
    overflow: "hidden",
  };

  /* Isian pelat. Pada `solid` seluruh penanda satu warna, jadi pelat kehilangan
     batasnya; lapisan gelap tipis mengembalikan pembagian dua bagian tanpa
     menambah warna baru ke palet. REJECT menumpuk arsirnya di atas itu. */
  const lapisan = [
    grade === "REJECT" && !garis
      ? "repeating-linear-gradient(-45deg, transparent 0 3px, rgb(0 0 0 / 0.3) 3px 6px)"
      : null,
    padat ? "linear-gradient(rgb(0 0 0 / 0.18), rgb(0 0 0 / 0.18))" : null,
  ].filter(Boolean);

  const gayaPelat: CSSProperties = {
    width: u.pelat,
    height: u.pelat,
    fontSize: u.huruf,
    backgroundColor: garis ? tint : warna,
    backgroundImage: lapisan.length ? lapisan.join(", ") : undefined,
    color: garis ? warna : "var(--color-surface)",
    borderRadius: hanyaPelat ? 5 : undefined,
    /* Garis rambut pemisah pelat dari badan — jahitan yang membuat penanda
       terbaca sebagai dua bagian yang disatukan, bukan satu kotak yang
       kebetulan dua warna. */
    boxShadow:
      hanyaPelat || garis
        ? undefined
        : "inset -1px 0 0 color-mix(in srgb, var(--color-surface) 55%, transparent)",
  };

  const isi = (
    <>
      <span
        aria-hidden
        className="font-display grid shrink-0 place-items-center leading-none font-extrabold"
        style={gayaPelat}
      >
        {huruf ?? (
          <GradeMark
            grade={grade}
            color={garis ? warna : "var(--color-surface)"}
            className=""
            style={{ width: u.huruf * 0.85, height: u.huruf * 0.85 }}
          />
        )}
      </span>

      {!hanyaPelat && (
        <span
          aria-hidden
          className="flex items-center font-bold tracking-[0.09em] whitespace-nowrap uppercase"
          style={{
            fontSize: u.teks,
            paddingInline: `${u.padX}px ${u.padX + 2}px`,
            color: padat ? "var(--color-surface)" : warna,
          }}
        >
          {teks}
        </span>
      )}
    </>
  );

  const kelasLuar = cx(
    "inline-flex shrink-0 items-stretch align-middle",
    className,
  );

  if (hanyaPelat) {
    /* Radius ikut dipasang di pembungkus, bukan hanya di pelat: pemanggil yang
       menambahkan `ring-*` untuk memisahkan pelat dari foto di belakangnya
       menggambar cincinnya pada pembungkus, dan cincin siku di sekeliling
       pelat membulat terlihat seperti cacat render. */
    return (
      <span
        role="img"
        aria-label={aria}
        className={kelasLuar}
        style={{ borderRadius: 5 }}
      >
        {isi}
      </span>
    );
  }

  /**
   * Varian bergaris dilapis, bukan diberi `border`.
   *
   * Garis 1px pada elemen ber-`clip-path` dipotong tepat di sudut pangkas dan
   * meninggalkan ujung terbuka — bingkainya terlihat robek. Jadi warnanya
   * dipasang sebagai latar induk, lalu anak dengan bentuk yang sama dan sisipan
   * 1px mengembalikan permukaannya. Yang tersisa terbaca sebagai garis.
   */
  if (garis) {
    return (
      <span
        role="img"
        aria-label={aria}
        className={kelasLuar}
        style={{ ...bentuk, backgroundColor: warna, padding: 1 }}
      >
        <span
          className="flex items-stretch"
          style={{ ...bentuk, backgroundColor: "var(--color-surface)" }}
        >
          {isi}
        </span>
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={aria}
      className={kelasLuar}
      style={{ ...bentuk, backgroundColor: padat ? warna : tint }}
    >
      {isi}
    </span>
  );
}

const GRADE_ORDER: Grade[] = ["A", "B", "C", "REJECT"];

/** Set untuk mencatat key GradeBar yang sudah di-animasi pada sesi browser ini. */
const animatedBarKeys = new Set<string>();

export interface GradeBarProps {
  /** Fractions keyed by grade, as ai_engine emits them. Missing = zero. */
  komposisi: Partial<Record<Grade, number>>;
  height?: number;
  showLegend?: boolean;
  /** Paksa animasi menyala atau mati secara eksplisit jika diberikan. */
  animate?: boolean;
  /** Jika true (default), hanya animasi pada render/mount pertama dalam sesi. Render/mount berikutnya tidak animasi. */
  animateOnce?: boolean;
  /** ID unik opsional untuk mengidentifikasi bar secara spesifik di antar perpindahan tab. */
  id?: string;
  className?: string;
}

/**
 * Batch composition as a single bar. Segments animate out from the left on
 * mount; `prefers-reduced-motion` flattens that globally.
 *
 * Segmennya sekarang dipisah celah 2px alih-alih bersambung langsung. Grade B
 * dan C adalah cokelat dan karat — bersentuhan, keduanya menyatu jadi satu
 * gradien tak terbaca, dan proporsi yang jadi seluruh alasan bar ini ada
 * hilang. Celah itu memotong dari lebar segmen secara proporsional (flex-shrink
 * membagi menurut basis), jadi rasionya tetap benar.
 */
export function GradeBar({
  komposisi,
  height = 12,
  showLegend = true,
  animate,
  animateOnce = true,
  id,
  className,
}: GradeBarProps) {
  const t = useTranslations("grade");
  const defaultId = useId();
  const barKey = id ?? `bar-${defaultId}-${JSON.stringify(komposisi)}`;

  const [shouldAnimate] = useState(() => {
    if (animate === false) return false;
    if (animate === true && !animateOnce) return true;
    if (animateOnce) {
      return !animatedBarKeys.has(barKey);
    }
    return true;
  });

  useEffect(() => {
    if (shouldAnimate && animateOnce) {
      animatedBarKeys.add(barKey);
    }
  }, [barKey, shouldAnimate, animateOnce]);

  const segments = GRADE_ORDER.map((grade) => ({
    grade,
    fraction: komposisi[grade] ?? 0,
  })).filter((s) => s.fraction > 0);

  const total = segments.reduce((sum, s) => sum + s.fraction, 0) || 1;
  const ringkasan = segments
    .map((s) => `${namaPanjang(s.grade, t)} ${persen(s.fraction / total)}`)
    .join(", ");

  /* Huruf hanya dicetak di dalam segmen yang benar-benar muat menampungnya.
     Ambangnya dua-duanya perlu: bar setinggi 8px tidak punya ruang vertikal
     untuk huruf apa pun, dan segmen 6% tidak punya ruang horizontal. */
  const bolehHuruf = height >= 18;

  return (
    <div className={className}>
      <div
        role="img"
        aria-label={`Komposisi batch: ${ringkasan || "belum ada data"}`}
        className="flex w-full gap-0.5 overflow-hidden rounded-full bg-sunken"
        style={{ height }}
      >
        {segments.map(({ grade, fraction }, i) => (
          <span
            key={grade}
            title={`${namaPanjang(grade, t)}, ${persen(fraction / total)}`}
            className="font-display grid origin-left place-items-center overflow-hidden rounded-xs leading-none font-extrabold"
            style={{
              width: `${(fraction / total) * 100}%`,
              backgroundColor: GRADE_COLOR[grade],
              color: "var(--color-surface)",
              fontSize: Math.round(height * 0.58),
              ...(shouldAnimate
                ? {
                    animation: `pantas-grow var(--dur-slow) var(--ease-out-soft) ${i * 60}ms both`,
                  }
                : { animation: "none" }),
            }}
          >
            {bolehHuruf && fraction / total >= 0.12
              ? (GRADE_LETTER[grade] ?? (
                  <GradeMark
                    grade={grade}
                    color="var(--color-surface)"
                    className=""
                    style={{ width: height * 0.44, height: height * 0.44 }}
                  />
                ))
              : null}
          </span>
        ))}
      </div>

      {showLegend && segments.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
          {segments.map(({ grade, fraction }) => (
            <li
              key={grade}
              className="type-body-sm flex items-center gap-1.5 text-muted"
            >
              <GradeMark grade={grade} className="size-2.5" />
              <span className="font-bold text-ink">
                {GRADE_LETTER[grade] ?? t("reject_short")}
              </span>
              <span className="tnum">{persen(fraction / total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
