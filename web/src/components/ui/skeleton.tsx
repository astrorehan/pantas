import type { CSSProperties } from "react";
import { cx } from "./cx";

// Spelled out rather than interpolated: Tailwind scans source text, so a
// template-built class name never makes it into the stylesheet.
const ROUNDED = {
  xs: "rounded-xs",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
} as const;

/**
 * Skeletons take the shape of the content they stand in for — a generic grey
 * block just moves the layout shift later (F-95, NFR-04).
 */
export function Skeleton({
  className,
  style,
  rounded = "md",
}: {
  className?: string;
  style?: CSSProperties;
  rounded?: keyof typeof ROUNDED;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "relative block overflow-hidden bg-sunken",
        ROUNDED[rounded],
        className,
      )}
      style={style}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.04] to-transparent [animation:pantas-shimmer_1.4s_infinite] dark:via-white/[0.06]" />
    </span>
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <span className={cx("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          rounded="xs"
          className="h-3.5"
          // Ragged right edge reads as text; equal bars read as a table.
          style={{ width: i === lines - 1 ? "62%" : "100%" }}
        />
      ))}
    </span>
  );
}

/** Matches the listing card: image on top, two lines, a price. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "block overflow-hidden rounded-md bg-surface shadow-e2",
        className,
      )}
    >
      <Skeleton rounded="xs" className="aspect-4/3 w-full rounded-none" />
      <span className="block p-2.5">
        <Skeleton rounded="xs" className="h-3.5 w-4/5" />
        <Skeleton rounded="xs" className="mt-2 h-3 w-1/3" />
        <Skeleton rounded="xs" className="mt-2.5 h-4 w-1/2" />
      </span>
    </span>
  );
}
