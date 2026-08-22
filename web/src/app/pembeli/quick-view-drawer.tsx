"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, MapPin, MapPinOff, Plus, Share2, ShieldCheck, Star } from "lucide-react";
import { Button, CommodityIcon, GradeBadge, Sheet, cx } from "@/components/ui";
import { formatRupiah, num, persen } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import { URUT_GRADE } from "@/lib/harga";
import { toast } from "sonner";
import type { Listing } from "@/lib/types";

interface QuickViewDrawerProps {
  listing: Listing | null;
  onClose: () => void;
}

/** Rating yang membuat seorang petani disebut terkemuka di layar ini. */
const AMBANG_TERKEMUKA = 4.8;

export function QuickViewDrawer({ listing, onClose }: QuickViewDrawerProps) {
  const store = useStore();
  const t = useTranslations("quick_view");

  if (!listing) return null;

  const added = listing.id in store.inquiry;
  const stokKg = listing.stok_kg ?? listing.berat_kg;
  // Grade diurutkan A→REJECT dan yang nol dibuang: `Object.entries` mengikuti
  // urutan penulisan JSON, jadi peti yang sama bisa tampil "C, A, B" di satu
  // listing dan "A, B, C" di listing berikutnya.
  const komposisi = URUT_GRADE.flatMap((g) => {
    const porsi = listing.komposisi?.[g] ?? 0;
    return porsi > 0 ? [{ grade: g, porsi }] : [];
  });

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/pembeli/produk/${listing.id}`;
    const nav = window.navigator as Navigator & {
      share?: (data?: ShareData) => Promise<void>;
      clipboard?: Clipboard;
    };
    if (nav.share) {
      try {
        await nav.share({
          title: `${listing.nama} - PANTAS`,
          text: `${listing.nama} (Grade ${listing.grade}) dari ${listing.petani} di PANTAS`,
          url,
        });
      } catch {
        /* share sheet closed by user */
      }
    } else if (nav.clipboard) {
      await nav.clipboard.writeText(url);
      toast.success("Tautan produk berhasil disalin!");
    }
  };

  return (
    <Sheet
      open={Boolean(listing)}
      onClose={onClose}
      title={listing.nama}
      side="end"
    >
      <div className="flex flex-col gap-5">
        <div className="relative aspect-16/9 overflow-hidden rounded-lg border border-line bg-muted/10">
          <Image
            src={listing.gambar}
            alt={listing.nama}
            fill
            sizes="(min-width: 640px) 28rem, 100vw"
            className="object-cover"
          />
          <div className="absolute left-3 top-3">
            <GradeBadge grade={listing.grade} variant="solid" />
          </div>
          {stokKg > 0 && (
            <div className="absolute right-3 top-3 rounded-full bg-stone-950/80 px-3 py-1 text-xs font-semibold text-canvas backdrop-blur-md">
              {t("stock", { val: num(stokKg) })}
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-muted">
              <CommodityIcon
                komoditas={listing.komoditas}
                className="size-4 shrink-0 text-brand"
              />
              <span className="type-body-sm font-medium capitalize">
                {listing.komoditas}
              </span>
            </div>
            <h3 className="type-heading-md pt-0.5 font-bold text-ink">
              {listing.nama}
            </h3>
          </div>
          <div className="text-end">
            <span className="type-heading-md tnum block font-extrabold text-brand">
              {formatRupiah(listing.harga_per_kg)}
            </span>
            <span className="type-body-sm text-muted">
              {t("per_unit", { unit: listing.satuan ?? "kg" })}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-line/60 bg-surface p-3.5">
          <div className="flex items-center justify-between">
            <span className="type-body-sm font-bold uppercase tracking-wider text-muted">
              {t("farmer_title")}
            </span>
            {listing.rating >= AMBANG_TERKEMUKA && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-grade-b">
                <Star aria-hidden className="size-3.5 fill-grade-b text-grade-b" />
                {t("top_farmer")}
              </span>
            )}
          </div>
          <p className="type-body-md font-bold text-ink">{listing.petani}</p>
          <p className="type-body-sm flex items-center gap-1 text-muted">
            {listing.jarak_km === null ? (
              <>
                <MapPinOff aria-hidden className="size-3.5 shrink-0" />
                {listing.lokasi} · {t("no_coords")}
              </>
            ) : (
              <>
                <MapPin aria-hidden className="size-3.5 shrink-0" />
                {listing.lokasi} ({num(listing.jarak_km)} km)
              </>
            )}
          </p>
          <div className="flex items-center gap-3 border-t border-line/40 pt-1 text-xs text-muted">
            <span>
              {t("rating_label")}{" "}
              <strong className="tnum font-semibold text-ink">
                ★ {num(listing.rating)}
              </strong>
            </span>
            <span aria-hidden>•</span>
            <span>
              {t("tx_label")}{" "}
              <strong className="tnum font-semibold text-ink">
                {listing.transaksi}
              </strong>
            </span>
          </div>
        </div>

        {komposisi.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="type-body-sm font-bold uppercase tracking-wider text-muted">
              {t("composition_title")}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {komposisi.map(({ grade, porsi }) => (
                <div
                  key={grade}
                  className="rounded-md border border-line bg-surface p-2 text-center"
                >
                  <span className="type-body-sm block font-bold text-muted">
                    {t("grade_short", { grade })}
                  </span>
                  <span className="type-body-md tnum font-extrabold text-ink">
                    {persen(porsi)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {listing.catatan_ai && (
          <div className="rounded-lg border border-brand/20 bg-brand-tint/40 p-3">
            <span className="type-body-sm block font-bold text-brand-dark">
              {t("ai_note_title")}
            </span>
            <p className="type-body-sm pt-1 italic text-ink">
              &ldquo;{listing.catatan_ai}&rdquo;
            </p>
          </div>
        )}

        {listing.hash_audit && (
          <div className="flex items-center gap-2 rounded-md border border-line bg-surface p-2.5 text-xs text-muted">
            <ShieldCheck aria-hidden className="size-4 shrink-0 text-brand" />
            <span className="truncate font-mono">
              {t("audit_hash")}: {listing.hash_audit}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            size="lg"
            block
            variant={added ? "primary" : "outline"}
            className={cx(
              "text-base font-bold transition-all",
              added
                ? "border-brand bg-brand text-canvas"
                : "border-brand bg-brand-tint/60 text-brand-dark hover:border-brand hover:bg-brand hover:text-canvas",
            )}
            onClick={() =>
              store.setInquiryQty(listing, added ? 0 : Math.min(stokKg, 50))
            }
          >
            {added ? (
              <>
                <Check aria-hidden className="size-5" />
                {t("btn_added")}
              </>
            ) : (
              <>
                <Plus aria-hidden className="size-5" />
                {t("btn_add")}
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Link
              href={`/pembeli/produk/${listing.id}`}
              onClick={onClose}
              className="tap focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line bg-surface py-2.5 text-sm font-semibold text-ink hover:border-line-strong hover:bg-sunken"
            >
              {t("btn_full_detail")}
              <ArrowUpRight aria-hidden className="size-4" />
            </Link>

            <button
              type="button"
              onClick={handleShare}
              aria-label="Bagikan produk"
              className="tap focus-ring grid size-11 shrink-0 place-items-center rounded-md border border-line bg-surface text-muted hover:border-line-strong hover:text-ink"
            >
              <Share2 aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
