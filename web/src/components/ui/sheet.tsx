"use client";

import { useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "./cx";
import { IconButton } from "./button";
import { Portal, useModalBehaviour } from "./dialog";
import { useTranslations } from "@/lib/i18n";

/**
 * One API, two shapes: a bottom sheet where the thumb is (mobile) and a side
 * drawer where the cursor is (desktop). Screens should not have to branch.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  side = "end",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  /** Desktop edge. `end` follows writing direction; `start` is the filter rail. */
  side?: "start" | "end";
  footer?: ReactNode;
  children: ReactNode;
}) {
  const tc = useTranslations("common");
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  useModalBehaviour(open, onClose, panelRef);

  if (!open) return null;

  return (
    <Portal>
      <div
        className={cx(
          "fixed inset-0 z-50 flex",
          "items-end justify-center",
          side === "end" ? "md:items-stretch md:justify-end" : "md:items-stretch md:justify-start",
        )}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          className={cx(
            "relative flex w-full flex-col glass-overlay backdrop-blur-xl backdrop-saturate-150",
            "max-h-[88dvh] rounded-t-xl",
            "md:h-dvh md:max-h-none md:w-[420px] md:rounded-none",
            side === "end" ? "md:border-s md:border-line/60" : "md:border-e md:border-line/60",
          )}
        >
          {/* Drag affordance — mobile only; on desktop the edge does that job. */}
          <span
            aria-hidden
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong md:hidden"
          />

          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <h2 id={`${id}-title`} className="type-heading-md text-ink">
                {title}
              </h2>
              {description && (
                <p className="type-body-md pt-1 text-muted">{description}</p>
              )}
            </div>
            <IconButton label={tc("close")} size="sm" onClick={onClose}>
              <X className="size-4" />
            </IconButton>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto border-t border-line px-5 py-4">
            {children}
          </div>

          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
