"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button, Portal, cx } from "@/components/ui";
import { useStore } from "@/lib/store";
import { langkahTur, posisiTooltip, type Kotak } from "@/lib/tur";
import { useTranslations } from "@/lib/i18n";

const LEBAR_TOOLTIP = 320;

/** Kotak elemen dalam koordinat viewport, atau null bila ia tidak terlihat. */
function kotakTerlihat(selectors: string[]): { kotak: Kotak; el: Element } | null {
  for (const s of selectors) {
    for (const el of document.querySelectorAll(s)) {
      const r = el.getBoundingClientRect();
      // Elemen yang disembunyikan breakpoint lain tetap ada di DOM tapi
      // berukuran nol — menyorotnya menghasilkan lingkaran cahaya di pojok
      // kiri atas layar.
      if (r.width > 0 && r.height > 0) {
        return {
          kotak: { top: r.top, left: r.left, width: r.width, height: r.height },
          el,
        };
      }
    }
  }
  return null;
}

/**
 * Tur berpandu sekali jalan (F-04).
 *
 * Coach mark yang benar-benar berlabuh pada elemennya, bukan carousel di tengah
 * layar: yang perlu diingat petani adalah *di mana* tombolnya, dan itu hanya
 * tersampaikan kalau tombol aslinya yang disorot. Status selesainya disimpan di
 * `profiles.tur_selesai` lewat `completeTour`, jadi tur tidak pernah muncul dua
 * kali kecuali diminta ulang dari layar Akun.
 */
export function CoachmarkTour() {
  const t = useTranslations("tour");
  const { sesi, completeTour } = useStore();
  const role = sesi?.role ?? null;
  const langkah = role ? langkahTur(role) : [];

  const [indeks, setIndeks] = useState(0);
  const [kotak, setKotak] = useState<Kotak | null>(null);
  const [tinggiTooltip, setTinggiTooltip] = useState(180);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const pathname = usePathname();

  const aktif = sesi?.turSelesai === false;
  const step = langkah[indeks];

  const judulTeks = step?.judulKey ? t(step.judulKey as Parameters<typeof t>[0]) : step?.judul;
  const deskripsiTeks = step?.deskripsiKey ? t(step.deskripsiKey as Parameters<typeof t>[0]) : step?.deskripsi;

  /* Ditulis sebagai fungsi biasa: React Compiler yang memoisasi. `useCallback`
     di sini justru ditolaknya — dependensi yang disimpulkan (`setIndeks`) tidak
     ada di larik yang ditulis tangan, jadi seluruh komponen dilewati dari
     optimisasi. */
  const sebelumnya = () => {
    setIndeks((i) => Math.max(0, i - 1));
  };

  const selesai = () => {
    void completeTour();
  };

  /* Batas langkah diperiksa di dalam updater, bukan terhadap `indeks` hasil
     tangkapan closure, supaya penekanan tombol yang beruntun tidak membaca
     indeks yang sudah basi. */
  const berikutnya = () => {
    setIndeks((i) => {
      if (i + 1 >= langkah.length) {
        void completeTour();
        return i;
      }
      return i + 1;
    });
  };

  // Pantau perpindahan elemen target saat layar dimuat atau di-resize
  useEffect(() => {
    if (!aktif || !step) return;

    function perbarui() {
      const res = kotakTerlihat(step.target);
      if (res) {
        setKotak(res.kotak);
      } else {
        // Jika target langkah ini tidak ada di DOM (misal di halaman lain),
        // otomatis lewati ke langkah berikutnya
        setIndeks((i) => (i + 1 < langkah.length ? i + 1 : i));
      }
    }

    perbarui();
    window.addEventListener("resize", perbarui);
    window.addEventListener("scroll", perbarui, true);
    return () => {
      window.removeEventListener("resize", perbarui);
      window.removeEventListener("scroll", perbarui, true);
    };
  }, [aktif, step, pathname, langkah.length]);

  // Ukur tinggi tooltip aktual agar penempatan vertikal presisi
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      setTinggiTooltip(tooltipRef.current.offsetHeight);
    }
  }, [indeks, step]);

  /* Tombol panah dan Esc.
     Pemasangan pendengar bergantung pada nilai, bukan pada tiga handler di
     atas. Bergantung pada handler berarti melepas dan memasang ulang
     pendengar `keydown` di setiap render. */
  useEffect(() => {
    if (!aktif) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        void completeTour();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        setIndeks((i) => {
          if (i + 1 >= langkah.length) {
            void completeTour();
            return i;
          }
          return i + 1;
        });
      } else if (e.key === "ArrowLeft") {
        setIndeks((i) => Math.max(0, i - 1));
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [aktif, langkah.length, completeTour]);

  /* Fokus pindah ke kartu penjelasan setiap langkah, agar pembaca layar ikut */
  useEffect(() => {
    if (!aktif || !kotak) return;
    tooltipRef.current?.focus();
  }, [aktif, kotak, indeks]);

  if (!aktif || !step || !kotak) return null;

  const lebar = Math.min(LEBAR_TOOLTIP, typeof window !== "undefined" ? window.innerWidth - 32 : LEBAR_TOOLTIP);
  const posisi = posisiTooltip(
    kotak,
    { width: typeof window !== "undefined" ? window.innerWidth : 0, height: typeof window !== "undefined" ? window.innerHeight : 0 },
    { width: lebar, height: tinggiTooltip },
  );
  const terakhir = indeks + 1 >= langkah.length;

  return (
    <Portal>
      {/* Cincin penyorot elemen & latar redup */}
      <div
        aria-hidden
        onClick={berikutnya}
        className="fixed inset-0 z-[60]"
        style={{ cursor: "pointer" }}
      >
        <div
          className="absolute rounded-lg ring-2 ring-brand transition-all duration-200"
          style={{
            top: kotak.top - 6,
            left: kotak.left - 6,
            width: kotak.width + 12,
            height: kotak.height + 12,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
          }}
        />
      </div>

      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-judul`}
        aria-describedby={`${id}-teks`}
        tabIndex={-1}
        className="rise fixed z-[61] rounded-xl bg-overlay p-4 shadow-e4 outline-none"
        style={{ top: posisi.top, left: posisi.left, width: lebar }}
      >
        <p className="type-body-sm font-bold uppercase tracking-wide text-brand">
          {t("step_progress", { done: indeks + 1, total: langkah.length })}
        </p>
        <h2 id={`${id}-judul`} className="type-heading-md pt-1 text-ink">
          {judulTeks}
        </h2>
        <p id={`${id}-teks`} className="type-body-md pt-1.5 text-muted">
          {deskripsiTeks}
        </p>

        <div className="flex items-center justify-between gap-3 pt-4">
          <button
            type="button"
            onClick={selesai}
            className="type-body-sm tap focus-ring rounded-sm font-bold text-muted hover:text-ink"
          >
            {t("skip")}
          </button>

          <div className="flex items-center gap-1.5" aria-hidden>
            {langkah.map((l, i) => (
              <span
                key={l.id}
                className={cx(
                  "h-1.5 rounded-full transition-all",
                  i === indeks ? "w-4 bg-brand" : "w-1.5 bg-line",
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {indeks > 0 && (
              <Button variant="outline" size="sm" onClick={sebelumnya}>
                {t("prev")}
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={berikutnya}>
              {terakhir ? t("finish") : t("next")}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
