"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { Button, IconButton, Portal, useModalBehaviour } from "@/components/ui";
import { useTranslations } from "@/lib/i18n";
import type { ReactNode } from "react";

/**
 * Kerangka bersama untuk lembar yang dicetak: tanda terima serah terima dan
 * label peti A4.
 *
 * Keduanya dulu menggambar modalnya sendiri di tempat, di dalam pohon halaman.
 * Aturan cetaknya menyembunyikan seluruh `body *` lalu memunculkan kembali
 * lembarannya sebagai `position: absolute` — tetapi lembaran itu bersarang di
 * panel ber-`overflow: hidden` dengan `max-height: 92dvh`, jadi apa pun yang
 * lebih panjang dari satu layar terpotong, dan yang keluar dari printer adalah
 * halaman kosong.
 *
 * Di sini modalnya diportal ke `<body>`. Karena ia anak langsung body, aturan
 * cetak di globals.css cukup menyembunyikan saudara-saudaranya, dan lembarannya
 * tetap di aliran normal sehingga memecah halaman sendiri. Portal juga
 * membawa serta apa yang hilang selama ini: jebakan fokus, tutup dengan
 * Escape, dan kunci gulir latar (NFR-22).
 */
export function PrintModal({
  isOpen,
  onClose,
  title,
  subtitle,
  /** Lebar panel di layar; cetak selalu memakai lebar penuh halaman. */
  lebar = "max-w-2xl",
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  lebar?: string;
  children: ReactNode;
}) {
  const t = useTranslations("receipt");
  const tc = useTranslations("common");
  const panelRef = useRef<HTMLDivElement>(null);
  useModalBehaviour(isOpen, onClose, panelRef);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        data-print-root
        className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-2 backdrop-blur-sm sm:p-4"
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          data-print-panel
          className={`relative flex max-h-[92dvh] w-full ${lebar} flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl`}
        >
          <div
            data-print-hide
            className="flex shrink-0 flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 sm:block">
                <h2 className="type-heading-sm truncate font-bold text-stone-900 sm:whitespace-normal">
                  {title}
                </h2>
                <span className="sm:hidden">
                  <IconButton label={tc("close")} size="sm" onClick={onClose}>
                    <X className="size-4" />
                  </IconButton>
                </span>
              </div>
              <p className="type-body-sm text-stone-500">{subtitle}</p>
            </div>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                className="w-full gap-2 sm:w-auto"
              >
                <Printer className="size-4" /> {t("btn_print")}
              </Button>
              <span className="hidden sm:block">
                <IconButton label={tc("close")} size="sm" onClick={onClose}>
                  <X className="size-4" />
                </IconButton>
              </span>
            </div>
          </div>

          {children}
        </div>
      </div>
    </Portal>
  );
}
