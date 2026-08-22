import type { ReactNode } from "react";
import { cx } from "./cx";

export type BadgeTone = "neutral" | "brand" | "warn" | "danger" | "info";

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-sunken text-muted border-line",
  brand: "bg-brand-tint text-brand-deep border-transparent",
  warn: "bg-clay-50 text-clay-700 border-transparent dark:bg-clay-900 dark:text-clay-300",
  danger: "bg-danger-tint text-danger border-transparent",
  info: "bg-sunken text-grade-c border-transparent",
};

export function Badge({
  tone = "neutral",
  icon,
  className,
  children,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "type-body-sm inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-bold",
        TONE[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
