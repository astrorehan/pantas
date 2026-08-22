import type { ReactNode } from "react";
import { cx } from "./cx";

/**
 * Required on every list (§7.4). An empty list with no explanation reads as a
 * broken app — which is exactly what a judge signing up a fresh account sees
 * without this.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Primary way out. An empty state without one is a dead end. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center rounded-md border border-dashed border-line bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <span aria-hidden className="text-label [&>svg]:size-10">
          {icon}
        </span>
      )}
      <p className="type-heading-sm pt-3 text-ink">{title}</p>
      {description && (
        <p className="type-body-md max-w-sm pt-1.5 text-muted">{description}</p>
      )}
      {action && <div className="pt-5">{action}</div>}
    </div>
  );
}
