"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "./cx";
import { IconButton } from "./button";
import { useTranslations } from "@/lib/i18n";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Focus trap + scroll lock + Escape, shared by Dialog and Sheet.
 *
 * A modal is the one place a focus trap is allowed (NFR-22): everything else
 * must let Tab walk straight out.
 */
export function useModalBehaviour(
  open: boolean,
  onClose: () => void,
  panelRef: React.RefObject<HTMLElement | null>,
) {
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    // Land on the first control; fall back to the panel so focus never stays
    // behind on the element that opened the modal.
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    if (first) first.focus();
    else panel?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      restoreTo.current?.focus();
    };
  }, [open, onClose, panelRef]);
}

/** Portals to <body> so a modal is never clipped by an ancestor's overflow. */
export function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
}) {
  const t = useTranslations("common");
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  useModalBehaviour(open, onClose, panelRef);

  if (!open) return null;

  const width = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
  }[size];

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
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
          aria-describedby={description ? `${id}-desc` : undefined}
          className={cx(
            "rise relative flex max-h-[90dvh] w-full flex-col rounded-t-xl glass-overlay backdrop-blur-xl backdrop-saturate-150 sm:rounded-xl",
            width,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h2 id={`${id}-title`} className="type-heading-md text-ink">
                {title}
              </h2>
              {description && (
                <p id={`${id}-desc`} className="type-body-md pt-1 text-muted">
                  {description}
                </p>
              )}
            </div>
            <IconButton label={t("close")} size="sm" onClick={onClose}>
              <X className="size-4" />
            </IconButton>
          </div>

          {children && (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {children}
            </div>
          )}

          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
