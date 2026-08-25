"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff, ScanLine } from "lucide-react";
import { Dialog } from "@/components/ui";
import { haptic } from "@/lib/haptic";
import { useTranslations } from "@/lib/i18n";

/**
 * Pemindai kode serah terima.
 *
 * Sebelum ini QR di layar pembeli tidak pernah dibaca oleh apa pun: ia
 * digambar, diberi keterangan "tunjukkan kode atau QR ini kepada petani", lalu
 * petani mengetik ulang kodenya dengan tangan. Layar itu menjanjikan sesuatu
 * yang tidak ada.
 *
 * Pembacanya memakai `BarcodeDetector` bawaan browser, bukan pustaka: satu
 * dependensi pemindai berukuran belasan kilobita gzip untuk satu layar, dan
 * anggaran bundel per route (NFR-05) dihitung utuh. Konsekuensinya jujur —
 * peramban yang belum punya API itu (Safari, Firefox) tidak mendapat kamera,
 * dan komponennya mengatakan begitu sambil menunjuk ke kolom ketik manual yang
 * tetap ada. Itu lebih baik daripada kamera yang menyala tanpa pernah mengenali
 * apa pun.
 */

interface KodeTerdeteksi {
  rawValue: string;
}

interface PembacaBarcode {
  detect(sumber: CanvasImageSource): Promise<KodeTerdeteksi[]>;
}

interface KonstruktorPembaca {
  new (opsi: { formats: string[] }): PembacaBarcode;
}

function pembacaTersedia(): KonstruktorPembaca | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { BarcodeDetector?: KonstruktorPembaca })
    .BarcodeDetector;
  return typeof ctor === "function" ? ctor : null;
}

/** Jeda antar pembacaan frame. 300 ms cukup responsif dan tidak memanaskan ponsel. */
const JEDA_MS = 300;

type Galat = "tak_didukung" | "kamera" | null;

export function PemindaiKode({
  isOpen,
  onClose,
  onKode,
}: {
  isOpen: boolean;
  onClose: () => void;
  /** Dipanggil sekali dengan isi QR mentah; pemanggil yang memvalidasi. */
  onKode: (kode: string) => void;
}) {
  const t = useTranslations("pesanan");

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={t("scan_title")}
      description={t("scan_desc")}
      size="sm"
    >
      {/* Isinya dipasang hanya selama modal terbuka, jadi setiap kali dibuka ia
          mulai dari keadaan bersih — tanpa satu pun setState pemulihan di dalam
          effect, yang ditolak React Compiler. */}
      {isOpen && <IsiPemindai onKode={onKode} />}
    </Dialog>
  );
}

function IsiPemindai({ onKode }: { onKode: (kode: string) => void }) {
  const t = useTranslations("pesanan");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  /** Menahan callback agar satu QR tidak terkirim dua kali dalam satu sesi pindai. */
  const sudahKirim = useRef(false);
  // Dukungan peramban diketahui sebelum render pertama, jadi keadaan "tidak
  // didukung" tidak perlu ditulis dari dalam effect.
  const [galat, setGalat] = useState<Galat>(() =>
    pembacaTersedia() ? null : "tak_didukung",
  );

  useEffect(() => {
    const Pembaca = pembacaTersedia();
    if (!Pembaca) return;

    let batal = false;
    let timer: number | undefined;
    const pembaca = new Pembaca({ formats: ["qr_code"] });

    async function jalan() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (batal) {
          stream.getTracks().forEach((s) => s.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
      } catch {
        if (!batal) setGalat("kamera");
        return;
      }

      const baca = async () => {
        if (batal || sudahKirim.current) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          try {
            const hasil = await pembaca.detect(video);
            const nilai = hasil[0]?.rawValue?.trim();
            if (nilai && !batal) {
              sudahKirim.current = true;
              haptic.scan();
              onKode(nilai);
              return;
            }
          } catch {
            // Frame yang gagal dibaca bukan kegagalan pindai — coba frame
            // berikutnya. Menghentikan pemindai di sini berarti satu gerakan
            // tangan yang buram mematikan kamera.
          }
        }
        if (!batal) timer = window.setTimeout(baca, JEDA_MS);
      };
      void baca();
    }

    void jalan();

    return () => {
      batal = true;
      if (timer) window.clearTimeout(timer);
      streamRef.current?.getTracks().forEach((s) => s.stop());
      streamRef.current = null;
    };
  }, [onKode]);

  if (galat) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-2 rounded-lg bg-sunken px-4 py-8 text-center"
      >
        <CameraOff aria-hidden className="size-8 text-line" />
        <p className="type-body-md font-bold text-ink">
          {galat === "tak_didukung" ? t("scan_unsupported") : t("scan_denied")}
        </p>
        <p className="type-body-sm max-w-xs text-muted">{t("scan_fallback_hint")}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-950">
      <video
        ref={videoRef}
        playsInline
        muted
        aria-label={t("scan_video_aria")}
        className="size-full object-cover"
      />
      {/* Bingkai bidik: sisi gelap memberi tahu ke mana QR harus diarahkan
          tanpa menutupi gambar kameranya. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-[15%] rounded-xl border-2 border-white/90 shadow-[0_0_0_100vmax_rgba(0,0,0,0.45)]" />
        <ScanLine className="absolute inset-x-0 top-1/2 mx-auto size-8 -translate-y-1/2 text-white/70" />
      </div>
    </div>
  );
}
