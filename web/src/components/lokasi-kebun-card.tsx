"use client";

import { useState } from "react";
import { LocateFixed, MapPin, MapPinOff } from "lucide-react";
import { Button, Card, Input, SectionLabel, cx } from "@/components/ui";
import { toast } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

/**
 * Titik kebun petani.
 *
 * Peta pemasok mengambil koordinat lot dari profil pemiliknya lewat
 * `listings_view` — kolom `lat`/`lng` ada di `profiles`, bukan di `listings`.
 * Hanya akun seed yang punya koordinat itu; setiap petani yang mendaftar
 * sendiri profilnya lahir dengan lat/lng `null`, dan tidak ada satu pun layar
 * yang bisa mengisinya. Akibatnya lot mereka tayang di katalog, ikut terhitung
 * di daftar peta, tapi tidak pernah punya titik — "listing di peta tidak
 * lengkap" yang dilaporkan itu persis selisihnya.
 *
 * Kartunya menyebutkan keadaannya apa adanya ketika titiknya belum ada, karena
 * lot tanpa koordinat memang hilang dari peta dan petani berhak tahu kenapa.
 *
 * Koordinat diambil dari GPS peramban, bukan diketik: derajat desimal adalah
 * bentuk yang tidak bisa diperiksa siapa pun dengan mata, dan satu digit salah
 * memindahkan kebun ke kabupaten lain. Nama lokasinya tetap bisa diketik —
 * itu yang dibaca manusia di kartu lot.
 */
export function LokasiKebunCard() {
  const store = useStore();
  const t = useTranslations("lokasi_kebun");
  const tc = useTranslations("common");

  // Koordinat tidak ikut di `Sesi` — yang tersimpan di sana hanya `lokasi` yang
  // berupa teks. Titiknya dibaca dari lot petani sendiri, yang memang membawa
  // salinan koordinat profilnya.
  const titik = store.myListings.find((l) => l.lat != null && l.lng != null);
  const [lokasi, setLokasi] = useState(store.sesi?.lokasi ?? "");
  const [sedang, setSedang] = useState(false);

  const punyaTitik = Boolean(titik);
  const geoAda = typeof navigator !== "undefined" && "geolocation" in navigator;

  const ambilTitik = () => {
    if (!geoAda) {
      toast.galat(t("no_geo_title"), t("no_geo_desc"));
      return;
    }
    setSedang(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void (async () => {
          try {
            await store.simpanLokasiKebun(
              pos.coords.latitude,
              pos.coords.longitude,
              lokasi.trim() || undefined,
            );
            toast.sukses(t("saved_title"), t("saved_desc"));
          } catch (e) {
            toast.galat(
              t("failed_title"),
              e instanceof Error ? e.message : undefined,
            );
          } finally {
            setSedang(false);
          }
        })();
      },
      () => {
        setSedang(false);
        toast.galat(t("denied_title"), t("denied_desc"));
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>{t("section")}</SectionLabel>
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={cx(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              punyaTitik
                ? "bg-brand-tint text-brand"
                : "bg-sunken text-muted",
            )}
          >
            {punyaTitik ? (
              <MapPin className="size-5" />
            ) : (
              <MapPinOff className="size-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="type-body-lg font-bold text-ink">
              {punyaTitik ? t("set_title") : t("unset_title")}
            </p>
            <p className="type-body-md text-muted">
              {punyaTitik
                ? t("set_desc", {
                    lat: titik!.lat!.toFixed(4),
                    lng: titik!.lng!.toFixed(4),
                  })
                : t("unset_desc")}
            </p>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="type-label text-label">{t("place_label")}</span>
          <Input
            value={lokasi}
            onChange={(e) => setLokasi(e.target.value)}
            placeholder={t("place_placeholder")}
            autoComplete="address-level2"
          />
        </label>

        <Button onClick={ambilTitik} disabled={sedang} className="w-full sm:w-fit">
          <LocateFixed aria-hidden className="size-4" />
          {sedang ? tc("loading") : punyaTitik ? t("btn_update") : t("btn_set")}
        </Button>
      </Card>
    </section>
  );
}
