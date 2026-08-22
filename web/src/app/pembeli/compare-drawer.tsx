"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Scale,
  X,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Badge, Button, GradeBadge, cx } from "@/components/ui";
import { formatRupiah, num } from "@/lib/format";
import { useTranslations } from "@/lib/i18n";
import type { Listing } from "@/lib/types";

interface CompareDrawerProps {
  selectedIds: string[];
  listings: Listing[];
  onToggle: (id: string) => void;
  onClear: () => void;
}

export function CompareDrawer({
  selectedIds,
  listings,
  onToggle,
  onClear,
}: CompareDrawerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("compare_drawer");


  const comparedListings = listings.filter((l) =>
    selectedIds.includes(l.id),
  );

  if (selectedIds.length === 0) return null;

  // Temukan harga termurah untuk disorot (F-34)
  const minPrice = Math.min(...comparedListings.map((l) => l.harga_per_kg));

  return (
    <>
      {/* Floating Bottom Bar (Compare Trigger) */}
      <div className="pointer-events-none fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-40 flex items-center justify-center sm:justify-end gap-2 max-w-[calc(100vw-2rem)]">
        <div className="pointer-events-auto flex flex-wrap items-center justify-between sm:justify-start gap-2 rounded-full border border-line bg-surface/95 px-3 py-2 sm:px-4 sm:py-2.5 shadow-lg backdrop-blur-md max-w-full">
          <span className="flex size-7 items-center justify-center rounded-full bg-brand-tint text-brand">
            <Scale className="size-4" />
          </span>
          <span className="type-body-sm font-bold text-ink">
            {selectedIds.length} {t("compared")}
          </span>
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            className="ms-1 font-bold"
          >
            {t("btn")}
          </Button>
          <button
            type="button"
            onClick={onClear}
            className="tap rounded-full p-1 text-muted hover:text-ink"
            title={t("clear")}
            aria-label={t("clear")}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Full Compare Modal (F-34 / F-77) */}
      {open && (
        <div
          role="dialog"
          aria-labelledby="modal-bandingkan-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div className="flex items-center gap-2.5">
                {/* Kode PRD internal ("F-34") tidak berarti apa-apa bagi
                    pembeli dan tidak pernah dimaksudkan untuk terbaca. */}
                <Badge tone="brand" icon={<Scale className="size-3.5" />}>
                  {t("modal_badge")}
                </Badge>
                <h2 id="modal-bandingkan-title" className="type-heading-md text-ink">
                  {t("modal_title")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup perbandingan"
                className="tap rounded-full p-1.5 text-muted hover:bg-line/40 hover:text-ink"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            {/* Comparison Table */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {comparedListings.map((item) => {
                  const isCheapest = item.harga_per_kg === minPrice;
                  return (
                    <div
                      key={item.id}
                      className={cx(
                        "flex flex-col justify-between gap-4 rounded-md border p-4 transition-all",
                        isCheapest
                          ? "border-brand bg-brand-tint/20 shadow-xs"
                          : "border-line bg-sunken",
                      )}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="relative aspect-16/9 overflow-hidden rounded-xs">
                          <Image
                            src={item.gambar}
                            alt={item.nama}
                            fill
                            className="object-cover"
                          />
                          <span className="absolute left-2 top-2">
                            <GradeBadge grade={item.grade} variant="solid" />
                          </span>
                        </div>

                        <div>
                          {isCheapest && (
                            <Badge
                              tone="brand"
                              className="mb-1 text-[10px] font-bold uppercase tracking-wider"
                            >
                              {t("best_price")}
                            </Badge>
                          )}
                          <h3 className="type-heading-sm text-ink">{item.nama}</h3>
                          <p className="type-body-sm flex items-center gap-1 pt-0.5 text-muted">
                            <MapPin className="size-3.5 shrink-0 text-brand" />
                            {item.petani}, {item.lokasi}
                          </p>
                        </div>

                        <div className="border-t border-line pt-3">
                          <span className="type-label text-label block">
                            {t("offer_price")}
                          </span>
                          <span
                            className={cx(
                              "type-heading-md tnum block font-bold",
                              isCheapest ? "text-brand" : "text-ink",
                            )}
                          >
                            {formatRupiah(item.harga_per_kg)}
                            <span className="type-body-sm font-normal text-muted">
                              {" "}
                              / {item.satuan ?? "kg"}
                            </span>
                          </span>
                        </div>

                        <div className="border-t border-line pt-3">
                          <span className="type-label text-label block">
                            {t("stock_avail")}
                          </span>
                          {/* Stok tersedia, bukan berat batch asal: keduanya
                              berbeda begitu sebagian lot sudah terjual, dan
                              seluruh layar lain memakai `stok_kg`. */}
                          <span className="type-body-sm tnum font-bold text-ink">
                            {t("stock_kg", {
                              val: num(item.stok_kg ?? item.berat_kg, 0),
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t border-line">
                        <Link
                          href={`/pembeli/produk/${item.id}`}
                          onClick={() => setOpen(false)}
                          className="tap focus-ring inline-flex items-center justify-center gap-1.5 rounded-xs bg-brand px-3 py-2 type-body-sm font-bold text-on-brand hover:bg-brand-deep"
                        >
                          <span>{t("view_detail")}</span>
                          <ArrowRight className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onToggle(item.id)}
                          className="tap rounded-xs py-1.5 type-body-sm font-bold text-muted hover:text-ink"
                        >
                          {t("remove")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-line bg-sunken px-6 py-4">
              <span className="type-body-sm text-muted">
                {t("footer_note")}
              </span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={onClear}>
                  {t("clear_all")}
                </Button>
                <Button size="sm" onClick={() => setOpen(false)}>
                  {t("close")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
