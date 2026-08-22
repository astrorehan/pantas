"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { Cpu, Database, Ruler, Scale, ScanLine, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  GradeBadge,
  GradeBar,
  cx,
} from "@/components/ui";
import { CONTOH_BATCH, type ContohBatch } from "@/lib/contoh-grading";
import { gradeBatch, getRekomendasiHarga } from "@/lib/data";
import { formatRupiah, num, persen, toGrade } from "@/lib/format";
import type { Grade, GradingSuccess, RekomendasiHarga } from "@/lib/types";

import { useTranslations } from "@/lib/i18n";

/** Ceiling from the F-01 acceptance criteria: a judge never waits longer. */
const BATAS_TUNGGU_MS = 8000;

type Sumber = "mesin" | "tersimpan";

interface Hasil {
  sumber: Sumber;
  payload: GradingSuccess;
  harga: RekomendasiHarga | null;
}

/**
 * Bentuk minimal `useTranslations()` yang benar-benar dipakai di sini.
 *
 * Nilai kembaliannya `string`, bukan `string | null` — itu sebabnya pola
 * `t("kunci") ?? "cadangan"` yang sempat dipakai di berkas ini tidak pernah
 * bisa jalan: cabang cadangannya mati, dan teks Indonesia yang ditulis di
 * sana justru jadi satu-satunya versi yang tidak pernah tampil.
 */
type Terjemah = (key: string, values?: Record<string, string | number>) => string;

/** Sample photo -> data URL, because /predict takes multipart, not a path. */
async function keDataUrl(src: string, pesanGagal: string): Promise<string> {
  const blob = await (await fetch(src)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(pesanGagal));
    reader.readAsDataURL(blob);
  });
}

function gradeDominan(payload: GradingSuccess): Grade {
  const komposisi = payload.ringkasan_batch.komposisi;
  const teratas = Object.entries(komposisi).sort((a, b) => b[1] - a[1])[0];
  return toGrade(teratas?.[0] ?? "B");
}

interface Ringkas {
  k: string;
  v: string;
  ikon: ReactNode;
  badge?: Grade;
}

function ringkasan(p: GradingSuccess, t: Terjemah, tc: Terjemah): Ringkas[] {
  const tidakTerukur = tc("not_rated");
  return [
    {
      k: tc("objects"),
      v: String(p.objek_terdeteksi),
      ikon: <ScanLine aria-hidden className="size-3.5" />,
    },
    {
      k: tc("uniformity_score"),
      v: `${num(p.ringkasan_batch.skor_keseragaman * 100)}%`,
      ikon: <Database aria-hidden className="size-3.5" />,
    },
    {
      k: t("bukti_calib"),
      v: p.kalibrasi.valid
        ? `${num(p.kalibrasi.px_per_mm2, 2)} px/mm²`
        : tidakTerukur,
      ikon: <Ruler aria-hidden className="size-3.5" />,
    },
    // Estimasi berat (F-101) selalu rentang, tidak pernah satu angka — dan
    // hanya muncul kalau kalibrasi koin memang berhasil.
    {
      k: t("bukti_weight"),
      v: p.ringkasan_batch.estimasi_berat?.tersedia
        ? `${num(p.ringkasan_batch.estimasi_berat.min_kg, 2)}–${num(p.ringkasan_batch.estimasi_berat.max_kg, 2)} kg`
        : tidakTerukur,
      ikon: <Scale aria-hidden className="size-3.5" />,
    },
    {
      k: tc("dominant_grade"),
      v: "",
      ikon: null,
      badge: gradeDominan(p),
    },
  ];
}

/**
 * The landing's proof section (F-01 §4). It calls the real `/predict`; a stored
 * sample is only substituted when the service does not answer inside
 * `BATAS_TUNGGU_MS`, and the swap is stated on screen rather than hidden —
 * a judge who cannot tell live output from a fixture learns nothing from it.
 */
export function DemoGrading() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const tp = useTranslations("pindai");
  const tg = useTranslations("grading");
  const [pilihan, setPilihan] = useState<ContohBatch>(CONTOH_BATCH[0]);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [jalan, setJalan] = useState(false);

  /** Label tiap contoh ikut bahasa aktif, bukan konstanta Indonesia di data. */
  const label = (c: ContohBatch) => t(`contoh_${c.komoditas}_label`);

  function pilih(c: ContohBatch) {
    setPilihan(c);
    setHasil(null);
  }

  async function analisis() {
    if (jalan) return;
    setJalan(true);
    setHasil(null);

    let payload = pilihan.hasil;
    let sumber: Sumber = "tersimpan";

    try {
      const dataUrl = await keDataUrl(pilihan.gambar, t("bukti_read_error"));
      const habis = new Promise<null>((r) =>
        setTimeout(() => r(null), BATAS_TUNGGU_MS),
      );
      const jawaban = await Promise.race([
        gradeBatch({ imageDataUrl: dataUrl, commodity: pilihan.komoditas }),
        habis,
      ]);
      // Demo mode returns a well-formed payload with zero objects; that is not
      // a result a judge should be shown as one.
      if (
        jawaban &&
        jawaban.status === "success" &&
        jawaban.objek_terdeteksi > 0
      ) {
        payload = jawaban;
        sumber = "mesin";
      }
    } catch {
      /* jaringan gagal — pakai contoh tersimpan */
    }

    const harga = await getRekomendasiHarga({
      komoditas: payload.komoditas,
      komposisi: payload.ringkasan_batch.komposisi,
    }).catch(() => null);

    setHasil({ sumber, payload, harga });
    setJalan(false);
  }

  const komposisi = hasil?.payload.ringkasan_batch.komposisi;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
      {/* ------------------------------------------------------------ Kiri */}
      <div className="flex flex-col gap-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-sunken">
          <Image
            src={hasil?.payload.annotated_img ?? pilihan.gambar}
            alt={
              hasil?.payload.annotated_img
                ? t("bukti_img_alt_annotated", { label: label(pilihan) })
                : t("bukti_img_alt_plain", { label: label(pilihan) })
            }
            fill
            sizes="(min-width: 1024px) 40vw, 92vw"
            className="object-cover"
            unoptimized={Boolean(hasil?.payload.annotated_img)}
          />
          {jalan && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-canvas/80">
              <ScanLine
                aria-hidden
                className="size-8 animate-pulse text-brand"
              />
              <p className="type-body-md font-bold text-ink">
                {tp("processing")}
              </p>
            </div>
          )}
        </div>

        <fieldset>
          <legend className="type-label pb-2 text-label">
            {t("bukti_pick_batch")}
          </legend>
          <div
            role="radiogroup"
            aria-label={t("bukti_pick_batch")}
            className="grid grid-cols-4 gap-2"
          >
            {CONTOH_BATCH.map((c) => {
              const aktif = c.gambar === pilihan.gambar;
              return (
                <button
                  key={c.gambar}
                  type="button"
                  role="radio"
                  aria-checked={aktif}
                  onClick={() => pilih(c)}
                  className={cx(
                    "tap tap-press focus-ring overflow-hidden rounded-md border-2 text-start",
                    aktif ? "border-brand" : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  <span className="relative block aspect-square">
                    <Image
                      src={c.gambar}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </span>
                  <span className="type-body-sm block truncate px-1 py-1 font-bold text-ink">
                    {label(c)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <p className="type-body-md text-muted">
          {t(`contoh_${pilihan.komoditas}_note`)}
        </p>

        <Button size="xl" block loading={jalan} onClick={() => void analisis()}>
          <Sparkles aria-hidden className="size-5" />
          {jalan ? tp("btn_scanning") : t("fitur1_action")}
        </Button>
      </div>

      {/* ----------------------------------------------------------- Kanan */}
      <Card variant="raised" className="flex flex-col gap-5 p-5 sm:p-6">
        {!hasil ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
            <Cpu aria-hidden className="size-10 text-label" />
            {/* Bukan `bukti_desc`: kalimat itu sudah jadi lead section persis di
                atas kartu ini, jadi mengulangnya membuat satu paragraf tampil
                dua kali dalam satu layar. */}
            <p className="type-body-lg text-muted">{t("bukti_empty")}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="type-heading-md text-ink">{t("bukti_report_title")}</h3>
              {hasil.sumber === "mesin" ? (
                <Badge tone="brand">{t("bukti_src_live")}</Badge>
              ) : (
                <Badge tone="warn">{t("bukti_src_cached")}</Badge>
              )}
            </div>

            {hasil.sumber === "tersimpan" && (
              <p className="type-body-sm rounded-md border border-line bg-sunken p-3 text-muted">
                {t("bukti_src_cached_note", { detik: BATAS_TUNGGU_MS / 1000 })}
              </p>
            )}

            <div>
              <p className="type-label pb-2 text-label">{tg("batch_composition")}</p>
              <GradeBar komposisi={komposisi ?? {}} height={16} />
            </div>

            <dl className="grid grid-cols-2 gap-3">
              {ringkasan(hasil.payload, t, tc).map(({ k, v, ikon, badge }) => (
                <div
                  key={k}
                  className="rounded-md border border-line bg-sunken p-3"
                >
                  <dt className="type-label flex items-center gap-1.5 text-label">
                    {ikon}
                    {k}
                  </dt>
                  <dd className="type-heading-sm tnum pt-1 text-ink">
                    {badge ? <GradeBadge grade={badge} size="md" /> : v}
                  </dd>
                </div>
              ))}
            </dl>

            {hasil.harga && (
              <div className="rounded-md border border-brand bg-brand-tint p-4">
                <p className="type-label text-brand-deep">
                  {t("bukti_price_title")}
                </p>
                <p className="type-heading-lg tnum pt-1 text-ink">
                  {formatRupiah(hasil.harga.min)} –{" "}
                  {formatRupiah(hasil.harga.max)}
                  <span className="type-body-md font-medium text-muted"> /kg</span>
                </p>
                <p className="type-body-sm pt-1.5 text-muted">
                  {t("bukti_price_formula", {
                    acuan: formatRupiah(hasil.harga.harga_acuan),
                    sumber: hasil.harga.harga_acuan_sumber,
                    pengali: num(hasil.harga.pengali, 3),
                    skor: persen(hasil.harga.skor_kualitas),
                  })}
                </p>
              </div>
            )}

            <div className="scroll-x -mx-1 w-full max-w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-[240px] sm:min-w-[26rem] border-collapse px-1">
                <caption className="type-label pb-2 text-start text-label">
                  {tg("per_object_detail")}: {hasil.payload.objek.length} {tc("objects")}
                </caption>
                <thead>
                  <tr className="border-b border-line text-start">
                    {["#", tg("col_grade"), tg("col_size"), "Solidity", tg("col_defect")].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-2 py-1.5 text-start font-bold text-muted text-xs sm:text-sm whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hasil.payload.objek.slice(0, 8).map((o) => (
                    <tr key={o.id} className="border-b border-line last:border-0">
                      <td className="type-body-sm tnum px-2 py-1.5 text-muted">
                        {o.id}
                      </td>
                      <td className="px-2 py-1.5">
                        <GradeBadge grade={toGrade(o.grade)} size="sm" />
                      </td>
                      <td className="type-body-sm tnum px-2 py-1.5 text-ink">
                        {o.ukuran_mm2 != null ? `${num(o.ukuran_mm2)} mm²` : "-"}
                      </td>
                      <td className="type-body-sm tnum px-2 py-1.5 text-ink">
                        {num(o.solidity, 2)}
                      </td>
                      <td className="type-body-sm px-2 py-1.5 text-muted">
                        {o.alasan_grade[0] ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasil.payload.hash_audit && (
              <div className="flex flex-col gap-1">
                <span className="type-label text-label">{t("bukti_hash_label")}</span>
                <p className="type-mono-sm break-all text-muted">
                  {hasil.payload.hash_audit}
                </p>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
