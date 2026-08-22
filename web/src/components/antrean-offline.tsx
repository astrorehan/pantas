"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  bacaAntrean,
  catatGagal,
  daftarBackgroundSync,
  hapusAntrean,
} from "@/lib/antrean-offline";
import { gradeBatch, gradeBatchMulti, gradeDominan, labelKomoditas } from "@/lib/data";
import { useStore } from "@/lib/store";
import type { LaporanGrading } from "@/lib/types";
import { useTranslations } from "@/lib/i18n";

/**
 * Pemroses antrean pindai offline (F-14).
 *
 * Dipasang sekali di kerangka aplikasi petani. Ia tidak merender apa pun; ia
 * mendengarkan tiga pemicu dan menguras antrean IndexedDB:
 *
 * 1. mount — antrean bisa berisi sisa kunjungan sebelumnya;
 * 2. event `online` peramban — jalur utama di Safari/Firefox yang belum
 *    mendukung Background Sync;
 * 3. pesan dari service worker — Background Sync membangunkan halaman ini.
 *
 * Pemrosesan sengaja terjadi di halaman, bukan di worker: menyimpan hasil ke
 * `gradings` butuh sesi Supabase pengguna, yang tidak dimiliki worker. Lihat
 * public/sw.js.
 */
export function AntreanOffline() {
  const store = useStore();
  const t = useTranslations("logistik");
  const refresh = store.refreshAntreanPindai;
  const addScan = store.addScan;
  // Satu putaran pada satu waktu: dua pemicu bisa datang berbarengan (event
  // `online` dan pesan service worker), dan entri yang sama tidak boleh
  // diproses dua kali lalu tersimpan dobel.
  const sedangJalan = useRef(false);

  const proses = useCallback(async () => {
    if (sedangJalan.current) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    sedangJalan.current = true;

    let berhasil = 0;
    try {
      const antrean = await bacaAntrean();
      for (const entri of antrean) {
        let laporan: LaporanGrading | null = null;
        let pesanGagal = "";
        let bolehCobaLagi = false;

        if (entri.fotos.length > 1) {
          const r = await gradeBatchMulti(entri.fotos, entri.komoditas);
          if (r.agregat.status === "success") laporan = r.agregat;
          else {
            pesanGagal = r.agregat.message ?? "Gagal dinilai.";
            bolehCobaLagi = Boolean(r.agregat.luring);
          }
        } else {
          const r = await gradeBatch({
            imageDataUrl: entri.fotos[0]?.dataUrl,
            commodity: entri.komoditas,
            coinRoi: entri.fotos[0]?.roi,
          });
          if (r.status === "success") laporan = r;
          else {
            pesanGagal = r.message;
            bolehCobaLagi = Boolean(r.luring);
          }
        }

        if (laporan) {
          addScan({
            komoditas_label: entri.komoditas_label,
            grade_dominan: gradeDominan(laporan.ringkasan_batch.komposisi),
            objek: laporan.objek_terdeteksi,
            gambar: entri.fotos[0]?.dataUrl ?? "/img/tomat.jpg",
            foto: entri.fotos.length > 1 ? entri.fotos.length : undefined,
            hasil: laporan,
          });
          await hapusAntrean(entri.id);
          berhasil += 1;
          continue;
        }

        if (bolehCobaLagi) {
          // Masih offline atau layanan belum pulih: sisa antrean tidak perlu
          // dicoba satu per satu untuk mendapat kegagalan yang sama.
          await catatGagal(entri.id, pesanGagal);
          break;
        }

        // Ditolak engine (blur, komoditas tidak didukung). Mencoba lagi tidak
        // akan mengubah jawabannya, jadi entri dibuang — tetapi petani harus
        // diberi tahu foto itu tidak jadi laporan.
        await hapusAntrean(entri.id);
        toast.error(
          t("offline_queue_rejected", {
            commodity: labelKomoditas(entri.komoditas),
            reason: pesanGagal,
          }),
        );
      }
    } catch {
      /* IndexedDB tidak tersedia — tidak ada antrean untuk diproses. */
    } finally {
      sedangJalan.current = false;
      await refresh();
    }

    if (berhasil > 0) {
      toast.success(
        t("offline_queue_processed", { count: berhasil }),
      );
    }
  }, [addScan, refresh, t]);

  useEffect(() => {
    const initOffline = () => {
      void refresh();
      void proses();
    };

    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(initOffline);
      } else {
        setTimeout(initOffline, 300);
      }
    }

    const saatOnline = () => {
      void daftarBackgroundSync();
      void proses();
    };
    const dariWorker = (e: MessageEvent) => {
      if (e.data?.type === "pantas:proses-antrean") void proses();
    };

    window.addEventListener("online", saatOnline);
    navigator.serviceWorker?.addEventListener("message", dariWorker);
    return () => {
      window.removeEventListener("online", saatOnline);
      navigator.serviceWorker?.removeEventListener("message", dariWorker);
    };
  }, [proses, refresh]);

  return null;
}

/**
 * Pendaftaran service worker.
 *
 * Terpisah dari pemroses di atas supaya jelas apa yang dilakukan masing-masing:
 * worker hanya membangunkan halaman lewat Background Sync (public/sw.js), tanpa
 * strategi cache apa pun.
 */
export function DaftarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const registerSW = () => {
      navigator.serviceWorker.register("/sw.js").catch((e) => {
        console.warn("[pantas] pendaftaran service worker gagal:", e);
      });
    };
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(registerSW);
      } else {
        setTimeout(registerSW, 500);
      }
    }
  }, []);

  return null;
}
