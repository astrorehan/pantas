"use client";

import { useId } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Check, Minus } from "lucide-react";
import { cx } from "./cx";

/** Hit area for the whole row, so the 44px touch floor is met by the label. */
const ROW = "flex min-h-11 cursor-pointer items-start gap-3 py-1";

export function Checkbox({
  label,
  hint,
  indeterminate,
  className,
  id: idProp,
  ...rest
}: Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
  hint?: ReactNode;
  indeterminate?: boolean;
}) {
  const auto = useId();
  const id = idProp ?? auto;

  return (
    <label htmlFor={id} className={cx(ROW, className)}>
      <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          ref={(el) => {
            if (el) el.indeterminate = indeterminate ?? false;
          }}
          className="peer focus-ring size-5 appearance-none rounded-xs border border-line-strong bg-surface checked:border-brand checked:bg-brand indeterminate:border-brand indeterminate:bg-brand disabled:opacity-50"
          {...rest}
        />
        {indeterminate ? (
          <Minus
            aria-hidden
            className="pointer-events-none absolute size-3.5 text-on-brand opacity-0 peer-indeterminate:opacity-100"
          />
        ) : (
          <Check
            aria-hidden
            className="pointer-events-none absolute size-3.5 text-on-brand opacity-0 peer-checked:opacity-100"
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="type-body-md block text-ink">{label}</span>
        {hint && <span className="type-body-sm block text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function Radio({
  label,
  hint,
  className,
  id: idProp,
  ...rest
}: Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
  hint?: ReactNode;
}) {
  const auto = useId();
  const id = idProp ?? auto;

  return (
    <label htmlFor={id} className={cx(ROW, className)}>
      <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <input
          id={id}
          type="radio"
          className="peer focus-ring size-5 appearance-none rounded-full border border-line-strong bg-surface checked:border-brand disabled:opacity-50"
          {...rest}
        />
        <span className="pointer-events-none absolute size-2.5 rounded-full bg-brand opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="min-w-0">
        <span className="type-body-md block text-ink">{label}</span>
        {hint && <span className="type-body-sm block text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function Switch({
  label,
  hint,
  checked,
  onCheckedChange,
  disabled,
  className,
  id: idProp,
}: {
  label: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const auto = useId();
  const id = idProp ?? auto;

  return (
    <div className={cx("flex min-h-11 items-start justify-between gap-4", className)}>
      <label htmlFor={id} className="min-w-0 cursor-pointer py-1">
        <span className="type-body-md block text-ink">{label}</span>
        {hint && <span className="type-body-sm block text-muted">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cx(
          "tap focus-ring mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent p-0.5",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-brand" : "bg-line-strong",
        )}
      >
        <span
          className={cx(
            "size-5 rounded-full bg-surface shadow-e1 transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
