"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, Info, TrendingUp, TriangleAlert } from "lucide-react";
import { BackBar } from "@/components/chrome";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  GradeBadge,
  SectionLabel,
  cx,
} from "@/components/ui";
import { pecahBeratPerGrade } from "@/lib/data";
import {
  MIN_OBJEK_KLAIM,
  nilaiSampel,
  type PenilaianSampel,
} from "@/lib/kekuatan-sampel";
import { formatAngka, formatRupiah, num, persen } from "@/lib/format";
import { haptic } from "@/lib/haptic";
import { useStore, type PublishInput } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import type { Grade, RekomendasiHarga } from "@/lib/types";

/** Rekomendasi untuk satu lot murni satu grade, dihitung di server. */
export interface RekomendasiLot {
  grade: Grade;
  /** Porsi grade ini pada batch asal [0..1], dari jumlah objek. */
  porsi: number;
  label: string;
  min: number;
  max: number;
  pengali: number;
}

type Mode = "campur" | "pisah";

interface BarisLot {
  grade: Grade;
  berat: number;
  harga: number;
}

const bulat100 = (n: number) => Math.round(n / 100) * 100;
const angkaDari = (teks: string, maks: number) => {
  const n = Number(teks.replace(/\D/g, "").slice(0, maks));
  return Number.isNaN(n) ? 0 : n;
};

const jepit = (n: number) => Math.min(100, Math.max(0, n));

/**
 * Penetapan harga.
 *
 * Petani boleh memberi harga di luar rentang AI — PANTAS menasihati, tidak
 * memaksa. Lencananya hanya menyatakan posisinya terhadap rekomendasi.
 *
 * Susunannya mengikuti satu pertanyaan yang dijawab berurutan: berapa harga
 * per kilo, berapa kilo yang dijual, jadi berapa uangnya, lalu diterbitkan
 * bagaimana. Sebelumnya penggeser harga dan angka harga duduk di dua kartu
 * yang berbeda — menggeser berarti mengubah angka yang tidak terlihat saat
 * digeser — dan perkiraan pendapatan hanya muncul sebagai baris kecil di dalam
 * kartu pilihan mode, padahal itulah angka yang paling dicari.
 *
 * Penerbitan punya dua bentuk, karena platform tidak bisa tahu apakah seorang
 * petani memilah panennya sesudah grading:
 *
 * - **Satu lot campur** — seluruh batch jadi satu listing pada grade dominan.
 *   Komposisinya ikut, jadi pembeli yang membaca "Grade B" juga melihat
 *   petinya berisi 14% A / 57% B / 29% C. Menjual campuran terukur sebagai
 *   grade murni adalah bagian yang tidak bisa dibela.
 * - **Pisah per grade** — satu listing per grade, masing-masing dihargai dari
 *   pengalinya sendiri. Hanya bentuk inilah yang jujur begitu panennya memang
 *   sudah berada di peti terpisah.
 */
export default function HargaForm({
  rec,
  komoditas,
  komposisi,
  perGrade,
  gradingId,
  gambarBatch,
  objekSampel,
  sampelKg,
}: {
  rec: RekomendasiHarga;
  /** Id komoditas engine (mis. "chili_merah_keriting"), bukan labelnya. */
  komoditas: string;
  /** Komposisi batch asal; null bila layar dibuka tanpa konteks pindaian. */
  komposisi: Partial<Record<Grade, number>> | null;
  perGrade: RekomendasiLot[];
  /** Baris `gradings` batch ini, bila dibuka dari arsip riwayat. */
  gradingId?: string;
  /** URL foto batch, bila dibuka dari arsip riwayat. */
  gambarBatch?: string;
  /** Butir yang dinilai engine; 0 bila layar dibuka tanpa konteks pindaian. */
  objekSampel: number;
  /** Perkiraan berat isi foto dalam kg, bila laporannya punya. */
  sampelKg?: number;
}) {
  const t = useTranslations("harga");
  const router = useRouter();
  const store = useStore();
  // Mulai di tengah rentang wajar agar cocok untuk komoditas apa pun.
  const [harga, setHarga] = useState(() => bulat100((rec.min + rec.max) / 2));
  /**
   * Berat dimulai kosong, bukan pada angka contoh.
   *
   * Sebelumnya bidang ini terisi 120 — bukan hasil pengukuran apa pun, dan
   * satu-satunya bidang di layar ini yang tidak bisa diturunkan dari data.
   * Nilai bawaan yang terlihat seperti data adalah nilai bawaan yang akan
   * terbit apa adanya: petani yang tidak menyadarinya menjual 120 kg yang tidak
   * pernah ditimbang siapa pun. Kosong berarti tombol terbit mati sampai
   * angkanya datang dari timbangan.
   */
  const [berat, setBerat] = useState(0);
  const [mode, setMode] = useState<Mode>("campur");
  const [publishing, setPublishing] = useState(false);

  /**
   * REJECT tidak pernah ikut terbit. Grade itu berarti veto patologi menemukan
   * pembusukan, dan menawarkannya ke pembeli industri sebagai lot berharga
   * adalah hal yang berbeda dari "grade rendah tetap punya pasar".
   */
  const lotLayak = useMemo(
    () => perGrade.filter((l) => l.grade !== "REJECT"),
    [perGrade],
  );
  const porsiReject = komposisi?.REJECT ?? 0;

  /**
   * Seberapa jauh batch ini boleh dijadikan klaim atas berat yang diisi.
   *
   * Layar ini menanyakan berat sekarung panen, sedangkan mutunya dinilai dari
   * butir yang muat di dalam satu foto. Selama ini jarak itu tidak pernah
   * diperiksa: satu tomat bergrade C cukup untuk menerbitkan "120 kg, Grade C,
   * komposisi 100% C". Aturannya ada di `lib/kekuatan-sampel.ts`.
   */
  const sampel = nilaiSampel({
    objek: objekSampel,
    berat_klaim_kg: berat,
    sampel_kg: sampelKg,
  });
  // Batch tanpa konteks pindaian tidak punya sampel untuk dinilai — layar ini
  // bisa dibuka langsung, dan diam lebih baik daripada menuduh.
  const adaSampel = objekSampel > 0;
  const klaimKomposisi = !adaSampel || sampel.boleh_klaim_komposisi;

  const bisaPisah =
    lotLayak.length > 1 && (!adaSampel || sampel.boleh_pisah_grade);

  // Bobot awal per grade mengikuti komposisi × berat batch. Petani menimpanya
  // dari timbangan — lihat catatan di layar soal jumlah objek vs berat.
  const [timpa, setTimpa] = useState<Partial<Record<Grade, number>>>({});
  const [hargaLot, setHargaLot] = useState<Partial<Record<Grade, number>>>({});

  const barisLot: BarisLot[] = useMemo(() => {
    const dasar = pecahBeratPerGrade(
      Object.fromEntries(lotLayak.map((l) => [l.grade, l.porsi])),
      berat,
    );
    return lotLayak.map((l) => {
      const bawaan = dasar.find((d) => d.grade === l.grade)?.berat_kg ?? 0;
      return {
        grade: l.grade,
        berat: timpa[l.grade] ?? bawaan,
        harga: hargaLot[l.grade] ?? bulat100((l.min + l.max) / 2),
      };
    });
  }, [lotLayak, berat, timpa, hargaLot]);

  const totalPisah = barisLot.reduce((n, b) => n + b.berat, 0);
  const pendapatanPisah = barisLot.reduce((n, b) => n + b.berat * b.harga, 0);
  const pendapatanCampur = berat * harga;
  const pendapatan = mode === "pisah" ? pendapatanPisah : pendapatanCampur;

  const { min, max } = rec;
  const status =
    harga < min ? "rendah" : harga > max ? "tinggi" : ("wajar" as const);

  const badge = {
    wajar: { text: t("badge_wajar"), tone: "brand" as const },
    rendah: { text: t("badge_rendah"), tone: "warn" as const },
    tinggi: { text: t("badge_tinggi"), tone: "danger" as const },
  }[status];

  // The slider spans slightly beyond the fair range so "outside" is reachable.
  const sliderMin = Math.round(min * 0.8);
  const sliderMax = Math.round(max * 1.3);
  const rentang = sliderMax - sliderMin || 1;
  const posisi = (n: number) => jepit(((n - sliderMin) / rentang) * 100);

  const bolehTerbit =
    mode === "campur"
      ? berat > 0 && harga > 0
      : barisLot.length > 0 &&
        barisLot.every((b) => b.berat > 0 && b.harga > 0);

  function publish() {
    if (publishing || !bolehTerbit) return;
    setPublishing(true);

    /* Menerbitkan dari arsip berarti `lastCapture` kosong — foto batch itu
       datang bersama tautannya. Sebelumnya keadaan ini jatuh ke foto stok
       rumah kaca, jadi lot yang terbit dari arsip memajang tomat milik orang
       lain kepada pembeli. */
    const gambar = gambarBatch ?? store.lastCapture ?? "";

    /* Sampel yang terlalu tipis kehilangan klaim komposisinya di sini, bukan
       hanya di layar. Komposisi adalah bidang yang dibaca pembeli, jadi
       menahannya harus terjadi pada data yang terbit — dan alasannya ikut
       tertulis, supaya pembeli tahu bedanya "tidak dirinci" dari "murni". */
    const catatanCampur = !komposisi
      ? undefined
      : klaimKomposisi
        ? sambung(
            t("note_mixed", {
              komposisi: ringkasKomposisi(komposisi),
              grade: rec.grade_dominan,
            }),
            adaSampel ? t("note_sample", { objek: objekSampel }) : null,
          )
        : t("note_mixed_thin", {
            grade: rec.grade_dominan,
            objek: objekSampel,
            berat: formatAngka(berat),
          });

    const lots: PublishInput[] =
      mode === "campur"
        ? [
            {
              nama: rec.komoditas_label,
              komoditas,
              grade: rec.grade_dominan,
              berat_kg: berat,
              harga_per_kg: harga,
              gambar,
              komposisi: klaimKomposisi ? (komposisi ?? undefined) : undefined,
              catatan_ai: catatanCampur,
            },
          ]
        : barisLot.map((b) => ({
            nama: `${rec.komoditas_label} Grade ${b.grade}`,
            komoditas,
            grade: b.grade,
            berat_kg: b.berat,
            harga_per_kg: b.harga,
            gambar,
            komposisi: { [b.grade]: 1 } as Partial<Record<Grade, number>>,
            catatan_ai: sambung(
              t("note_split", { grade: b.grade }),
              adaSampel ? t("note_sample", { objek: objekSampel }) : null,
            ),
          }));

    haptic.success();
    store.publishListings(lots, gradingId);
    router.push("/petani/listing-tayang");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* --------------------------------------------------------- Konteks */}
      <div className="flex flex-wrap items-center gap-3">
        <GradeBadge grade={rec.grade_dominan} size="md" />
        <h1 className="type-heading-lg min-w-0 text-ink">
          {rec.komoditas_label}
        </h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          {/* ------------------------------------------------ Harga per kg */}
          <Card className="rise min-w-0 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionLabel>{t("label_your_price")}</SectionLabel>
              <Badge
                tone={badge.tone}
                icon={
                  <span aria-hidden className="size-1.5 rounded-full bg-current" />
                }
              >
                {badge.text}
              </Badge>
            </div>

            <label
              htmlFor="harga"
              className="type-display-md mt-3 flex items-baseline gap-1 text-ink"
            >
              <span className="type-heading-md text-muted">Rp</span>
              <input
                id="harga"
                type="text"
                inputMode="numeric"
                value={formatAngka(harga)}
                onChange={(e) => setHarga(angkaDari(e.target.value, 8))}
                className="focus-ring type-display-md tnum min-h-11 w-full min-w-0 rounded-xs bg-transparent text-ink"
              />
              <span className="type-body-md shrink-0 text-muted">
                {t("per_kg_short")}
              </span>
            </label>

            {/* Rentang wajarnya digambar pada relnya sendiri, bukan hanya
                ditulis sebagai dua angka di bawah. Petani menggeser sampai
                keluar rentang tanpa pernah tahu di mana batasnya berada. */}
            <div className="pt-4">
              <input
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={100}
                value={harga}
                onChange={(e) => setHarga(Number(e.target.value))}
                aria-label={t("slider_aria")}
                aria-describedby="rentang-wajar"
                className="pantas-slider w-full"
                style={
                  { "--fill": `${posisi(harga)}%` } as React.CSSProperties
                }
              />

              {/* Rentang wajarnya digambar sebagai rel sendiri di bawah
                  penggeser, bukan sebagai warna pada relnya.
                  `.pantas-slider` mengecat latarnya dengan gradien penuh, jadi
                  apa pun yang ditaruh di belakangnya tidak pernah terlihat —
                  dan menaruhnya di depan akan menutupi isian yang justru
                  menunjukkan posisi harga sekarang. Dua rel yang sejajar
                  memberi tahu keduanya sekaligus. */}
              {/* Margin negatif: penggesernya kini setinggi 44px supaya bisa
                  disentuh, tapi relnya yang terlihat masih 8px di tengah kotak
                  itu. Tanpa ini, rel rentang wajar melayang 18px di bawah rel
                  yang seharusnya ia dampingi. */}
              <div
                aria-hidden
                className="-mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sunken"
              >
                <div
                  className="h-full rounded-full bg-brand/45"
                  style={{
                    marginInlineStart: `${posisi(min)}%`,
                    width: `${posisi(max) - posisi(min)}%`,
                  }}
                />
              </div>

              <p id="rentang-wajar" className="type-body-sm tnum pt-2 text-muted">
                {t("fair_range", {
                  min: formatRupiah(min),
                  max: formatAngka(max),
                })}
              </p>
            </div>
          </Card>

          {/* ---------------------------------------------------- Berat kg */}
          <Card className="min-w-0 p-5">
            <SectionLabel>
              <label htmlFor="berat">{t("label_batch_weight")}</label>
            </SectionLabel>
            {/*
              Kotak, bukan angka telanjang.

              Sebelumnya field ini adalah `<input>` tanpa latar, tanpa garis,
              setinggi 28px — bentuknya sama persis dengan angka besar di kartu
              harga tepat di atasnya, dan angka itu diatur penggeser, bukan
              diketik. Jadi satu-satunya hal yang harus diketik di layar ini
              adalah satu-satunya hal yang tidak tampak bisa diketik, dan
              selama ia kosong tombol terbit tetap mati.

              Ukuran angkanya dipertahankan — ini memang angka utama kartu ini —
              yang ditambahkan cuma bahannya: permukaan cekung, garis, dan
              tinggi sentuh 44px.
            */}
            <div
              className={cx(
                "mt-2 flex items-center gap-2 rounded-md border bg-sunken px-3 py-2",
                "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand",
                berat > 0 ? "border-line" : "border-line-strong",
              )}
            >
              <input
                id="berat"
                type="text"
                inputMode="numeric"
                value={berat === 0 ? "" : formatAngka(berat)}
                onChange={(e) => {
                  setBerat(angkaDari(e.target.value, 6));
                  // Berat batch berubah berarti pembagian per grade ikut
                  // berubah; timpaan manual sebelumnya sudah tidak berlaku.
                  setTimpa({});
                }}
                /* `focus-ring` pindah ke pembungkus: yang harus menyala adalah
                   kotaknya, bukan garis teks di dalamnya. */
                className="type-heading-lg tnum min-h-11 w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-placeholder"
                placeholder="0"
              />
              <span className="type-body-md shrink-0 font-bold text-muted">
                {t("unit_kg")}
              </span>
            </div>

            {/* Dua angka berat hidup di dua layar dan tidak pernah saling
                menyebut: laporan mutu menulis perkiraan berat butir di dalam
                foto (sering di bawah satu kilo), layar ini menanyakan berat
                sekarung panen. Tanpa kalimat ini keduanya terlihat seperti
                angka yang sama yang saling bertentangan. */}
            <p className="type-body-sm pt-2 text-muted">
              {!adaSampel
                ? t("weight_hint")
                : sampelKg
                  ? t("weight_from_scan", {
                      objek: objekSampel,
                      sampel: num(sampelKg, 2),
                    })
                  : t("weight_from_scan_noest", { objek: objekSampel })}
            </p>
          </Card>
        </div>

        {/* ------------------------------------------------ Uang & rincian */}
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">
          <Card className="rise min-w-0 p-5 surface-brand">
            <SectionLabel>{t("earnings_label")}</SectionLabel>
            {/* Tanpa berat, angkanya bukan Rp 0 — ia belum ada. Menampilkan
                nol membuat layar terlihat sudah menghitung sesuatu. */}
            <p className="type-display-md tnum flex items-center gap-2 pt-2 text-brand">
              <TrendingUp aria-hidden className="size-6 shrink-0" />
              <span className="min-w-0 break-all">
                {pendapatan > 0 ? formatRupiah(pendapatan) : "-"}
              </span>
            </p>
            <p className="type-body-sm pt-2 text-muted">
              {pendapatan <= 0
                ? t("earnings_need_weight")
                : mode === "pisah"
                  ? t("earnings_split", { count: barisLot.length })
                  : t("earnings_mixed", {
                      berat: formatAngka(berat),
                      harga: formatRupiah(harga),
                    })}
            </p>
          </Card>

          <RincianPerhitunganCard rec={rec} />
        </div>
      </div>

      {/* Peringatan sampel duduk sebelum pilihan cara terbit, bukan sesudah:
          ia mengubah arti dari kedua pilihan itu. */}
      {adaSampel && sampel.tingkat !== "cukup" && (
        <PeringatanSampel sampel={sampel} berat={berat} />
      )}

      {/* ------------------------------------------------------ Cara terbit */}
      <section aria-labelledby="cara-terbit" className="min-w-0">
        <SectionLabel>
          <span id="cara-terbit">{t("label_publish_mode")}</span>
        </SectionLabel>

        <div
          role="radiogroup"
          aria-labelledby="cara-terbit"
          className="mt-2 grid gap-3 md:grid-cols-2"
        >
          <PilihanMode
            aktif={mode === "campur"}
            onClick={() => setMode("campur")}
            judul={t("mode_mixed_title")}
            isi={
              !komposisi
                ? t("mode_mixed_desc_pure")
                : klaimKomposisi
                  ? t("mode_mixed_desc_komp", {
                      grade: rec.grade_dominan,
                      komposisi: ringkasKomposisi(komposisi),
                    })
                  : t("mode_mixed_desc_nokomp", { grade: rec.grade_dominan })
            }
            total={pendapatanCampur}
          />
          <PilihanMode
            aktif={mode === "pisah"}
            onClick={() => bisaPisah && setMode("pisah")}
            nonaktif={!bisaPisah}
            judul={t("mode_split_title")}
            isi={
              bisaPisah
                ? t("mode_split_desc_ready", { count: lotLayak.length })
                : adaSampel && !sampel.boleh_pisah_grade
                  ? t("mode_split_desc_thin", { min: MIN_OBJEK_KLAIM })
                  : t("mode_split_desc_unready")
            }
            total={pendapatanPisah}
          />
        </div>

        {mode === "pisah" && (
          <div className="mt-3 flex flex-col gap-3">
            <p className="type-body-sm text-muted">{t("table_caption")}</p>

            {/* Satu kartu per lot, bukan tabel lima kolom. Tabel itu punya
                lebar minimum 30rem — di ponsel ia mendorong seluruh halaman
                keluar layar, dan dua kolom yang bisa diisi justru yang paling
                sempit. */}
            {barisLot.map((b) => {
              const info = lotLayak.find((l) => l.grade === b.grade)!;
              return (
                <Card key={b.grade} className="min-w-0 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <GradeBadge grade={b.grade} size="sm" />
                    <span className="type-body-sm tnum text-muted">
                      {t("lot_share", { porsi: persen(info.porsi) })}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="min-w-0">
                      <label
                        htmlFor={`berat-${b.grade}`}
                        className="type-body-sm block text-muted"
                      >
                        {t("col_berat")}
                      </label>
                      <div className="mt-1 flex items-baseline gap-2">
                        <input
                          id={`berat-${b.grade}`}
                          type="text"
                          inputMode="numeric"
                          value={b.berat === 0 ? "" : formatAngka(b.berat)}
                          onChange={(e) =>
                            setTimpa((v) => ({
                              ...v,
                              [b.grade]: angkaDari(e.target.value, 6),
                            }))
                          }
                          className="focus-ring type-heading-sm tnum min-h-11 w-full min-w-0 rounded-xs border border-line bg-canvas px-3 py-2 text-ink"
                        />
                        <span className="type-body-sm shrink-0 text-muted">
                          {t("unit_kg")}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <label
                        htmlFor={`harga-${b.grade}`}
                        className="type-body-sm block text-muted"
                      >
                        {t("col_harga")}
                      </label>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="type-body-sm shrink-0 text-muted">
                          Rp
                        </span>
                        <input
                          id={`harga-${b.grade}`}
                          type="text"
                          inputMode="numeric"
                          value={formatAngka(b.harga)}
                          onChange={(e) =>
                            setHargaLot((h) => ({
                              ...h,
                              [b.grade]: angkaDari(e.target.value, 8),
                            }))
                          }
                          className="focus-ring type-heading-sm tnum min-h-11 w-full min-w-0 rounded-xs border border-line bg-canvas px-3 py-2 text-ink"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <span className="type-body-sm tnum text-muted">
                      {t("lot_fair", {
                        min: formatAngka(info.min),
                        max: formatAngka(info.max),
                      })}
                    </span>
                    <span className="type-body-md tnum font-bold text-brand">
                      {formatRupiah(b.berat * b.harga)}
                    </span>
                  </div>
                </Card>
              );
            })}

            <Card variant="flat" className="min-w-0 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="type-body-md font-bold text-ink">
                  {t("table_total")}
                </span>
                <span className="type-body-md tnum text-muted">
                  {formatAngka(totalPisah)} {t("unit_kg")}
                </span>
                <span className="type-heading-md tnum font-bold text-brand">
                  {formatRupiah(pendapatanPisah)}
                </span>
              </div>
            </Card>

            {barisLot.some((b) => b.berat <= 0) && (
              <p role="alert" className="type-body-sm font-bold text-danger">
                {t("warn_zero_weight")}
              </p>
            )}

            {totalPisah !== berat && (
              <p className="type-body-sm text-muted">
                {t("warn_weight_mismatch", {
                  total: formatAngka(totalPisah),
                  berat: formatAngka(berat),
                })}
              </p>
            )}
          </div>
        )}

        {porsiReject > 0 && (
          <p className="type-body-sm mt-3 flex gap-2 rounded-md border border-grade-b bg-sunken p-3 text-ink">
            <Info aria-hidden className="size-4 shrink-0" />
            <span className="min-w-0">
              {t("warn_reject_grade", { porsi: persen(porsiReject) })}
            </span>
          </p>
        )}
      </section>

      {/* Footer is sticky inside the flow, not fixed to a 430px frame — at
          1440px a fixed bar centred on a phone width lands nowhere. */}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {/* Tombol yang mati tanpa sebab hanya terbaca sebagai rusak. Alasannya
            berdiri di footer yang sama, bukan di kartu yang mungkin sudah
            tergulir keluar layar. */}
        <span className="type-body-sm tnum text-muted">
          {!bolehTerbit && mode === "campur" && berat <= 0 ? (
            <span className="font-bold text-ink">{t("blocked_need_weight")}</span>
          ) : (
            t("footer_total", {
              rupiah: pendapatan > 0 ? formatRupiah(pendapatan) : "-",
            })
          )}
        </span>
        <Button
          onClick={publish}
          disabled={!bolehTerbit}
          loading={publishing}
          size="xl"
          className="w-full md:w-auto"
        >
          {publishing
            ? t("btn_publishing")
            : mode === "pisah"
              ? t("btn_publish_split", { count: barisLot.length })
              : t("btn_publish")}
        </Button>
      </div>
    </div>
  );
}

/** Gabung kalimat catatan listing tanpa spasi ganda saat salah satu kosong. */
const sambung = (...bagian: (string | null)[]) =>
  bagian.filter(Boolean).join(" ");

/**
 * Jarak antara yang dinilai dan yang dijual, ditulis dengan angkanya sendiri.
 *
 * Peringatan yang hanya berbunyi "sampel kecil" tidak memberi tahu petani
 * seberapa kecil. Yang memberi tahu adalah kelipatannya: satu tomat 0,05 kg
 * dipakai sebagai keterangan untuk 120 kg berarti 2.400×, dan angka itulah
 * yang membuat masalahnya terlihat tanpa perlu dipercaya begitu saja.
 */
function PeringatanSampel({
  sampel,
  berat,
}: {
  sampel: PenilaianSampel;
  berat: number;
}) {
  const t = useTranslations("harga");
  const parah = sampel.tingkat === "sangat_tipis";

  return (
    <section
      role="note"
      aria-label={t(parah ? "sample_verythin_title" : "sample_thin_title")}
      className={cx(
        "flex min-w-0 gap-3 rounded-md border p-4",
        parah ? "border-danger bg-danger-tint" : "border-grade-b bg-sunken",
      )}
    >
      <TriangleAlert
        aria-hidden
        className={cx(
          "mt-0.5 size-5 shrink-0",
          parah ? "text-danger" : "text-grade-b",
        )}
      />
      <div className="min-w-0">
        <p className="type-body-md font-bold text-ink">
          {t(parah ? "sample_verythin_title" : "sample_thin_title")}
        </p>

        <p className="type-body-sm pt-1 text-ink">
          {t("sample_count", { objek: sampel.objek })}{" "}
          {/* Kelipatan ekstrapolasi adalah kalimat terkuat, tapi ia baru ada
              setelah beratnya diisi. Sebelum itu ukurannya jumlah butir — dan
              di bawah tiga butir "±100 poin persen" secara harfiah benar tapi
              tidak berarti apa-apa, jadi kasus itu bicara sendiri. */}
          {sampel.lipat !== null && berat > 0
            ? t("sample_factor", {
                berat: formatAngka(berat),
                lipat: formatAngka(sampel.lipat),
              })
            : sampel.objek < MIN_OBJEK_KLAIM
              ? t("sample_single")
              : t("sample_margin", {
                  objek: sampel.objek,
                  margin: sampel.margin_poin_persen,
                })}
        </p>

        {parah && (
          <p className="type-body-sm pt-2 text-muted">
            {t("sample_withheld", { objek: sampel.objek })}
          </p>
        )}

        <ButtonLink
          href="/petani/pindai"
          size="sm"
          variant="secondary"
          className="mt-3"
        >
          {t("sample_retake")}
        </ButtonLink>
      </div>
    </section>
  );
}

/** "14% A · 57% B · 29% C" — dipakai di kartu mode dan catatan listing. */
function ringkasKomposisi(k: Partial<Record<Grade, number>>) {
  return (["A", "B", "C", "REJECT"] as Grade[])
    .filter((g) => (k[g] ?? 0) > 0)
    .map((g) => `${persen(k[g] ?? 0)} ${g}`)
    .join(" · ");
}

function PilihanMode({
  aktif,
  nonaktif = false,
  onClick,
  judul,
  isi,
  total,
}: {
  aktif: boolean;
  nonaktif?: boolean;
  onClick: () => void;
  judul: string;
  isi: string;
  total: number;
}) {
  const t = useTranslations("harga");
  return (
    <button
      type="button"
      role="radio"
      // Nama aksesibel eksplisit: isi kartu ikut memuat perkiraan rupiah, dan
      // pembaca layar sebaiknya menyebut pilihannya lebih dulu.
      aria-label={judul}
      aria-checked={aktif}
      aria-disabled={nonaktif || undefined}
      onClick={onClick}
      className={cx(
        "tap tap-press focus-ring flex min-w-0 flex-col gap-1.5 rounded-md text-start",
        nonaktif && "opacity-60",
        aktif
          ? "border-2 border-brand bg-brand-tint p-4"
          : "border border-line bg-surface p-[17px] hover:border-line-strong",
      )}
    >
      <span className="type-heading-sm text-ink">{judul}</span>
      <span className="type-body-sm text-muted">{isi}</span>
      {!nonaktif && total > 0 && (
        <span className="type-body-md tnum pt-1 font-bold text-brand">
          {t("estimate_value", { rupiah: formatRupiah(total) })}
        </span>
      )}
    </button>
  );
}

export function HargaBackBar({ href }: { href: string }) {
  const t = useTranslations("harga");
  return (
    <BackBar title={t("title")} href={href} parentLabel={t("parent_label")} />
  );
}

/**
 * Rumus harganya, tertutup secara bawaan.
 *
 * Transparansi rumus adalah janji produk ini, jadi angkanya tetap ada dan tetap
 * lengkap. Tapi "pengali harga × 1,047" bukan langkah dalam pekerjaan menetapkan
 * harga — ia bukti bahwa angkanya bukan karangan, dan bukti dibuka saat
 * diragukan, bukan dibaca lebih dulu setiap kali.
 */
export function RincianPerhitunganCard({ rec }: { rec: RekomendasiHarga }) {
  const t = useTranslations("harga");
  const baris = [
    {
      k: t("calc_ref_price", { sumber: rec.harga_acuan_sumber }),
      v: formatRupiah(rec.harga_acuan),
    },
    { k: t("calc_dominant_grade"), v: rec.grade_dominan_label },
    { k: t("calc_quality_score"), v: num(rec.skor_kualitas, 2) },
    { k: t("calc_grade_weight"), v: `× ${num(rec.bobot_grade, 3)}` },
    { k: t("calc_price_multiplier"), v: `× ${num(rec.pengali, 3)}` },
  ];

  return (
    <details className="group min-w-0 overflow-hidden rounded-md border border-line bg-surface">
      <summary className="focus-ring tap flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="type-body-md block font-bold text-ink">
            {t("calc_details_title")}
          </span>
          <span className="type-body-sm block pt-0.5 text-muted">
            {t("calc_details_desc")}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
        />
      </summary>

      <dl className="type-body-sm grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-t border-line p-4">
        {baris.map(({ k, v }) => (
          <div key={k} className="contents">
            <dt className="min-w-0 text-muted">{k}</dt>
            <dd className="tnum text-end font-bold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
