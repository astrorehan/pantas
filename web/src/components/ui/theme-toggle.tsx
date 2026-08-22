"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  applyTheme,
  getServerTheme,
  getTheme,
  subscribeTheme,
  type Theme,
} from "@/lib/theme";
import { cx } from "./cx";

import { useTranslations } from "@/lib/i18n";

const OPTIONS: { value: Theme; key: "light" | "dark" | "system"; Icon: typeof Sun }[] = [
  { value: "light", key: "light", Icon: Sun },
  { value: "dark", key: "dark", Icon: Moon },
  { value: "system", key: "system", Icon: Monitor },
];

/**
 * Three-way theme control. The stored preference is read through an external
 * store so the server render and the client's first render agree on "system"
 * and then settle — no flash of the wrong pill, no hydration warning.
 *
 * Dua bentuk, bukan satu bentuk dengan dua ukuran.
 *
 * `compact` tetap segmented control klasik — rel `bg-sunken` dengan keping
 * putih yang meluncur — karena di bilah aplikasi ia benda kecil yang butuh
 * relnya sendiri agar terbaca sebagai satu kesatuan. Di kartu pengaturan rel
 * itu justru jadi slab krem selebar kartu: bidang paling berat di layar,
 * dipakai untuk pilihan paling jarang disentuh. Bentuk lebarnya sekarang chip
 * terpisah selebar isinya, memakai bahasa pil yang sama dengan ringkasan di
 * beranda.
 */
export function ThemeToggle({
  compact = false,
  className,
}: {
  /** Icon-only segmented control for the app bar; labelled rows in settings. */
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("theme");
  const theme = useSyncExternalStore(
    subscribeTheme,
    getTheme,
    getServerTheme,
  );

  return (
    <div
      role="radiogroup"
      aria-label={t("title")}
      className={cx(
        compact
          ? "inline-flex items-center gap-1 rounded-full border border-line bg-sunken p-1"
          : "flex flex-wrap items-center gap-2",
        className,
      )}
    >
      {OPTIONS.map(({ value, key, Icon }) => {
        const active = theme === value;
        const label = t(key);
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={compact ? label : undefined}
            title={compact ? label : undefined}
            onClick={() => applyTheme(value)}
            className={cx(
              "tap focus-ring type-body-sm relative z-10 flex items-center justify-center gap-1.5 rounded-full font-bold cursor-pointer select-none whitespace-nowrap",
              compact
                ? cx(
                    "size-11 flex-1 sm:size-9",
                    active
                      ? "bg-surface text-ink shadow-e1 ring-1 ring-black/5 dark:ring-white/10"
                      : "text-muted hover:text-ink",
                  )
                : cx(
                    "min-h-11 border px-3.5 sm:min-h-10",
                    active
                      ? "border-brand bg-brand-tint text-brand-deep"
                      : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
                  ),
            )}
          >
            <Icon aria-hidden className="size-4 shrink-0" />
            {!compact && label}
          </button>
        );
      })}
    </div>
  );
}
