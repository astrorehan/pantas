"use client";

/* eslint-disable @next/next/no-img-element -- captures are runtime data URLs */

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CloudOff,
  ImageOff,
  ScanLine,
} from "lucide-react";
import { BackBar } from "@/components/chrome";
import { tambahAntrean } from "@/lib/antrean-offline";
import { haptic } from "@/lib/haptic";
import { Container } from "@/components/container";
import { LaporanGradingView } from "@/components/laporan-grading";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  GradeBar,
  SectionLabel,
  Skeleton,
  cx,
} from "@/components/ui";
import {
  gradeBatch,
  gradeBatchMulti,
  gradeDominan,
  hrefJualLaporan,
  labelKomoditas,
} from "@/lib/data";
import { persen } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import type {
  FotoHasil,
  GradingMulti,
  GradingResult,
  LaporanGrading,
} from "@/lib/types";

/**
 * Foto batch.
 *
 * Bila engine mengembalikan `annotated_img`, itulah yang tampil: kotak dan
 * huruf grade di sana digambar oleh mesin yang menilainya. Bila tidak, yang
 * tampil adalah fotonya apa adanya.
 *
 * Sebelumnya layar ini menggambar lima lingkaran berlabel A, B, C, B, dan X
 * pada posisi tetap ketika anotasi tidak ada — bentuk, warna, dan grade-nya
 * ditulis tangan di dalam berkas ini. Foto tanpa anotasi lalu terlihat persis
 * seperti foto yang sudah dinilai per objek, termasuk pada batch yang engine-nya
 * tidak mendeteksi apa pun. Tidak ada keadaan yang membenarkan itu: penanda
 * grade adalah klaim tentang panen orang, dan klaim itu harus datang dari
 * engine atau tidak muncul sama sekali.
 */
function BatchPreview({
  capture,
  annotated,
}: {
  capture: string | null;
  annotated?: string;
}) {
  const t = useTranslations("hasil");
  const src = annotated ?? capture;

  if (!src) {
    return (
      <div className="flex aspect-2/1 w-full flex-col items-center justify-center gap-2 rounded-md bg-sunken text-center">
        <ImageOff aria-hidden className="size-7 text-line" />
        <p className="type-body-sm px-4 text-muted">{t("no_photo")}</p>
      </div>
    );
  }

  return (
    <figure className="m-0">
      <div className="relative aspect-2/1 w-full overflow-hidden rounded-md bg-stone-900">
        <img
          src={src}
          alt={annotated ? t("alt_annotated") : t("alt_plain")}
          className="absolute inset-0 size-full object-cover"
        />
      </div>
      <figcaption className="type-body-sm pt-2 text-muted">
        {annotated ? t("cap_annotated") : t("cap_plain")}
      </figcaption>
    </figure>
  );
}

/**
 * Penggeser foto untuk pindai multi-sudut.
 *
 * Ringkasan per foto ada di bawah gambarnya, bukan digabung ke panel agregat:
 * kalau satu sudut ditolak engine atau koinnya tidak terdeteksi, petani perlu
 * tahu sudut yang mana — bukan sekadar bahwa "sebagian gagal".
 */
function PenggeserFoto({
  foto,
  captures,
  aktif,
  onPilih,
}: {
  foto: FotoHasil[];
  captures: string[];
  aktif: number;
  onPilih: (i: number) => void;
}) {
  const t = useTranslations("hasil");
  const terpilih = foto[aktif];
  const hasil = terpilih?.hasil;
  const sukses = hasil?.status === "success" ? hasil : null;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <BatchPreview
        capture={captures[aktif] ?? null}
        annotated={sukses?.annotated_img}
      />

      <ul className="scroll-x flex gap-2 pb-1">
        {foto.map((f, i) => {
          const gagal = f.hasil.status !== "success";
          const gambar =
            (f.hasil.status === "success" && f.hasil.annotated_img) ||
            captures[i] ||
            "";
          return (
            <li key={f.indeks}>
              <button
                type="button"
                onClick={() => onPilih(i)}
                aria-current={i === aktif ? "true" : undefined}
                aria-label={t("photo_pick", {
                  num: i + 1,
                  state: gagal ? t("photo_failed_aria") : "",
                })}
                className={cx(
                  "focus-ring relative block size-16 shrink-0 overflow-hidden rounded-md border-2",
                  i === aktif ? "border-brand" : "border-line",
                )}
              >
                {gambar ? (
                  <img src={gambar} alt="" className="size-full object-cover" />
                ) : (
                  <span className="block size-full bg-sunken" />
                )}
                <span className="type-body-sm absolute bottom-0 start-0 bg-black/70 px-1 font-bold text-white">
                  {i + 1}
                </span>
                {gagal && (
                  <span className="absolute inset-0 flex items-center justify-center bg-danger/70">
                    <AlertTriangle aria-hidden className="size-5 text-white" />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <Card className="min-w-0 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>{t("photo_num", { num: aktif + 1 })}</SectionLabel>
          {sukses ? (
            <Badge tone={sukses.kalibrasi.valid ? "brand" : "warn"}>
              {sukses.kalibrasi.valid ? t("coin_detected") : t("coin_not_detected")}
            </Badge>
          ) : (
            <Badge tone="danger">{t("failed_eval")}</Badge>
          )}
        </div>

        {sukses ? (
          <>
            <p className="type-body-sm tnum pt-2 text-muted">
              {t("photo_stats", {
                count: sukses.objek_terdeteksi,
                uniformity: persen(sukses.ringkasan_batch.skor_keseragaman),
              })}
            </p>
            <GradeBar
              komposisi={sukses.ringkasan_batch.komposisi}
              height={12}
              showLegend={false}
              className="mt-2"
            />
          </>
        ) : (
          <p className="type-body-sm pt-2 text-danger">
            {hasil?.status === "error" ? hasil.message : t("err_photo_unreadable")}
          </p>
        )}
      </Card>
    </div>
  );
}

function LoadingReport() {
  const t = useTranslations("hasil");
  return (
    <div className="flex flex-col gap-4 pt-4" aria-label={t("analyzing_aria")}>
      <Skeleton className="aspect-2/1 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/**
 * Apa yang dimuat layar ini.
 *
 * `tersimpan` adalah laporan pindaian yang sudah selesai dan sudah tercatat di
 * riwayat. Ia ada supaya kunjungan ulang ke layar ini — menekan kembali dari
 * layar harga, misalnya — menampilkan laporan yang sama, bukan menilai ulang
 * dari awal. Dulu tidak ada keadaan ini: setiap pemasangan komponen memanggil
 * grader lagi, dan ketika sesi itu tidak punya foto sama sekali, yang dinilai
 * adalah ketiadaan foto. Jawabannya nol objek — lalu nol objek itu ikut
 * tercatat ke riwayat dan ke tabel `gradings` sebagai pindaian yang tidak
 * pernah terjadi.
 */
type Muatan =
  | { mode: "tunggal"; hasil: GradingResult }
  | { mode: "multi"; multi: GradingMulti }
  | { mode: "tersimpan"; laporan: LaporanGrading; gambar?: string }
  | { mode: "kosong" };

export default function HasilPage() {
  const t = useTranslations("hasil");
  const store = useStore();
  const [muatan, setMuatan] = useState<Muatan | null>(null);
  /** Terisi bila pindaian ini masuk antrean offline alih-alih dinilai. */
  const [antre, setAntre] = useState<{ alasan: string; jumlah: number } | null>(
    null,
  );
  const [fotoAktif, setFotoAktif] = useState(0);
  const recorded = useRef(false);
  // Komoditas dipilih petani di layar pindai; menentukan config ambang batas
  // yang dipakai engine, jadi label di sini harus ikut pilihan itu.
  const komoditas = store.lastKomoditas;
  const komoditasLabel = labelKomoditas(komoditas);
  const captures = store.lastCaptures;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // Kunjungan ulang: laporannya sudah ada, tinggal ditampilkan lagi.
      const tersimpan = store.lastScanId
        ? store.scans.find((s) => s.id === store.lastScanId)
        : undefined;
      if (tersimpan?.hasil) {
        recorded.current = true; // sudah tercatat saat pertama dinilai
        setMuatan({
          mode: "tersimpan",
          laporan: tersimpan.hasil,
          gambar: tersimpan.gambar,
        });
        return;
      }

      // Tidak ada foto dan tidak ada laporan: tidak ada yang bisa dinilai.
      // Memanggil grader di sini hanya menghasilkan laporan nol objek yang
      // terlihat seperti pindaian gagal, padahal tidak ada pindaian sama sekali.
      if (captures.length === 0) {
        setMuatan({ mode: "kosong" });
        return;
      }

      // Sudah tahu tidak ada sinyal: jangan buang waktu pada permintaan yang
      // pasti gagal, langsung masukkan antrean.
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        if (!cancelled) await masukkanAntrean(t("err_no_connection"));
        return;
      }

      // Antrean berisi lebih dari satu sudut memakai /predict/batch: hasilnya
      // satu laporan gabungan, bukan sekian laporan terpisah.
      if (captures.length > 1) {
        const r = await gradeBatchMulti(captures, komoditas);
        if (cancelled) return;
        if (r.agregat.luring) {
          await masukkanAntrean(r.agregat.message ?? t("err_offline_default"));
          return;
        }
        setMuatan({ mode: "multi", multi: r });
        return;
      }

      // Kirim capture asli ke FastAPI /predict bila NEXT_PUBLIC_PREDICT_URL
      // terisi; tanpa itu gradeBatch mengembalikan payload demo.
      const r = await gradeBatch({
        imageDataUrl: store.lastCapture,
        commodity: komoditas,
        coinRoi: store.lastCoinRoi,
      });
      if (cancelled) return;
      if (r.status === "error" && r.luring) {
        await masukkanAntrean(r.message);
        return;
      }
      setMuatan({ mode: "tunggal", hasil: r });
    })();

    async function masukkanAntrean(alasan: string) {
      try {
        await tambahAntrean({
          komoditas,
          komoditas_label: komoditasLabel,
          fotos: captures,
        });
        await store.refreshAntreanPindai();
        haptic.warning();
        if (!cancelled) setAntre({ alasan, jumlah: captures.length });
      } catch {
        // IndexedDB tidak tersedia: lebih baik menyatakan kegagalannya apa
        // adanya daripada menjanjikan antrean yang tidak pernah ada.
        haptic.error();
        if (!cancelled)
          setMuatan({
            mode: "tunggal",
            hasil: {
              status: "error",
              message: t("err_queue_unavailable", { alasan }),
              luring: true,
            },
          });
      }
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sekali per kunjungan; capture sudah final saat layar ini terbuka
  }, []);

  // Laporan yang dibaca layar: hasil satu foto, atau agregat seluruh sudut.
  const laporan: LaporanGrading | null =
    muatan === null || muatan.mode === "kosong"
      ? null
      : muatan.mode === "tersimpan"
        ? muatan.laporan
        : muatan.mode === "multi"
          ? muatan.multi.agregat.status === "success"
            ? muatan.multi.agregat
            : null
          : muatan.hasil.status === "success"
            ? muatan.hasil
            : null;

  /**
   * Laporan tanpa satu pun objek bukan catatan panen — ia foto yang gagal
   * dibaca. Mencatatnya ke riwayat berarti mengisi arsip petani dengan baris
   * kosong yang tidak bisa dijual, tidak bisa dibandingkan, dan tetap terhitung
   * sebagai "pindaian tersimpan".
   */
  const kosong = laporan !== null && laporan.objek_terdeteksi === 0;

  // Record this scan once the result lands (once — StrictMode double-runs effects).
  useEffect(() => {
    if (!laporan || kosong || recorded.current) return;
    recorded.current = true;
    haptic.success();
    const dominan = gradeDominan(laporan.ringkasan_batch.komposisi);
    store.addScan({
      komoditas_label: komoditasLabel,
      grade_dominan: dominan,
      objek: laporan.objek_terdeteksi,
      gambar: store.lastCapture ?? "",
      foto: captures.length > 1 ? captures.length : undefined,
      hasil: laporan, // dipersistenkan ke tabel gradings (hash_audit ikut tersimpan)
    });
  }, [laporan, kosong, store, komoditasLabel, captures.length]);

  // Umpan balik taktil kesalahan jika evaluasi grading gagal / objek kosong
  useEffect(() => {
    if (!muatan || muatan.mode === "kosong" || muatan.mode === "tersimpan") return;
    if (
      kosong ||
      (muatan.mode === "tunggal" && muatan.hasil.status === "error") ||
      (muatan.mode === "multi" && muatan.multi.agregat.status === "error")
    ) {
      haptic.error();
    }
  }, [muatan, kosong]);

  const bar = (
    <BackBar
      title={t("title")}
      href="/petani/pindai"
      parentLabel={t("pindai_label")}
    />
  );

  // Antrean offline: fotonya aman di IndexedDB dan akan diproses saat sinyal
  // kembali — layar ini menyatakannya, bukan menampilkan galat merah seolah
  // pindaiannya hilang.
  if (antre) {
    return (
      <>
        {bar}
        <main className="flex-1 py-4">
          <Container width="narrow">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <CloudOff aria-hidden className="size-6 shrink-0 text-grade-b" />
                <div className="min-w-0">
                  <h1 className="type-heading-sm text-ink">
                    {t("queue_offline_title")}
                  </h1>
                  <p className="type-body-md pt-2 text-muted">
                    {antre.jumlah === 1
                      ? t("queue_offline_desc_single")
                      : t("queue_offline_desc_multi", { count: antre.jumlah })}
                  </p>
                  <p className="type-body-sm pt-2 text-muted">{antre.alasan}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-5 sm:flex-row">
                <ButtonLink href="/petani" size="lg" className="flex-1">
                  {t("btn_back_home")}
                </ButtonLink>
                <ButtonLink
                  href="/petani/pindai"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  {t("btn_scan_again")}
                </ButtonLink>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  if (!muatan) {
    return (
      <>
        {bar}
        <main className="flex-1 pb-4">
          <Container>
            <LoadingReport />
          </Container>
        </main>
      </>
    );
  }

  /**
   * Tidak ada pindaian untuk ditampilkan.
   *
   * Layar ini bisa dicapai tanpa memotret apa pun — ditautkan langsung, atau
   * ditekan "kembali" dari layar harga yang dibuka lewat riwayat. Dulu keadaan
   * itu dijawab dengan laporan nol objek lengkap dengan penanda grade palsu.
   * Sekarang ia dijawab dengan apa yang sebenarnya terjadi, plus dua pintu
   * keluar yang berguna.
   */
  if (muatan.mode === "kosong") {
    return (
      <>
        {bar}
        <main className="flex-1 py-4">
          <Container width="narrow">
            <EmptyState
              icon={<ScanLine />}
              title={t("empty_title")}
              description={t("empty_desc")}
              action={
                <div className="flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/petani/pindai" size="lg">
                    {t("btn_start_scan")}
                  </ButtonLink>
                  <ButtonLink
                    href="/petani/riwayat"
                    variant="outline"
                    size="lg"
                  >
                    {t("btn_open_riwayat")}
                  </ButtonLink>
                </div>
              }
            />
          </Container>
        </main>
      </>
    );
  }

  if (!laporan || kosong) {
    const pesan = kosong
      ? t("err_no_objects")
      : muatan.mode === "multi"
        ? (muatan.multi.agregat.message ?? t("err_no_photos"))
        : muatan.mode === "tunggal" && muatan.hasil.status === "error"
          ? muatan.hasil.message
          : t("err_unreadable");
    return (
      <>
        {bar}
        <main className="flex-1 py-4">
          <Container width="narrow">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  aria-hidden
                  className="size-6 shrink-0 text-danger"
                />
                <div className="min-w-0">
                  <h1 className="type-heading-sm text-ink">
                    {t("err_title")}
                  </h1>
                  <p className="type-body-md pt-2 text-muted">{pesan}</p>
                </div>
              </div>
              <div className="pt-5">
                <ButtonLink href="/petani/pindai" size="lg" block>
                  {t("btn_retake")}
                </ButtonLink>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  const komposisi = laporan.ringkasan_batch.komposisi;
  const estimasi = laporan.ringkasan_batch.estimasi_berat;
  const agregat = muatan.mode === "multi" ? muatan.multi.agregat : null;
  const gagalSebagian = agregat ? agregat.foto_gagal.length > 0 : false;

  const media =
    muatan.mode === "multi" ? (
      <PenggeserFoto
        foto={muatan.multi.foto}
        captures={captures.map((c) => c.dataUrl)}
        aktif={Math.min(fotoAktif, muatan.multi.foto.length - 1)}
        onPilih={setFotoAktif}
      />
    ) : (
      <BatchPreview
        capture={
          muatan.mode === "tersimpan"
            ? (muatan.gambar ?? null)
            : store.lastCapture
        }
        annotated={"annotated_img" in laporan ? laporan.annotated_img : undefined}
      />
    );

  return (
    <>
      {bar}

      <main className="flex-1 py-4">
        <Container>
          <h1 className="type-heading-lg text-ink">
            {t("objects_count", {
              label: komoditasLabel,
              count: laporan.objek_terdeteksi,
            })}
          </h1>

          {gagalSebagian && (
            <p className="type-body-sm pt-2 text-danger">
              {t("partial_fail", {
                count: agregat!.foto_gagal.length,
                details: agregat!.foto_gagal
                  .map((f) => t("photo_num", { num: f.indeks + 1 }))
                  .join(", "),
              })}
            </p>
          )}

          <div className="pt-4">
            <LaporanGradingView laporan={laporan} media={media} />
          </div>
        </Container>
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-surface py-3">
        <Container className="flex justify-end">
          <ButtonLink
            href={hrefJualLaporan({
              komoditas: laporan.komoditas,
              komposisi,
              objek: laporan.objek_terdeteksi,
              sampel_kg: estimasi?.tersedia ? estimasi.kg : null,
              dari: "/petani/hasil",
            })}
            size="lg"
            className="w-full md:w-auto"
          >
            {t("btn_price_recom")}
            <ArrowRight aria-hidden className="size-5" />
          </ButtonLink>
        </Container>
      </footer>
    </>
  );
}
