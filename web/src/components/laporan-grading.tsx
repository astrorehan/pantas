import type { ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Layers,
  Scale,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  Card,
  GradeBadge,
  GradeBar,
  GradeMark,
  SectionLabel,
  Table,
  cx,
  type Column,
} from "@/components/ui";
import { bacaAlasan } from "@/lib/alasan-grade";
import { URUT_GRADE, gradeDominan } from "@/lib/data";
import { num, persen } from "@/lib/format";
import { useTranslations } from "@/lib/i18n";
import type { Grade, LaporanGrading, ObjekGrading } from "@/lib/types";

type BarisObjek = ObjekGrading & { foto?: number };

const KUNCI_GRADE: Record<Grade, string> = {
  A: "a",
  B: "b",
  C: "c",
  REJECT: "reject",
};

/**
 * Laporan mutu tersimpan, dirender dari `gradings.hasil`.
 *
 * Urutannya adalah urutan keputusan petani, bukan urutan keluaran engine:
 * mutu apa yang didapat, berapa banyak tiap mutu, kira-kira berapa berat, dan
 * kenapa nilainya begitu. Angka yang tidak menjawab satu pun dari keempatnya —
 * mm²/piksel, solidity, keyakinan YOLO-2, faktor densitas, hash audit — pindah
 * ke bagian teknis yang tertutup. Angka-angka itu tidak dihapus: verifikator dan
 * pembeli industri memang memerlukannya, dan hash-nya adalah tautan sertifikat.
 * Yang berubah hanya siapa yang harus melewatinya lebih dulu.
 *
 * Menerima kedua bentuk laporan — satu foto (`GradingSuccess`) dan agregat
 * multi-sudut (`AgregatBatch`), karena keduanya tersimpan di kolom jsonb yang
 * sama dan halaman detail tidak boleh menebak yang mana.
 */
export function LaporanGradingView({
  laporan,
  /** Kolom bukti: foto batch, atau penggeser sudut pada pindai multi-foto. */
  media,
  judul,
}: {
  laporan: LaporanGrading;
  media?: ReactNode;
  judul?: string;
}) {
  const t = useTranslations("grading");
  const { komposisi } = laporan.ringkasan_batch;
  const dominan = gradeDominan(komposisi);
  const agregat = "foto_terproses" in laporan ? laporan : null;
  const objek = laporan.objek as BarisObjek[];
  const total = laporan.objek_terdeteksi;
  const estimasi = laporan.ringkasan_batch.estimasi_berat;

  const jumlah = URUT_GRADE.map((g) => ({
    grade: g,
    n: Math.round((komposisi[g] ?? 0) * total),
  }));
  const nDominan = jumlah.find((j) => j.grade === dominan)?.n ?? 0;

  const alasanUnik = [
    ...new Set(objek.flatMap((o) => o.alasan_grade ?? [])),
  ].slice(0, 6);

  const isi = (
    <div className="flex min-w-0 flex-col gap-4">
      {/* ------------------------------------------------------------ Vonis */}
      <Card className="min-w-0 overflow-hidden p-5">
        <SectionLabel>{judul ?? t("verdict_label")}</SectionLabel>

        <div className="flex flex-wrap items-center gap-3 pt-3">
          <GradeBadge grade={dominan} size="lg" />
          <p className="type-body-md tnum font-bold text-ink">
            {t("verdict_count", { n: nDominan, total })}
          </p>
        </div>

        <p className="type-body-md pt-3 text-muted">
          {t(`verdict_${KUNCI_GRADE[dominan]}`)}
        </p>

        <GradeBar
          komposisi={komposisi}
          height={28}
          showLegend={false}
          className="pt-5"
        />

        {/* Legenda ditulis sebagai jumlah butir, bukan persentase. Petani
            memuat peti dengan butir; persennya turunan, dan menaruhnya lebih
            dulu memaksa satu perkalian di kepala sebelum angkanya berguna. */}
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 pt-4 sm:grid-cols-4">
          {jumlah.map(({ grade, n }) => (
            <li key={grade} className="flex min-w-0 items-center gap-2">
              <GradeMark grade={grade} className="size-3 shrink-0" />
              <span className="type-body-sm min-w-0 flex-1 truncate text-muted">
                {t(`short_${KUNCI_GRADE[grade]}`)}
              </span>
              <span className="type-body-md tnum shrink-0 font-bold text-ink">
                {n}
              </span>
            </li>
          ))}
        </ul>

        {agregat && (
          <p className="type-body-sm mt-4 flex gap-2 rounded-md bg-sunken p-3 text-muted">
            <Layers aria-hidden className="size-4 shrink-0" />
            {t("combined_note", { count: agregat.foto_terproses })}
          </p>
        )}
      </Card>

      {/* ------------------------------------------------- Perkiraan berat */}
      <KartuPerkiraanBerat estimasi={estimasi} />

      {/* --------------------------------------------------- Kualitas foto */}
      <KartuKalibrasi laporan={laporan} />

      {/* ----------------------------------------------------- Kenapa mutu */}
      {alasanUnik.length > 0 && (
        <Card className="min-w-0 p-4">
          <SectionLabel>
            {t("why_dominant", { grade: t(`short_${KUNCI_GRADE[dominan]}`) })}
          </SectionLabel>
          <ul className="flex flex-col gap-2 pt-3">
            {alasanUnik.map((alasan) => (
              <li key={alasan} className="type-body-md flex gap-2 text-ink">
                <span aria-hidden className="pt-1 text-muted">
                  •
                </span>
                <span className="min-w-0">
                  <Alasan mentah={alasan} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ------------------------------------------------------- Teknis ▾ */}
      <DetailTeknis laporan={laporan} objek={objek} />
    </div>
  );

  if (!media) return isi;

  /* `min-w-0` bukan hiasan: tanpa itu tiap kolom grid memakai `min-width: auto`,
     yang berarti lebar min-content anaknya. Tabel per objek punya min-content
     529px, jadi di layar 375px seluruh kolom melar ke 529px dan setiap kartu
     di dalamnya ikut keluar layar. Itulah yang membuat halaman ini terpotong
     di ponsel. */
  return (
    <div className="grid gap-4 lg:grid-cols-[42fr_58fr] lg:items-start">
      <div className="min-w-0 lg:sticky lg:top-20">{media}</div>
      {isi}
    </div>
  );
}

/**
 * Satu alasan grade.
 *
 * Kalimat engine diterjemahkan bila polanya dikenali, dan ditampilkan apa
 * adanya bila tidak. Versi mentahnya tidak hilang — ia tetap tercetak utuh di
 * tabel per objek pada bagian teknis.
 */
function Alasan({ mentah }: { mentah: string }) {
  const t = useTranslations("alasan");
  const terbaca = bacaAlasan(mentah);
  if (!terbaca) return <>{mentah}</>;
  return <>{t(terbaca.kunci, terbaca.params)}</>;
}

/**
 * Perkiraan berat dari luas terkalibrasi.
 *
 * Aturan tampilan yang tidak boleh dilanggar: angka ini selalu muncul sebagai
 * rentang dan selalu berlabel perkiraan. Ia tidak menggantikan timbangan —
 * berat yang mengikat transaksi tetap berat aktual saat serah terima, dan
 * justru angka itulah yang mengkalibrasi faktornya lewat
 * ai_engine/calibrate_density.py.
 */
function KartuPerkiraanBerat({
  estimasi,
}: {
  estimasi?: LaporanGrading["ringkasan_batch"]["estimasi_berat"];
}) {
  const t = useTranslations("grading");

  // Laporan tersimpan dari sebelum estimasi berat ada tidak punya bidang ini.
  if (!estimasi) return null;

  if (!estimasi.tersedia) {
    return (
      <Card className="min-w-0 p-4">
        <SectionLabel>{t("weight_label")}</SectionLabel>
        <p className="type-body-md pt-2 text-muted">{estimasi.alasan}</p>
      </Card>
    );
  }

  const sebagian = estimasi.objek_terukur < estimasi.objek_total;

  return (
    <Card className="min-w-0 p-4">
      <SectionLabel>{t("weight_label")}</SectionLabel>

      <p className="type-heading-lg tnum flex items-center gap-2 pt-2 text-ink">
        <Scale aria-hidden className="size-6 shrink-0 text-brand" />
        {num(estimasi.min_kg, 2)}–{num(estimasi.max_kg, 2)} kg
      </p>

      {/* Angka ini dan kolom berat di layar harga adalah dua besaran berbeda —
          isi satu foto versus sekarung panen — dan sebelumnya tidak ada satu
          kalimat pun yang menyambungkan keduanya. */}
      <p className="type-body-md pt-2 text-muted">
        {t("weight_note", { objek: estimasi.objek_terukur })}
      </p>

      {sebagian && (
        <p className="type-body-sm pt-2 text-muted">
          {t("weight_partial", {
            terukur: estimasi.objek_terukur,
            total: estimasi.objek_total,
          })}
        </p>
      )}

      {estimasi.n_sampel_kalibrasi === 0 && (
        <p className="type-body-sm mt-3 rounded-md bg-sunken p-3 text-muted">
          {t("weight_unvalidated")}
        </p>
      )}
    </Card>
  );
}

/**
 * Kalibrasi koin, ditulis sebagai konsekuensi.
 *
 * "0,5 mm²/piksel" tidak memberi tahu petani apa pun yang bisa ia kerjakan.
 * Yang bisa ia kerjakan adalah: koinnya terbaca atau tidak, dan kalau tidak,
 * bagaimana cara memotret ulang supaya terbaca.
 */
function KartuKalibrasi({ laporan }: { laporan: LaporanGrading }) {
  const t = useTranslations("grading");
  const agregat = "foto_terproses" in laporan ? laporan : null;
  const valid = laporan.kalibrasi.valid;

  return (
    <Card
      className={cx(
        "flex min-w-0 gap-3 p-4",
        valid ? "" : "border border-grade-b",
      )}
    >
      {valid ? (
        <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
      ) : (
        <TriangleAlert
          aria-hidden
          className="mt-0.5 size-5 shrink-0 text-grade-b"
        />
      )}
      <div className="min-w-0">
        <p className="type-body-md font-bold text-ink">
          {valid ? t("coin_ok_title") : t("coin_bad_title")}
        </p>
        <p className="type-body-sm pt-1 text-muted">
          {valid ? t("coin_ok_desc") : t("coin_bad_desc")}
        </p>
        {agregat && (
          <p className="type-body-sm tnum pt-1 text-muted">
            {t("coin_multi", {
              calibrated: agregat.kalibrasi.foto_terkalibrasi,
              processed: agregat.foto_terproses,
            })}
          </p>
        )}
      </div>
    </Card>
  );
}

/**
 * Bagian teknis, tertutup secara bawaan.
 *
 * `<details>` asli, bukan state React: ia sudah bisa dibuka dengan keyboard,
 * sudah diumumkan pembaca layar sebagai grup yang bisa dilipat, dan tetap
 * berfungsi sebelum JavaScript-nya tiba.
 */
function DetailTeknis({
  laporan,
  objek,
}: {
  laporan: LaporanGrading;
  objek: BarisObjek[];
}) {
  const t = useTranslations("grading");
  const tc = useTranslations("common");
  const agregat = "foto_terproses" in laporan ? laporan : null;
  const estimasi = laporan.ringkasan_batch.estimasi_berat;

  const kolom: Column<BarisObjek>[] = [
    {
      key: "id",
      header: "#",
      cell: (o) => (agregat ? `${(o.foto ?? 0) + 1}.${o.id}` : String(o.id)),
    },
    { key: "grade", header: "Grade", cell: (o) => o.grade },
    {
      key: "ukuran",
      header: t("col_size"),
      align: "end",
      cell: (o) => (o.ukuran_mm2 == null ? "-" : `${num(o.ukuran_mm2, 0)} mm²`),
    },
    {
      key: "solidity",
      header: "Solidity",
      align: "end",
      cell: (o) => num(o.solidity, 2),
    },
    {
      key: "kondisi",
      header: "YOLO-2",
      cell: (o) =>
        o.yolo2_kondisi === "tidak_dinilai"
          ? tc("not_rated")
          : `${o.yolo2_kondisi} (${Math.round((o.yolo2_conf ?? 0) * 100)}%)`,
    },
    {
      key: "cacat",
      header: t("col_defect"),
      prosa: true,
      // `cacat` adalah daftar objek {jenis, tipe, luas_persen}, bukan string —
      // menampilkannya apa adanya menghasilkan "[object Object]".
      // Cacat bentuk dilaporkan engine dengan `luas_persen: 0` — persentasenya
      // hanya berarti untuk bercak, jadi angka nol tidak ikut ditampilkan.
      cell: (o) =>
        o.cacat?.length
          ? o.cacat
              .map((c) =>
                c.luas_persen ? `${c.jenis} (${num(c.luas_persen, 1)}%)` : c.jenis,
              )
              .join(", ")
          : "-",
    },
    {
      // Kalimat engine apa adanya. Kartu "kenapa" di atas menampilkan versi
      // yang sudah diterjemahkan; ini tempat versi aslinya tetap terbaca,
      // termasuk ambang batas yang dipakai saat penilaian.
      key: "alasan",
      header: t("col_reason"),
      prosa: true,
      cell: (o) => o.alasan_grade?.join("; ") || "-",
    },
  ];

  const ukuran: { k: string; v: string }[] = [
    {
      k: t("tech_uniformity"),
      v: persen(laporan.ringkasan_batch.skor_keseragaman),
    },
  ];
  if ("px_per_mm2" in laporan.kalibrasi) {
    ukuran.push({
      k: t("tech_px"),
      v: `${num(laporan.kalibrasi.px_per_mm2, 2)} mm²/piksel`,
    });
  }
  if (estimasi?.tersedia) {
    ukuran.push(
      { k: t("tech_area"), v: `${num(estimasi.luas_total_mm2, 0)} mm²` },
      {
        k: t("tech_density"),
        v: `${num(estimasi.faktor_gram_per_mm2, 4)} g/mm²`,
      },
      { k: t("tech_midpoint"), v: `${num(estimasi.kg, 2)} kg` },
      {
        k: t("tech_uncertainty"),
        v: `±${persen(estimasi.rel_ketidakpastian)}`,
      },
      { k: t("tech_factor_source"), v: estimasi.sumber_faktor },
      {
        k: t("tech_calib_samples"),
        v: String(estimasi.n_sampel_kalibrasi),
      },
    );
  }

  return (
    <details className="group min-w-0 overflow-hidden rounded-md border border-line bg-surface">
      <summary className="focus-ring tap flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="type-body-md block font-bold text-ink">
            {t("tech_title")}
          </span>
          <span className="type-body-sm block pt-0.5 text-muted">
            {t("tech_desc")}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="flex min-w-0 flex-col gap-4 border-t border-line p-4">
        <dl className="type-body-sm grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
          {ukuran.map(({ k, v }) => (
            <div key={k} className="contents">
              <dt className="min-w-0 text-muted">{k}</dt>
              <dd className="tnum text-end font-bold break-all text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        {laporan.hash_audit && (
          <div className="min-w-0 border-t border-line pt-3">
            <SectionLabel>{t("tech_hash")}</SectionLabel>
            <Link
              href={`/lacak/${encodeURIComponent(laporan.hash_audit)}`}
              className="type-mono-sm mt-1 flex items-center gap-2 break-all text-brand hover:underline"
            >
              <ShieldCheck aria-hidden className="size-4 shrink-0" />
              {laporan.hash_audit}
            </Link>
          </div>
        )}

        {objek.length > 0 && (
          <div className="min-w-0 border-t border-line pt-3">
            <SectionLabel>{t("per_object_detail")}</SectionLabel>
            <div className="min-w-0 pt-2">
              <Table
                rows={objek}
                columns={kolom}
                rowKey={(o) => `${o.foto ?? 0}-${o.id}`}
                density="compact"
                caption={
                  agregat ? t("table_caption_multi") : t("table_caption_single")
                }
              />
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
