import * as React from "react";
import { cx } from "./cx";

export type IconProps = React.SVGProps<SVGSVGElement>;

const baseProps: React.SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/* ============================================================================
 * 1. IKON KOMODITAS (4 Ikon)
 * ============================================================================ */

export function IconTomat({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      <circle cx="12" cy="14" r="8" />
      <path d="M12 2v4 M8.5 6c1.5 0 2.5-1 3.5-3 1 2 2 3 3.5 3" />
    </svg>
  );
}

export function IconCabai({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      {/* Tangkai cabai */}
      <path d="M16 2l-1 3 M13 5c1.5-.8 3-.8 4.5 0" />
      {/* Badan cabai rawit/keriting: ramping, panjang, bergelombang halus (S-curve) */}
      <path d="M16.5 5c1 3 1.5 6 0 10-2 4-5 6-10.5 7-.8 0-1.2-.6-.7-1.3 2.5-2.5 5-6 7.2-10 1.5-2.5 2-4.5 1.5-5.7.8 0 1.7 0 2.5 0Z" />
    </svg>
  );
}

export function IconTimun({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      <path d="M7 17a6 6 0 0 0 8.5-8.5l-2-2a6 6 0 0 0-8.5 8.5l2 2Z" />
      <path d="M14 8l1.5-1.5 M10 12l1 1 M8 14l1 1" />
    </svg>
  );
}

export function IconWortel({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      {/* Daun wortel di atas */}
      <path d="M12 7V2 M12 4l-2-2 M12 4l2-2 M10 7L6 3 M8 5L5 5 M14 7l4-4 M16 5l3 0" />
      {/* Badan wortel meruncing ke bawah */}
      <path d="M8 8c1.5-1 6.5-1 8 0l-3 13a1 1 0 0 1-2 0L8 8Z" />
      {/* Tekstur/serat wortel */}
      <path d="M10 12h4 M10.5 16h3" />
    </svg>
  );
}

/* ============================================================================
 * 2. IKON GRADE MUTU GEOMETRIS (4 Ikon - Aksesibilitas Buta Warna)
 * ============================================================================ */

export function IconGradeA({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      <path d="M12 3L20 7V13C20 17.5 16.5 20.5 12 21.5C7.5 20.5 4 17.5 4 13V7L12 3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconGradeB({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      <path d="M12 2l10 10-10 10-10-10 10-10Z" />
      <path d="M12 8v8 M8 12h8" />
    </svg>
  );
}

export function IconGradeC({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconGradeReject({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      <path d="M12 3L2 20h20L12 3Z" />
      <path d="M12 9v4 M12 16.5v.5" />
    </svg>
  );
}

/* ============================================================================
 * 3. IKON DOMAIN KHAS PANTAS (6 Ikon)
 * ============================================================================ */

export function IconKoinKalibrasi({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2" />
    </svg>
  );
}

export function IconPindaiBatch({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      <rect x="7" y="7" width="14" height="14" rx="2" />
      <path d="M3 17V5a2 2 0 0 1 2-2h12" />
      <path d="M7 14h14 M14 11v6" />
    </svg>
  );
}

export function IconKonsolidasiRute({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      <circle cx="5" cy="6" r="2" />
      <circle cx="5" cy="18" r="2" />
      <circle cx="19" cy="12" r="2.5" />
      <path d="M7 6c4 0 6 6 10 6 M7 18c4 0 6-6 10-6" />
    </svg>
  );
}

export function IconRantaiDingin({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      <path d="M3 17h13V6H3v11ZM16 11h4l2 3v3h-6V11Z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="18.5" cy="17.5" r="1.5" />
      <path d="M9.5 8.5l2 2 M11.5 8.5l-2 2 M10.5 7v3 M9 8.5h3" />
    </svg>
  );
}

export function IconHashAudit({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3 M9 14h6 M9 17h6 M11 13v5 M13 13v5" />
    </svg>
  );
}

export function IconSerahTerima({ className, ...props }: IconProps) {
  return (
    <svg {...baseProps} className={cx("size-6 shrink-0", className)} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M15 16l2 2 4-4" />
    </svg>
  );
}

/* ============================================================================
 * 4. HELPER & KATALOG SELURUH IKON (Untuk Galeri DS / Dev Tools)
 * ============================================================================ */

export function CommodityIcon({
  komoditas,
  className,
  ...props
}: {
  komoditas: string;
  className?: string;
} & IconProps) {
  const k = komoditas.toLowerCase();
  if (k.includes("tomat") || k.includes("tomato")) {
    return <IconTomat className={className} {...props} />;
  }
  if (k.includes("cabai") || k.includes("chili")) {
    return <IconCabai className={className} {...props} />;
  }
  if (k.includes("timun") || k.includes("cucumber")) {
    return <IconTimun className={className} {...props} />;
  }
  if (k.includes("wortel") || k.includes("carrot")) {
    return <IconWortel className={className} {...props} />;
  }
  return <IconTomat className={className} {...props} />;
}

export function GradeShapeIcon({
  grade,
  className,
  ...props
}: {
  grade: string;
  className?: string;
} & IconProps) {
  const g = grade.toUpperCase();
  if (g === "A") return <IconGradeA className={className} {...props} />;
  if (g === "B") return <IconGradeB className={className} {...props} />;
  if (g === "C") return <IconGradeC className={className} {...props} />;
  return <IconGradeReject className={className} {...props} />;
}

export const PANTAS_ICON_CATALOG = [
  { id: "tomat", name: "Tomat", category: "Komoditas", Icon: IconTomat },
  { id: "cabai", name: "Cabai", category: "Komoditas", Icon: IconCabai },
  { id: "timun", name: "Timun", category: "Komoditas", Icon: IconTimun },
  { id: "wortel", name: "Wortel", category: "Komoditas", Icon: IconWortel },
  { id: "grade-a", name: "Grade A (Perisai)", category: "Grade Mutu", Icon: IconGradeA },
  { id: "grade-b", name: "Grade B (Diamond)", category: "Grade Mutu", Icon: IconGradeB },
  { id: "grade-c", name: "Grade C (Circle)", category: "Grade Mutu", Icon: IconGradeC },
  { id: "grade-reject", name: "Reject (Segitiga)", category: "Grade Mutu", Icon: IconGradeReject },
  { id: "koin-kalibrasi", name: "Koin Kalibrasi", category: "Domain PANTAS", Icon: IconKoinKalibrasi },
  { id: "pindai-batch", name: "Pindai Batch", category: "Domain PANTAS", Icon: IconPindaiBatch },
  { id: "konsolidasi-rute", name: "Konsolidasi Rute", category: "Domain PANTAS", Icon: IconKonsolidasiRute },
  { id: "rantai-dingin", name: "Rantai Dingin", category: "Domain PANTAS", Icon: IconRantaiDingin },
  { id: "hash-audit", name: "Hash Audit", category: "Domain PANTAS", Icon: IconHashAudit },
  { id: "serah-terima", name: "Serah Terima QR", category: "Domain PANTAS", Icon: IconSerahTerima },
] as const;
