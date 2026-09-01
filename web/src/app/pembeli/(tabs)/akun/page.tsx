"use client";

import { BrandBar } from "@/components/chrome";
import AkunView from "@/components/akun-view";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

export default function AkunPembeliPage() {
  const store = useStore();
  const t = useTranslations("settings");

  const selesai = store.orders.filter(
    (o) => o.status === "selesai" && (o.status_kasus ?? "normal") === "normal",
  ).length;
  const peranLabel = store.sesi?.lokasi
    ? `${t("role_pembeli_industri")} \u2022 ${store.sesi.lokasi}`
    : t("role_pembeli_industri");

  return (
    <>
      <BrandBar title={t("title_pembeli")} />
      <AkunView
        peranLabel={peranLabel}
        baris={[
          {
            k: t("stat_orders"),
            v: String(store.orders.length),
            href: "/pembeli/pesanan",
          },
          {
            k: t("stat_completed_orders"),
            v: String(selesai),
            href: "/pembeli/pesanan",
          },
          {
            k: t("stat_active_inquiries"),
            v: String(Object.keys(store.inquiry).length),
            href: "/pembeli/inquiry",
          },
        ]}
      />
    </>
  );
}

