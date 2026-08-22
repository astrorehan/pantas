"use client";

import { Globe } from "lucide-react";
import { useLocale, type Locale } from "@/lib/i18n";
import { cx } from "./cx";

const OPTIONS: { value: Locale; label: string; code: string }[] = [
  { value: "id", label: "Indonesia", code: "ID" },
  { value: "en", label: "English", code: "EN" },
];

/**
 * Two-way application language control (F-97).
 * Supports ID (Bahasa Indonesia - default) and EN (English - Expo/Judge mode).
 */
export function LocaleToggle({
  compact = false,
  className,
}: {
  /** Short ID/EN code for app bar or compact headers; full names in settings and footer. */
  compact?: boolean;
  className?: string;
}) {
  const { locale, setLocale } = useLocale();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setLocale(locale === "id" ? "en" : "id")}
        title="Ganti Bahasa / Switch Language"
        className={cx(
          "tap focus-ring text-[11px] inline-flex items-center gap-0.5 rounded-full border border-line bg-sunken px-2 py-0.5 font-bold leading-none text-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer select-none",
          className,
        )}
      >
        <span className={cx(locale === "id" ? "text-brand font-extrabold" : "text-muted font-medium")}>ID</span>
        <span className="text-line-strong font-normal text-[9px] opacity-70">/</span>
        <span className={cx(locale === "en" ? "text-brand font-extrabold" : "text-muted font-medium")}>EN</span>
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Bahasa Antarmuka / Interface Language"
      className={cx("flex flex-wrap items-center gap-2", className)}
    >
      {OPTIONS.map(({ value, label }) => {
        const active = locale === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setLocale(value)}
            className={cx(
              "tap focus-ring type-body-sm flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-3.5 font-bold cursor-pointer select-none sm:min-h-10",
              active
                ? "border-brand bg-brand-tint text-brand-deep"
                : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {/* Globe hanya pada yang aktif: dua ikon identik berdampingan
                tidak membedakan apa pun, ia cuma mengulang kata "bahasa" yang
                sudah jadi label barisnya. */}
            {active && (
              <Globe aria-hidden className="size-3.5 shrink-0 text-brand" />
            )}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
