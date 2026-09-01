"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CreditCard,
  ShieldAlert,
} from "lucide-react";
import { Badge, Button, Card, Dialog, SectionLabel, Textarea } from "@/components/ui";
import { toast } from "@/components/ui/toast";
import { useTranslations } from "@/lib/i18n";
import { useStore, type Order } from "@/lib/store";

type ModeAlasan = "batal" | "sengketa" | null;

/**
 * Lifecycle yang sama di layar petani dan pembeli.
 *
 * Progres fisik tetap dirender `StatusHero`; kartu ini hanya mengurus state
 * ortogonal yang mengunci progres (pembatalan/sengketa) dan konfirmasi uang
 * yang berpindah di luar aplikasi.
 */
export function TransactionLifecycle({
  order,
  peran,
}: {
  order: Order;
  peran: "petani" | "pembeli";
}) {
  const t = useTranslations("transaksi");
  const tc = useTranslations("common");
  const store = useStore();
  const [mode, setMode] = useState<ModeAlasan>(null);
  const [alasan, setAlasan] = useState("");
  const [sibuk, setSibuk] = useState(false);

  const kasus = order.status_kasus ?? "normal";
  const pembayaran = order.status_pembayaran ?? "belum_dibayar";
  const permintaanSaya = Boolean(
    order.diminta_oleh && order.diminta_oleh === store.sesi?.userId,
  );
  const alasanValid = alasan.trim().length >= 10 && alasan.trim().length <= 500;

  function tutupDialog() {
    if (sibuk) return;
    setMode(null);
    setAlasan("");
  }

  async function kirimAlasan() {
    if (!mode || !alasanValid) return;
    setSibuk(true);
    const hasil =
      mode === "batal"
        ? await store.ajukanPembatalan(order.id, alasan)
        : await store.bukaSengketa(order.id, alasan);
    setSibuk(false);

    if (!hasil.berhasil) {
      toast.galat(t("action_failed"), hasil.pesan);
      return;
    }

    toast.sukses(
      mode === "sengketa"
        ? t("dispute_success")
        : order.status === "dipesan"
          ? t("cancel_direct_success")
          : t("cancel_request_success"),
    );
    tutupDialog();
  }

  async function jawabPembatalan(setuju: boolean) {
    setSibuk(true);
    const hasil = await store.tanggapiPembatalan(order.id, setuju);
    setSibuk(false);
    if (!hasil.berhasil) {
      toast.galat(t("action_failed"), hasil.pesan);
      return;
    }
    toast.sukses(setuju ? t("approve_success") : t("reject_success"));
  }

  async function ubahPembayaran() {
    setSibuk(true);
    const hasil =
      peran === "pembeli"
        ? await store.tandaiPembayaran(order.id)
        : await store.konfirmasiPembayaran(order.id);
    setSibuk(false);
    if (!hasil.berhasil) {
      toast.galat(t("action_failed"), hasil.pesan);
      return;
    }
    toast.sukses(
      peran === "pembeli" ? t("mark_paid_success") : t("confirm_paid_success"),
    );
  }

  const labelPembayaran = {
    belum_dibayar: t("payment_unpaid"),
    ditandai_dibayar: t("payment_marked"),
    dikonfirmasi: t("payment_confirmed"),
  }[pembayaran];

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <SectionLabel>{t("title")}</SectionLabel>
            <p className="type-body-sm max-w-2xl pt-1 text-muted">{t("off_app_note")}</p>
          </div>
          <Badge
            tone={pembayaran === "dikonfirmasi" ? "brand" : pembayaran === "ditandai_dibayar" ? "info" : "neutral"}
            icon={<CreditCard aria-hidden className="size-3.5" />}
          >
            {labelPembayaran}
          </Badge>
        </div>

        <div className="mt-4 rounded-lg border border-line bg-sunken p-4">
          <div className="flex items-center gap-2">
            {pembayaran === "dikonfirmasi" ? (
              <CheckCircle2 aria-hidden className="size-5 text-brand" />
            ) : (
              <CreditCard aria-hidden className="size-5 text-muted" />
            )}
            <p className="type-body-md font-bold text-ink">{t("payment_title")}</p>
          </div>

          {kasus === "normal" && pembayaran !== "dikonfirmasi" && (
            <div className="pt-3">
              {order.status === "dipesan" ? (
                <p className="type-body-sm text-muted">{t("payment_before_confirm")}</p>
              ) : peran === "pembeli" && pembayaran === "belum_dibayar" ? (
                <Button onClick={ubahPembayaran} loading={sibuk} size="sm">
                  {t("mark_paid")}
                </Button>
              ) : peran === "petani" && pembayaran === "ditandai_dibayar" ? (
                <Button onClick={ubahPembayaran} loading={sibuk} size="sm">
                  {t("confirm_received")}
                </Button>
              ) : (
                <p className="type-body-sm text-muted">
                  {pembayaran === "belum_dibayar"
                    ? t("payment_wait_buyer")
                    : t("payment_wait_farmer")}
                </p>
              )}
            </div>
          )}
        </div>

        {kasus === "pembatalan_diajukan" && (
          <div className="mt-4 rounded-lg border border-clay-200 bg-clay-50 p-4 dark:border-clay-800 dark:bg-clay-900">
            <div className="flex items-start gap-3">
              <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-clay-700 dark:text-clay-300" />
              <div className="min-w-0">
                <p className="type-body-md font-bold text-ink">{t("cancel_requested_title")}</p>
                <p className="type-body-sm pt-1 text-muted">
                  {permintaanSaya ? t("cancel_requested_self") : t("cancel_requested_other")}
                </p>
                {order.alasan_kasus && (
                  <p className="type-body-sm mt-2 rounded-md bg-surface/70 p-3 text-ink">
                    {t("reason_value", { reason: order.alasan_kasus })}
                  </p>
                )}
              </div>
            </div>
            {!permintaanSaya && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  loading={sibuk}
                  onClick={() => void jawabPembatalan(true)}
                >
                  {t("approve_cancel")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={sibuk}
                  onClick={() => void jawabPembatalan(false)}
                >
                  {t("reject_cancel")}
                </Button>
              </div>
            )}
          </div>
        )}

        {kasus === "dibatalkan" && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger-tint p-4">
            <Ban aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
            <div>
              <p className="type-body-md font-bold text-danger">{t("cancelled_title")}</p>
              <p className="type-body-sm pt-1 text-muted">{t("cancelled_desc")}</p>
              {order.alasan_kasus && (
                <p className="type-body-sm pt-2 text-ink">
                  {t("reason_value", { reason: order.alasan_kasus })}
                </p>
              )}
            </div>
          </div>
        )}

        {kasus === "sengketa" && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger-tint p-4">
            <ShieldAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
            <div>
              <p className="type-body-md font-bold text-danger">{t("dispute_title")}</p>
              <p className="type-body-sm pt-1 text-muted">{t("dispute_desc")}</p>
              {order.alasan_kasus && (
                <p className="type-body-sm pt-2 text-ink">
                  {t("reason_value", { reason: order.alasan_kasus })}
                </p>
              )}
            </div>
          </div>
        )}

        {kasus === "normal" && (
          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            {order.status !== "selesai" && (
              <Button variant="danger-ghost" size="sm" onClick={() => setMode("batal")}>
                {order.status === "dipesan" ? t("cancel_now") : t("request_cancel")}
              </Button>
            )}
            {order.status !== "dipesan" && (
              <Button variant="ghost" size="sm" onClick={() => setMode("sengketa")}>
                <ShieldAlert aria-hidden className="size-4" />
                {t("open_dispute")}
              </Button>
            )}
          </div>
        )}
      </Card>

      <Dialog
        open={mode !== null}
        onClose={tutupDialog}
        title={mode === "sengketa" ? t("dispute_dialog_title") : t("cancel_dialog_title")}
        description={
          mode === "sengketa"
            ? t("dispute_dialog_desc")
            : order.status === "dipesan"
              ? t("cancel_dialog_direct")
              : t("cancel_dialog_request")
        }
        footer={
          <>
            <Button variant="ghost" disabled={sibuk} onClick={tutupDialog}>
              {tc("cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={!alasanValid}
              loading={sibuk}
              onClick={() => void kirimAlasan()}
            >
              {mode === "sengketa" ? t("submit_dispute") : t("submit_cancel")}
            </Button>
          </>
        }
      >
        <Textarea
          autoFocus
          label={t("reason_label")}
          hint={t("reason_hint")}
          value={alasan}
          maxLength={500}
          counter={`${alasan.length}/500`}
          error={alasan.length > 0 && alasan.trim().length < 10 ? t("reason_error") : null}
          onChange={(event) => setAlasan(event.target.value)}
        />
      </Dialog>
    </>
  );
}
