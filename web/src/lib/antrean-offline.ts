"use client";

import type { FotoAntrean } from "./data";

/**
 * Antrean pindai offline (F-14).
 *
 * Petani memotret di kebun tanpa sinyal; fotonya harus tetap tersimpan dan
 * diproses ketika sinyal kembali. localStorage tidak dipakai di sini: satu
 * batch multi-foto bisa beberapa ratus kilobyte dan menulis blob sebesar itu
 * ke localStorage — yang sinkron dan berkuota ~5 MB bersama seluruh cache
 * aplikasi — akan membekukan UI lalu gagal. IndexedDB asinkron dan kuotanya
 * jauh lebih besar, dan isinya bertahan setelah reload maupun tab ditutup.
 *
 * Tanpa dependensi: wrapper IndexedDB seadanya lebih murah daripada menarik
 * pustaka baru untuk satu object store.
 */

const DB_NAME = "pantas-antrean";
const DB_VERSI = 1;
const STORE = "pindaian";

/** Nama tag Background Sync; sama persis dengan yang didengarkan public/sw.js. */
export const SYNC_TAG = "pantas-antrean-pindai";

export interface AntreanPindai {
  id: string;
  /** ISO — dipakai mengurutkan dan menampilkan "menunggu sejak". */
  dibuat: string;
  komoditas: string;
  komoditas_label: string;
  fotos: FotoAntrean[];
  /** Berapa kali percobaan pemrosesan sudah gagal. */
  percobaan: number;
  galatTerakhir?: string;
}

function bukaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB tidak tersedia di peramban ini."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSI);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Gagal membuka IndexedDB."));
  });
}

function jalankan<T>(
  mode: IDBTransactionMode,
  aksi: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return bukaDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = aksi(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("Transaksi antrean gagal."));
        tx.oncomplete = () => db.close();
      }),
  );
}

export async function tambahAntrean(
  entri: Omit<AntreanPindai, "id" | "dibuat" | "percobaan">,
): Promise<AntreanPindai> {
  const baris: AntreanPindai = {
    ...entri,
    id: `antre-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dibuat: new Date().toISOString(),
    percobaan: 0,
  };
  await jalankan("readwrite", (s) => s.add(baris));
  await daftarBackgroundSync();
  return baris;
}

export async function bacaAntrean(): Promise<AntreanPindai[]> {
  const semua = await jalankan<AntreanPindai[]>("readonly", (s) => s.getAll());
  return semua.sort((a, b) => a.dibuat.localeCompare(b.dibuat));
}

export async function hitungAntrean(): Promise<number> {
  try {
    return await jalankan<number>("readonly", (s) => s.count());
  } catch {
    // Peramban tanpa IndexedDB (atau mode privat yang memblokirnya) tidak
    // punya antrean sama sekali — nol adalah jawaban yang benar, bukan galat.
    return 0;
  }
}

export async function hapusAntrean(id: string): Promise<void> {
  await jalankan("readwrite", (s) => s.delete(id));
}

/** Catat kegagalan supaya entri tidak diulang tanpa jejak. */
export async function catatGagal(id: string, pesan: string): Promise<void> {
  const baris = await jalankan<AntreanPindai | undefined>("readonly", (s) => s.get(id));
  if (!baris) return;
  await jalankan("readwrite", (s) =>
    s.put({ ...baris, percobaan: baris.percobaan + 1, galatTerakhir: pesan }),
  );
}

/**
 * Minta service worker memproses antrean begitu koneksi kembali.
 *
 * Gagal diam-diam bila peramban tidak mendukung Background Sync (Safari, dan
 * Firefox tanpa flag): jalur cadangannya adalah pemroses di halaman yang
 * mendengarkan event `online` — lihat components/antrean-offline.tsx.
 */
export async function daftarBackgroundSync(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    };
    await reg.sync?.register(SYNC_TAG);
  } catch {
    /* Background Sync tidak tersedia — pemroses di halaman yang mengambil alih. */
  }
}
