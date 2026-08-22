"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Handshake,
  PackageCheck,
  RefreshCw,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button, ButtonLink, cx } from "@/components/ui";
import { useStore } from "@/lib/store";
import { formatRupiah } from "@/lib/format";
import { useTranslations } from "@/lib/i18n";
import type { JenisPeristiwa, Peristiwa } from "@/lib/types";

/**
 * Kabar dari seberang, ditampilkan selagi layarnya terbuka.
 *
 * Sinkronisasi diam-diam memperbaiki angka, tapi tidak memberitahu siapa pun.
 * Padahal justru inilah momen produknya: pembeli menawar, petani menerima, dan
 * penawaran itu berubah jadi pesanan. Tanpa pengumuman, satu-satunya cara
 * pembeli tahu adalah memperhatikan sebuah angka di tab yang mungkin sedang
 * tidak dilihatnya.
 *
 * Dua bentuk, dipilih menurut bobot kejadiannya:
 *
 *   - **Lembar penuh** untuk penawaran yang jadi pesanan. Ini transaksi yang
 *     baru saja terbentuk atas nama pengguna; ia layak menghentikan layar dan
 *     menuntut satu keputusan — lihat pesanannya, atau tutup.
 *
 *   - **Kartu sisip** untuk sisanya: tawaran masuk, status pesanan maju,
 *     tawaran ditolak. Penting, tapi tidak sepadan dengan menghalangi jalan.
 *     Ia menyingkir sendiri setelah sepuluh detik.
 *
 * Keduanya diumumkan ke pembaca layar, dan keduanya patuh pada
 * `prefers-reduced-motion` lewat kelas gerak yang hanya menyala bila gerak
 * memang diizinkan.
 */

/** Peristiwa yang cukup besar untuk menghentikan layar. */
const BESAR: ReadonlySet<JenisPeristiwa> = new Set<JenisPeristiwa>([
  "penawaran_diterima",
]);

const IKON: Record<JenisPeristiwa, LucideIcon> = {
  penawaran_diterima: CheckCircle2,
  penawaran_ditolak: XCircle,
  penawaran_ditawar_balik: RefreshCw,
  penawaran_baru: Handshake,
  pesanan_baru: PackageCheck,
  pesanan_status: PackageCheck,
};

/** Warna mengikuti arti, bukan satu aksen untuk semuanya. */
const NADA: Record<JenisPeristiwa, string> = {
  penawaran_diterima: "text-brand",
  penawaran_ditolak: "text-danger",
  penawaran_ditawar_balik: "text-grade-b",
  penawaran_baru: "text-brand",
  pesanan_baru: "text-brand",
  pesanan_status: "text-brand",
};

function useTeks(e: Peristiwa) {
  const t = useTranslations("siaran");
  const tStatus = useTranslations("pesanan");

  const judul =
    e.jenis === "pesanan_status" && e.status
      ? t("pesanan_status_judul", { status: tStatus(`status_${e.status}`) })
      : t(`${e.jenis}_judul` as Parameters<typeof t>[0]);

  const isi = t(`${e.jenis}_isi` as Parameters<typeof t>[0], {
    nama: e.nama,
    lawan: e.lawan ?? t("pihak_lain"),
  });

  return { judul, isi };
}

/** Angka transaksi, dibaca sekali turun. */
function Rincian({ e }: { e: Peristiwa }) {
  const t = useTranslations("siaran");
  const baris: { k: string; v: string }[] = [];
  if (e.kuantitas_kg != null)
    baris.push({ k: t("kuantitas"), v: t("kuantitas_nilai", { val: e.kuantitas_kg }) });
  if (e.harga_per_kg != null)
    baris.push({ k: t("harga"), v: t("harga_nilai", { val: formatRupiah(e.harga_per_kg) }) });
  if (e.total != null) baris.push({ k: t("total"), v: formatRupiah(e.total) });
  if (baris.length === 0) return null;

  return (
    <dl className="flex flex-col divide-y divide-line border-y border-line">
      {baris.map(({ k, v }) => (
        <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="type-body-md text-muted">{k}</dt>
          <dd className="type-body-md tnum font-bold text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------ Lembar penuh */

function LembarPenuh({ e, onTutup }: { e: Peristiwa; onTutup: () => void }) {
  const t = useTranslations("siaran");
  const tc = useTranslations("common");
  const { judul, isi } = useTeks(e);
  const panelRef = useRef<HTMLDivElement>(null);
  const Ikon = IKON[e.jenis];

  useEffect(() => {
    // Fokus mendarat di panel, bukan di tombol utama: yang pertama dibaca
    // pembaca layar harus kabarnya, bukan ajakan bertindaknya.
    panelRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        ev.stopPropagation();
        onTutup();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
    };
  }, [onTutup]);

  return (
    <div
      className="fixed inset-0 z-90 flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`siaran-judul-${e.id}`}
      aria-describedby={`siaran-isi-${e.id}`}
    >
      <button
        type="button"
        aria-label={tc("close")}
        onClick={onTutup}
        className="siaran-tirai absolute inset-0 bg-stone-950/55 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="siaran-lembar relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-line bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-e3 focus:outline-none sm:rounded-2xl sm:pb-6"
      >
        {/* Cincin yang mengembang sekali, lalu diam. Perayaan yang tidak
            berdenyut terus-menerus di belakang teks yang sedang dibaca. */}
        <div className="relative mx-auto flex size-16 items-center justify-center">
          <span
            aria-hidden
            className="siaran-cincin absolute inset-0 rounded-full bg-brand-tint"
          />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-brand-tint">
            <Ikon aria-hidden className={cx("size-8", NADA[e.jenis])} />
          </span>
        </div>

        <h2
          id={`siaran-judul-${e.id}`}
          className="type-heading-lg pt-4 text-center text-ink"
        >
          {judul}
        </h2>
        <p
          id={`siaran-isi-${e.id}`}
          className="type-body-md pt-1.5 pb-4 text-center text-muted"
        >
          {isi}
        </p>

        <Rincian e={e} />

        {e.orderId && (
          <p className="type-body-sm tnum pt-3 text-center text-label">
            {t("nomor_pesanan", { id: e.orderId })}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-5 sm:flex-row-reverse">
          {e.href && (
            <ButtonLink href={e.href} size="lg" className="flex-1" onClick={onTutup}>
              {t("cta_lihat_pesanan")}
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
          )}
          <Button variant="ghost" size="lg" onClick={onTutup} className="flex-1">
            {t("cta_tutup")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Kartu sisip */

function KartuSisip({ e, onTutup }: { e: Peristiwa; onTutup: () => void }) {
  const t = useTranslations("siaran");
  const tc = useTranslations("common");
  const { judul, isi } = useTeks(e);
  const Ikon = IKON[e.jenis];

  useEffect(() => {
    const jam = setTimeout(onTutup, 10_000);
    return () => clearTimeout(jam);
  }, [onTutup]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="siaran-kartu pointer-events-auto w-full max-w-sm rounded-lg border border-line bg-surface p-3.5 shadow-e3"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-tint">
          <Ikon aria-hidden className={cx("size-5", NADA[e.jenis])} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="type-body-md font-bold text-ink">{judul}</p>
          <p className="type-body-sm text-muted">{isi}</p>
          {e.href && (
            <Link
              href={e.href}
              onClick={onTutup}
              className="type-body-sm focus-ring mt-1.5 inline-flex items-center gap-1 font-bold text-brand hover:underline"
            >
              {t("cta_lihat")}
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={onTutup}
          aria-label={tc("close")}
          className="tap focus-ring -m-1 shrink-0 rounded-md p-1 text-label hover:text-ink"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- Status sambungan */

/**
 * Pil kecil ketika kanal putus.
 *
 * Layar yang berhenti diperbarui tanpa berkata apa-apa membuat orang percaya
 * pada angka yang sudah basi. Muncul hanya saat benar-benar putus — bukan saat
 * sedang menyambung, yang normal terjadi tiap kali halaman dibuka.
 */
function StatusSambungan() {
  const store = useStore();
  const t = useTranslations("siaran");
  if (store.statusLangganan !== "terputus" || !store.sesi) return null;
  return (
    <div
      role="status"
      className="type-body-sm pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-muted shadow-e2"
    >
      <WifiOff aria-hidden className="size-3.5 shrink-0 text-grade-c" />
      {t("terputus")}
    </div>
  );
}

/* ------------------------------------------------------------------ Wadah */

export function SiaranLangsung() {
  const store = useStore();

  // Dipasang lewat `dynamic(..., { ssr: false })`, jadi render pertamanya sudah
  // di peramban. Penjaga ini hanya untuk pemanggil lain yang lupa itu.
  if (typeof document === "undefined") return null;

  const antre = store.peristiwa;
  const besar = antre.find((e) => BESAR.has(e.jenis));
  const kecil = antre.filter((e) => !BESAR.has(e.jenis));

  return createPortal(
    <>
      {/* Hanya satu lembar penuh sekaligus; sisanya menunggu gilirannya. */}
      {besar && (
        <LembarPenuh e={besar} onTutup={() => store.tutupPeristiwa(besar.id)} />
      )}

      <div className="pointer-events-none fixed inset-x-0 top-16 z-80 flex flex-col items-center gap-2 px-3 md:top-4 md:items-end md:px-4">
        <StatusSambungan />
        {kecil.map((e) => (
          <KartuSisip key={e.id} e={e} onTutup={() => store.tutupPeristiwa(e.id)} />
        ))}
      </div>
    </>,
    document.body,
  );
}
