"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { cx } from "./cx";

/**
 * Menu aksi sekunder di balik satu tombol `⋯`.
 *
 * Ada karena kartu di layar petani sempat memajang empat tombol sejajar —
 * Ubah harga, Jeda, Tandai terjual, Hapus — dan pada 360px keempatnya
 * membungkus jadi dua baris tombol yang saling berebut perhatian dengan isi
 * kartunya sendiri. Satu aksi utama tetap terlihat; sisanya pindah ke sini.
 *
 * Sengaja **bukan** modal: `Dialog` dan `Sheet` mengunci fokus dan mengunci
 * gulir halaman, dua hal yang salah untuk daftar pendek yang dibuka lalu
 * ditutup dalam sedetik (NFR-22 mengizinkan jebakan fokus hanya di modal).
 * Yang dipinjam dari sana hanya perilakunya: Escape menutup, fokus kembali ke
 * pemicu, panah naik-turun berjalan antar item.
 */

export interface MenuAction {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** `danger` untuk aksi yang menghapus atau tidak bisa dibatalkan. */
  tone?: "default" | "danger";
  disabled?: boolean;
}

export function Menu({
  label,
  actions,
  align = "end",
  className,
}: {
  /** Nama aksesibel tombol pemicu — mis. "Aksi lain untuk Tomat Grade A". */
  label: string;
  actions: MenuAction[];
  /** Sisi panel yang disejajarkan dengan pemicu. */
  align?: "start" | "end";
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Item yang benar-benar bisa dipilih. Yang `disabled` dilewati saat panah
  // ditekan, bukan sekadar tidak bereaksi saat sampai di sana.
  const enabled = actions.filter((a) => !a.disabled);

  function close(kembaliKePemicu = true) {
    setOpen(false);
    if (kembaliKePemicu) triggerRef.current?.focus();
  }

  function fokusItem(i: number) {
    const items = panelRef.current?.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])',
    );
    if (!items?.length) return;
    const n = items.length;
    items[((i % n) + n) % n].focus();
  }

  useEffect(() => {
    if (!open) return;

    // Fokus item pertama begitu panel terbuka. Dipanggil di efek, bukan di
    // handler klik, karena panelnya belum ada di DOM saat klik diproses.
    fokusItem(0);

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (!panelRef.current?.contains(document.activeElement)) return;
      const items = [
        ...panelRef.current.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"])',
        ),
      ];
      const kini = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        fokusItem(kini + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        fokusItem(kini - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        fokusItem(0);
      } else if (e.key === "End") {
        e.preventDefault();
        fokusItem(items.length - 1);
      } else if (e.key === "Tab") {
        // Tab keluar dari menu memang menutupnya — itu yang membedakan menu
        // dari modal. Fokusnya dibiarkan berjalan ke elemen berikutnya.
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  if (enabled.length === 0 && actions.length === 0) return null;

  return (
    <div ref={rootRef} className={cx("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cx(
          "tap tap-press focus-ring inline-flex size-11 items-center justify-center rounded-md sm:size-9",
          open
            ? "bg-sunken text-ink"
            : "text-muted hover:bg-sunken hover:text-ink",
        )}
      >
        <MoreHorizontal aria-hidden className="size-5" />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={`${id}-menu`}
          role="menu"
          aria-label={label}
          className={cx(
            "rise absolute top-full z-30 mt-1 flex min-w-52 flex-col rounded-md p-1 glass-overlay backdrop-blur-xl backdrop-saturate-150",
            align === "end" ? "end-0" : "start-0",
          )}
        >
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-disabled={a.disabled || undefined}
              onClick={() => {
                if (a.disabled) return;
                close();
                a.onSelect();
              }}
              className={cx(
                "tap focus-ring type-body-md flex min-h-11 items-center gap-2.5 rounded-sm px-3 text-start font-medium",
                a.disabled
                  ? "pointer-events-none opacity-50"
                  : a.tone === "danger"
                    ? "text-danger hover:bg-danger-tint"
                    : "text-ink hover:bg-sunken",
              )}
            >
              {a.icon && <span className="shrink-0">{a.icon}</span>}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
