"use client";

import { useEffect, useState } from "react";
import { qrSvg as buatQrSvg } from "@/lib/qr";
import { PrintModal } from "@/components/print-modal";
import { useTranslations } from "@/lib/i18n";

/** Enam label per lembar A4, grid 2×3. */
const JUMLAH_LABEL = 6;

export function PrintableCrateLabelsModal({
  nama,
  komoditas,
  grade,
  hashAudit,
  beratKg = 25,
  isOpen,
  onClose,
}: {
  nama: string;
  komoditas: string;
  grade: string;
  hashAudit?: string;
  beratKg?: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("receipt");
  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    const hash = hashAudit || "pantas-demo-hash-audit";
    const lacakUrl = `${window.location.origin}/lacak/${hash}`;
    buatQrSvg(lacakUrl, { margin: 1, light: "#ffffff" }).then(setQrSvg);
  }, [hashAudit]);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const hashShort = (hashAudit || "PANTAS-AUDIT-HASH-2026").slice(0, 16);

  return (
    <PrintModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("crate_title")}
      subtitle={t("crate_sub")}
      lebar="max-w-4xl"
    >
      {/* `print:grid-cols-2` mengunci tata letak lembarannya: di layar sempit
          labelnya menumpuk satu kolom, tetapi kertas A4 selalu memuat dua. */}
      <div
        data-print-sheet
        className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto bg-white p-4 text-stone-900 sm:grid-cols-2 sm:p-6 print:grid-cols-2"
      >
        {Array.from({ length: JUMLAH_LABEL }).map((_, index) => (
          <div
            key={index}
            className="flex min-w-0 break-inside-avoid flex-col justify-between rounded-xl border-2 border-dashed border-stone-400 bg-stone-50 p-3.5 sm:p-4"
          >
            {/* Header Label */}
            <div className="flex items-center justify-between gap-2 border-b border-stone-300 pb-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-green-700 text-xs font-bold text-white">
                  P
                </span>
                <span className="truncate font-display text-xs font-bold text-green-900">
                  PANTAS TRACEABILITY
                </span>
              </div>
              <span className="shrink-0 rounded bg-green-700 px-2 py-0.5 text-xs font-bold text-white">
                GRADE {grade}
              </span>
            </div>

            {/* Body */}
            <div className="my-3 flex min-w-0 items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-stone-900">{nama}</p>
                <p className="truncate text-[11px] capitalize text-stone-600">
                  Komoditas: {komoditas}
                </p>
                <p className="text-[11px] text-stone-600">
                  Netto: ~{beratKg} kg / Peti
                </p>
                <p className="mt-1 truncate font-mono text-[10px] text-stone-500">
                  Hash: {hashShort}…
                </p>
              </div>

              {/* QR Code */}
              <div className="flex shrink-0 flex-col items-center">
                {qrSvg ? (
                  <div
                    className="size-16 rounded border border-stone-300 bg-white p-0.5 sm:size-20 [&>svg]:size-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : null}
                <span className="mt-0.5 font-mono text-[8px] text-stone-500">
                  SCAN UNTUK LACAK
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-stone-200 pt-1.5 text-[9px] text-stone-500">
              <span>
                Peti #{index + 1} dari {JUMLAH_LABEL}
              </span>
              <span>Tgl Panen: {todayStr}</span>
            </div>
          </div>
        ))}
      </div>
    </PrintModal>
  );
}
