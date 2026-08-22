"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Check } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { ButtonLink, Card, GradeBadge } from "@/components/ui";
import { formatAngka, formatRupiah } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

function fmtTanggal(d: Date) {
  return `${d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} • ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".")}`;
}

export default function ListingTayangPage() {
  const t = useTranslations("listing_tayang");
  const store = useStore();
  const router = useRouter();
  // Satu batch bisa terbit sebagai beberapa lot per grade, jadi layar
  // ini mengonfirmasi sebuah himpunan, bukan satu baris.
  const listings = store.myListings.filter((l) =>
    store.lastPublishedIds.includes(l.id),
  );

  // Deep link without a fresh publish — nothing to confirm, go home.
  useEffect(() => {
    if (store.ready && listings.length === 0) router.replace("/petani");
  }, [store.ready, listings.length, router]);

  if (listings.length === 0) return null;

  const jamak = listings.length > 1;
  const totalKg = listings.reduce((n, l) => n + l.berat_kg, 0);
  const totalNilai = listings.reduce(
    (n, l) => n + l.berat_kg * l.harga_per_kg,
    0,
  );

  const wa = `https://wa.me/?text=${encodeURIComponent(
    jamak
      ? t("wa_text_multi", {
          details: listings
            .map(
              (l) =>
                `${l.nama} ${formatAngka(l.berat_kg)} kg Grade ${l.grade} ${formatRupiah(l.harga_per_kg)}/kg`,
            )
            .join("; "),
        })
      : t("wa_text_single", {
          nama: listings[0].nama,
          berat: formatAngka(listings[0].berat_kg),
          grade: listings[0].grade,
          harga: formatRupiah(listings[0].harga_per_kg),
          id: listings[0].id,
        }),
  )}`;

  return (
    <>
      {/* Layar konfirmasi tetap butuh jalur kembali — tombol footer mengarah
          maju ke listing, bukan keluar dari alur (F-82). */}
      <BackBar
        title={t("title")}
        href="/petani"
        parentLabel={t("home_label")}
      />

      <main className="flex-1 px-4 pt-12 pb-4">
        <div className="rise flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-full border-2 border-brand">
            <Check className="size-8 text-brand" strokeWidth={2.5} />
          </span>
          <h1 className="pt-5 text-2xl font-extrabold text-ink">
            {jamak
              ? t("heading_multi", { count: listings.length })
              : t("heading_single")}
          </h1>
          <p className="max-w-[280px] pt-2 text-sm leading-5 text-muted">
            {jamak ? t("desc_multi") : t("desc_single")}
          </p>
        </div>

        <div className="mx-auto flex max-w-lg flex-col gap-3 pt-8">
          {listings.map((l) => (
            <Card key={l.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-bold text-ink">{l.nama}</p>
                  <p className="pt-0.5 text-xs text-muted">
                    {formatAngka(l.berat_kg)} kg •{" "}
                    {formatRupiah(l.harga_per_kg)}/kg
                  </p>
                </div>
                <GradeBadge grade={l.grade} />
              </div>

              <div className="mt-4 divide-y divide-line border-t border-line">
                {[
                  { k: t("label_id"), v: l.id },
                  { k: t("label_lot_value"), v: formatRupiah(l.berat_kg * l.harga_per_kg) },
                  { k: t("label_published"), v: fmtTanggal(new Date()) },
                ].map(({ k, v }) => (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <span className="text-xs text-muted">{k}</span>
                    <span className="text-right text-xs font-bold text-ink">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {jamak && (
            <Card variant="raised" className="flex items-center justify-between gap-3 p-4">
              <span className="text-xs font-bold text-muted">
                {t("total_kg", { kg: formatAngka(totalKg) })}
              </span>
              <span className="tnum text-base font-bold text-brand">
                {formatRupiah(totalNilai)}
              </span>
            </Card>
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 flex flex-col gap-3 bg-canvas p-4">
        <ButtonLink
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          size="lg"
          block
        >
          {t("btn_whatsapp")}
        </ButtonLink>
        <ButtonLink href="/petani/listing" variant="secondary" size="lg" block>
          {t("btn_view_listings")}
        </ButtonLink>
      </footer>
    </>
  );
}
