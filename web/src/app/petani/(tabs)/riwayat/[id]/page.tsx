"use client";

/* eslint-disable @next/next/no-img-element -- scan captures are data URLs */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileSearch, ImageOff, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { LaporanGradingView } from "@/components/laporan-grading";
import {
  ButtonLink,
  Button,
  Card,
  EmptyState,
  Skeleton,
  Dialog,
} from "@/components/ui";
import { getGradingDetail, hrefJualLaporan, hapusRiwayatGrading } from "@/lib/data";
import type { RiwayatItem } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { LaporanGrading } from "@/lib/types";
import { useTranslations } from "@/lib/i18n";
import { toast } from "sonner";

/**
 * `dariDb` memisahkan laporan yang punya baris `gradings` sungguhan dari
 * salinan cache lokal. Hanya id yang pertama boleh dipakai sebagai
 * `listings.grading_id`; id cache berbentuk `scan-<timestamp>` dan bukan kunci
 * asing yang sah.
 */
type Muatan = {
  item: RiwayatItem;
  hasil: LaporanGrading;
  dariDb: boolean;
} | null;

function fmtWaktu(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}, ${d
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(":", ".")}`;
}

export default function RiwayatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const t = useTranslations("riwayat");
  const tHasil = useTranslations("hasil");
  const [muatan, setMuatan] = useState<Muatan>(null);
  const [selesai, setSelesai] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hapusDialogOpen, setHapusDialogOpen] = useState(false);

  /**
   * Layar ini menampilkan satu pindaian, jadi menghapusnya menghapus alasan
   * layar ini ada: setelah berhasil ia menggantikan dirinya sendiri dengan
   * arsip (`replace`, bukan `push`, supaya tombol kembali tidak mengembalikan
   * petani ke laporan yang sudah tidak ada). `isDeleting` sengaja tidak
   * dipulihkan pada jalur sukses — navigasinya sedang berjalan dan tombolnya
   * harus tetap terkunci sampai layar ini dilepas.
   */
  async function jalankanHapus() {
    setIsDeleting(true);
    const hasilHapus = await hapusRiwayatGrading(id);
    if (hasilHapus === "ok") {
      store.hapusScan(id);
      toast.success(t("delete_success"));
      router.replace("/petani/riwayat");
      return;
    }
    toast.error(hasilHapus === "terkunci" ? t("delete_locked") : t("delete_error"));
    setIsDeleting(false);
    setHapusDialogOpen(false);
  }

  function onHapus() {
    setHapusDialogOpen(true);
  }

  useEffect(() => {
    let batal = false;
    void (async () => {
      const dariDb = await getGradingDetail(id);
      if (batal) return;
      if (dariDb) {
        setMuatan({ ...dariDb, dariDb: true });
        setSelesai(true);
        return;
      }
      // Cadangan cache lokal: tanpa Supabase, laporan pindaian sesi ini hanya
      // hidup di sini — dan layar detail tidak boleh jadi jalan buntu.
      const lokal = store.scans.find((s) => s.id === id);
      if (lokal?.hasil) {
        setMuatan({
          item: {
            id: lokal.id,
            tanggal: lokal.tanggal,
            komoditas: lokal.komoditas ?? "",
            komoditas_label: lokal.komoditas_label,
            grade_dominan: lokal.grade_dominan,
            objek: lokal.objek,
            gambar: lokal.gambar,
            skor: lokal.skor,
            foto: lokal.foto,
            hash_audit: lokal.hash_audit,
          },
          hasil: lokal.hasil,
          dariDb: false,
        });
      }
      setSelesai(true);
    })();
    return () => {
      batal = true;
    };
  }, [id, store.scans]);

  if (!selesai) {
    return (
      <>
        <BackBar
          title={t("detail_title")}
          href="/petani/riwayat"
          parentLabel={t("parent_riwayat")}
        />
        <main className="flex-1 py-4">
          <Container className="flex flex-col gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </Container>
        </main>
      </>
    );
  }

  if (!muatan) {
    return (
      <>
        <BackBar
          title={t("detail_title")}
          href="/petani/riwayat"
          parentLabel={t("parent_riwayat")}
        />
        <main className="flex-1 py-4">
          <Container>
            <EmptyState
              icon={<FileSearch />}
              title={t("not_found_title")}
              description={t("not_found_desc")}
              action={
                <ButtonLink href="/petani/riwayat" size="lg">
                  {t("back_to_riwayat")}
                </ButtonLink>
              }
            />
          </Container>
        </main>
      </>
    );
  }

  const { item, hasil, dariDb } = muatan;

  /**
   * Tautan jual membawa seluruh komposisi batch, bukan hanya grade dominan.
   *
   * Rekomendasi harga menimbang komposisi penuh: batch 90% A / 10% C tidak
   * berharga sama dengan batch 50% A / 50% C meski grade dominannya sama-sama
   * A. Sebelum ini tombol ini hanya mengirim komoditas dan grade, jadi batch
   * yang sama menghasilkan dua angka berbeda tergantung layar mana yang
   * dipakai untuk membukanya.
   */
  const komposisi = hasil.ringkasan_batch.komposisi;
  const estimasi = hasil.ringkasan_batch.estimasi_berat;
  /* Foto batch ikut hanya bila ia sudah jadi URL penyimpanan. Salinan lokal
     berbentuk data URL — puluhan kilobita yang tidak muat di query string, dan
     pada kasus itu foto yang sama masih ada di `store.lastCapture`. */
  const fotoUrl = item.gambar?.startsWith("http") ? item.gambar : null;
  const hrefJual = hrefJualLaporan({
    komoditas: item.komoditas,
    komposisi,
    objek: item.objek,
    sampel_kg: estimasi?.tersedia ? estimasi.kg : null,
    dari: `/petani/riwayat/${item.id}`,
    grading_id: dariDb ? item.id : undefined,
    gambar: fotoUrl,
  });

  const media = item.gambar ? (
    <Card className="min-w-0 overflow-hidden">
      <img
        src={item.gambar}
        alt={t("photo_batch", { name: item.komoditas_label })}
        className="aspect-2/1 w-full object-cover"
      />
    </Card>
  ) : (
    <div className="flex aspect-2/1 w-full flex-col items-center justify-center gap-2 rounded-md bg-sunken text-center">
      <ImageOff aria-hidden className="size-7 text-line" />
      <p className="type-body-sm px-4 text-muted">{tHasil("no_photo")}</p>
    </div>
  );

  return (
    <>
      <BackBar
        title={item.komoditas_label}
        href="/petani/riwayat"
        parentLabel={t("parent_riwayat")}
      />

      <main className="flex-1 py-4">
        <Container className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="type-heading-lg text-ink">
                {item.komoditas_label}
              </h1>
              <p className="type-body-sm pt-1 text-muted">
                {fmtWaktu(item.tanggal)} • {t("obj_count", { val: item.objek })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!item.is_listed && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={onHapus}
                  disabled={isDeleting}
                  aria-label={t("delete_aria", { name: item.komoditas_label })}
                  className="text-danger hover:bg-danger-tint hover:text-danger"
                >
                  {isDeleting ? (
                    <Loader2 aria-hidden className="size-4 animate-spin" />
                  ) : (
                    <Trash2 aria-hidden className="size-4" />
                  )}
                </Button>
              )}
              <ButtonLink href={hrefJual} size="md">
                <ShoppingBag aria-hidden className="me-1.5 inline size-4" />
                {t("btn_sell")}
              </ButtonLink>
            </div>
          </div>

          <LaporanGradingView laporan={hasil} media={media} />
        </Container>
      </main>

      <Dialog
        open={hapusDialogOpen}
        onClose={() => {
          if (!isDeleting) setHapusDialogOpen(false);
        }}
        title={t("confirm_delete_title")}
        description={t("confirm_delete_desc")}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setHapusDialogOpen(false)}
              disabled={isDeleting}
            >
              {t("btn_cancel")}
            </Button>
            <Button variant="danger" onClick={jalankanHapus} disabled={isDeleting}>
              {isDeleting ? t("btn_deleting") : t("btn_delete")}
            </Button>
          </>
        }
      />
    </>
  );
}
