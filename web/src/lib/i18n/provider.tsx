"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { idMessages } from "./messages/id";

export type Locale = "id" | "en";

/**
 * Kamus Inggris dimuat saat diminta, bukan diimpor di atas.
 *
 * Keduanya statis membuat 62 KB kamus Inggris ikut masuk chunk bersama, yang
 * diunduh setiap route — termasuk untuk mayoritas pengguna yang tidak pernah
 * meninggalkan bahasa Indonesia. Itu sendirian mendorong sebelas route melewati
 * anggaran NFR-05.
 *
 * Konsekuensinya jujur: pengunjung yang bahasanya tersimpan "en" melihat satu
 * frame Indonesia sebelum chunk-nya tiba. Ditukar dengan 62 KB yang tidak
 * pernah dipakai di setiap kunjungan pertama, itu pertukaran yang benar.
 */
type Kamus = typeof idMessages;

let enCache: Kamus | null = null;

async function muatEn(): Promise<Kamus> {
  if (!enCache) {
    const mod = await import("./messages/en");
    enCache = mod.enMessages as Kamus;
  }
  return enCache;
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  isEn: boolean;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "id",
  setLocale: () => {},
  toggleLocale: () => {},
  isEn: false,
});

export const KUNCI_LOCALE = "pantas-locale";

/**
 * Menulis pilihan bahasa ke cookie, bukan hanya localStorage.
 *
 * `src/i18n/request.ts` membacanya untuk memilih kamus komponen server.
 * Tanpa ini `/lacak/[hash]` — satu-satunya halaman publik yang dirender di
 * server — selalu berbahasa Indonesia di dalam header dan footer berbahasa
 * Inggris. Setahun cukup: pilihan bahasa tidak perlu kedaluwarsa lebih cepat
 * daripada ingatan pengunjung tentang pernah memilihnya.
 */
function tulisCookieLocale(locale: Locale) {
  document.cookie = `${KUNCI_LOCALE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(KUNCI_LOCALE);
        if (saved === "en" || saved === "id") {
          return saved;
        }
      } catch {}
    }
    return "id";
  });

  /* Hanya kamus Inggris yang disimpan sebagai state; kamus aktif diturunkan
     dari `locale` di bawah. Menyimpan keduanya berarti effect ini harus
     memanggil `setPesan(idMessages)` secara sinkron saat kembali ke Indonesia
     — render tambahan untuk nilai yang sudah bisa dihitung, dan persis yang
     dilarang `react-hooks/set-state-in-effect`. */
  const [enPesan, setEnPesan] = useState<Kamus | null>(() => enCache);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (locale !== "en" || enPesan) return;
    let batal = false;
    void muatEn()
      .then((m) => {
        if (!batal) setEnPesan(m);
      })
      /* Chunk gagal diunduh (offline, cache basi) bukan alasan untuk
         mengosongkan layar: Indonesia tetap terpasang dan tetap terbaca. */
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [locale, enPesan]);

  const pesan: Kamus = locale === "en" ? (enPesan ?? idMessages) : idMessages;

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    // Cookie lebih dulu: ini yang dibaca render server berikutnya, dan ia
    // tidak boleh hilang gara-gara localStorage penuh atau mode privat.
    try {
      tulisCookieLocale(nextLocale);
    } catch {
      // ignore cookie errors
    }
    try {
      localStorage.setItem(KUNCI_LOCALE, nextLocale);
      document.documentElement.lang = nextLocale;
    } catch {
      // ignore storage errors
    }
  };

  const toggleLocale = () => {
    setLocale(locale === "id" ? "en" : "id");
  };

  const isEn = locale === "en";

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale, isEn }}>
      <NextIntlClientProvider
        key={pesan === idMessages ? "id" : "en"}
        locale={locale}
        messages={pesan}
        timeZone="Asia/Jakarta"
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
