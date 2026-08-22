import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

export type CardVariant = "flat" | "raised" | "interactive" | "glass" | "glass-brand";

/**
 * `raised` is the default, not `flat`.
 *
 * The elevation scale existed from the start but nothing reached for it, so
 * every surface sat on the canvas at the same height and the whole product
 * read as one undifferentiated sheet — the "datar" complaint. A card is a
 * thing lying *on* the page; it says so by default now, and callers that
 * genuinely want a flush panel (rows nested inside another card, sections of
 * a sheet) ask for `flat` explicitly.
 *
 * Bahan kartu berubah: garis dilepas, kedalaman dibawa bayangan.
 *
 * Garis 1px itu dulu wajib karena permukaan dan kanvas sama-sama praktis putih
 * (#ffffff di atas #faf9f7, 1,05:1) — tanpa garis, kartu tidak ada. Efeknya
 * setiap kotak di layar dikurung, dan layar penuh kotak terkurung terbaca
 * seperti formulir, bukan seperti benda. Palet oat menaikkan pemisahan itu ke
 * 1,13:1 dan menambahkan tepi atas tersorot, jadi bayangan cukup sendirian.
 *
 * `flat` sengaja tetap bergaris: ia panel yang menempel rata di dalam kartu
 * lain, tempat bayangan akan mengaku ada ketinggian yang tidak ada.
 */
const VARIANT: Record<CardVariant, string> = {
  flat: "border border-line bg-surface",
  raised: "bg-surface shadow-e2",
  // Lift on hover rather than merely darkening the border: the movement is
  // what tells a mouse user the whole card is the target, not the link inside.
  interactive:
    "tap bg-surface shadow-e2 hover:-translate-y-0.5 hover:shadow-e4",
  glass: "glass backdrop-blur-lg backdrop-saturate-150",
  "glass-brand": "glass-brand backdrop-blur-lg backdrop-saturate-150",
};

export function Card({
  variant = "raised",
  className,
  children,
  ...rest
}: ComponentProps<"div"> & { variant?: CardVariant }) {
  return (
    <div className={cx("rounded-md", VARIANT[variant], className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  hint,
  action,
  className,
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-start justify-between gap-3 border-b border-line px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="type-heading-sm truncate text-ink">{title}</h3>
        {hint && <p className="type-body-sm pt-0.5 text-muted">{hint}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cx("p-4", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...rest
}: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "flex items-center justify-end gap-2 border-t border-line px-4 py-3",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
