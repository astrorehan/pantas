"use client";

import { Smartphone, Vibrate, VibrateOff } from "lucide-react";
import { useHaptic } from "@/lib/haptic";
import { useTranslations } from "@/lib/i18n";
import { cx } from "./cx";

/**
 * Sakelar kontrol getaran (Haptic Feedback) — F-108.
 *
 * Memungkinkan pengguna mengaktifkan atau menonaktifkan respon getar
 * pada aksi operasional PWA/mobile (pemindaian QR, grading, verifikasi).
 */
export function HapticToggle({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("settings");
  const { isSupported, enabled, setEnabled } = useHaptic();

  if (!isSupported) {
    return (
      <div
        className={cx(
          "inline-flex items-center gap-1.5 rounded-full border border-line bg-sunken px-3 py-1.5 text-muted",
          className,
        )}
        title={t("haptic_unsupported")}
      >
        <Smartphone aria-hidden className="size-3.5 shrink-0 opacity-60" />
        <span className="type-body-sm text-muted">
          {t("haptic_unsupported")}
        </span>
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("haptic")}
      className={cx("flex flex-wrap items-center gap-2", className)}
    >
      <button
        type="button"
        role="radio"
        aria-checked={enabled}
        aria-label="Getar Aktif"
        onClick={() => setEnabled(true)}
        className={cx(
          "tap focus-ring type-body-sm flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-3.5 font-bold cursor-pointer select-none sm:min-h-10",
          enabled
            ? "border-brand bg-brand-tint text-brand-deep"
            : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
        )}
      >
        <Vibrate aria-hidden className="size-3.5 shrink-0 text-brand" />
        <span>Aktif</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={!enabled}
        aria-label="Getar Nonaktif"
        onClick={() => setEnabled(false)}
        className={cx(
          "tap focus-ring type-body-sm flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-3.5 font-bold cursor-pointer select-none sm:min-h-10",
          !enabled
            ? "border-brand bg-brand-tint text-brand-deep"
            : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
        )}
      >
        <VibrateOff aria-hidden className="size-3.5 shrink-0 opacity-70" />
        <span>Nonaktif</span>
      </button>
    </div>
  );
}
