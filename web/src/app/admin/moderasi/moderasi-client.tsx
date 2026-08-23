"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Search, ShieldCheck } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  GradeBadge,
  Input,
  Skeleton,
  Textarea,
  cx,
  toast,
} from "@/components/ui";
import { labelKomoditas } from "@/lib/data";
import {
  getListingsModerasi,
  moderasiListing,
  type BarisModerasi,
  type StatusListingDb,
} from "@/lib/data-admin";
import { formatRupiah } from "@/lib/format";
import { useTranslations } from "@/lib/i18n";

/**
 * Moderasi listing (F-91).
 *
 * Dua keputusan yang membentuk layar ini:
 *
 * 1. Alasan wajib, dan tombolnya tetap mati sampai alasannya diisi. Fungsi
 *    Postgres di balik layar juga menolaknya, jadi ini bukan satu-satunya
 *    penjaga — tapi menolak di server sesudah dialog tertutup berarti operator
 *    membaca pesan galat untuk sesuatu yang bisa dicegah sebelum ia menekan.
 *
 * 2. Yang disembunyikan tidak hilang dari daftar. Layar moderasi yang hanya
 *    menampilkan yang tayang adalah pintu satu arah: begitu sebuah lot
 *    diturunkan, tidak ada lagi permukaan yang bisa mengembalikannya.
 */

type Saringan = "semua" | StatusListingDb;

const SARINGAN: Saringan[] = ["semua", "tayang", "disembunyikan", "habis", "ditutup"];

const NADA_STATUS: Record<StatusListingDb, "brand" | "danger" | "neutral" | "warn"> = {
  tayang: "brand",
  disembunyikan: "danger",
  habis: "neutral",
  ditutup: "warn",
};

export function ModerasiClient() {
  const t = useTranslations("admin_moderasi");
  const [baris, setBaris] = useState<BarisModerasi[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [cari, setCari] = useState("");
  const [saringan, setSaringan] = useState<Saringan>("semua");
  const [target, setTarget] = useState<BarisModerasi | null>(null);
  const [alasan, setAlasan] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let aktif = true;
    getListingsModerasi()
      .then((hasil) => {
        if (aktif) setBaris(hasil);
      })
      .finally(() => {
        if (aktif) setMemuat(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  const terlihat = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    return baris.filter((b) => {
      if (saringan !== "semua" && b.status !== saringan) return false;
      if (!kata) return true;
      return (
        b.nama.toLowerCase().includes(kata) ||
        b.petani.toLowerCase().includes(kata) ||
        b.id.toLowerCase().includes(kata)
      );
    });
  }, [baris, cari, saringan]);

  const hitung = (s: Saringan) =>
    s === "semua" ? baris.length : baris.filter((b) => b.status === s).length;

  /** Sembunyikan bila sedang tayang, pulihkan bila tidak. */
  const arah = target?.status === "tayang" ? "disembunyikan" : "tayang";

  async function kirim() {
    if (!target) return;
    setMengirim(true);
    setGalat(null);

    const hasil = await moderasiListing(target.id, arah, alasan);
    setMengirim(false);

    if (!hasil.ok) {
      setGalat(hasil.pesan);
      return;
    }

    setBaris((sebelum) =>
      sebelum.map((b) => (b.id === target.id ? { ...b, status: hasil.status } : b)),
    );
    toast.sukses(
      arah === "disembunyikan" ? t("toast_hidden") : t("toast_restored"),
      t("toast_logged"),
    );
    tutup();
  }

  function tutup() {
    setTarget(null);
    setAlasan("");
    setGalat(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={t("search_label")}
        placeholder={t("search_placeholder")}
        value={cari}
        onChange={(e) => setCari(e.target.value)}
        prefix={<Search aria-hidden className="size-4" />}
      />

      <div role="group" aria-label={t("filter_label")} className="flex flex-wrap gap-2">
        {SARINGAN.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSaringan(s)}
            aria-pressed={saringan === s}
            className={cx(
              "tap tap-press focus-ring type-body-sm inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 font-bold sm:min-h-9",
              saringan === s
                ? "border-brand bg-brand text-on-brand"
                : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {t(`filter_${s}`)}
            <span className="tnum opacity-70">{hitung(s)}</span>
          </button>
        ))}
      </div>

      {memuat && baris.length === 0 && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!memuat && terlihat.length === 0 && (
        <EmptyState
          icon={<ShieldCheck className="size-8" />}
          title={t("empty_title")}
          description={t("empty_desc")}
        />
      )}

      <ul className="flex flex-col gap-3">
        {terlihat.map((b) => (
          <li
            key={b.id}
            className={cx(
              "flex min-w-0 flex-col gap-3 rounded-md border border-line bg-surface p-4 sm:flex-row sm:items-center",
              b.status === "disembunyikan" && "border-danger/40 bg-danger-tint/30",
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="type-heading-sm truncate text-ink">{b.nama}</span>
                <GradeBadge grade={b.grade} size="sm" />
                <Badge tone={NADA_STATUS[b.status]}>{t(`status_${b.status}`)}</Badge>
              </div>
              <span className="type-body-sm truncate text-muted">
                {b.petani} · {labelKomoditas(b.komoditas)} · {b.berat_kg} kg ·{" "}
                {formatRupiah(b.harga_per_kg)}/kg
              </span>
              <span className="type-mono-sm truncate text-label">{b.id}</span>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {b.hash_audit && (
                <Link
                  href={`/lacak/${b.hash_audit}`}
                  className="tap focus-ring type-body-sm inline-flex min-h-11 items-center rounded-md px-3 font-bold text-brand hover:bg-brand-tint sm:min-h-9"
                >
                  {t("btn_trace")}
                </Link>
              )}
              <Button
                size="sm"
                variant={b.status === "tayang" ? "danger-ghost" : "outline"}
                onClick={() => {
                  setTarget(b);
                  setAlasan("");
                  setGalat(null);
                }}
              >
                {b.status === "tayang" ? (
                  <>
                    <EyeOff aria-hidden className="size-4" /> {t("btn_hide")}
                  </>
                ) : (
                  <>
                    <Eye aria-hidden className="size-4" /> {t("btn_restore")}
                  </>
                )}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={target !== null}
        onClose={tutup}
        title={arah === "disembunyikan" ? t("dialog_hide_title") : t("dialog_restore_title")}
        description={
          target
            ? t("dialog_desc", { nama: target.nama, petani: target.petani })
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" size="md" onClick={tutup} disabled={mengirim}>
              {t("btn_cancel")}
            </Button>
            <Button
              variant={arah === "disembunyikan" ? "danger" : "primary"}
              size="md"
              loading={mengirim}
              disabled={alasan.trim().length < 8}
              onClick={() => void kirim()}
            >
              {arah === "disembunyikan" ? t("btn_hide_confirm") : t("btn_restore_confirm")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Textarea
            label={t("reason_label")}
            hint={t("reason_hint")}
            placeholder={
              arah === "disembunyikan" ? t("reason_placeholder_hide") : t("reason_placeholder_restore")
            }
            required
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            error={galat}
          />
          <p className="type-body-sm text-muted">{t("reason_note")}</p>
        </div>
      </Dialog>
    </div>
  );
}
