"use client";

import { useMemo } from "react";
import { FilterSheet } from "@/components/ui/filter-sheet";
import { Select } from "@/components/ui/select";
import type { SelectOption } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { KOMODITAS, URUT_GRADE } from "@/lib/data";
import { useTranslations } from "@/lib/i18n";

export interface PanelFilterProps {
  jumlahAktif: number;
  onReset: () => void;
  komoditas: string;
  grade: string;
  dari: string;
  sampai: string;
  onUbahFilter: (key: "komoditas" | "grade" | "dari" | "sampai", val: string) => void;
}

export function PanelFilter({
  jumlahAktif,
  onReset,
  komoditas,
  grade,
  dari,
  sampai,
  onUbahFilter,
}: PanelFilterProps) {
  const t = useTranslations("riwayat");

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

  return (
    <FilterSheet
      jumlahAktif={jumlahAktif}
      onReset={onReset}
      description={t("filter_desc")}
    >
      <Select
        id="f-komoditas"
        label={t("filter_komoditas")}
        value={komoditas}
        onChange={(v) => onUbahFilter("komoditas", v)}
        options={opsiKomoditas}
      />
      <Select
        id="f-grade"
        label={t("filter_grade")}
        value={grade}
        onChange={(v) => onUbahFilter("grade", v)}
        options={opsiGrade}
      />
      <Input
        id="f-dari"
        type="date"
        label={t("filter_dari")}
        value={dari}
        max={sampai || undefined}
        onChange={(e) => onUbahFilter("dari", e.target.value)}
      />
      <Input
        id="f-sampai"
        type="date"
        label={t("filter_sampai")}
        value={sampai}
        min={dari || undefined}
        onChange={(e) => onUbahFilter("sampai", e.target.value)}
      />
    </FilterSheet>
  );
}

export default PanelFilter;
