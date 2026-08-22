"use client";

import { useTranslations } from "@/lib/i18n";

/**
 * Pintasan papan ketik ke `#konten` (NFR-22).
 *
 * Komponen klien tersendiri supaya root layout tetap bisa dirender statis:
 * memanggil `getTranslations()` di layout menyeret seluruh route ke render
 * dinamis demi satu kalimat.
 */
export function SkipLink() {
  const t = useTranslations("common");
  return (
    <a
      href="#konten"
      className="focus-ring sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-e3"
    >
      {t("skip_to_content")}
    </a>
  );
}
