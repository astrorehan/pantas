"use client";

import { useId, useRef } from "react";
import type { ReactNode } from "react";
import { cx } from "./cx";

export interface TabItem {
  value: string;
  label: ReactNode;
  /** Small trailing count — status filters carry these. */
  count?: number;
  disabled?: boolean;
}

/**
 * Tab list following the ARIA authoring pattern: arrow keys move between tabs,
 * Home/End jump to the ends, and only the active tab is in the tab order.
 */
export function Tabs({
  items,
  value,
  onChange,
  variant = "underline",
  className,
  label,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  variant?: "underline" | "segmented";
  className?: string;
  /** Accessible name for the tab list — e.g. "Filter status pesanan". */
  label: string;
}) {
  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);

  function move(dir: 1 | -1) {
    const from = items.findIndex((t) => t.value === value);
    for (let n = 1; n <= items.length; n++) {
      const i = (from + dir * n + items.length * n) % items.length;
      if (!items[i].disabled) {
        onChange(items[i].value);
        listRef.current
          ?.querySelector<HTMLElement>(`[data-value="${items[i].value}"]`)
          ?.focus();
        return;
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(items[0].value);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(items[items.length - 1].value);
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cx(
        "scroll-x flex",
        variant === "underline"
          ? "gap-1 border-b border-line"
          : "gap-1 rounded-md border border-line bg-sunken p-1",
        className,
      )}
    >
      {items.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`${id}-${tab.value}`}
            data-value={tab.value}
            aria-selected={active}
            aria-controls={`${id}-${tab.value}-panel`}
            tabIndex={active ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.value)}
            className={cx(
              "tap focus-ring type-body-md flex min-h-11 shrink-0 items-center gap-2 px-3 font-bold whitespace-nowrap",
              "disabled:pointer-events-none disabled:opacity-50",
              variant === "underline"
                ? cx(
                    "-mb-px border-b-2",
                    active
                      ? "border-brand text-brand"
                      : "border-transparent text-muted hover:text-ink",
                  )
                : cx(
                    "rounded-sm",
                    active
                      ? "bg-surface text-ink shadow-e1"
                      : "text-muted hover:text-ink",
                  ),
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={cx(
                  "type-body-sm tnum rounded-full px-1.5 py-0.5 font-bold",
                  active ? "bg-brand-tint text-brand-deep" : "bg-sunken text-muted",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  value,
  active,
  children,
}: {
  /** Must match the `useId()`-derived prefix of its Tabs instance. */
  id: string;
  value: string;
  active: boolean;
  children: ReactNode;
}) {
  if (!active) return null;
  return (
    <div
      role="tabpanel"
      id={`${id}-${value}-panel`}
      aria-labelledby={`${id}-${value}`}
      tabIndex={0}
      className="focus-ring"
    >
      {children}
    </div>
  );
}
