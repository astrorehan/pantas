"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cx } from "./cx";
import { Button } from "./button";
import { Sheet } from "./sheet";
import { useTranslations } from "@/lib/i18n";

/**
 * Satu tombol filter, satu panel, satu tombol reset.
 *
 * Layar Riwayat sempat menjalankan tiga mekanisme untuk pekerjaan yang sama:
 * kartu filter yang bisa diciutkan, deretan pill filter aktif dengan tombol
 * silang masing-masing, dan tombol "Reset" terpisah di kepala kartu. Ketiganya
 * benar sendiri-sendiri dan membingungkan bersama-sama — petani harus menebak
 * mana yang mematikan apa.
 *
 * Isinya diserahkan ke pemanggil (`children`): tiap layar punya bidang filter
 * berbeda, dan membungkusnya di sini hanya akan melahirkan satu prop per
 * bidang. Yang distandarkan adalah pemicunya, badge jumlah aktif, dan tempat
 * tombol Reset — tiga hal yang sebelumnya ditulis ulang di tiap layar.
 */
export function FilterSheet({
  title,
  description,
  jumlahAktif = 0,
  onReset,
  children,
  className,
}: {
  title?: string;
  description?: string;
  /** Berapa filter menyala. Nol menyembunyikan badge dan tombol Reset. */
  jumlahAktif?: number;
  onReset: () => void;
  children: ReactNode;
  className?: string;
}) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const aktif = jumlahAktif > 0;
  const displayTitle = title ?? t("filter");

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className={cx(aktif && "border-brand/40 text-brand", className)}
      >
        <SlidersHorizontal aria-hidden className="size-4" />
        {displayTitle}
        {aktif && (
          <span className="type-body-sm tnum flex size-5 items-center justify-center rounded-full bg-brand font-bold text-on-brand">
            {jumlahAktif}
          </span>
        )}
      </Button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={displayTitle}
        description={description}
        side="end"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={onReset}
              disabled={!aktif}
              className="me-auto"
            >
              Reset
            </Button>
            <Button onClick={() => setOpen(false)}>{t("apply")}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">{children}</div>
      </Sheet>
    </>
  );
}
