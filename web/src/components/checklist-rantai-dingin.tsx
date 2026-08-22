"use client";

import { useState } from "react";
import { Check, Loader2, Snowflake } from "lucide-react";
import { Card, Checkbox, cx } from "@/components/ui";
import { toast } from "@/components/ui/toast";
import { simpanChecklistPengiriman } from "@/lib/data";
import {
  checklistUntuk,
  profilRantaiDingin,
  ringkasChecklist,
} from "@/lib/rantai-dingin";
import { useTranslations } from "@/lib/i18n";

/**
 * Checklist rantai dingin (F-52) — layar kerja, bukan daftar bacaan.
 *
 * Bentuk lamanya lima baris teks beruntun dengan satu pil hitungan di pojok:
 * petani yang berdiri di samping armada harus membaca kelimanya untuk tahu
 * mana yang belum. Sekarang tiap langkah punya kotaknya sendiri, yang sudah
 * dicentang mundur jadi latar tenang, dan satu kalimat di bawah menyebut
 * berapa langkah lagi sebelum muatan boleh berangkat.
 */
export function ChecklistRantaiDingin({
  pengirimanId,
  komoditas,
  awal,
}: {
  pengirimanId: string;
  komoditas: string;
  awal?: Record<string, boolean>;
}) {
  const t = useTranslations("logistik");
  const daftar = checklistUntuk(komoditas);
  const profil = profilRantaiDingin(komoditas);
  const [tercentang, setTercentang] = useState<Record<string, boolean>>(awal ?? {});
  const [menyimpan, setMenyimpan] = useState(false);

  const ringkas = ringkasChecklist(tercentang, daftar);
  const persen = Math.round((ringkas.selesai / ringkas.total) * 100);

  async function ubah(id: string, nilai: boolean) {
    const sebelumnya = tercentang;
    const baru = { ...tercentang, [id]: nilai };
    setTercentang(baru);
    setMenyimpan(true);
    const { error } = await simpanChecklistPengiriman(pengirimanId, baru);
    setMenyimpan(false);
    if (error) {
      setTercentang(sebelumnya);
      toast.galat(error);
    }
  }

  return (
    <Card variant="raised" className="flex flex-col gap-5 p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="type-heading-md flex items-center gap-2 text-ink">
            <Snowflake aria-hidden className="size-5 shrink-0 text-brand" />
            {t("checklist_title")}
          </h2>
          <p className="type-body-md pt-2 text-muted">
            {profil.wajib ? t("cold_chain_wajib") : t("cold_chain_opsional")}
          </p>
        </div>

        <span
          className={cx(
            "type-body-sm tnum flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-bold",
            ringkas.lengkap
              ? "bg-brand-tint text-brand-deep"
              : "bg-sunken text-muted",
          )}
        >
          {menyimpan && (
            <>
              <Loader2 aria-hidden className="size-3.5 animate-spin" />
              <span className="sr-only">{t("checklist_saving")}</span>
            </>
          )}
          {t("completed_count", { done: ringkas.selesai, total: ringkas.total })}
        </span>
      </div>

      {/* Kemajuan sebagai bentuk, bukan hanya angka: yang dilihat sambil
          berjalan adalah panjang batangnya, bukan "3 dari 5". */}
      <div
        role="progressbar"
        aria-valuenow={ringkas.selesai}
        aria-valuemin={0}
        aria-valuemax={ringkas.total}
        aria-label={t("checklist_title")}
        className="h-2 overflow-hidden rounded-full bg-sunken"
      >
        <div
          className={cx(
            "h-full rounded-full transition-[width] duration-300",
            ringkas.lengkap ? "bg-brand" : "bg-brand-deep",
          )}
          style={{ width: `${persen}%` }}
        />
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {daftar.map((item) => {
          const sudah = Boolean(tercentang[item.id]);
          return (
            <li key={item.id}>
              <Checkbox
                checked={sudah}
                onChange={(e) => void ubah(item.id, e.target.checked)}
                label={t(
                  item.labelKey as Parameters<typeof t>[0],
                  item.labelParams as Parameters<typeof t>[1],
                )}
                hint={t(
                  item.detailKey as Parameters<typeof t>[0],
                  item.detailParams as Parameters<typeof t>[1],
                )}
                className={cx(
                  "rounded-md border px-3 py-2.5 transition-colors",
                  sudah
                    ? "border-brand/40 bg-brand-tint/50"
                    : "border-line bg-canvas hover:border-line-strong",
                )}
              />
            </li>
          );
        })}
      </ul>

      <p
        aria-live="polite"
        className={cx(
          "type-body-sm flex items-center gap-2 font-bold",
          ringkas.lengkap ? "text-brand-deep" : "text-muted",
        )}
      >
        {ringkas.lengkap ? (
          <>
            <Check aria-hidden className="size-4 shrink-0" />
            {t("checklist_all_done")}
          </>
        ) : (
          t("checklist_remaining", { count: ringkas.tertinggal.length })
        )}
      </p>
    </Card>
  );
}
