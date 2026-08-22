"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Loader2, Info } from "lucide-react";
import { getRuteUntukPengiriman, type PenugasanRute } from "@/lib/data";
import { Skeleton } from "@/components/ui";
import { useTranslations } from "@/lib/i18n";

export function RutePenjemputan({
  pengirimanId,
  metode,
}: {
  pengirimanId: string;
  metode: "jemput_mandiri" | "konsolidasi" | "kurir_mitra";
}) {
  const t = useTranslations("logistik");
  const [penugasan, setPenugasan] = useState<PenugasanRute | null>(null);
  const [memuat, setMemuat] = useState(metode === "konsolidasi");

  useEffect(() => {
    if (metode !== "konsolidasi") return;
    let aktif = true;
    getRuteUntukPengiriman(pengirimanId)
      .then((hasil) => {
        if (aktif) setPenugasan(hasil);
      })
      .finally(() => {
        if (aktif) setMemuat(false);
      });
    return () => {
      aktif = false;
    };
  }, [pengirimanId, metode]);

  if (metode !== "konsolidasi") {
    return (
      <div className="rounded-md border border-line bg-sunken p-4 flex items-start gap-2">
        <Info className="size-5 text-muted shrink-0" aria-hidden />
        <p className="type-body-sm text-muted">
          {metode === "jemput_mandiri"
            ? t("mandiri_msg")
            : t("courier_msg")}
        </p>
      </div>
    );
  }

  if (memuat) {
    return (
      <div className="rounded-md border border-line bg-sunken p-4 flex items-center gap-3">
        <Loader2 className="size-4 text-muted animate-spin" aria-hidden />
        <Skeleton className="h-4 w-64" />
        <span className="sr-only">{t("loading_msg")}</span>
      </div>
    );
  }

  if (!penugasan) {
    return (
      <div className="rounded-md border border-line bg-sunken p-4 flex items-start gap-2">
        <Clock className="size-5 text-muted shrink-0" aria-hidden />
        <p className="type-body-sm text-muted">
          {t("unscheduled_msg")}
        </p>
      </div>
    );
  }

  const { rute, item } = penugasan;
  const jam = item.perkiraan_tiba
    ? new Date(item.perkiraan_tiba).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="rounded-md border border-line bg-sunken p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="size-5 text-brand shrink-0" aria-hidden />
        <span className="type-body-md text-ink font-bold">
          {t("route_assigned", { no: rute.nomor })}
        </span>
      </div>
      <span className="type-body-sm text-muted">
        {jam ? t("eta_time", { time: jam }) : t("eta_pending")}
        {" · "}
        {t("stop_order", { seq: item.urutan, total: rute.item.length })}
      </span>
    </div>
  );
}

