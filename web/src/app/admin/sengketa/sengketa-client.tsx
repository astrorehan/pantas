"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Handshake, XCircle } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Skeleton,
  Textarea,
  toast,
} from "@/components/ui";
import {
  getSengketaAktif,
  selesaikanSengketa,
  type BarisSengketa,
} from "@/lib/data-admin";
import { formatRupiah } from "@/lib/format";
import { useLocale, useTranslations } from "@/lib/i18n";

type Keputusan = "lanjut" | "batal";
const INTL: Record<string, string> = { id: "id-ID", en: "en-US" };

export function SengketaClient() {
  const t = useTranslations("admin_sengketa");
  const { locale } = useLocale();
  const [baris, setBaris] = useState<BarisSengketa[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [target, setTarget] = useState<BarisSengketa | null>(null);
  const [keputusan, setKeputusan] = useState<Keputusan>("lanjut");
  const [catatan, setCatatan] = useState("");
  const [mengirim, setMengirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let aktif = true;
    getSengketaAktif()
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

  function buka(item: BarisSengketa, hasil: Keputusan) {
    setTarget(item);
    setKeputusan(hasil);
    setCatatan("");
    setGalat(null);
  }

  function tutup() {
    if (mengirim) return;
    setTarget(null);
    setCatatan("");
    setGalat(null);
  }

  async function simpan() {
    if (!target || catatan.trim().length < 10) return;
    setMengirim(true);
    setGalat(null);
    const hasil = await selesaikanSengketa(target.id, keputusan === "batal", catatan);
    setMengirim(false);
    if (!hasil.ok) {
      setGalat(hasil.pesan);
      return;
    }

    setBaris((sebelum) => sebelum.filter((item) => item.id !== target.id));
    toast.sukses(
      keputusan === "batal" ? t("toast_cancelled") : t("toast_continued"),
      t("toast_audited"),
    );
    tutup();
  }

  const waktu = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "–";
    return date.toLocaleString(INTL[locale] ?? "id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (memuat) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((item) => <Skeleton key={item} className="h-40 w-full" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {baris.length === 0 ? (
        <EmptyState
          icon={<Handshake className="size-8" />}
          title={t("empty_title")}
          description={t("empty_desc")}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {baris.map((item) => (
            <li key={item.id}>
              <Card className="flex h-full flex-col gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-heading-sm truncate text-ink">{item.nama}</p>
                    <p className="type-body-sm pt-1 text-muted">
                      {item.pembeli} ↔ {item.petani}
                    </p>
                  </div>
                  <Badge tone="danger">{t("active_badge")}</Badge>
                </div>

                <div className="rounded-md bg-danger-tint p-3">
                  <p className="type-body-sm font-bold text-danger">{t("reason_label")}</p>
                  <p className="type-body-md pt-1 text-ink">{item.alasan}</p>
                </div>

                <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3">
                  <div>
                    <dt className="type-label text-label">{t("order_label")}</dt>
                    <dd className="type-body-sm tnum pt-1 text-ink">#{item.id}</dd>
                  </div>
                  <div>
                    <dt className="type-label text-label">{t("value_label")}</dt>
                    <dd className="type-body-sm tnum pt-1 font-bold text-ink">
                      {formatRupiah(item.total)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="type-label text-label">{t("opened_label")}</dt>
                    <dd className="type-body-sm tnum pt-1 text-ink">{waktu(item.diminta_pada)}</dd>
                  </div>
                </dl>

                <div className="mt-auto flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => buka(item, "lanjut")}>
                    <CheckCircle2 aria-hidden className="size-4" />
                    {t("continue_btn")}
                  </Button>
                  <Button size="sm" variant="danger-ghost" onClick={() => buka(item, "batal")}>
                    <XCircle aria-hidden className="size-4" />
                    {t("cancel_btn")}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={target !== null}
        onClose={tutup}
        title={keputusan === "batal" ? t("dialog_cancel_title") : t("dialog_continue_title")}
        description={target ? t("dialog_desc", { id: target.id, name: target.nama }) : undefined}
        footer={
          <>
            <Button variant="ghost" disabled={mengirim} onClick={tutup}>
              {t("close_btn")}
            </Button>
            <Button
              variant={keputusan === "batal" ? "danger" : "primary"}
              disabled={catatan.trim().length < 10}
              loading={mengirim}
              onClick={() => void simpan()}
            >
              {t("save_btn")}
            </Button>
          </>
        }
      >
        <Textarea
          autoFocus
          required
          label={t("resolution_label")}
          hint={t("resolution_hint")}
          value={catatan}
          maxLength={500}
          counter={`${catatan.length}/500`}
          error={galat}
          onChange={(event) => setCatatan(event.target.value)}
        />
      </Dialog>
    </div>
  );
}
