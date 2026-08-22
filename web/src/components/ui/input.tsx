"use client";

import { useId, useRef } from "react";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

const FIELD_BOX =
  "w-full rounded-md border bg-surface text-ink type-body-lg placeholder:text-placeholder " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Label + hint + error scaffolding shared by every control. Error text is
 * wired through `aria-describedby` so a screen reader announces *why* a field
 * is invalid, not just that it is.
 */
export function Field({
  id,
  label,
  hint,
  error,
  counter,
  required,
  children,
  className,
}: {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  counter?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="type-label text-label">
          {label}
          {required && (
            <span className="text-danger" aria-hidden>
              {" "}
              *
            </span>
          )}
        </label>
      )}
      {children}
      {(error || hint || counter) && (
        <div className="flex items-start justify-between gap-3">
          <p
            id={error ? `${id}-error` : `${id}-hint`}
            role={error ? "alert" : undefined}
            className={cx(
              "type-body-sm",
              error ? "font-bold text-danger" : "text-muted",
            )}
          >
            {error ?? hint}
          </p>
          {counter && (
            <p className="type-body-sm tnum shrink-0 text-label">{counter}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  counter,
  className,
  id: idProp,
  ...rest
}: Omit<ComponentProps<"input">, "prefix"> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  /** Static adornment inside the box — "Rp", a search glyph, a unit. */
  prefix?: ReactNode;
  suffix?: ReactNode;
  counter?: string;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  // With an adornment the wrapper draws the border and owns the focus ring, so
  // the input itself goes flat — two nested boxes read as a rendering bug.
  const adorned = prefix != null || suffix != null;

  const control = (
    <input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      className={cx(
        FIELD_BOX,
        adorned
          ? "min-h-0 rounded-none border-0 bg-transparent px-0 py-3 focus:outline-none"
          : cx(
              "focus-ring min-h-12 px-4 py-3",
              error ? "border-danger" : "border-line focus:border-brand",
            ),
        className,
      )}
      {...rest}
    />
  );

  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      counter={counter}
      required={rest.required}
    >
      {adorned ? (
        <div
          className={cx(
            "flex min-h-12 items-center gap-2 rounded-md border bg-surface px-4",
            "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand",
            error ? "border-danger" : "border-line focus-within:border-brand",
          )}
        >
          {prefix && (
            <span className="type-body-md shrink-0 text-muted">{prefix}</span>
          )}
          {control}
          {suffix && (
            <span className="type-body-md shrink-0 text-muted">{suffix}</span>
          )}
        </div>
      ) : (
        control
      )}
    </Field>
  );
}

export function Textarea({
  label,
  hint,
  error,
  counter,
  autoGrow = true,
  className,
  id: idProp,
  onInput,
  ...rest
}: ComponentProps<"textarea"> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  counter?: string;
  autoGrow?: boolean;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      counter={counter}
      required={rest.required}
    >
      <textarea
        id={id}
        ref={ref}
        rows={rest.rows ?? 3}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        onInput={(e) => {
          if (autoGrow && ref.current) {
            // Collapse before measuring, otherwise the box only ever grows.
            ref.current.style.height = "auto";
            ref.current.style.height = `${ref.current.scrollHeight}px`;
          }
          onInput?.(e);
        }}
        className={cx(
          FIELD_BOX,
          "focus-ring resize-y px-4 py-3",
          autoGrow && "resize-none overflow-hidden",
          error ? "border-danger" : "border-line focus:border-brand",
          className,
        )}
        {...rest}
      />
    </Field>
  );
}
