"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { MapPin, MapPinOff, MapPinned, Navigation, Search, Star } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { EmptyState, GradeBadge, Input, Skeleton, cx } from "@/components/ui";
import { formatRupiah, num } from "@/lib/format";
import { jarakKm, keTitik, urutTerdekat, type Titik } from "@/lib/jarak";
import type { Grade, Listing } from "@/lib/types";
import { useTranslations } from "@/lib/i18n";

// Leaflet touches `window` at import time, so it must not run on the server.
const PetaMap = dynamic(() => import("@/components/peta-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

type Saringan = "A" | "B" | "dekat";

/** Ambang "dekat": satu rit pikap pulang-pergi dalam satu pagi. */
const RADIUS_DEKAT_KM = 25;

export default function PetaClient({ listings }: { listings: Listing[] }) {
  const t = useTranslations("peta");
  const tProd = useTranslations("produk");
  const [query, setQuery] = useState("");
  const [saringan, setSaringan] = useState<Saringan[]>([]);
  const [selected, setSelected] = useState<string>();
  const [userLoc, setUserLoc] = useState<Titik | null>(null);
  const [locSelesai, setLocSelesai] = useState(false);

  // Client-only capability check, SSR-safe (renders false on the server).
  const geoAvailable = useSyncExternalStore(
    () => () => {},
    () => "geolocation" in navigator,
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
      // Menolak izin lokasi adalah pilihan yang sah, bukan kegagalan yang perlu
      // diteriakkan lewat toast. Layar cukup menyebutkan jarak ini dihitung
      // dari mana.
      () => setLocSelesai(true),
    );
  }, [geoAvailable]);

  const shown = useMemo(() => {
    // Begitu posisi pembeli diketahui, jarak dihitung ulang dari sana; kalau
    // tidak, angka dari server (diukur dari pusat kota) yang dipakai, dan
    // keterangan di bawah daftar menyebutkan yang mana.
    let out = userLoc
      ? listings.map((l) => ({
          ...l,
          jarak_km: jarakKm(userLoc, keTitik(l.lat, l.lng)),
        }))
      : listings;

    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (l) =>
          l.nama.toLowerCase().includes(q) ||
          l.komoditas.toLowerCase().includes(q) ||
          l.lokasi.toLowerCase().includes(q) ||
          l.petani.toLowerCase().includes(q),
      );
    }

    const grade: Grade[] = saringan.filter((s) => s === "A" || s === "B") as Grade[];
    if (grade.length > 0) out = out.filter((l) => grade.includes(l.grade));

    // Lot tanpa koordinat tidak lolos saringan jarak: jaraknya tidak diketahui,
    // dan "tidak diketahui" bukan alasan untuk menyebutnya dekat.
    if (saringan.includes("dekat")) {
      out = out.filter((l) => l.jarak_km !== null && l.jarak_km <= RADIUS_DEKAT_KM);
    }

    return urutTerdekat(out, (l) => l.jarak_km);
  }, [listings, query, saringan, userLoc]);

  const tanpaKoordinat = shown.filter((l) => l.jarak_km === null).length;

  const toggle = (s: Saringan) =>
    setSaringan((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const CHIPS: { id: Saringan; label: string }[] = [
    { id: "A", label: t("chip_grade_a") },
    { id: "B", label: t("chip_grade_b") },
    { id: "dekat", label: t("chip_km") },
  ];

  return (
    <>
      <BackBar title={t("title")} href="/pembeli" parentLabel={tProd("parent_katalog")} />

      <main className="flex flex-1 flex-col py-3">
        <Container className="flex flex-1 flex-col">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t("search_aria")}
              placeholder={t("search_placeholder")}
              className="lg:w-80"
              prefix={<Search aria-hidden className="size-4" />}
            />

            <div className="flex flex-wrap items-center gap-2">
              {CHIPS.map((c) => {
                const aktif = saringan.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    aria-pressed={aktif}
                    className={cx(
                      "tap tap-press focus-ring type-body-sm flex min-h-11 items-center gap-1.5 rounded-full px-3.5 font-bold sm:min-h-9 sm:px-3",
                      aktif
                        ? "bg-brand-deep text-on-brand"
                        : "border border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
              {saringan.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSaringan([])}
                  className="type-body-sm inline-flex min-h-11 items-center px-1 font-bold text-muted underline hover:text-ink sm:min-h-9"
                >
                  {t("clear_filters", { count: saringan.length })}
                </button>
              )}
            </div>
          </div>

          {/* Dari mana jaraknya diukur — satu kalimat, selalu ada, karena angka
              km tanpa titik acuan tidak berarti apa-apa. */}
          {/* Dua baris di ponsel, satu baris dari `sm` ke atas. Sebagai satu
              baris yang membungkus, titik pemisahnya tertinggal menggantung di
              ujung baris pertama — "15 lot ·" — lalu keterangan jaraknya mulai
              di baris berikutnya tanpa apa pun di depannya. */}
          <p className="type-body-sm flex flex-col gap-y-0.5 pt-3 text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
            <span className="tnum font-bold text-ink">
              {t("count_shown", { count: shown.length })}
            </span>
            <span aria-hidden className="hidden sm:inline">
              ·
            </span>
            {isLocating ? (
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-brand" />
                {t("locating")}
              </span>
            ) : userLoc ? (
              <span className="flex items-center gap-1">
                <Navigation aria-hidden className="size-3.5 text-brand" />
                {t("distance_from_you")}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <MapPin aria-hidden className="size-3.5" />
                {t("distance_from_city")}
              </span>
            )}
          </p>

          <div className="mt-3 flex flex-1 flex-col lg:grid lg:grid-cols-[40fr_60fr] lg:items-start lg:gap-4">
            <ul className="order-2 flex flex-col gap-3 lg:order-1 lg:max-h-[70dvh] lg:overflow-y-auto lg:pe-1">
              {shown.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/pembeli/produk/${l.id}`}
                    onMouseEnter={() => setSelected(l.id)}
                    onFocus={() => setSelected(l.id)}
                    className={cx(
                      "tap tap-press focus-ring flex items-start justify-between gap-3 rounded-md border bg-surface p-4",
                      selected === l.id
                        ? "border-brand"
                        : "border-line hover:border-line-strong",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="type-heading-sm block text-ink">
                        {l.nama} · {l.berat_kg} kg
                      </span>
                      <span className="type-body-sm tnum block pt-1 text-muted">
                        {formatRupiah(l.harga_per_kg)}/kg ·{" "}
                        {l.jarak_km === null ? (
                          <span className="inline-flex items-center gap-1 font-bold text-grade-b">
                            <MapPinOff aria-hidden className="size-3" />
                            {t("no_coords")}
                          </span>
                        ) : (
                          t("km_away", { val: num(l.jarak_km) })
                        )}{" "}
                        · {l.petani}
                      </span>
                      <span className="type-body-sm flex items-center gap-1 pt-1.5 font-bold text-ink">
                        <Star
                          aria-hidden
                          className="size-3.5 fill-clay-500 text-clay-500"
                        />
                        <span className="tnum">{num(l.rating)}</span>
                      </span>
                    </span>
                    <GradeBadge grade={l.grade} />
                  </Link>
                </li>
              ))}
              {shown.length === 0 && (
                <li>
                  <EmptyState
                    icon={<MapPinned />}
                    title={t("empty_title")}
                    description={t("empty_desc")}
                  />
                </li>
              )}
            </ul>

            {/* Peta yang memegang layar, bukan pratinjau setinggi 208px di
                atas daftar sepanjang lima belas kartu.

                Layar ini bernama Peta dan satu-satunya hal yang tidak bisa
                dilakukan daftar — menunjukkan lot mana yang searah dengan lot
                lain — hanya ada di peta. Sebelumnya peta itu seperempat layar
                ponsel lalu tergulung hilang pada gulir pertama, jadi sisa
                kunjungan dihabiskan pada daftar yang sudah ada di tab Katalog.
                Sekarang ia menempel di bawah bilah atas dan daftarnya bergulir
                di belakangnya. */}
            <div className="order-1 sticky top-14 z-10 flex flex-col gap-2 bg-canvas pb-3 lg:order-2 lg:top-20 lg:pb-0">
              <div className="h-[46dvh] overflow-hidden rounded-md border border-line lg:h-[70dvh]">
                <PetaMap
                  listings={shown}
                  selectedId={selected}
                  onSelect={setSelected}
                  userLoc={userLoc}
                  labelSaya={t("you_are_here")}
                  labelTanpaJarak={t("no_coords")}
                  labelGugusAria={(count) => t("cluster_aria", { count })}
                  labelGugusTooltip={(count, harga) =>
                    t("cluster_tooltip", { count, harga: formatRupiah(harga) })
                  }
                />
              </div>
              {/* Selisih antara daftar dan peta disebutkan, bukan disembunyikan
                  dengan menaruh lot itu di sembarang titik. */}
              {tanpaKoordinat > 0 && (
                <p className="type-body-sm flex items-start gap-1.5 text-muted">
                  <MapPinOff aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                  {t("not_on_map", { count: tanpaKoordinat })}
                </p>
              )}
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
