import { Info, Scale } from "lucide-react";
import { Badge, Card, SectionLabel } from "@/components/ui";
import { num, persen } from "@/lib/format";
import type { EstimasiBerat } from "@/lib/types";
import { useTranslations } from "@/lib/i18n";

/**
 * Estimasi berat batch dari luas terkalibrasi (F-101).
 *
 * Aturan tampilan yang tidak boleh dilanggar: angka ini selalu muncul sebagai
 * rentang dan selalu berlabel estimasi. Ia tidak menggantikan timbangan —
 * berat yang mengikat transaksi tetap berat aktual saat serah terima, dan
 * justru angka itulah yang mengkalibrasi faktornya lewat
 * ai_engine/calibrate_density.py.
 */
export function EstimasiBeratCard({
  estimasi,
  className,
}: {
  estimasi?: EstimasiBerat;
  className?: string;
}) {
  const t = useTranslations("weight_estimation");

  // Laporan tersimpan dari sebelum F-101 tidak punya bidang ini sama sekali.
  if (!estimasi) return null;

  if (!estimasi.tersedia) {
    return (
      <Card className={className}>
        <div className="p-4">
          <SectionLabel>{t("title")}</SectionLabel>
          <p className="type-body-md pt-2 text-muted">{estimasi.alasan}</p>
        </div>
      </Card>
    );
  }

  const sebagian = estimasi.objek_terukur < estimasi.objek_total;
  const belumTervalidasi = estimasi.n_sampel_kalibrasi === 0;

  return (
    <Card className={className}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <SectionLabel>{t("title")}</SectionLabel>
          <Badge tone={belumTervalidasi ? "warn" : "info"}>
            {belumTervalidasi
              ? t("unvalidated")
              : t("calibrated", { count: estimasi.n_sampel_kalibrasi })}
          </Badge>
        </div>

        <p className="type-heading-lg tnum pt-3 text-ink">
          <Scale aria-hidden className="mb-1 me-2 inline size-5 text-brand" />
          {num(estimasi.min_kg, 2)}–{num(estimasi.max_kg, 2)} kg
        </p>
        <p className="type-body-sm tnum pt-1 text-muted">
          {t("midpoint", {
            kg: num(estimasi.kg, 2),
            pct: persen(estimasi.rel_ketidakpastian),
          })}
        </p>

        <dl className="type-body-sm tnum grid grid-cols-2 gap-x-4 gap-y-1 pt-3">
          <dt className="text-muted">{t("measured_area")}</dt>
          <dd className="text-end font-bold text-ink">
            {num(estimasi.luas_total_mm2, 0)} mm²
          </dd>
          <dt className="text-muted">{t("density_factor")}</dt>
          <dd className="text-end font-bold text-ink">
            {num(estimasi.faktor_gram_per_mm2, 4)} g/mm²
          </dd>
          <dt className="text-muted">{t("measured_objects")}</dt>
          <dd className="text-end font-bold text-ink">
            {t("objects_ratio", {
              done: estimasi.objek_terukur,
              total: estimasi.objek_total,
            })}
          </dd>
        </dl>

        <p className="type-body-sm mt-3 flex gap-2 rounded-md bg-sunken p-3 text-muted">
          <Info aria-hidden className="size-4 shrink-0" />
          <span>
            {t("info_note")}{" "}
            {sebagian &&
              t("partial_note", {
                count: estimasi.objek_total - estimasi.objek_terukur,
                done: estimasi.objek_terukur,
              })}{" "}
            {t("factor_source", { source: estimasi.sumber_faktor })}
          </span>
        </p>
      </div>
    </Card>
  );
}
