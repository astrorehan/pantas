"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUpDown,
  Check,
  ChevronDown,
  Eye,
  MapPin,
  Mic,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { Button, EmptyState, GradeBadge, Input, CommodityIcon, Sheet, cx } from "@/components/ui";
import { Container } from "@/components/container";
import { formatRupiah, num } from "@/lib/format";
import { jarakKm, keTitik, urutTerdekat, type Titik } from "@/lib/jarak";
import { haptic } from "@/lib/haptic";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import type { Messages } from "@/lib/i18n/messages/id";
import type { Grade, Listing } from "@/lib/types";
import dynamic from "next/dynamic";

/**
 * Kedua laci baru muncul setelah pengguna bertindak — menandai listing untuk
 * dibandingkan, atau menekan kartu untuk intip cepat. Keduanya `null` sampai
 * saat itu, jadi menyertakannya di chunk awal hanya memperbesar first-load
 * tanpa menggambar apa pun. Pemuatan ditunda dengan pola yang sama yang sudah
 * dipakai `app-shell.tsx` untuk CoachmarkTour.
 *
 * Ini yang menurunkan /pembeli kembali ke bawah anggaran NFR-05 (260 KB gzip);
 * rute itu sebelumnya 261,6 KB, terberat di seluruh aplikasi.
 */
const CompareDrawer = dynamic(
  () => import("../compare-drawer").then((m) => m.CompareDrawer),
  { ssr: false },
);
const QuickViewDrawer = dynamic(
  () => import("../quick-view-drawer").then((m) => m.QuickViewDrawer),
  { ssr: false },
);

type SortOption = "default" | "terdekat" | "termurah" | "rating";

interface FilterState {
  grade: Grade | "ALL";
  kelompok: string; // "ALL" | "Tomat" | "Cabai" | "Timun" | "Wortel"
  readyStockOnly: boolean;
  grosirOnly: boolean;
  minRating: number; // 0 or 4.5 or 4.8
  maxHarga: number | null;
}

const INITIAL_FILTERS: FilterState = {
  grade: "ALL",
  kelompok: "ALL",
  readyStockOnly: false,
  grosirOnly: false,
  minRating: 0,
  maxHarga: null,
};

/**
 * Kelompok komoditas. `label` adalah kunci kamus, bukan teksnya sendiri —
 * empat dari lima entri dulu menyimpan teks Indonesia langsung di sini lalu
 * menyerahkannya ke `t()` sebagai kunci, jadi versi Inggrisnya merender
 * "katalog.Tomat".
 */
const KOMODITAS_TABS: {
  id: string;
  label: keyof Messages["katalog"];
  icon?: string;
}[] = [
  { id: "ALL", label: "tab_all" },
  { id: "Tomat", label: "group_tomat", icon: "tomato_merah" },
  { id: "Cabai", label: "group_cabai", icon: "chili_rawit" },
  { id: "Timun", label: "group_timun", icon: "cucumber_baby" },
  { id: "Wortel", label: "group_wortel", icon: "carrot" },
];

/** Pil filter aktif yang bisa dilepas dengan satu ketukan. */
function PilFilter({
  children,
  onClear,
}: {
  children: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="tap focus-ring inline-flex min-h-11 items-center gap-1 rounded-full bg-brand-tint px-3 py-0.5 text-xs font-bold text-brand-dark transition-colors hover:bg-brand/20 sm:min-h-7 sm:px-2.5"
    >
      {children}
      <X aria-hidden className="size-3 text-brand-dark/70" />
    </button>
  );
}

export default function Katalog({ listings }: { listings: Listing[] }) {
  const store = useStore();
  const t = useTranslations("katalog");
  const tc = useTranslations("common");

  const labelKelompok = (id: string) =>
    t(KOMODITAS_TABS.find((k) => k.id === id)?.label ?? "tab_all");

  const params = useSearchParams();
  const qUrl = params.get("q") ?? "";
  const [query, setQuery] = useState(qUrl);

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [quickViewListing, setQuickViewListing] = useState<Listing | null>(null);
  const [userLoc, setUserLoc] = useState<Titik | null>(null);
  const [locSelesai, setLocSelesai] = useState(false);
  const [listening, setListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- vendor API, no lib types
  const recRef = useRef<any>(null);

  const inquiryItems = Object.values(store.inquiry);
  const inquiryCount = inquiryItems.length;
  const inquiryTotalEst = inquiryItems.reduce(
    (acc, item) => acc + item.listing.harga_per_kg * item.qty,
    0,
  );

  const [qUrlTerakhir, setQUrlTerakhir] = useState(qUrl);
  if (qUrl !== qUrlTerakhir) {
    setQUrlTerakhir(qUrl);
    if (qUrl) {
      setQuery(qUrl);
      setFilters(INITIAL_FILTERS);
    }
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 4
        ? [...prev, id]
        : prev,
    );
  }

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.grade !== "ALL") count++;
    if (filters.kelompok !== "ALL") count++;
    if (filters.readyStockOnly) count++;
    if (filters.grosirOnly) count++;
    if (filters.minRating > 0) count++;
    if (filters.maxHarga !== null && filters.maxHarga > 0) count++;
    return count;
  }, [filters]);

  // Client-only capability checks, SSR-safe (render false on the server).
  const geoAvailable = useSyncExternalStore(
    () => () => {},
    () => "geolocation" in navigator,
    () => false,
  );
  const micAvailable = useSyncExternalStore(
    () => () => {},
    () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    () => false,
  );

  const isLocating = geoAvailable && !locSelesai;

  useEffect(() => {
    if (!geoAvailable) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocSelesai(true);
      },
      () => setLocSelesai(true),
    );
  }, [geoAvailable]);

  // Voice search via Web Speech API — matters for low-literacy rural users.
  useEffect(() => {
    if (!micAvailable) return;
    const SR =
      (window as unknown as Record<string, unknown>).SpeechRecognition ??
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new (SR as any)();
    rec.lang = "id-ID";
    rec.interimResults = false;
    rec.onresult = (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => {
      setQuery(e.results[0][0].transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => rec.abort();
  }, [micAvailable]);

  function toggleMic() {
    if (!recRef.current) return;
    if (listening) {
      recRef.current.stop();
    } else {
      setListening(true);
      recRef.current.start();
    }
  }

  // Modern Web API: App Badging API for PWA cart/inquiry notifications
  useEffect(() => {
    if ("setAppBadge" in navigator) {
      if (inquiryCount > 0) {
        navigator.setAppBadge(inquiryCount).catch(() => {});
      } else if ("clearAppBadge" in navigator) {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  }, [inquiryCount]);

  const shown = useMemo(() => {
    let out = listings;

    if (userLoc) {
      out = out.map((l) => ({
        ...l,
        jarak_km: jarakKm(userLoc, keTitik(l.lat, l.lng)),
      }));
    }

    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (l) =>
          l.nama.toLowerCase().includes(q) ||
          l.lokasi.toLowerCase().includes(q) ||
          l.petani.toLowerCase().includes(q),
      );
    }

    if (filters.grade !== "ALL") {
      out = out.filter((l) => l.grade === filters.grade);
    }

    if (filters.kelompok !== "ALL") {
      out = out.filter((l) =>
        l.nama.toLowerCase().includes(filters.kelompok.toLowerCase()) ||
        l.komoditas.toLowerCase().includes(filters.kelompok.toLowerCase())
      );
    }

    if (filters.readyStockOnly) {
      out = out.filter((l) => (l.stok_kg ?? l.berat_kg) > 0);
    }

    if (filters.grosirOnly) {
      out = out.filter((l) => (l.stok_kg ?? l.berat_kg) >= 100);
    }

    if (filters.minRating > 0) {
      out = out.filter((l) => l.rating >= filters.minRating);
    }

    if (filters.maxHarga !== null && filters.maxHarga > 0) {
      out = out.filter((l) => l.harga_per_kg <= (filters.maxHarga as number));
    }

    if (sortBy === "terdekat") {
      // Lot tanpa koordinat turun ke bawah, bukan naik ke puncak: dulu jaraknya
      // ditulis 0 dan ia jadi "yang terdekat" di layar tiap pembeli.
      out = urutTerdekat(out, (l) => l.jarak_km);
    } else if (sortBy === "termurah") {
      out = [...out].sort((a, b) => a.harga_per_kg - b.harga_per_kg);
    } else if (sortBy === "rating") {
      out = [...out].sort((a, b) => b.rating - a.rating);
    }

    return out;
  }, [listings, query, filters, sortBy, userLoc]);

  return (
    <main id="konten" className="flex-1 py-4">
      <Container>
        {/* Row 1: Search Bar & Primary Action Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            aria-label={t("search_placeholder")}
            className="flex-1"
            prefix={<Search aria-hidden className="size-4" />}
            suffix={
              micAvailable ? (
                <button
                  type="button"
                  onClick={toggleMic}
                  aria-label={
                    listening ? "Stop listening" : "Voice search"
                  }
                  aria-pressed={listening}
                  className={cx(
                    "tap focus-ring -me-2 grid size-11 place-items-center rounded-sm sm:size-9",
                    listening
                      ? "animate-pulse bg-danger-tint text-danger"
                      : "text-brand hover:bg-brand-tint",
                  )}
                >
                  <Mic aria-hidden className="size-4" />
                </button>
              ) : undefined
            }
          />

          <div className="flex items-center gap-2">
            {/* Filter Drawer Trigger Button */}
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={filterOpen}
              className={cx(
                "tap focus-ring flex h-11 items-center gap-2 rounded-md px-3.5 text-xs font-bold transition-all border shadow-xs sm:h-10",
                activeFilterCount > 0
                  ? "bg-brand text-canvas border-brand"
                  : "bg-surface text-ink border-line hover:border-line-strong hover:bg-sunken"

              )}
            >
              <SlidersHorizontal className="size-4" />
              <span>{tc("filter")}</span>
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-canvas text-brand text-xs font-black shadow-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Custom Sort Menu */}
            <div className="relative">
              <button
                id="sort-dropdown-button"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={sortDropdownOpen}
                aria-controls="sort-dropdown-menu"
                onClick={() => setSortDropdownOpen((prev) => !prev)}
                className="tap focus-ring flex h-11 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-xs font-semibold text-ink shadow-xs hover:border-line-strong sm:h-10"
              >
                <ArrowUpDown className="size-3.5 text-muted" />
                <span>
                  {sortBy === "terdekat"
                    ? t("sort_nearest")
                    : sortBy === "termurah"
                    ? t("sort_cheapest")
                    : sortBy === "rating"
                    ? t("sort_rating")
                    : t("sort_default")}
                </span>
                <ChevronDown className="size-3.5 text-muted" />
              </button>

              {sortDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSortDropdownOpen(false)}
                  />
                  <div
                    id="sort-dropdown-menu"
                    role="listbox"
                    aria-labelledby="sort-dropdown-button"
                    className="absolute right-0 top-11 z-20 w-44 rounded-lg border border-line bg-surface p-1 shadow-md animate-in fade-in zoom-in-95 duration-150"
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={sortBy === "default"}
                      onClick={() => { setSortBy("default"); setSortDropdownOpen(false); }}
                      className={cx(
                        "tap focus-ring flex min-h-11 w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:min-h-9",
                        sortBy === "default" ? "bg-brand-tint text-brand-dark" : "text-ink hover:bg-sunken"

                      )}
                    >
                      <span>{t("sort_default")}</span>
                      {sortBy === "default" && <Check className="size-3.5 text-brand" />}
                    </button>
                    <button
                      type="button"
                      role="option"
                      aria-selected={sortBy === "terdekat"}
                      onClick={() => { setSortBy("terdekat"); setSortDropdownOpen(false); }}
                      className={cx(
                        "tap focus-ring flex min-h-11 w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:min-h-9",
                        sortBy === "terdekat" ? "bg-brand-tint text-brand-dark" : "text-ink hover:bg-sunken"

                      )}
                    >
                      <span>{t("sort_nearest")}</span>
                      {sortBy === "terdekat" && <Check className="size-3.5 text-brand" />}
                    </button>
                    <button
                      type="button"
                      role="option"
                      aria-selected={sortBy === "termurah"}
                      onClick={() => { setSortBy("termurah"); setSortDropdownOpen(false); }}
                      className={cx(
                        "tap focus-ring flex min-h-11 w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:min-h-9",
                        sortBy === "termurah" ? "bg-brand-tint text-brand-dark" : "text-ink hover:bg-sunken"

                      )}
                    >
                      <span>{t("sort_cheapest")}</span>
                      {sortBy === "termurah" && <Check className="size-3.5 text-brand" />}
                    </button>
                    <button
                      type="button"
                      role="option"
                      aria-selected={sortBy === "rating"}
                      onClick={() => { setSortBy("rating"); setSortDropdownOpen(false); }}
                      className={cx(
                        "tap focus-ring flex min-h-11 w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold transition-colors sm:min-h-9",
                        sortBy === "rating" ? "bg-brand-tint text-brand-dark" : "text-ink hover:bg-sunken"

                      )}
                    >
                      <span>{t("sort_rating")}</span>
                      {sortBy === "rating" && <Check className="size-3.5 text-brand" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {isLocating && (
              <span className="type-body-sm flex shrink-0 items-center gap-1.5 text-muted">
                <span
                  aria-hidden
                  className="size-1.5 animate-pulse rounded-full bg-brand"
                />
                {tc("detecting_location")}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Commodity Category Tabs (Ultra-Clean Scrollable Bar) */}
        <div
          role="tablist"
          aria-label={t("filter_category")}
          className="scroll-x flex gap-2 pt-3 pb-1"
        >
          {KOMODITAS_TABS.map((tab) => {
            const active = filters.kelompok === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    kelompok: active ? "ALL" : tab.id,
                  }))
                }
                className={cx(
                  "tap focus-ring flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all sm:min-h-8 sm:px-3",
                  active
                    ? "bg-brand-dark text-canvas shadow-xs"
                    : "border border-line bg-surface text-muted hover:border-line-strong hover:text-ink"
                )}
              >
                {tab.icon && (
                  <CommodityIcon
                    komoditas={tab.icon}
                    className={cx("size-3.5 shrink-0", active ? "text-canvas" : "text-brand")}
                  />
                )}
                  {t(tab.label)}
                </button>
              );
            })}
        </div>

        {/* Row 3: Active Removable Filter Pills (Rendered only when activeFilterCount > 0) */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="type-body-sm font-semibold text-muted mr-1">
              {t("filter_active")}
            </span>

            {filters.kelompok !== "ALL" && (
              <PilFilter
                onClear={() => setFilters((prev) => ({ ...prev, kelompok: "ALL" }))}
              >
                {t("filter_category")} {labelKelompok(filters.kelompok)}
              </PilFilter>
            )}

            {filters.grade !== "ALL" && (
              <PilFilter
                onClear={() => setFilters((prev) => ({ ...prev, grade: "ALL" }))}
              >
                {t("filter_grade")} {filters.grade}
              </PilFilter>
            )}

            {filters.readyStockOnly && (
              <PilFilter
                onClear={() =>
                  setFilters((prev) => ({ ...prev, readyStockOnly: false }))
                }
              >
                {t("filter_ready_stock")}
              </PilFilter>
            )}

            {filters.grosirOnly && (
              <PilFilter
                onClear={() => setFilters((prev) => ({ ...prev, grosirOnly: false }))}
              >
                {t("filter_grosir")}
              </PilFilter>
            )}

            {filters.minRating > 0 && (
              <PilFilter
                onClear={() => setFilters((prev) => ({ ...prev, minRating: 0 }))}
              >
                {t("filter_rating", { val: num(filters.minRating) })}
              </PilFilter>
            )}

            {filters.maxHarga !== null && (
              <PilFilter
                onClear={() => setFilters((prev) => ({ ...prev, maxHarga: null }))}
              >
                {t("filter_max_price", { val: formatRupiah(filters.maxHarga) })}
              </PilFilter>
            )}

            <button
              type="button"
              onClick={() => setFilters(INITIAL_FILTERS)}
              className="type-body-sm ms-1 inline-flex min-h-11 items-center px-1 font-bold text-muted underline hover:text-ink sm:min-h-7"
            >
              {t("reset_all")}
            </button>
          </div>
        )}

        {/* Results Count Summary */}
        <p className="type-body-sm tnum pt-2 text-muted">
          {t("showing_results", { shown: shown.length, total: listings.length })}
        </p>

        {/* Results Grid */}
        {shown.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Search />}
            title={t("empty_title")}
            description={t("empty_desc")}
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setFilters(INITIAL_FILTERS);
                  setSortBy("default");
                  setQuery("");
                }}
              >
                {t("reset_all_filters")}
              </Button>
            }
          />
        ) : (
          <ul role="list" className="grid gap-3 pt-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((l, i) => {
              const added = l.id in store.inquiry;
              const isCompared = compareIds.includes(l.id);
              const stokKg = l.stok_kg ?? l.berat_kg;
              return (
                <li
                  key={l.id}
                  className="group rise relative flex flex-col overflow-hidden rounded-lg bg-surface shadow-e2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-e4 container-card cv-auto"
                >
                  <div className="relative aspect-16/9 overflow-hidden bg-muted/10">
                    <Link
                      href={`/pembeli/produk/${l.id}`}
                      className="tap focus-ring relative block size-full"
                    >
                      <Image
                        src={l.gambar}
                        alt={l.nama}
                        fill
                        sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-103"
                        priority={i < 4}
                        loading={i < 4 ? "eager" : "lazy"}
                      />
                    </Link>
                    <span className="absolute left-2.5 top-2.5 z-10 pointer-events-none">
                      {/* `solid` karena ia duduk di atas foto: badan bertint
                          varian bawaan mengandalkan permukaan kartu di
                          belakangnya, dan di atas gambar ia terbaca pucat. */}
                      <GradeBadge grade={l.grade} variant="solid" />
                    </span>
                  </div>

                  <Link
                    href={`/pembeli/produk/${l.id}`}
                    className="tap focus-ring block p-3 sm:p-3.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <CommodityIcon
                        komoditas={l.komoditas}
                        className="size-4 shrink-0 text-brand"
                      />
                      <p className="type-body-md truncate font-bold text-ink">{l.nama}</p>
                    </div>

                    <p className="type-body-sm flex items-center gap-1.5 pt-1.5 text-muted">
                      <MapPin aria-hidden className="size-3.5 shrink-0 text-muted/80" />
                      <span className="truncate">
                        <strong className="font-semibold text-ink/90">{l.petani}</strong> · {l.lokasi}
                      </span>
                    </p>

                    {/* Reputasi turun jadi teks biasa. Sebagai pil bertint ia
                        berebut perhatian dengan lencana grade di foto dan pil
                        stok di baris harga — tiga pil berwarna per kartu, lima
                        belas kartu per layar. Angkanya sama, bobotnya yang
                        dikembalikan ke tempatnya. */}
                    <p className="type-body-sm flex items-center gap-1.5 pt-1.5 text-muted">
                      <Star aria-hidden className="size-3.5 shrink-0 fill-grade-b text-grade-b" />
                      <span className="tnum font-bold text-ink/90">{num(l.rating, 1)}</span>
                      <span aria-hidden>·</span>
                      <span className="truncate">
                        {l.transaksi} {t("completed_tx")}
                      </span>
                    </p>

                    <div className="mt-2.5 flex items-baseline justify-between gap-2 border-t border-line/50 pt-2.5">
                      <div className="min-w-0">
                        <span className="type-heading-sm tnum font-bold text-brand">
                          {formatRupiah(l.harga_per_kg)}
                        </span>
                        <span className="type-body-sm text-muted">
                          /{l.satuan ?? "kg"}
                        </span>
                      </div>
                      {stokKg > 0 && (
                        <span className="type-body-sm tnum shrink-0 text-muted">
                          {t("stock_label", { val: num(stokKg) })}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Dua aksi sekunder turun dari foto ke kaki kartu.
                      Sebelumnya keduanya melayang di atas gambar: "Bandingkan"
                      menutupi sudut kanan atas setinggi 24px, dan "Intip
                      Detail" hanya muncul pada `group-hover` — artinya di
                      ponsel, tempat tidak ada kursor untuk menggantung, fitur
                      itu tidak pernah bisa dibuka sama sekali. */}
                  <div className="mt-auto flex items-center gap-2 px-3 pb-3 pt-1 sm:px-3.5 sm:pb-3.5">
                    <Button
                      size="sm"
                      variant={added ? "primary" : "outline"}
                      className={cx(
                        "min-w-0 flex-1 rounded-md font-semibold transition-all",
                        added
                          ? "bg-brand text-canvas border-brand shadow-xs"
                          : "border-brand/30 bg-brand-tint/50 text-brand-dark hover:bg-brand hover:text-canvas hover:border-brand"
                      )}
                      aria-label={added ? `${t("btn_inquiry_added")}: ${l.nama}` : `${t("btn_inquiry_add")}: ${l.nama}`}
                      onClick={() => {
                        haptic.selection();
                        store.setInquiryQty(
                          l,
                          added ? 0 : Math.min(stokKg, 50),
                        );
                      }}
                    >
                      {added ? (
                        <>
                          <Check aria-hidden className="size-4" />
                          {t("btn_inquiry_added")}
                        </>
                      ) : (
                        <>
                          <Plus aria-hidden className="size-4" />
                          {t("btn_inquiry_add")}
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setQuickViewListing(l)}
                      title={t("btn_quick_view")}
                      aria-label={t("btn_quick_view_aria", { name: l.nama })}
                      className="tap tap-press focus-ring grid size-11 shrink-0 place-items-center rounded-md border border-line text-muted hover:border-line-strong hover:text-ink sm:size-9"
                    >
                      <Eye aria-hidden className="size-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCompare(l.id)}
                      aria-pressed={isCompared}
                      title={isCompared ? t("btn_compare_remove") : t("btn_compare_add")}
                      aria-label={
                        isCompared
                          ? t("btn_compare_remove_aria", { name: l.nama })
                          : t("btn_compare_add_aria", { name: l.nama })
                      }
                      className={cx(
                        "tap tap-press focus-ring grid size-11 shrink-0 place-items-center rounded-md border transition-all sm:size-9",
                        isCompared
                          ? "border-brand bg-brand text-canvas"
                          : "border-line text-muted hover:border-line-strong hover:text-ink",
                      )}
                    >
                      <ArrowLeftRight aria-hidden className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Floating Sticky Inquiry Bar */}
        {inquiryCount > 0 && (
          <div className="pointer-events-none sticky bottom-4 z-20 flex justify-center pt-6">
            <div className="pointer-events-auto flex items-center gap-3.5 rounded-full bg-stone-950/95 px-4 py-2 text-canvas shadow-2xl backdrop-blur-md border border-stone-800 animate-in fade-in slide-in-from-bottom-4 duration-300">

              <div className="flex items-center gap-2.5 pl-1">
                <div className="flex size-7 items-center justify-center rounded-full bg-brand font-bold text-xs text-canvas shadow-xs">
                  {inquiryCount}
                </div>
                <div className="flex flex-col">
                  <span className="type-body-sm font-bold leading-tight">{t("inquiry_selected")}</span>
                  <span className="type-body-sm text-stone-400">
                    {t("inquiry_est_total", { val: formatRupiah(inquiryTotalEst) })}
                  </span>
                </div>
              </div>
              <div className="h-6 w-px bg-stone-800" />
              <Link
                href="/pembeli/inquiry"
                className="tap tap-press focus-ring type-body-sm flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 font-bold text-canvas transition-colors hover:bg-brand-deep"
              >
                {t("inquiry_view_submit")}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Multi-Criteria Filter Sheet Drawer */}
        <Sheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          title={t("filter_drawer_title")}
          description={t("filter_drawer_desc")}
          side="start"
          footer={
            <div className="flex w-full items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setFilters(INITIAL_FILTERS)}
                className="type-body-sm flex items-center gap-1 font-semibold text-muted hover:text-ink"
              >
                <RotateCcw className="size-3.5" />
                {t("reset_all")}
              </button>
              <Button
                variant="primary"
                onClick={() => setFilterOpen(false)}
                className="font-bold"
              >
                {t("filter_drawer_apply", { val: shown.length })}
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-6 py-2">
            {/* Grade Kualitas */}
            <div className="flex flex-col gap-2.5">
              <span className="type-body-sm font-bold uppercase tracking-wider text-muted">{t("filter_drawer_grade_title")}</span>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, grade: "ALL" }))}
                  className={cx(
                    "tap focus-ring min-h-11 rounded-sm px-3.5 text-xs font-bold transition-all sm:min-h-9",
                    filters.grade === "ALL"
                      ? "bg-brand-deep text-canvas shadow-xs font-bold opacity-100"
                      : "border border-line bg-surface text-muted hover:border-line-strong hover:text-ink opacity-70"
                  )}
                >
                  {t("filter_drawer_grade_all")}
                </button>

                {(["A", "B", "C"] as const).map((g) => {
                  const active = filters.grade === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, grade: active ? "ALL" : g }))}
                      className={cx(
                        "tap focus-ring rounded-sm transition-all inline-flex items-center",
                        active
                          ? "ring-2 ring-brand ring-offset-2 ring-offset-surface scale-105 opacity-100 shadow-xs"
                          : "opacity-50 hover:opacity-100"
                      )}
                    >
                      <GradeBadge grade={g} size="lg" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kelompok Komoditas */}
            <div className="flex flex-col gap-2.5">
              <span className="type-body-sm font-bold uppercase tracking-wider text-muted">{t("filter_drawer_commodity_title")}</span>

              <div className="flex flex-wrap gap-2">
                {KOMODITAS_TABS.map((tab) => {
                  const active = filters.kelompok === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, kelompok: active ? "ALL" : tab.id }))}
                      className={cx(
                        "tap focus-ring type-body-sm flex min-h-11 items-center gap-1.5 rounded-full px-3.5 font-bold transition-all sm:min-h-9",
                        active
                          ? "bg-brand-deep text-canvas shadow-xs"
                          : "border border-line bg-surface text-muted hover:border-line-strong hover:text-ink"
                      )}
                    >
                      {tab.icon && (
                        <CommodityIcon
                          komoditas={tab.icon}
                          className={cx("size-3.5", active ? "text-canvas" : "text-brand")}
                        />
                      )}
                      {t(tab.label)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Batas Maksimal Harga */}
            <div className="flex flex-col gap-2.5">
              <span className="type-body-sm font-bold uppercase tracking-wider text-muted">{t("filter_drawer_price_title")}</span>

              <div className="flex flex-wrap gap-2">
                {[30000, 50000, 100000].map((hp) => {
                  const active = filters.maxHarga === hp;
                  return (
                    <button
                      key={hp}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          maxHarga: active ? null : hp,
                        }))
                      }
                      className={cx(
                        "tap focus-ring type-body-sm flex min-h-11 items-center gap-1.5 rounded-full px-3.5 font-bold transition-all sm:min-h-9",
                        active
                          ? "bg-brand-deep text-canvas shadow-xs"
                          : "border border-line bg-surface text-muted hover:border-line-strong hover:text-ink"
                      )}
                    >
                      &le; {formatRupiah(hp)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ketersediaan Stok */}
            <div className="flex flex-col gap-2.5">
              <span className="type-body-sm font-bold uppercase tracking-wider text-muted">{t("filter_drawer_stock_title")}</span>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      readyStockOnly: !prev.readyStockOnly,
                    }))
                  }
                  className={cx(
                    "tap focus-ring type-body-sm flex min-h-11 items-center gap-1.5 rounded-full px-3.5 font-bold transition-all sm:min-h-9",
                    filters.readyStockOnly
                      ? "bg-brand-deep text-canvas shadow-xs"
                      : "border border-line bg-surface text-muted hover:border-line-strong hover:text-ink"
                  )}
                >
                  {filters.readyStockOnly && <Check className="size-3.5" />}
                  {t("filter_drawer_stock_ready")}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      grosirOnly: !prev.grosirOnly,
                    }))
                  }
                  className={cx(
                    "tap focus-ring type-body-sm flex min-h-11 items-center gap-1.5 rounded-full px-3.5 font-bold transition-all sm:min-h-9",
                    filters.grosirOnly
                      ? "bg-brand-deep text-canvas shadow-xs"
                      : "border border-line bg-surface text-muted hover:border-line-strong hover:text-ink"
                  )}
                >
                  {filters.grosirOnly && <Check className="size-3.5" />}
                  {t("filter_drawer_stock_grosir")}
                </button>
              </div>
            </div>

            {/* Reputasi Petani */}
            <div className="flex flex-col gap-2.5">
              <span className="type-body-sm font-bold uppercase tracking-wider text-muted">{t("filter_drawer_rating_title")}</span>

              <div className="flex flex-wrap gap-2">
                {[0, 4.5, 4.8].map((rt) => {
                  const active = filters.minRating === rt;
                  return (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, minRating: active ? 0 : rt }))}
                      className={cx(
                        "tap focus-ring type-body-sm flex min-h-11 items-center gap-1.5 rounded-full px-3.5 font-bold transition-all sm:min-h-9",
                        active
                          ? "bg-brand-deep text-canvas shadow-xs"
                          : "border border-line bg-surface text-muted hover:border-line-strong hover:text-ink"
                      )}
                    >
                      {rt === 0 ? (
                        t("filter_drawer_rating_all")
                      ) : (
                        <>
                          <Star className="size-3.5 fill-grade-b text-grade-b" />

                          ★ {rt}+
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </Sheet>

        {/* Mode Bandingkan Listing Drawer (F-34 / F-77) */}
        <CompareDrawer
          selectedIds={compareIds}
          listings={listings}
          onToggle={toggleCompare}
          onClear={() => setCompareIds([])}
        />

        {/* Quick View Drawer (P1 UX) */}
        <QuickViewDrawer
          listing={quickViewListing}
          onClose={() => setQuickViewListing(null)}
        />
      </Container>
    </main>
  );
}




