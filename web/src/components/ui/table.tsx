"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cx } from "./cx";

export type SortDir = "asc" | "desc";

export interface Column<Row> {
  key: string;
  header: ReactNode;
  /** Cell renderer. Keep it pure — the table re-renders on every sort. */
  cell: (row: Row) => ReactNode;
  sortable?: boolean;
  align?: "start" | "end";
  /** Hide below this breakpoint on narrow screens. */
  hideBelow?: "sm" | "md" | "lg";
  width?: string;
  /**
   * Kolom yang isinya kalimat, bukan angka.
   *
   * Dalam mode kartu ia mendapat barisnya sendiri — label di atas, isi di
   * bawah, selebar kartu — karena kalimat yang dipepet ke kolom nilai selebar
   * setengah layar pecah jadi tiang teks setinggi sepuluh baris.
   */
  prosa?: boolean;
}

/*
 * Ambangnya diukur terhadap lebar wadah tabel, bukan lebar jendela.
 *
 * Lebar jendela adalah tebakan tentang ruang yang tersedia, dan di sini
 * tebakannya salah: panel teknis laporan grading duduk di kolom 58fr, jadi pada
 * jendela 1280px wadahnya cuma 593px — `lg:` menyala persis ketika ruangnya
 * justru menyempit jadi dua kolom. Kueri wadah menanyakan hal yang sebenarnya
 * ingin diketahui tabel: "apakah aku muat di sini?"
 *
 * Nilainya ditulis penuh, bukan disusun dari potongan, karena pemindai Tailwind
 * membaca berkas ini sebagai teks.
 */
const HIDE_BELOW = {
  sm: "hidden @sm/tabel:table-cell",
  md: "hidden @md/tabel:table-cell",
  lg: "hidden @lg/tabel:table-cell",
} as const;

const STACK = {
  sm: { kartu: "@sm/tabel:hidden", tabel: "hidden @sm/tabel:block" },
  md: { kartu: "@md/tabel:hidden", tabel: "hidden @md/tabel:block" },
  lg: { kartu: "@lg/tabel:hidden", tabel: "hidden @lg/tabel:block" },
  xl: { kartu: "@xl/tabel:hidden", tabel: "hidden @xl/tabel:block" },
  "2xl": { kartu: "@2xl/tabel:hidden", tabel: "hidden @2xl/tabel:block" },
  "3xl": { kartu: "@3xl/tabel:hidden", tabel: "hidden @3xl/tabel:block" },
} as const;

/**
 * Data table with a sticky header. Wrapped in its own horizontal scroller so a
 * wide table never widens the page (F-78).
 *
 * Di bawah `stackBelow` barisnya berhenti jadi baris tabel dan menjadi kartu.
 *
 * Penggeser mendatar menyelamatkan tata letak halaman, bukan pembacanya: tabel
 * tujuh kolom selebar 640px di dalam kolom 309px berarti pembaca ponsel
 * menggeser bolak-balik untuk merangkai satu baris, dan kolom yang isinya
 * kalimat — "alasan grade", misalnya — diperas jadi tiang teks selebar dua
 * kata. Kartunya dirakit dari `columns` yang sama, jadi tidak ada markup kedua
 * yang bisa ketinggalan saat kolomnya berubah.
 */
export function Table<Row>({
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  density = "comfortable",
  empty,
  caption,
  onRowClick,
  className,
  stackBelow = "2xl",
}: {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  sort?: { key: string; dir: SortDir };
  onSortChange?: (next: { key: string; dir: SortDir }) => void;
  density?: "compact" | "comfortable";
  /** Rendered in place of the body when there are no rows. */
  empty?: ReactNode;
  caption: string;
  onRowClick?: (row: Row) => void;
  className?: string;
  /**
   * Lebar wadah minimum yang dibutuhkan tabel; di bawah itu barisnya jadi
   * kartu. Memakai skala wadah Tailwind: `sm` 24rem, `md` 28rem, `lg` 32rem,
   * `xl` 36rem, `2xl` 42rem, `3xl` 48rem.
   *
   * Bawaannya `2xl` (672px) — cukup untuk lima sampai tujuh kolom pendek.
   * Tabel dua atau tiga kolom angka boleh menurunkannya; `false` mematikan
   * penumpukan sama sekali.
   */
  stackBelow?: keyof typeof STACK | false;
}) {
  const pad = density === "compact" ? "px-3 py-2" : "px-4 py-3";

  if (rows.length === 0 && empty) {
    return <div className={className}>{empty}</div>;
  }

  const stack = stackBelow ? STACK[stackBelow] : null;

  const tabel = (
    <div
      className={cx(
        "scroll-x rounded-md bg-surface shadow-e2",
        stack?.tabel,
        className,
      )}
    >
      <table className="w-full border-collapse text-start">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 z-10 bg-sunken">
          <tr>
            {columns.map((col) => {
              const active = sort?.key === col.key;
              const nextDir: SortDir =
                active && sort?.dir === "asc" ? "desc" : "asc";
              const Icon = !active
                ? ChevronsUpDown
                : sort?.dir === "asc"
                  ? ChevronUp
                  : ChevronDown;

              return (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={
                    active
                      ? sort?.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : col.sortable
                        ? "none"
                        : undefined
                  }
                  className={cx(
                    "type-label border-b border-line text-label",
                    pad,
                    col.align === "end" ? "text-end" : "text-start",
                    col.hideBelow && HIDE_BELOW[col.hideBelow],
                  )}
                >
                  {col.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() =>
                        onSortChange({ key: col.key, dir: nextDir })
                      }
                      className={cx(
                        "focus-ring inline-flex items-center gap-1 hover:text-ink",
                        active && "text-ink",
                      )}
                    >
                      {col.header}
                      <Icon aria-hidden className="size-3" />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cx(
                "border-b border-line last:border-0",
                onRowClick && "tap cursor-pointer hover:bg-sunken",
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cx(
                    "type-body-md text-ink",
                    pad,
                    col.align === "end" ? "tnum text-end" : "text-start",
                    col.hideBelow && HIDE_BELOW[col.hideBelow],
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /*
   * `@container/tabel` harus membungkus kedua bentuknya, dan `min-w-0` di
   * sebelahnya bukan hiasan: tanpa itu wadahnya memakai lebar min-content
   * anaknya — yaitu lebar tabel — dan kueri wadahnya selalu menjawab "muat".
   */
  const sortable = onSortChange ? columns.filter((c) => c.sortable) : [];

  return (
    <div className="@container/tabel min-w-0">
      {tabel}

      {stack && (
        <div className={cx("flex flex-col gap-2", stack.kartu, className)}>
          {/*
            Pengurutan tidak ikut hilang bersama kepala tabelnya. Tanpa baris ini
            satu-satunya cara mengurut adalah memperlebar jendela — yang di
            ponsel bukan pilihan.
          */}
          {sortable.length > 0 && (
            <div
              role="group"
              aria-label={caption}
              className="scroll-x flex gap-2 pb-1"
            >
              {sortable.map((col) => {
                const active = sort?.key === col.key;
                const nextDir: SortDir =
                  active && sort?.dir === "asc" ? "desc" : "asc";
                const Icon = !active
                  ? ChevronsUpDown
                  : sort?.dir === "asc"
                    ? ChevronUp
                    : ChevronDown;
                return (
                  <button
                    key={col.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      onSortChange?.({ key: col.key, dir: nextDir })
                    }
                    className={cx(
                      "tap tap-press focus-ring type-body-sm flex min-h-9 shrink-0 items-center gap-1 rounded-full px-3 font-bold",
                      active
                        ? "bg-brand-deep text-on-brand"
                        : "border border-line bg-surface text-muted",
                    )}
                  >
                    {col.header}
                    <Icon aria-hidden className="size-3" />
                  </button>
                );
              })}
            </div>
          )}

          <ul className="flex flex-col gap-2">
            {rows.map((row) => {
              const isi = (
                <dl className="flex flex-col divide-y divide-line">
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className={cx(
                        "gap-x-4 py-2",
                        col.prosa
                          ? "flex flex-col gap-y-1"
                          : "flex flex-wrap items-baseline justify-between",
                      )}
                    >
                      <dt className="type-label shrink-0 text-label">
                        {col.header}
                      </dt>
                      <dd
                        className={cx(
                          "type-body-md min-w-0 text-ink",
                          col.prosa ? "text-start" : "tnum text-end font-bold",
                        )}
                      >
                        {col.cell(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              );

              return (
                <li key={rowKey(row)}>
                  {onRowClick ? (
                    <button
                      type="button"
                      onClick={() => onRowClick(row)}
                      className="tap tap-press focus-ring w-full rounded-md bg-surface px-4 py-2 text-start shadow-e1"
                    >
                      {isi}
                    </button>
                  ) : (
                    <div className="rounded-md bg-surface px-4 py-2 shadow-e1">
                      {isi}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Generic client-side comparator for the common column types. */
export function sortRows<Row>(
  rows: Row[],
  sort: { key: string; dir: SortDir } | undefined,
  value: (row: Row, key: string) => string | number | undefined,
): Row[] {
  if (!sort) return rows;
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = value(a, sort.key);
    const bv = value(b, sort.key);
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number")
      return (av - bv) * dir;
    return String(av).localeCompare(String(bv), "id") * dir;
  });
}
