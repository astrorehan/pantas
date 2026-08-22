"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { ReactNode } from "react";
import { ChevronRight, Info, TrendingDown, TrendingUp } from "lucide-react";
import { cx } from "./cx";

/**
 * A number with its provenance attached.
 *
 * §5.3 rule 2: no figure appears on screen without a traceable source. `source`
 * is not decoration — it is the tooltip a judge opens to ask "where does this
 * come from", and every caller is expected to supply one.
 *
 * `href` makes the whole tile a destination. It is handled here rather than by
 * wrapping the tile in a `<Link>` at the call site, which is what the farmer
 * dashboard used to do: `source` renders a `<button>`, and a button inside an
 * anchor is invalid markup that leaves the provenance tooltip unopenable. The
 * overlay link below is a sibling of that button, not its ancestor.
 */
export function Stat({
  label,
  value,
  unit,
  delta,
  source,
  icon,
  size = "md",
  href,
  hrefLabel,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  /** Signed change vs the previous period, already formatted. */
  delta?: { value: string; direction: "up" | "down"; good?: boolean };
  source?: string;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Turns the tile into a link to the screen this number is drawn from. */
  href?: string;
  /** Accessible name for that link — required when `href` is set. */
  hrefLabel?: string;
  className?: string;
}) {
  const id = useId();
  const [showSource, setShowSource] = useState(false);

  const valueClass = {
    sm: "type-heading-lg",
    md: "type-display-md",
    lg: "type-display-lg",
  }[size];

  const Trend = delta?.direction === "up" ? TrendingUp : TrendingDown;
  // "Good" is not the same as "up": avoided emissions going down is good.
  const trendGood = delta?.good ?? delta?.direction === "up";

  return (
    <div
      className={cx(
        "relative flex flex-col rounded-md bg-surface p-4 shadow-e2",
        href && "tap hover:-translate-y-0.5 hover:shadow-e4",
        className,
      )}
    >
      {href && (
        <Link
          href={href}
          aria-label={hrefLabel}
          className="focus-ring absolute inset-0 z-0 rounded-md"
        />
      )}

      <div className="flex items-center gap-1.5">
        {icon && <span className="text-muted">{icon}</span>}
        <p className="type-label text-label">{label}</p>
        {source && (
          <button
            type="button"
            aria-label={`Dari mana angka ini: ${label}`}
            aria-expanded={showSource}
            aria-controls={`${id}-source`}
            onClick={() => setShowSource((s) => !s)}
            onBlur={() => setShowSource(false)}
            // Ikonnya tetap 14px — ia keterangan, bukan aksi utama ubin — tapi
            // area sentuhnya 44px lewat `hit-44`. Tetangga terdekatnya adalah
            // teks label dan chevron di ujung baris yang lain, jadi bidang
            // yang melar itu tidak menimpa kontrol mana pun.
            className="focus-ring hit-44 z-10 -m-1 rounded-full p-1 text-label hover:text-muted"
          >
            <Info aria-hidden className="size-3.5" />
          </button>
        )}
        {/* In flow, not absolutely positioned. A label long enough to wrap —
            "Pesanan Masuk" does at 375px — used to push the provenance button
            underneath an absolute chevron, and the two hit areas overlapped. */}
        {href && (
          <ChevronRight
            aria-hidden
            className="ms-auto size-4 shrink-0 text-label"
          />
        )}
      </div>

      <p className={cx("tnum pt-1 text-ink", valueClass)}>
        {value}
        {unit && (
          <span className="type-body-md ps-1 font-medium text-muted">
            {unit}
          </span>
        )}
      </p>

      {delta && (
        <p
          className={cx(
            "type-body-sm flex items-center gap-1 pt-1 font-bold",
            trendGood ? "text-grade-a" : "text-danger",
          )}
        >
          <Trend aria-hidden className="size-3.5" />
          <span className="tnum">{delta.value}</span>
        </p>
      )}

      {source && showSource && (
        <p
          id={`${id}-source`}
          role="tooltip"
          className="type-body-sm absolute top-full left-0 z-30 mt-1 w-64 max-w-[min(16rem,90vw)] rounded-md border border-line bg-overlay p-3 text-muted shadow-e3"
        >
          {source}
        </p>
      )}
    </div>
  );
}
