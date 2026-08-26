"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button, Dialog, SectionLabel, Textarea } from "@/components/ui";
import { haptic } from "@/lib/haptic";
import { kirimUlasan } from "@/lib/data";
import { toast } from "@/components/ui/toast";
import { useTranslations } from "@/lib/i18n";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  penilaiId: string;
  dinilaiId: string;
  dinilaiNama: string;
  onSuccess?: () => void;
}

export function RatingModal({
  isOpen,
  onClose,
  orderId,
  penilaiId,
  dinilaiId,
  dinilaiNama,
  onSuccess,
}: RatingModalProps) {
  const t = useTranslations("ulasan");
  const [bintang, setBintang] = useState(5);
  const [hoverBintang, setHoverBintang] = useState(0);
  const [komentar, setKomentar] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { ulasan, error } = await kirimUlasan({
        order_id: orderId,
        penilai_id: penilaiId,
        dinilai_id: dinilaiId,
        bintang,
        komentar: komentar.trim() || undefined,
      });

      if (ulasan) {
        haptic.success();
        toast.sukses(t("toast_success", { name: dinilaiNama }));
        if (onSuccess) onSuccess();
        onClose();
      } else {
        // Kalimat dari lapisan data, bukan "gagal" generik: penolakan yang
        // paling sering terjadi — sudah pernah menilai — punya jalan keluar
        // yang berbeda dari kegagalan jaringan.
        haptic.error();
        toast.galat(error ?? t("toast_error_default"));
        if (error?.includes("sudah menilai") && onSuccess) onSuccess();
      }
    } catch {
      haptic.error();
      toast.galat(t("toast_error_generic"));
    } finally {
      setSubmitting(false);
    }
  };

  const footerButtons = (
    <div className="flex justify-end gap-3 w-full">
      <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
        {t("btn_cancel")}
      </Button>
      <Button type="button" variant="primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : t("btn_submit")}
      </Button>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={t("title")}
      description={t("desc", { name: dinilaiNama })}
      footer={footerButtons}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
        {/* Pemilihan 1-5 Bintang */}
        <div className="flex flex-col items-center justify-center gap-2 py-4 bg-sunken rounded-xl border border-line">
          <div role="radiogroup" aria-label="Nilai transaksi" className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= (hoverBintang || bintang);
              return (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={star === bintang}
                  aria-label={`${star} bintang`}
                  onClick={() => {
                    haptic.selection();
                    setBintang(star);
                  }}
                  onMouseEnter={() => setHoverBintang(star)}
                  onMouseLeave={() => setHoverBintang(0)}
                  className="tap focus-ring rounded-sm p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`size-8 transition-colors ${
                      active
                        ? "text-grade-b fill-grade-b"
                        : "text-line hover:text-grade-b/60"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <span className="type-label font-bold text-grade-b">
            {bintang === 5 && t("star_5")}
            {bintang === 4 && t("star_4")}
            {bintang === 3 && t("star_3")}
            {bintang === 2 && t("star_2")}
            {bintang === 1 && t("star_1")}
          </span>
        </div>

        {/* Input Komentar */}
        <div className="flex flex-col gap-1.5">
          <SectionLabel>{t("note_label")}</SectionLabel>
          <Textarea
            rows={3}
            value={komentar}
            onChange={(e) => setKomentar(e.target.value)}
            placeholder={t("note_placeholder")}
            disabled={submitting}
          />
        </div>
      </form>
    </Dialog>
  );
}
