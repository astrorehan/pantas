"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cx } from "./cx";
import { Field } from "./input";
import { useTranslations } from "@/lib/i18n";

export interface SelectOption {
  value: string;
  label: string;
  /** Optional group heading; consecutive options sharing one are grouped. */
  group?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

/**
 * Listbox built on a button + `role="listbox"` rather than a native `<select>`:
 * native option lists cannot be styled, and the commodity picker needs icons
 * and group headings that match the rest of the system.
 *
 * Keyboard contract: Up/Down move, Home/End jump, Enter/Space commit, Escape
 * closes and returns focus to the trigger, and typing jumps to a prefix match.
 */

export function Select({
  value,
  onChange,
  options,
  label,
  hint,
  error,
  placeholder,
  disabled,
  className,
  id: idProp,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const tc = useTranslations("common");
  const defaultPlaceholder = placeholder ?? tc("select_placeholder");
  const auto = useId();
  const id = idProp ?? auto;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typed = useRef({ buffer: "", at: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const groups = useMemo(() => {
    const out: { group?: string; items: { opt: SelectOption; i: number }[] }[] =
      [];
    options.forEach((opt, i) => {
      const last = out[out.length - 1];
      if (last && last.group === opt.group) last.items.push({ opt, i });
      else out.push({ group: opt.group, items: [{ opt, i }] });
    });
    return out;
  }, [options]);

  /** Open at the current selection so Enter-Enter is a no-op, not a surprise. */
  function buka() {
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function commit(i: number) {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function step(from: number, dir: 1 | -1) {
    for (let n = 1; n <= options.length; n++) {
      const i = (from + dir * n + options.length * n) % options.length;
      if (!options[i].disabled) return i;
    }
    return from;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) buka();
        else setActive((a) => step(a, 1));
        return;
      case "ArrowUp":
        e.preventDefault();
        if (!open) buka();
        else setActive((a) => step(a, -1));
        return;
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(step(-1, 1));
        }
        return;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(step(options.length, -1));
        }
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) commit(active);
        else buka();
        return;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
        }
        return;
      case "Tab":
        setOpen(false);
        return;
    }

    // Type-ahead: printable keys within 700ms extend the search prefix.
    if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
    const now = Date.now();
    typed.current.buffer =
      now - typed.current.at > 700 ? e.key : typed.current.buffer + e.key;
    typed.current.at = now;
    const q = typed.current.buffer.toLowerCase();
    const hit = options.findIndex(
      (o) => !o.disabled && o.label.toLowerCase().startsWith(q),
    );
    if (hit >= 0) {
      setActive(hit);
      if (!open) commit(hit);
    }
  }

  return (
    <Field id={id} label={label} hint={hint} error={error} className={className}>
      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-haspopup="listbox"
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : buka())}
          onKeyDown={onKeyDown}
          className={cx(
            "tap focus-ring flex min-h-12 w-full items-center justify-between gap-2 rounded-md border bg-surface px-4 py-2 text-start",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error ? "border-danger" : "border-line hover:border-line-strong",
            open && "border-brand",
          )}
        >
          <span
            className={cx(
              "type-body-lg flex min-w-0 items-center gap-2 truncate",
              selected ? "text-ink" : "text-placeholder",
            )}
          >
            {selected?.icon}
            <span className="truncate">{selected?.label ?? defaultPlaceholder}</span>
          </span>
          <ChevronDown
            aria-hidden
            className={cx(
              "size-4 shrink-0 text-muted transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={`${id}-opt-${active}`}
            onKeyDown={onKeyDown}
            className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-line bg-overlay p-1 shadow-e3 focus:outline-none"
          >
            {groups.map(({ group, items }) => (
              <li key={group ?? "_"} role="presentation">
                {group && (
                  <p className="type-label px-3 pt-3 pb-1 text-label">{group}</p>
                )}
                <ul role="presentation">
                  {items.map(({ opt, i }) => {
                    const isSelected = opt.value === value;
                    return (
                      <li
                        key={opt.value}
                        id={`${id}-opt-${i}`}
                        data-index={i}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={opt.disabled || undefined}
                        onClick={() => commit(i)}
                        onMouseMove={() => setActive(i)}
                        className={cx(
                          "type-body-md flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2.5",
                          opt.disabled && "cursor-not-allowed opacity-50",
                          active === i && !opt.disabled && "bg-brand-tint",
                          isSelected ? "font-bold text-ink" : "text-ink",
                        )}
                      >
                        {opt.icon}
                        <span className="min-w-0 flex-1 truncate">
                          {opt.label}
                        </span>
                        {isSelected && (
                          <Check aria-hidden className="size-4 text-brand" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}
