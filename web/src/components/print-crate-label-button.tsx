"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintableCrateLabelsModal } from "@/components/printable-crate-labels-modal";

export function PrintCrateLabelButton({
  nama,
  komoditas,
  grade,
  hashAudit,
  label,
}: {
  nama: string;
  komoditas: string;
  grade: string;
  hashAudit: string;
  /**
   * Diterima sebagai prop, bukan dibaca dari `useTranslations`: pemanggilnya
   * halaman lacak publik yang dirender di server dan menerjemahkan lewat
   * `getTranslations`.
   */
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2 shrink-0"
      >
        <Tag className="size-4 text-brand" /> {label}
      </Button>

      <PrintableCrateLabelsModal
        nama={nama}
        komoditas={komoditas}
        grade={grade}
        hashAudit={hashAudit}
        beratKg={25}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
