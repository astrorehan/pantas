/*
 * Service worker PANTAS — pemicu Background Sync untuk antrean pindai (F-14).
 *
 * Cakupannya sengaja sempit: worker ini TIDAK melakukan precache app shell atau
 * strategi cache apa pun (itu pekerjaan F-95). Satu-satunya tugasnya adalah
 * bangun ketika koneksi kembali dan menyuruh halaman yang terbuka memproses
 * antrean IndexedDB.
 *
 * Kenapa bukan worker yang memanggil /predict sendiri: menyimpan hasilnya butuh
 * sesi Supabase pengguna, yang hidup di konteks halaman. Worker yang mencoba
 * mengunggah tanpa sesi hanya akan ditolak RLS — jadi ia membangunkan halaman,
 * dan halaman yang mengerjakan. Bila tidak ada halaman terbuka, antrean tetap
 * utuh di IndexedDB dan diproses pada kunjungan berikutnya.
 */

const SYNC_TAG = "pantas-antrean-pindai";

self.addEventListener("install", () => {
  // Tidak ada yang di-precache; langsung aktif supaya versi baru tidak
  // menunggu tab lama ditutup.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Beri tahu setiap halaman PANTAS yang terbuka bahwa antrean layak dicoba lagi.
 * `includeUncontrolled` supaya tab yang dibuka sebelum worker ini aktif ikut
 * menerima pesannya.
 */
async function bangunkanKlien() {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clients) {
    client.postMessage({ type: "pantas:proses-antrean" });
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(bangunkanKlien());
  }
});

// Halaman dapat memaksa satu putaran pemrosesan, misalnya sesudah menambah
// entri baru saat masih offline.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "pantas:coba-antrean") {
    event.waitUntil(bangunkanKlien());
  }
});
