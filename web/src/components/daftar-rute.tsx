"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Lock, Play, Users } from "lucide-react";
import { Badge, Button, Card, Skeleton, toast } from "@/components/ui";
import type { BadgeTone } from "@/components/ui";
import { getRuteList } from "@/lib/data";
import { ubahStatusRute } from "@/lib/data-admin";
import type { Rute } from "@/lib/types";
import { useTranslations } from "@/lib/i18n";

/**
 * Daftar rute armada di dashboard admin.
 *
 * Dirender di klien, bukan server, karena rute yang baru disimpan perencana
 * bisa berada di localStorage saat basis data belum terisi (lihat `bacaRuteLokal`
 * di lib/data.ts). Kalau kartu ini dirender di server, admin menyimpan rute lalu
 * tidak menemukannya di ringkasan — persis kesan "tersimpan tapi hilang" yang
 * ingin dihapus F-51.
 */

/**
 * Siklus hidup rute, searah.
 *
 * Sampai sebelum ini kartu rute hanya menampilkan `r.status` sebagai teks
 * mentah, dan tidak ada satu pun permukaan yang bisa mengubahnya — jadi setiap
 * rute berhenti di 'draf' selamanya. Akibatnya bukan cuma label yang basi:
 * view `dampak_agregat` menghitung `km_dihemat` hanya dari rute berstatus
 * 'selesai', sehingga penghematan jarak di dashboard tidak pernah bisa tumbuh
 * dari data nyata berapa pun rute yang direncanakan operator.
 */
/** 'draf' tidak pernah menjadi tujuan: rute tidak bisa mundur. */
type StatusLanjut = Exclude<Rute["status"], "draf">;

const LANJUT: Record<Rute["status"], StatusLanjut | null> = {
  draf: "terkunci",
  terkunci: "berjalan",
  berjalan: "selesai",
  selesai: null,
};

const IKON_LANJUT: Record<StatusLanjut, typeof Lock> = {
  terkunci: Lock,
  berjalan: Play,
  selesai: CheckCircle2,
};

const NADA: Record<Rute["status"], BadgeTone> = {
  draf: "neutral",
  terkunci: "info",
  berjalan: "warn",
  selesai: "brand",
};

export function DaftarRute({ awal }: { awal: Rute[] }) {
  const [rute, setRute] = useState<Rute[]>(awal);
  const [memuat, setMemuat] = useState(true);
  const [sibuk, setSibuk] = useState<string | null>(null);
  const t = useTranslations("admin_rute");

  useEffect(() => {
    let aktif = true;
    getRuteList()
      .then((hasil) => {
        if (aktif) setRute(hasil);
      })
      .finally(() => {
        if (aktif) setMemuat(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  async function majukan(r: Rute) {
    const berikut = LANJUT[r.status];
    if (!berikut) return;

    setSibuk(r.id);
    const hasil = await ubahStatusRute(r.id, berikut);
    setSibuk(null);

    if (!hasil.ok) {
      toast.galat(t("status_failed"), hasil.pesan);
      return;
    }

    setRute((sebelum) =>
      sebelum.map((x) => (x.id === r.id ? { ...x, status: berikut } : x)),
    );
    toast.sukses(
      t("status_changed", { no: r.nomor, status: t(`status_${berikut}`) }),
      berikut === "selesai" ? t("status_done_note") : undefined,
    );
  }

  return (
    <Card variant="raised" className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="type-heading-md flex min-w-0 items-center gap-2 text-ink">
          <Users className="size-5 shrink-0 text-brand" /> {t("list_title")}
        </h2>
        <span className="type-mono-sm shrink-0 text-label">{t("route_count", { count: rute.length })}</span>
      </div>

      {memuat && rute.length === 0 && <Skeleton className="h-20 w-full" />}

      {rute.map((r) => {
        const berikut = LANJUT[r.status];
        const Ikon = berikut ? IKON_LANJUT[berikut] : null;

        return (
          <div key={r.id} className="flex min-w-0 flex-col gap-2 rounded-md border border-line bg-sunken p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="type-heading-sm text-ink">{t("route_number", { id: r.nomor })}</span>
              <Badge tone={NADA[r.status]}>{t(`status_${r.status}`)}</Badge>
            </div>

            <div className="type-body-sm text-muted">
              <span>
                {t("route_desc", { car: r.kendaraan, count: r.item.length, km: r.jarak_km, indKm: r.jarak_individual_km })}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="type-mono-sm font-bold text-brand">
                {t("save_km", { val: Math.round(r.jarak_individual_km - r.jarak_km) })}
              </span>

              {berikut && Ikon ? (
                <Button
                  size="sm"
                  variant={berikut === "selesai" ? "primary" : "ghost"}
                  loading={sibuk === r.id}
                  onClick={() => void majukan(r)}
                >
                  <Ikon aria-hidden className="size-4" /> {t(`advance_${berikut}`)}
                </Button>
              ) : (
                <span className="type-body-sm text-muted">{t("status_done_note")}</span>
              )}
            </div>

            {r.status === "draf" && (
              <p className="type-body-sm text-label">{t("draft_km_note")}</p>
            )}
          </div>
        );
      })}
    </Card>
  );
}
