"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Truck } from "lucide-react";
import { BrandBar } from "@/components/chrome";
import AkunView from "@/components/akun-view";
import { LokasiKebunCard } from "@/components/lokasi-kebun-card";
import { getJumlahRiwayatGrading } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

export default function AkunPetaniPage() {
  const store = useStore();
  const t = useTranslations("settings");
  const selesai = store.orders.filter(
    (o) => o.status === "selesai" && (o.status_kasus ?? "normal") === "normal",
  ).length;
  const aktif = store.orders.filter((o) => {
    const kasus = o.status_kasus ?? "normal";
    return kasus !== "dibatalkan" && !(o.status === "selesai" && kasus === "normal");
  }).length;

  /**
   * Hitungan arsip, bukan panjang singgahan.
   *
   * `store.scans` dibatasi delapan baris (lihat `getJumlahRiwayatGrading`), jadi
   * membacanya di sini membuat Akun mengaku 8 sementara layar Riwayat — yang
   * bertanya dengan `count: "exact"` — mengaku 15. Panjang singgahan tetap
   * dipakai sebagai nilai awal supaya ubinnya tidak berkedip dari 0.
   */
  const [jumlahPindaian, setJumlahPindaian] = useState(store.scans.length);
  useEffect(() => {
    let batal = false;
    void getJumlahRiwayatGrading(store.scans.length).then((n) => {
      if (!batal) setJumlahPindaian(n);
    });
    return () => {
      batal = true;
    };
  }, [store.scans.length]);

  // Label peran: gunakan lokasi dari profil jika tersedia, jika tidak cukup "Petani"
  const peranLabel = store.sesi?.lokasi
    ? `${t("role_petani")} • ${store.sesi.lokasi}`
    : t("role_petani");

  return (
    <>
      <BrandBar title={t("title_petani")} />
      <AkunView
        peranLabel={peranLabel}
        sebelumAktivitas={<LokasiKebunCard />}
        baris={[
          {
            k: t("stat_active_listings"),
            v: String(store.myListings.length),
            href: "/petani/listing",
          },
          {
            k: t("stat_saved_scans"),
            v: String(jumlahPindaian),
            href: "/petani/riwayat",
          },
          {
            k: t("stat_completed_orders"),
            v: String(selesai),
            href: "/petani/pesanan",
          },
          {
            k: t("stat_active_orders"),
            v: String(aktif),
            href: "/petani/pesanan",
          },
        ]}
        tautan={[
          {
            href: "/petani/dampak",
            label: t("explore_impact_title"),
            deskripsi: t("explore_impact_desc"),
            icon: TrendingUp,
          },
          {
            href: "/petani/logistik",
            label: t("explore_logistics_title"),
            deskripsi: t("explore_logistics_desc"),
            icon: Truck,
          },
        ]}
      />
    </>
  );
}
