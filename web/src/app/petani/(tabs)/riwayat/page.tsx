"use client";

/* eslint-disable @next/next/no-img-element -- scan captures are data URLs */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ScanLine,
  Layers,
  X,
  GitCompareArrows,
  Trash2,
  Loader2,
} from "lucide-react";
import { BrandBar } from "@/components/chrome";
import { Container } from "@/components/container";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Dialog,
  EmptyState,
  GradeBadge,
  GradeBar,
  Input,
  SectionLabel,
  Select,
  Skeleton,
  cx,
} from "@/components/ui";
import { FilterSheet } from "@/components/ui/filter-sheet";
import type { SelectOption } from "@/components/ui";
import {
  KOMODITAS,
  URUT_GRADE,
  getRiwayatGrading,
  getCachedRiwayatGrading,
  hapusRiwayatGrading,
} from "@/lib/data";
import type { FilterRiwayat, RiwayatItem } from "@/lib/data";
import { persen } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Grade } from "@/lib/types";
import { useLocale, useTranslations } from "@/lib/i18n";
import { toast } from "sonner";

const PER_HALAMAN = 12;

/**
 * Arsip pindaian.
 *
 * Tiga hal yang salah di versi sebelumnya, dan ketiganya soal bentuk, bukan
 * data.
 *
 * Pertama, arsip tanpa struktur waktu. Dua belas kartu identik berurutan, dan
 * satu-satunya penanda kapan sesuatu terjadi adalah baris metadata 12px di
 * dalam tiap kartu. Petani datang ke sini dengan pertanyaan "yang minggu lalu
 * itu mana" dan harus membacanya satu per satu. Sekarang hari adalah judulnya.
 *
 * Kedua, grade — satu-satunya alasan pindaian itu ada — diletakkan paling
 * bawah di dalam kartu, dengan ukuran terkecil di kartu itu. Sekarang ia
 * ditempel di foto, tempat label mutu memang menempel pada barang, dan seluruh
 * kolomnya sejajar sehingga satu sapuan mata ke bawah membaca seluruh mutu
 * panen tanpa membaca satu nama pun.
 *
 * Ketiga, tombol "Bandingkan" di setiap baris. Membandingkan adalah pekerjaan
 * yang jarang dan selalu butuh dua benda; menaruh pemicunya di tiap kartu
 * berarti dua belas tombol permanen untuk satu tindakan sesekali, dan tiap
 * tombol itu bersaing dengan kartunya sendiri sebagai sasaran ketuk. Sekarang
 * ia satu sakelar mode.
 */
export default function RiwayatPage() {
  const store = useStore();
  const t = useTranslations("riwayat");
  const { locale } = useLocale();
  const [halaman, setHalaman] = useState(1);
  const [komoditas, setKomoditas] = useState("");
  const [grade, setGrade] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [hasil, setHasil] = useState<{
    kunci: string;
    items: RiwayatItem[];
    total: number;
  } | null>(null);
  const [modeBanding, setModeBanding] = useState(false);
  const [banding, setBanding] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [hapusDialogTarget, setHapusDialogTarget] = useState<string | null>(null);

  /**
   * Menghapus satu pindaian.
   *
   * Daftar yang tampil dipangkas sendiri, tidak menunggu pengambilan ulang:
   * baris yang baru saja dihapus tetap terlihat sampai jaringan menjawab adalah
   * cara tercepat membuat petani menekan tombol yang sama dua kali. Salinan
   * lokalnya ikut dibuang lewat `hapusScan` — tanpa itu cadangan sesi
   * memunculkannya kembali begitu daftar dimuat ulang.
   */
  async function jalankanHapus() {
    const id = hapusDialogTarget;
    if (!id) return;

    setIsDeleting(id);
    const hasilHapus = await hapusRiwayatGrading(id);
    if (hasilHapus === "ok") {
      store.hapusScan(id);
      setHasil((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter((x) => x.id !== id),
          total: Math.max(0, prev.total - 1),
        };
      });
      setBanding((b) => b.filter((x) => x !== id));
      /* Menghapus isi terakhir sebuah halaman meninggalkan halaman kosong yang
         tidak punya tombol apa pun untuk keluar darinya. */
      if (items?.length === 1 && halaman > 1) setHalaman((h) => h - 1);
      toast.success(t("delete_success"));
    } else if (hasilHapus === "terkunci") {
      toast.error(t("delete_locked"));
    } else {
      toast.error(t("delete_error"));
    }
    setIsDeleting(null);
    setHapusDialogTarget(null);
  }

  const opsiKomoditas: SelectOption[] = useMemo(
    () => [
      { value: "", label: t("opt_all_komoditas") },
      ...KOMODITAS.map((k) => ({ value: k.id, label: k.label, group: k.kelompok })),
    ],
    [t],
  );

  const opsiGrade: SelectOption[] = useMemo(
    () => [
      { value: "", label: t("opt_all_grade") },
      ...URUT_GRADE.map((g) => ({ value: g, label: `Grade ${g}` })),
    ],
    [t],
  );

  const cadangan: RiwayatItem[] = useMemo(
    () =>
      store.scans.map((s) => ({
        id: s.id,
        tanggal: s.tanggal,
        komoditas: s.komoditas ?? "",
        komoditas_label: s.komoditas_label,
        grade_dominan: s.grade_dominan,
        objek: s.objek,
        gambar: s.gambar,
        skor: s.skor,
        foto: s.foto,
        hash_audit: s.hash_audit,
      })),
    [store.scans],
  );

  const filter: FilterRiwayat = useMemo(
    () => ({
      halaman,
      perHalaman: PER_HALAMAN,
      komoditas: komoditas || undefined,
      grade: (grade || undefined) as Grade | undefined,
      dari: dari || undefined,
      sampai: sampai || undefined,
    }),
    [halaman, komoditas, grade, dari, sampai],
  );
  const kunci = JSON.stringify(filter);

  useEffect(() => {
    let batal = false;
    void getRiwayatGrading(filter, cadangan)
      .then((h) => {
        if (!batal) setHasil({ kunci, items: h.items, total: h.total });
      })
      .catch(() => {
        if (!batal) setHasil({ kunci, items: [], total: 0 });
      });
    return () => {
      batal = true;
    };
  }, [filter, kunci, cadangan]);

  const cachedResult = getCachedRiwayatGrading(kunci);
  const items = hasil?.kunci === kunci ? hasil.items : cachedResult?.items ?? null;
  const total = hasil?.kunci === kunci ? hasil.total : cachedResult?.total ?? 0;

  const daftar = items && items.length > 0 ? items : cadangan;

  /**
   * Komposisi grade sebagai satu bentuk, bukan empat angka.
   *
   * Dihitung dari halaman yang sedang tampil, karena itu satu-satunya himpunan
   * yang benar-benar ada di tangan — API riwayat mengembalikan satu halaman dan
   * satu `total`, tidak ada agregat. Judulnya karena itu ikut berubah: menyebut
   * ini "seluruh arsip" saat halaman kedua sedang terbuka adalah angka yang
   * salah dengan label yang meyakinkan.
   */
  const komposisi = useMemo(() => {
    if (daftar.length === 0) return null;
    return URUT_GRADE.reduce<Partial<Record<Grade, number>>>((acc, g) => {
      const n = daftar.filter((s) => s.grade_dominan === g).length;
      if (n > 0) acc[g] = n;
      return acc;
    }, {});
  }, [daftar]);

  const seluruhArsip = total <= daftar.length;

  /**
   * Pengelompokan per hari.
   *
   * Item sudah urut menurun dari sumbernya, jadi cukup satu lintasan yang
   * menutup kelompok begitu tanggalnya berganti — tidak perlu peta lalu
   * pengurutan ulang, dan urutan aslinya dijamin terjaga.
   */
  const kelompok = useMemo(() => {
    if (!items) return null;
    const out: { kunci: string; label: string; items: RiwayatItem[] }[] = [];
    for (const item of items) {
      const d = new Date(item.tanggal);
      const k = d.toDateString();
      const terakhir = out[out.length - 1];
      if (terakhir && terakhir.kunci === k) {
        terakhir.items.push(item);
      } else {
        out.push({ kunci: k, label: labelHari(d, locale, t), items: [item] });
      }
    }
    return out;
  }, [items, locale, t]);

  function ubahFilter(set: (v: string) => void, nilai: string) {
    set(nilai);
    setHalaman(1);
  }

  function resetFilter() {
    setKomoditas("");
    setGrade("");
    setDari("");
    setSampai("");
    setHalaman(1);
  }

  function toggleBanding(id: string) {
    setBanding((b) =>
      b.includes(id) ? b.filter((x) => x !== id) : b.length < 2 ? [...b, id] : b,
    );
  }

  function keluarModeBanding() {
    setModeBanding(false);
    setBanding([]);
  }

  const halamanTerakhir = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const filterAktif = [komoditas, grade, dari, sampai].filter(Boolean);
  const adaFilter = filterAktif.length > 0;
  const bisaBanding = (items?.length ?? cadangan.length) >= 2;

  return (
    <>
      <BrandBar title={t("title")} />

      <main className="flex-1 pb-28 pt-4 md:pb-8">
        <Container className="flex flex-col gap-5">
          {/* --- Ikhtisar: hitungan, komposisi, dan kedua pemicunya ------- */}
          <Card className="flex flex-col gap-3.5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
              <p className="type-body-lg text-muted">
                <span className="type-heading-lg tnum pe-1.5 align-baseline text-ink">
                  {total || cadangan.length}
                </span>
                {t("scans_saved")}
              </p>

              <div className="flex shrink-0 items-center gap-2">
                {bisaBanding && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={modeBanding}
                    onClick={() =>
                      modeBanding ? keluarModeBanding() : setModeBanding(true)
                    }
                    className={cx(modeBanding && "border-brand/40 text-brand")}
                  >
                    <GitCompareArrows aria-hidden className="size-4" />
                    {modeBanding ? t("cmp_done") : t("btn_cmp")}
                  </Button>
                )}

                <FilterSheet
                  jumlahAktif={filterAktif.length}
                  onReset={resetFilter}
                  description={t("filter_desc")}
                >
                  <Select
                    id="f-komoditas"
                    label={t("filter_komoditas")}
                    value={komoditas}
                    onChange={(v) => ubahFilter(setKomoditas, v)}
                    options={opsiKomoditas}
                  />
                  <Select
                    id="f-grade"
                    label={t("filter_grade")}
                    value={grade}
                    onChange={(v) => ubahFilter(setGrade, v)}
                    options={opsiGrade}
                  />
                  <Input
                    id="f-dari"
                    type="date"
                    label={t("filter_dari")}
                    value={dari}
                    max={sampai || undefined}
                    onChange={(e) => ubahFilter(setDari, e.target.value)}
                  />
                  <Input
                    id="f-sampai"
                    type="date"
                    label={t("filter_sampai")}
                    value={sampai}
                    min={dari || undefined}
                    onChange={(e) => ubahFilter(setSampai, e.target.value)}
                  />
                </FilterSheet>
              </div>
            </div>

            {komposisi && (
              /* Dibatasi lebarnya: empat segmen yang direntang sampai 1.700px
                 berhenti membaca sebagai proporsi dan mulai membaca sebagai
                 hiasan. */
              <div className="max-w-2xl">
                <SectionLabel>
                  {seluruhArsip ? t("composition_all") : t("composition_page")}
                </SectionLabel>
                <GradeBar
                  komposisi={komposisi}
                  height={18}
                  showLegend
                  className="pt-2"
                />
              </div>
            )}
          </Card>

          {/* Pil hanya muncul saat ada yang menyala, dan tiap pil adalah cara
              mematikan filternya sendiri — itu satu-satunya tugasnya di sini,
              bukan salinan kedua dari panel saring. */}
          {adaFilter && (
            <ul className="flex flex-wrap items-center gap-2">
              {komoditas && (
                <PilFilter
                  teks={
                    opsiKomoditas.find((o) => o.value === komoditas)?.label ??
                    komoditas
                  }
                  hapus={t("filter_remove", { teks: komoditas })}
                  onHapus={() => ubahFilter(setKomoditas, "")}
                />
              )}
              {grade && (
                <PilFilter
                  teks={`Grade ${grade}`}
                  hapus={t("filter_remove", { teks: `Grade ${grade}` })}
                  onHapus={() => ubahFilter(setGrade, "")}
                />
              )}
              {dari && (
                <PilFilter
                  teks={t("filter_from", { tanggal: dari })}
                  hapus={t("filter_remove", { teks: dari })}
                  onHapus={() => ubahFilter(setDari, "")}
                />
              )}
              {sampai && (
                <PilFilter
                  teks={t("filter_until", { tanggal: sampai })}
                  hapus={t("filter_remove", { teks: sampai })}
                  onHapus={() => ubahFilter(setSampai, "")}
                />
              )}
            </ul>
          )}

          {/* --- Bilah bandingkan (F-13) ---------------------------------- */}
          {/* Dinaikkan di atas pil navigasi bawah, bukan sekadar `bottom-20`:
              pil itu tingginya 64px plus safe-area, jadi nilai tetap akan
              menabraknya di ponsel berponi. */}
          {modeBanding && (
            <div className="fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] z-40 mx-auto max-w-xl md:bottom-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/30 p-3 glass-overlay backdrop-blur-xl backdrop-saturate-150">
                <p className="type-body-md min-w-0 flex-1 text-ink">
                  <span className="tnum font-bold">{banding.length}/2</span>{" "}
                  {banding.length === 0
                    ? t("cmp_mode_on")
                    : banding.length === 1
                      ? t("cmp_1")
                      : t("cmp_2")}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={keluarModeBanding}>
                    {t("btn_cancel")}
                  </Button>
                  <ButtonLink
                    href={`/petani/riwayat/banding?a=${encodeURIComponent(banding[0] ?? "")}&b=${encodeURIComponent(banding[1] ?? "")}`}
                    size="sm"
                    aria-disabled={banding.length < 2}
                    className={
                      banding.length < 2 ? "pointer-events-none opacity-50" : ""
                    }
                  >
                    <GitCompareArrows aria-hidden className="size-4" />
                    {t("btn_cmp")}
                  </ButtonLink>
                </div>
              </div>
            </div>
          )}

          {/* --- Daftar --------------------------------------------------- */}
          {items === null ? (
            <ul className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="h-26 w-full" />
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<ScanLine />}
              title={adaFilter ? t("empty_title_filter") : t("empty_title")}
              description={adaFilter ? t("empty_desc_filter") : t("empty_desc")}
              action={
                adaFilter ? (
                  <Button variant="ghost" size="lg" onClick={resetFilter}>
                    {t("filter_reset_short")}
                  </Button>
                ) : (
                  <ButtonLink href="/petani/pindai" size="lg">
                    <ScanLine aria-hidden className="size-4" />
                    {t("btn_start_scan")}
                  </ButtonLink>
                )
              }
            />
          ) : (
            <>
              {kelompok?.map((g) => (
                <section key={g.kunci} className="flex flex-col gap-2.5">
                  {/* Judul hari sebagai palang, bukan sekadar teks: garisnya
                      yang membuat daftar terbaca sebagai beberapa hari, bukan
                      satu tumpukan dengan tulisan di sela-selanya. */}
                  <h2 className="flex items-center gap-3">
                    <span className="type-heading-sm shrink-0 text-ink">
                      {g.label}
                    </span>
                    <span aria-hidden className="h-px flex-1 bg-line" />
                    <span className="type-body-sm tnum shrink-0 text-label">
                      {t("group_count", { count: g.items.length })}
                    </span>
                  </h2>

                  {/* Butir daftar memakai `min-w-0`: butir grid punya lebar
                      minimum otomatis sebesar min-content-nya, jadi tanpa itu
                      satu kartu yang isinya kepanjangan melebarkan seluruh
                      jalur dan mendorong isinya keluar layar. */}
                  <ul className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                    {g.items.map((s) => (
                      <li key={s.id} className="min-w-0">
                        <KartuPindaian
                          item={s}
                          modeBanding={modeBanding}
                          dipilih={banding.includes(s.id)}
                          penuh={banding.length >= 2}
                          onToggle={() => toggleBanding(s.id)}
                          onHapus={() => setHapusDialogTarget(s.id)}
                          hapusLabel={t("delete_aria", { name: s.komoditas_label })}
                          isDeleting={isDeleting === s.id}
                          waktu={fmtJam(s.tanggal, locale)}
                          keseragaman={
                            s.skor != null
                              ? t("uniformity", { val: persen(s.skor) })
                              : ""
                          }
                          objek={t("obj_count", { val: s.objek })}
                          fotoLabel={
                            s.foto != null && s.foto > 1
                              ? t("photo_count", { count: s.foto })
                              : null
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              {halamanTerakhir > 1 && (
                <nav
                  aria-label={t("pagination_label")}
                  className="flex items-center justify-between gap-3 pt-2"
                >
                  <Button
                    variant="ghost"
                    onClick={() => setHalaman((h) => Math.max(1, h - 1))}
                    disabled={halaman <= 1}
                  >
                    <ChevronLeft aria-hidden className="size-4" />
                    {t("prev")}
                  </Button>
                  <span className="type-body-md tnum text-muted">
                    {halaman} / {halamanTerakhir}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setHalaman((h) => Math.min(halamanTerakhir, h + 1))
                    }
                    disabled={halaman >= halamanTerakhir}
                  >
                    {t("next")}
                    <ChevronRight aria-hidden className="size-4" />
                  </Button>
                </nav>
              )}
            </>
          )}
        </Container>
      </main>

      <Dialog
        open={hapusDialogTarget !== null}
        onClose={() => {
          if (!isDeleting) setHapusDialogTarget(null);
        }}
        title={t("confirm_delete_title")}
        description={t("confirm_delete_desc")}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setHapusDialogTarget(null)}
              disabled={isDeleting !== null}
            >
              {t("btn_cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={jalankanHapus}
              disabled={isDeleting !== null}
            >
              {isDeleting ? t("btn_deleting") : t("btn_delete")}
            </Button>
          </>
        }
      />
    </>
  );
}

/**
 * Satu pindaian.
 *
 * Elemennya berganti sesuai mode — `Link` saat menelusuri, `button` saat
 * memilih — karena keduanya memang tindakan berbeda dan hanya satu yang boleh
 * hidup dalam satu waktu. Membungkus keduanya bersamaan akan menghasilkan
 * tautan di dalam tombol, yang tidak bisa dinavigasi keyboard dengan benar dan
 * membuat pembaca layar mengumumkan dua sasaran untuk satu kartu.
 */
function KartuPindaian({
  item,
  modeBanding,
  dipilih,
  penuh,
  onToggle,
  onHapus,
  hapusLabel,
  isDeleting,
  waktu,
  objek,
  keseragaman,
  fotoLabel,
}: {
  item: RiwayatItem;
  modeBanding: boolean;
  dipilih: boolean;
  penuh: boolean;
  onToggle: () => void;
  onHapus: () => void;
  hapusLabel: string;
  isDeleting: boolean;
  waktu: string;
  objek: string;
  keseragaman: string;
  fotoLabel: string | null;
}) {
  const isi = (
    <>
      <img
        src={item.gambar ?? "/img/tomat.jpg"}
        alt=""
        className="size-19 shrink-0 rounded-md object-cover"
      />

      <span className="min-w-0 flex-1">
        <span className="type-heading-sm block truncate text-ink">
          {item.komoditas_label}
        </span>
        <span className="type-body-sm tnum block truncate pt-0.5 text-muted">
          {objek} • {waktu}
          {keseragaman}
        </span>
        {/* Baris mutu selalu ada — grade tidak pernah kosong — jadi seluruh
            kartu setinggi sama dan penandanya sejajar menurun. Menempelkannya
            ke sudut foto tampak lebih pintar sampai kartu bersebelahan: yang
            punya lencana foto jadi lebih tinggi dari tetangganya, dan
            penandanya menggantung melewati tepi foto. */}
        <span className="flex flex-wrap items-center gap-2 pt-2">
          <GradeBadge grade={item.grade_dominan} size="sm" />
          {fotoLabel && (
            <Badge tone="info">
              <Layers aria-hidden className="me-1 inline size-3" />
              {fotoLabel}
            </Badge>
          )}
        </span>
      </span>

      {modeBanding ? (
        <span
          aria-hidden
          className={cx(
            "grid size-6 shrink-0 place-items-center rounded-full border-2",
            dipilih
              ? "border-brand bg-brand text-on-brand"
              : "border-line-strong",
          )}
        >
          {dipilih && <Check className="size-3.5" strokeWidth={3} />}
        </span>
      ) : (
        <ChevronRight aria-hidden className="size-5 shrink-0 text-label" />
      )}
    </>
  );

  /**
   * Tanpa `w-full`.
   *
   * Baris normal menaruh tautan ini bersebelahan dengan tombol hapus di dalam
   * satu Card ber-`flex`. `width: 100%` di sana berarti "selebar Card" —
   * padahal Card-lah yang sedang diukur dari isinya, jadi lebar tautan ikut
   * menambah lebar Card dan tombol hapus terdorong 32px keluar viewport 390px.
   * Yang menahan di layar hanyalah `overflow-x: hidden` global, jadi tombolnya
   * tidak hilang dengan bunyi apa pun — ia cuma terpotong separuh.
   *
   * Lebar diurus `flex-1` di pemanggil; `min-w-0` menyertainya supaya isi
   * panjang memotong dirinya sendiri alih-alih melebarkan barisnya.
   */
  const kelas = "focus-ring flex items-center gap-3.5 rounded-md p-3 text-start";

  if (modeBanding) {
    return (
      <Card
        className={cx(
          "transition-shadow",
          dipilih ? "ring-2 ring-brand" : "hover:shadow-e3",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          disabled={!dipilih && penuh}
          aria-pressed={dipilih}
          className={cx(kelas, "w-full disabled:opacity-45")}
        >
          {isi}
        </button>
      </Card>
    );
  }

  return (
    <Card variant="interactive" className="relative flex items-stretch">
      <Link
        href={`/petani/riwayat/${encodeURIComponent(item.id)}`}
        className={cx(kelas, "min-w-0 flex-1 pe-2")}
      >
        {isi}
      </Link>
      {!item.is_listed && (
        <div className="flex shrink-0 items-center justify-center pe-3">
          <button
            type="button"
            onClick={onHapus}
            disabled={isDeleting}
            className="tap focus-ring flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-danger-tint hover:text-danger disabled:cursor-not-allowed disabled:opacity-50 sm:size-10"
            aria-label={hapusLabel}
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </button>
        </div>
      )}
    </Card>
  );
}

function PilFilter({
  teks,
  hapus,
  onHapus,
}: {
  teks: string;
  hapus: string;
  onHapus: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onHapus}
        aria-label={hapus}
        className="tap focus-ring type-body-md inline-flex min-h-9 items-center gap-1.5 rounded-full border border-brand/30 bg-brand-tint px-3 font-bold text-brand-deep hover:border-brand"
      >
        {teks}
        <X aria-hidden className="size-3.5" />
      </button>
    </li>
  );
}

const INTL: Record<string, string> = { id: "id-ID", en: "en-US" };

function fmtJam(iso: string, locale: string) {
  return new Date(iso)
    .toLocaleTimeString(INTL[locale] ?? "id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", locale === "id" ? "." : ":");
}

/**
 * Judul kelompok. "Hari ini" dan "Kemarin" menang atas tanggal penuh karena
 * itulah cara orang menyebut dua hari terakhir — dan dua hari terakhir adalah
 * tempat hampir semua pindaian berada.
 */
function labelHari(
  d: Date,
  locale: string,
  t: (key: string) => string,
): string {
  const hariIni = new Date();
  const selisih = Math.round(
    (new Date(hariIni.getFullYear(), hariIni.getMonth(), hariIni.getDate()).getTime() -
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) /
      86_400_000,
  );
  if (selisih === 0) return t("today");
  if (selisih === 1) return t("yesterday");
  return d.toLocaleDateString(INTL[locale] ?? "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
