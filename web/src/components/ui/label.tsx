import type { ReactNode } from "react";
import { cx } from "./cx";

/** The small all-caps eyebrow that names a block of content. */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cx("type-label text-label", className)}>{children}</p>;
}
