"use client";

import { Truck } from "lucide-react";
import { Card, SectionLabel } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { hitungOngkos, ongkosPerKg } from "@/lib/ongkos";
import { useTranslations } from "@/lib/i18n";

/**
 * Rincian ongkos angkut (F-53).
 *
 * PRD §EP-F: "Rumus ditampilkan, tidak disembunyikan." Karena itu kartu ini
 * merender tiap suku beserta rumusnya, bukan satu angka total — pembeli yang
 * menawar berhak tahu mana bagian yang berubah kalau ia menambah muatan dan
 * mana yang tetap.
 */
export function KartuOngkos({
  jarakKm,
  beratKg,
  konsolidasi = false,
  judul,
  catatan,
}: {
  /**
   * Jarak tempuh, atau `null` bila koordinat kebunnya belum diatur.
   *
   * Jarak nol bukan pengganti yang aman: komponen jaraknya adalah suku terbesar
   * pada tarif ini (Rp3.500/km), jadi menghitungnya sebagai nol menghasilkan
   * ongkos yang jauh lebih murah daripada rit yang sebenarnya. Lebih baik
   * mengatakan belum bisa dihitung.
   */
  jarakKm: number | null;
  beratKg: number;
  konsolidasi?: boolean;
  judul?: string;
  catatan?: string;
}) {
  const t = useTranslations("ongkos");
  const ongkos = hitungOngkos({
    jarak_km: jarakKm ?? 0,
    berat_kg: beratKg,
    konsolidasi,
  });

  if (jarakKm === null) {
    return (
      <Card className="p-4">
        <SectionLabel className="flex items-center gap-1.5">
          <Truck aria-hidden className="size-4" />
          {judul ?? t("default_title")}
        </SectionLabel>
        <p className="type-body-md pt-3 text-ink">{t("no_distance_title")}</p>
        <p className="type-body-sm pt-1 text-muted">{t("no_distance_desc")}</p>
      </Card>
    );
  }

  const getLabel = (label: string) => {
    if (label === "Biaya keberangkatan") return t("departure_fee");
    if (label === "Jarak tempuh") return t("distance_label");
    if (label === "Bobot muatan") return t("weight_label");
    return label;
  };

  const getRumus = (rumus: string) => {
    if (rumus === "tarif dasar armada") return t("departure_formula");
    return rumus;
  };

  return (
    <Card className="p-4">
      <SectionLabel className="flex items-center gap-1.5">
        <Truck aria-hidden className="size-4" />
        {judul ?? t("default_title")}
      </SectionLabel>

      <dl className="mt-3 divide-y divide-line border-t border-line">
        {ongkos.suku.map((s) => (
          <div key={s.label} className="flex items-baseline justify-between gap-3 py-2">
            <dt className="min-w-0">
              <span className="type-body-sm block text-ink">{getLabel(s.label)}</span>
              <span className="type-body-sm block text-label">{getRumus(s.rumus)}</span>
            </dt>
            <dd className="type-body-sm tnum shrink-0 text-ink">
              {formatRupiah(s.nilai)}
            </dd>
          </div>
        ))}

        {ongkos.diskon > 0 && (
          <div className="flex items-baseline justify-between gap-3 py-2">
            <dt className="min-w-0">
              <span className="type-body-sm block text-brand">
                {t("discount_title")}
              </span>
              <span className="type-body-sm block text-label">
                {t("discount_note")}
              </span>
            </dt>
            <dd className="type-body-sm tnum shrink-0 text-brand">
              −{formatRupiah(ongkos.diskon)}
            </dd>
          </div>
        )}

        <div className="flex items-baseline justify-between gap-3 pt-2.5">
          <dt className="type-body-md font-bold text-ink">{t("total_label")}</dt>
          <dd className="text-end">
            <span className="type-heading-sm tnum block text-ink">
              {formatRupiah(ongkos.total)}
            </span>
            {beratKg > 0 && (
              <span className="type-body-sm tnum block text-muted">
                ≈ {formatRupiah(ongkosPerKg(ongkos, beratKg))}/kg
              </span>
            )}
          </dd>
        </div>
      </dl>

      <p className="type-body-sm pt-3 text-label">
        {catatan ?? t("default_note")}
      </p>
    </Card>
  );
}
