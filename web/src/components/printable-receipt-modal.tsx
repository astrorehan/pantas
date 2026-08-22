"use client";

import { useEffect, useState } from "react";
import { qrSvg as buatQrSvg } from "@/lib/qr";
import { formatRupiah } from "@/lib/format";
import { PrintModal } from "@/components/print-modal";
import { useTranslations } from "@/lib/i18n";
import type { Order } from "@/lib/store";

export function PrintableReceiptModal({
  order,
  isOpen,
  onClose,
}: {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("receipt");
  const [qrSvg, setQrSvg] = useState<string>("");

  useEffect(() => {
    if (!order) return;
    const lacakUrl = `${window.location.origin}/lacak/${order.kode}`;
    buatQrSvg(lacakUrl, { margin: 1, light: "#ffffff" }).then(setQrSvg);
  }, [order]);

  if (!isOpen || !order) return null;

  const formattedDate = new Date(order.tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <PrintModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("preview_title")}
      subtitle={t("preview_sub")}
    >
      <div
        data-print-sheet
        className="flex-1 overflow-y-auto bg-white p-4 text-stone-900 sm:p-8"
      >
        {/* Header Receipt */}
        <div className="flex items-start justify-between border-b-2 border-stone-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 font-display text-lg font-bold text-white">
                P
              </span>
              <span className="font-display text-2xl font-extrabold tracking-tight text-green-800">
                PANTAS
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-600">
              Platform Grading AI &amp; Ketelusuran Rantai Pasok Panen
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded-md border border-stone-300 bg-stone-100 px-2.5 py-1 font-mono text-xs font-bold text-stone-800">
              {t("official_badge")}
            </span>
            <p className="mt-1.5 font-mono text-sm font-bold text-stone-900">
              #{order.kode}
            </p>
            <p className="text-xs text-stone-500">{formattedDate}</p>
          </div>
        </div>

        {/* Transaction Metadata Grid */}
        <div className="mt-6 grid grid-cols-2 gap-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              {t("seller_title")}
            </p>
            <p className="mt-1 text-sm font-bold text-stone-900">{order.petani}</p>
            <p className="text-stone-600">Wilayah: DIY (Sleman / Bantul)</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              {t("buyer_title")}
            </p>
            <p className="mt-1 text-sm font-bold text-stone-900">{order.pembeli}</p>
            <p className="text-stone-600">Status Serah Terima: VERIFIKASI RESMI</p>
          </div>
        </div>

        {/* Order Details Table */}
        <div className="mt-6">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b-2 border-stone-800 text-stone-600">
                <th className="py-2.5 font-bold">{t("th_comm")}</th>
                <th className="py-2.5 text-center font-bold">{t("th_grade")}</th>
                <th className="py-2.5 text-right font-bold">{t("th_vol")}</th>
                <th className="py-2.5 text-right font-bold">{t("th_price")}</th>
                <th className="py-2.5 text-right font-bold">{t("th_sub")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium">
              <tr>
                <td className="py-3.5">
                  <p className="text-sm font-bold text-stone-900">{order.nama}</p>
                  <p className="font-mono text-[11px] text-stone-500">
                    ID: {order.id}
                  </p>
                </td>
                <td className="py-3.5 text-center">
                  <span className="inline-block rounded bg-green-700 px-2 py-0.5 font-bold text-white">
                    Grade {order.grade}
                  </span>
                </td>
                <td className="py-3.5 text-right font-mono text-sm font-bold">
                  {order.berat_kg} kg
                </td>
                <td className="py-3.5 text-right font-mono">
                  {formatRupiah(order.harga_per_kg)}
                </td>
                <td className="py-3.5 text-right font-mono text-sm font-bold text-green-800">
                  {formatRupiah(order.total)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total Block */}
          <div className="mt-4 flex items-center justify-between border-t-2 border-stone-800 pt-3">
            <span className="text-sm font-bold text-stone-900">
              {t("total_label")}
            </span>
            <span className="font-mono text-xl font-extrabold text-green-800">
              {formatRupiah(order.total)}
            </span>
          </div>
        </div>

        {/* Audit Verification & QR Code Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-6">
          <div className="max-w-xs text-xs">
            <p className="font-bold text-stone-800">{t("audit_title")}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
              {t("audit_desc")}
            </p>
            <div className="mt-3 flex gap-8">
              <div>
                <div className="h-10 w-28 border-b border-stone-400" />
                <p className="mt-1 text-center text-[10px] text-stone-500">
                  {t("sig_seller")}
                </p>
              </div>
              <div>
                <div className="h-10 w-28 border-b border-stone-400" />
                <p className="mt-1 text-center text-[10px] text-stone-500">
                  {t("sig_buyer")}
                </p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center text-center">
            {qrSvg ? (
              <div
                className="size-28 rounded-lg border border-stone-300 p-1 [&>svg]:size-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : null}
            <p className="mt-1 font-mono text-[9px] text-stone-500">
              PANTAS TRACEABILITY
            </p>
          </div>
        </div>
      </div>
    </PrintModal>
  );
}
