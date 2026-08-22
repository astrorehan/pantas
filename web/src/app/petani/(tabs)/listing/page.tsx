"use client";

/* eslint-disable @next/next/no-img-element -- published photos can be data URLs */

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Search,
  Edit3,
  Pause,
  Play,
  CheckCircle2,
  Trash2,
  ScanLine,
  ImageOff,
} from "lucide-react";
import { BrandBar } from "@/components/chrome";
import { SubNav } from "@/components/sub-nav";
import { JUAL_TABS } from "@/components/nav-config";
import { Container } from "@/components/container";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  GradeBadge,
  GradeBar,
  Input,
  Badge,
  Dialog,
  Select,
  Skeleton,
  cx,
} from "@/components/ui";
import { FilterSheet } from "@/components/ui/filter-sheet";
import { Menu } from "@/components/ui/menu";
import { RingkasBaris } from "@/components/ui/ringkas-baris";
import type { MenuAction } from "@/components/ui/menu";
import { URUT_GRADE } from "@/lib/data";
import { formatAngka, formatRupiah } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import type { Grade, Listing } from "@/lib/types";

type StatusLot = "tayang" | "dijeda" | "terjual";

/** Kerangka saat `useSearchParams` menunda render di batas Suspense. */
function MemuatListing() {
  const t = useTranslations("listing");
  return (
    <>
      <BrandBar title={t("title")} />
      <SubNav items={JUAL_TABS} label="Bagian Jual" layout="inline" />
      <main className="flex-1 py-4">
        <Container className="flex flex-col gap-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </Container>
      </main>
    </>
  );
}

export default function ListingSayaPage() {
  return (
    <Suspense fallback={<MemuatListing />}>
      <ListingSaya />
    </Suspense>
  );
}

/**
 * Daftar lot petani.
 *
 * Layar ini sempat membuka dengan empat kartu metrik bergradien — emerald,
 * biru, kuning, ungu — di atas spanduk "⚡ Tindak Lanjut Mendesak", di atas
 * dua baris chip saring, sebelum satu pun barang terlihat. Empat dari lima
 * angka itu tidak mengubah apa pun yang petani lakukan di layar ini, dan yang
 * satu-satunya berguna — nilai lot yang sedang tayang — tenggelam di antaranya.
 * Spanduknya sendiri mengulang peringatan yang sudah disampaikan kartu Langkah
 * Berikutnya di Beranda: dua alarm untuk satu kejadian.
 *
 * Sekarang: satu baris ringkasan, satu kolom pencarian, satu baris status.
 * Sisanya barang.
 */
function ListingSaya() {
  const t = useTranslations("listing");
  const tc = useTranslations("common");
  const store = useStore();
  const params = useSearchParams();
  const fokus = params.get("fokus");
  const fokusRef = useRef<HTMLLIElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | StatusLot>("semua");
  const [gradeFilter, setGradeFilter] = useState<"semua" | Grade>("semua");

  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [editHarga, setEditHarga] = useState<number>(0);
  const [editBerat, setEditBerat] = useState<number>(0);

  const [hapusTarget, setHapusTarget] = useState<Listing | null>(null);

  useEffect(() => {
    if (!fokus) return;
    fokusRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [fokus, store.myListings.length]);

  /**
   * Satu angka, dan alasannya jelas: inilah yang petani tawar-menawarkan.
   * Omzet pesanan selesai pindah ke `/petani/dampak`, tempat angka riwayat
   * memang tinggal; jumlah tawaran sudah punya badge di tab Penawaran.
   */
  const lotTayang = store.myListings.filter(
    (l) => (l.status ?? "tayang") === "tayang",
  );
  const nilaiTayang = lotTayang.reduce(
    (acc, l) => acc + l.harga_per_kg * l.berat_kg,
    0,
  );
  const stokTayang = lotTayang.reduce((acc, l) => acc + l.berat_kg, 0);

  const filteredListings = store.myListings.filter((l) => {
    const status = (l.status ?? "tayang") as StatusLot;
    if (statusFilter !== "semua" && status !== statusFilter) return false;
    if (gradeFilter !== "semua" && l.grade !== gradeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.nama.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.komoditas.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function bukaEdit(l: Listing) {
    setEditListing(l);
    setEditHarga(l.harga_per_kg);
    setEditBerat(l.berat_kg);
  }

  function simpanEdit() {
    if (!editListing) return;
    store.updateListing(editListing.id, {
      harga_per_kg: Number(editHarga),
      berat_kg: Number(editBerat),
      stok_kg: Number(editBerat),
    });
    setEditListing(null);
  }

  function hapusKonfirmasi() {
    if (!hapusTarget) return;
    store.deleteListing(hapusTarget.id);
    setHapusTarget(null);
  }

  const STATUS: { value: "semua" | StatusLot; label: string }[] = [
    { value: "semua", label: t("filter_status_all") },
    { value: "tayang", label: t("filter_status_tayang") },
    { value: "dijeda", label: t("filter_status_dijeda") },
    { value: "terjual", label: t("filter_status_terjual") },
  ];

  return (
    <>
      <BrandBar title={t("title")} />
      <SubNav items={JUAL_TABS} label="Bagian Jual" layout="inline" />

      <main className="flex-1 py-4">
        <Container className="flex flex-col gap-4">
          {/* --- Ringkasan ------------------------------------------------ */}
          <RingkasBaris
            items={[
              { nilai: formatRupiah(nilaiTayang), label: t("summary_lot_value") },
              { nilai: `${formatAngka(stokTayang)} kg`, label: t("summary_ready_stock") },
            ]}
          />

          {/* --- Cari & saring -------------------------------------------- */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                />
                <input
                  type="search"
                  aria-label={t("search_placeholder")}
                  placeholder={t("search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="type-body-md focus-ring min-h-11 w-full rounded-md border border-line bg-surface ps-9 pe-3 text-ink placeholder:text-placeholder"
                />
              </div>

              {/* Grade tinggal di balik sheet: tiap kartu sudah memakai lencana
                  grade-nya sendiri, jadi menyaringnya adalah pekerjaan sesekali
                  — bukan baris kontrol permanen. */}
              <FilterSheet
                jumlahAktif={gradeFilter === "semua" ? 0 : 1}
                onReset={() => setGradeFilter("semua")}
                description={t("filter_desc")}
              >
                <Select
                  id="filter-grade"
                  label="Grade"
                  value={gradeFilter}
                  onChange={(v) => setGradeFilter(v as "semua" | Grade)}
                  options={[
                    { value: "semua", label: t("filter_grade_all") },
                    ...URUT_GRADE.map((g) => ({
                      value: g,
                      label: `Grade ${g}`,
                    })),
                  ]}
                />
              </FilterSheet>
            </div>

            <div className="scroll-x flex gap-2">
              {STATUS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={statusFilter === value}
                  onClick={() => setStatusFilter(value)}
                  className={cx(
                    "tap focus-ring type-body-md min-h-11 shrink-0 rounded-full border px-3 font-bold sm:min-h-9",
                    statusFilter === value
                      ? "border-brand bg-brand text-on-brand"
                      : "border-line bg-surface text-muted hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* --- Daftar lot ----------------------------------------------- */}
          {filteredListings.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={<Store />}
              title={t("empty_title")}
              description={t("empty_desc")}
              action={
                <ButtonLink href="/petani/pindai" size="lg">
                  <ScanLine aria-hidden className="size-4" />
                  {t("btn_start_scan")}
                </ButtonLink>
              }
            />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredListings.map((l) => {
                const status = (l.status ?? "tayang") as StatusLot;
                const disorot = l.id === fokus;
                const campuran =
                  URUT_GRADE.filter((g) => (l.komposisi?.[g] ?? 0) > 0).length > 1;

                const aksiLain: MenuAction[] = [
                  status === "tayang"
                    ? {
                        label: t("btn_pause"),
                        icon: <Pause aria-hidden className="size-4" />,
                        onSelect: () => store.toggleListingStatus(l.id, "dijeda"),
                      }
                    : {
                        label: t("btn_resume"),
                        icon: <Play aria-hidden className="size-4" />,
                        onSelect: () => store.toggleListingStatus(l.id, "tayang"),
                        disabled: status === "terjual",
                      },
                  {
                    label: t("btn_mark_sold"),
                    icon: <CheckCircle2 aria-hidden className="size-4" />,
                    onSelect: () => store.toggleListingStatus(l.id, "terjual"),
                    disabled: status === "terjual",
                  },
                  {
                    label: t("btn_delete"),
                    icon: <Trash2 aria-hidden className="size-4" />,
                    tone: "danger",
                    onSelect: () => setHapusTarget(l),
                  },
                ];

                return (
                  <li key={l.id} ref={disorot ? fokusRef : undefined}>
                    <Card
                      className={cx(
                        "flex h-full flex-col gap-3 p-4",
                        disorot && "ring-2 ring-brand",
                        status === "dijeda" && "bg-sunken/40",
                        status === "terjual" && "opacity-70",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          {/* Lot yang terbit tanpa foto tersimpan menampilkan
                              kotak kosong, bukan `<img src="">` yang dirender
                              peramban sebagai ikon gambar rusak. */}
                          {l.gambar ? (
                            <img
                              src={l.gambar}
                              alt=""
                              className="size-20 rounded-md border border-line object-cover"
                            />
                          ) : (
                            <span
                              aria-hidden
                              className="grid size-20 place-items-center rounded-md border border-line bg-sunken"
                            >
                              <ImageOff className="size-6 text-line" />
                            </span>
                          )}
                          {/* Hanya pelatnya yang menggantung di sudut. Tag utuh
                              lebarnya melebihi foto 80px ini, jadi ia akan
                              menjulur jauh ke luar dan menabrak judul. */}
                          <span className="absolute -bottom-1 -end-1">
                            <GradeBadge
                              grade={l.grade}
                              size="sm"
                              variant="mark"
                              className="ring-2 ring-surface"
                            />
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="type-body-lg min-w-0 truncate font-bold text-ink">
                              {l.nama}
                            </h3>
                            <StatusLencana status={status} t={t} />
                          </div>

                          <p className="type-body-md tnum pt-0.5 text-muted">
                            {formatAngka(l.berat_kg)} kg
                          </p>

                          <p className="type-heading-md tnum pt-1 text-brand">
                            {formatRupiah(l.harga_per_kg)}
                            <span className="type-body-md font-medium text-muted">
                              {t("per_kg")}
                            </span>
                          </p>

                          {campuran && (
                            <div className="pt-2">
                              <GradeBar
                                komposisi={l.komposisi ?? {}}
                                height={6}
                                showLegend={false}
                              />
                              <p className="type-body-sm pt-1 text-label">
                                {t("mixed_lot", { grade: l.grade })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Satu aksi utama terlihat; tiga sisanya di balik ⋯.
                          Empat tombol sejajar pada 360px membungkus jadi dua
                          baris dan membuat tiap kartu tampak seperti panel
                          kendali alih-alih sekarung tomat. */}
                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => bukaEdit(l)}
                        >
                          <Edit3 aria-hidden className="size-4 text-brand" />
                          {t("btn_edit_price")}
                        </Button>

                        <div className="flex items-center gap-1">
                          {/* Tingginya dinaikkan sungguhan, bukan lewat
                              `hit-44`: tombol ⋯ hanya 4px di sebelahnya, dan
                              bidang sentuh yang melar akan menimpanya. */}
                          <Link
                            href="/petani/hasil"
                            className="type-body-md focus-ring inline-flex min-h-11 items-center rounded-xs px-2 font-bold text-brand hover:underline sm:min-h-9"
                          >
                            {t("report_link")}
                          </Link>
                          <Menu
                            label={t("other_actions_aria", { name: l.nama })}
                            actions={aksiLain}
                          />
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </main>

      {/* --- Ubah harga & stok -------------------------------------------- */}
      <Dialog
        open={Boolean(editListing)}
        onClose={() => setEditListing(null)}
        title={t("modal_edit_title")}
        description={editListing?.nama}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditListing(null)}>
              {tc("cancel")}
            </Button>
            <Button onClick={simpanEdit}>{tc("save")}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            id="edit-harga"
            type="number"
            label={t("modal_edit_price_label")}
            value={editHarga}
            onChange={(e) => setEditHarga(Number(e.target.value))}
            min={1000}
            step={500}
            hint={t("modal_edit_price_hint")}
          />
          <Input
            id="edit-berat"
            type="number"
            label={t("modal_edit_stock_label")}
            value={editBerat}
            onChange={(e) => setEditBerat(Number(e.target.value))}
            min={1}
            step={10}
            hint={t("modal_edit_stock_hint")}
          />
          <p className="type-body-md flex items-center justify-between gap-3 rounded-md border border-line bg-sunken p-3 text-muted">
            {t("modal_edit_lot_value")}
            <span className="type-heading-sm tnum text-ink">
              {formatRupiah(editHarga * editBerat)}
            </span>
          </p>
        </div>
      </Dialog>

      {/* --- Hapus lot ----------------------------------------------------- */}
      <Dialog
        open={Boolean(hapusTarget)}
        onClose={() => setHapusTarget(null)}
        title={t("modal_delete_confirm_title")}
        description={t("modal_delete_confirm_desc")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setHapusTarget(null)}>
              {tc("cancel")}
            </Button>
            <Button variant="danger" onClick={hapusKonfirmasi}>
              {t("btn_delete")}
            </Button>
          </>
        }
      >
        {hapusTarget && (
          <div className="flex items-center gap-3 rounded-md border border-line bg-sunken p-3">
            {hapusTarget.gambar ? (
              <img
                src={hapusTarget.gambar}
                alt=""
                className="size-12 shrink-0 rounded-sm object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="grid size-12 shrink-0 place-items-center rounded-sm bg-surface"
              >
                <ImageOff className="size-5 text-line" />
              </span>
            )}
            <div className="min-w-0">
              <p className="type-body-md truncate font-bold text-ink">
                {hapusTarget.nama}
              </p>
              <p className="type-body-sm tnum text-muted">
                {formatAngka(hapusTarget.berat_kg)} kg
              </p>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}

function StatusLencana({
  status,
  t,
}: {
  status: StatusLot;
  t: ReturnType<typeof useTranslations<"listing">>;
}) {
  if (status === "tayang") {
    return <Badge tone="brand">{t("filter_status_tayang")}</Badge>;
  }
  if (status === "dijeda") {
    return <Badge tone="warn">{t("filter_status_dijeda")}</Badge>;
  }
  return <Badge tone="neutral">{t("filter_status_terjual")}</Badge>;
}
