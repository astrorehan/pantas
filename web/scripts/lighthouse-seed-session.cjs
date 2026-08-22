/**
 * Menyiapkan sesi untuk pengukuran NFR-02 ("LCP halaman aplikasi setelah login").
 *
 * Layar peran duduk di balik `RequireRole`, yang membaca sesi dari store. Tanpa
 * sesi, Lighthouse hanya akan mengukur layar kosong lalu redirect ke /masuk —
 * angka yang tidak berarti apa-apa.
 *
 * Login lewat UI tidak dipakai karena job performa membangun aplikasi tanpa env
 * Supabase (lihat lighthouserc.cjs). Dalam mode itu store membaca sesi dari
 * localStorage apa adanya, jadi menanam satu baris cache sudah cukup dan hasilnya
 * deterministik — tidak bergantung pada basis data yang hidup.
 */

// Sinkron dengan KEY_BASE + keyFor() di src/lib/store.tsx. Tanpa Supabase,
// userId selalu undefined sehingga bucket-nya "anon".
const STORAGE_KEY = "pantas-store-v1:anon";

// Sama dengan AKUN_DEMO[0] di src/lib/demo.ts.
const SESI_PETANI = {
  role: "petani",
  email: "petani@demo.pantas.id",
  nama: "Pak Warsono",
  lokasi: "Pakem, Sleman — lereng Merapi",
  // Tur berpandu (F-04) adalah overlay yang muncul setelah hidrasi dan menggeser
  // fokus; mengukur dengannya menyala berarti mengukur kunjungan pertama saja.
  // Ambang NFR-02 berlaku untuk layar aplikasi, jadi tur ditandai selesai.
  turSelesai: true,
};

const SESI_PEMBELI = {
  role: "pembeli",
  email: "pembeli@demo.pantas.id",
  nama: "Rina Pradita",
  lokasi: "Umbulharjo, Yogyakarta",
  turSelesai: true,
};

/** @type {(browser: import('puppeteer').Browser, ctx: {url: string}) => Promise<void>} */
module.exports = async (browser, { url }) => {
  const { origin, pathname } = new URL(url);
  const page = await browser.newPage();

  try {
    // Origin dipinjam dari endpoint JSON, bukan dari halaman aplikasi: membuka
    // halaman aplikasi di sini akan memanaskan cache HTTP dan membuat LCP yang
    // diukur setelahnya terlihat lebih baik daripada kunjungan sungguhan.
    await page.goto(`${origin}/api/health`, { waitUntil: "domcontentloaded" });

    const sesi = pathname.startsWith("/pembeli") ? SESI_PEMBELI : SESI_PETANI;
    const perluSesi = pathname.startsWith("/petani") || pathname.startsWith("/pembeli");

    await page.evaluate(
      (key, value) => {
        window.localStorage.clear();
        if (value) window.localStorage.setItem(key, value);
      },
      STORAGE_KEY,
      perluSesi ? JSON.stringify({ sesi }) : null,
    );

    // `disableStorageReset` menahan Lighthouse membersihkan localStorage — dan
    // ikut menahan pembersihan cache HTTP. Cache dikosongkan manual di sini agar
    // setiap URL tetap diukur dalam keadaan dingin.
    const cdp = await page.createCDPSession();
    await cdp.send("Network.clearBrowserCache");
    await cdp.detach();
  } finally {
    await page.close();
  }
};
