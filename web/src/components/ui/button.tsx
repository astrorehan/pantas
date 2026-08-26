"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { haptic } from "@/lib/haptic";
import { cx } from "./cx";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "contrast"
  | "danger"
  | "danger-ghost";

export type ButtonSize = "sm" | "md" | "lg" | "xl";

export type HapticTrigger =
  | boolean
  | "selection"
  | "light"
  | "medium"
  | "heavy"
  | "shutter"
  | "scan"
  | "success"
  | "warning"
  | "error";

/**
 * Backgrounds ride semantic tokens, so a variant needs no dark-mode twin.
 * `text-on-brand` rather than `text-white`: on dark the accent is light green
 * and white-on-that fails contrast.
 *
 * The filled variants carry a gradient and a shadow so the primary action
 * reads as a raised key rather than a coloured rectangle painted onto the
 * page. `hover:bg-none` is not decoration: `bg-brand-deep` is a background
 * *colour*, and without dropping the image the gradient would sit on top of it
 * and the hover state would never show.
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "fill-brand bg-brand text-on-brand shadow-e2 hover:bg-none hover:bg-brand-deep hover:shadow-e3",
  secondary:
    "bg-brand-dark text-canvas shadow-e2 hover:bg-brand-deep hover:shadow-e3",
  outline: "border border-brand bg-transparent text-brand hover:bg-brand-tint",
  // Deliberately flat: ghost is the quiet variant, and it is what icon buttons
  // in toolbars default to. Elevating it would put a shadow on every chrome
  // affordance in the app.
  ghost:
    "border border-line bg-surface text-ink hover:bg-sunken hover:border-line-strong",
  /**
   * Untuk tombol yang duduk di atas isian brand — kartu hero, chrome hijau.
   * `primary` di sana adalah hijau di atas hijau: isinya hilang dan bayangannya
   * tak berarti. Ini membalik polaritas, keping terang membawa teks brand.
   */
  contrast:
    "bg-surface text-brand-deep shadow-e2 hover:bg-canvas hover:shadow-e3",
  danger: "bg-danger text-canvas shadow-e2 hover:opacity-90 hover:shadow-e3",
  /**
   * Merusak, tapi tenang — keluar akun, hapus draf, batalkan langganan.
   *
   * Ada karena pemanggilnya sudah mencoba menyusunnya sendiri dan gagal
   * diam-diam: `variant="ghost" className="text-danger"` tidak pernah berwarna
   * merah. `ghost` sudah menyetel `text-ink`, dan dua utility warna teks
   * berspesifisitas sama diputus oleh urutan di stylesheet, bukan oleh urutan
   * di atribut class — jadi tombol keluar terbaca persis seperti tombol netral
   * selama ini, tanpa satu pun peringatan dari peramban.
   */
  "danger-ghost":
    "border border-danger/35 bg-transparent text-danger hover:bg-danger-tint hover:border-danger/60",
};

/**
 * Every size clears the 44px touch floor on phones (NFR-23). `sm` is the only
 * one that would not, so it grows to 44 below the `sm` breakpoint and shrinks
 * back to a dense 36 once there is a mouse — handled here rather than at each
 * call site, which is what kept small icon buttons under-sized before.
 */
const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-11 sm:min-h-9 gap-1.5 rounded-sm px-3 type-body-sm font-bold",
  md: "min-h-11 gap-2 rounded-md px-4 type-body-md font-bold",
  lg: "min-h-12 gap-2 rounded-md px-5 type-body-lg font-bold",
  xl: "min-h-14 gap-2.5 rounded-lg px-6 type-body-lg font-bold",
};

const ICON_ONLY: Record<ButtonSize, string> = {
  sm: "w-11 sm:w-9 px-0",
  md: "w-11 px-0",
  lg: "w-12 px-0",
  xl: "w-14 px-0",
};

function base(
  variant: ButtonVariant,
  size: ButtonSize,
  block: boolean,
  iconOnly: boolean,
) {
  return cx(
    "tap tap-press focus-ring inline-flex shrink-0 items-center justify-center",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-disabled:pointer-events-none aria-disabled:opacity-50",
    SIZE[size],
    iconOnly && ICON_ONLY[size],
    VARIANT[variant],
    block && "w-full",
  );
}

function triggerButtonHaptic(
  hapticFeedback: HapticTrigger | undefined,
  variant: ButtonVariant,
  iconOnly: boolean,
) {
  if (hapticFeedback === false) return;
  if (
    typeof hapticFeedback === "string" &&
    typeof haptic[hapticFeedback] === "function"
  ) {
    haptic[hapticFeedback]();
    return;
  }
  if (iconOnly) {
    haptic.selection();
  } else if (variant === "primary" || variant === "danger") {
    haptic.medium();
  } else {
    haptic.light();
  }
}

/** Inline spinner. Sized in `em` so it tracks whatever text size it sits in. */
function Spinner() {
  return (
    <span
      aria-hidden
      className="size-[1.1em] shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  iconOnly = false,
  hapticFeedback = true,
  onClick,
  className,
  children,
  disabled,
  ...rest
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full-width. The farmer flows use this; dense desktop toolbars do not. */
  block?: boolean;
  loading?: boolean;
  /** Square button holding a single icon — still needs an `aria-label`. */
  iconOnly?: boolean;
  /** Respon taktil saat tombol diklik (bawaan: true). */
  hapticFeedback?: HapticTrigger;
}) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      triggerButtonHaptic(hapticFeedback, variant, iconOnly);
    }
    onClick?.(e);
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={handleClick}
      data-haptic-handled="true"
      className={cx(base(variant, size, block, iconOnly), className)}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  block = false,
  iconOnly = false,
  hapticFeedback = true,
  onClick,
  className,
  children,
  ...rest
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  iconOnly?: boolean;
  /** Respon taktil saat link tombol diklik (bawaan: true). */
  hapticFeedback?: HapticTrigger;
}) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    triggerButtonHaptic(hapticFeedback, variant, iconOnly);
    onClick?.(e);
  };

  return (
    <Link
      onClick={handleClick}
      data-haptic-handled="true"
      className={cx(base(variant, size, block, iconOnly), className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

/**
 * Icon-only button. `label` is required and becomes the accessible name —
 * an icon button without one is invisible to a screen reader (NFR-22).
 */
export function IconButton({
  label,
  variant = "ghost",
  size = "md",
  hapticFeedback = "selection",
  className,
  children,
  ...rest
}: Omit<ComponentProps<"button">, "aria-label"> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  hapticFeedback?: HapticTrigger;
  children: ReactNode;
}) {
  return (
    <Button
      aria-label={label}
      title={label}
      variant={variant}
      size={size}
      iconOnly
      hapticFeedback={hapticFeedback}
      className={className}
      {...rest}
    >
      {children}
    </Button>
  );
}
