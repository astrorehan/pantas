<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1021–1062.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — EP-L — Platform (PWA, a11y, i18n, performa)  
> Sumber: `docs/PRD.md` §baris 1021–1062  ·  Epic: `EP-L` Platform
>
> [← EP-K — Admin & Operasi](./EP-K-admin.md) · [Indeks](../00-INDEX.md) · [Backlog](../../BACKLOG.md) · [Model data — tabel, view, aturan RLS →](../05-model-data.md)

<!-- PRD-SLICE-BEGIN -->
### EP-L — Platform

#### F-95 · PWA installable & offline · [INOVASI][FUNGSI] · P0 · REVAMP
`manifest.ts` sudah ada; service worker belum.
- [ ] Workbox: precache app shell, `stale-while-revalidate` untuk katalog, `network-first` untuk data pesanan.
- [ ] Halaman offline yang berguna (bukan dino): menampilkan listing & pindaian ter-cache.
- [ ] Prompt instalasi kustom setelah 2 kunjungan.
- [ ] Background Sync untuk antrean pindai (F-14).

#### F-96 · Aksesibilitas WCAG 2.1 AA · [UIUX] · P0 · BARU
- [ ] Kontras teks ≥ 4,5:1 (≥ 3:1 untuk teks besar) di **kedua** tema — diverifikasi otomatis.
- [ ] Seluruh fungsi dapat dijangkau keyboard; urutan fokus logis; tanpa jebakan fokus kecuali dialog modal.
- [ ] Landmark ARIA, heading berurutan, `<label>` untuk setiap input.
- [ ] Informasi grade tidak pernah hanya lewat warna — selalu ada label teks atau bentuk.
- [ ] `prefers-reduced-motion` dihormati (sudah ada, dipertahankan).
- [ ] Uji dengan NVDA + VoiceOver pada 5 alur emas.
- [ ] `axe-core` berjalan di CI, nol pelanggaran serius/kritis.

#### F-97 · Internasionalisasi id/en · [UIUX][PRESENTASI] · P1 · BARU
`next-intl`, dua kamus. Default Indonesia. Toggle di pengaturan & footer. Berguna bila ada juri atau materi ekspo berbahasa Inggris. Semua string UI diekstrak — tidak ada teks keras di komponen.

#### F-112 · Bilingual sampai render server · [UIUX][PRESENTASI] · P1 · BARU
F-97 memasang `next-intl`; F-112 menutup lubang yang tersisa sesudahnya.

- **Locale bertahan di cookie.** Sebelumnya locale hanya hidup di localStorage, yang tidak bisa dibaca server, sehingga `getRequestConfig` mengunci locale server ke `id` dan `/lacak/[hash]` — satu-satunya route publik yang dirender di server — selalu kembali berbahasa Indonesia di dalam header dan footer berbahasa Inggris. `setLocale` menulis cookie `pantas-locale`, dan skrip inline pra-paint memindahkan pembaca lama, sama seperti `THEME_SCRIPT`.
- **Root layout sengaja tidak membaca cookie.** Memanggil `cookies()` di sana menarik seluruh pohon ke render dinamis dan membalik `/`, `/demo`, `/masuk`, `/tentang` dari Static ke Dynamic. Hanya `/lacak/[hash]` — sudah dinamis karena paramsnya — yang menyelesaikan locale di server.
- **Metadata route tetap Indonesia saja.** Menerjemahkannya butuh `generateMetadata` + `getTranslations`, yang membaca cookie dan menarik route publik statis kembali ke dinamis. Keputusan sadar, bukan kelalaian.
- **Tidak ada teks keras yang tersisa di permukaan yang sudah masuk.** Tur berpandu dan pemandu langkah berikutnya membawa kunci plus parameter `jumlah`, bukan prosa di dalam struktur data; label navigasi diselesaikan lewat `NAV_KEY_MAP`, bukan dicocokkan dengan teks yang dirender.
- **Gerbang paritas kamus.** `npm run check:i18n` membandingkan kedua kamus dua arah dan keluar bukan-nol pada ketimpangan apa pun.

#### F-98 · Batas galat & pelaporan · [FUNGSI] · P0 · BARU
- [ ] `error.tsx` dan `not-found.tsx` di setiap segmen route, bertema PANTAS dengan jalan keluar yang jelas.
- [ ] Sentry (free tier) menangkap galat klien & server, dengan sesi ter-scrub PII.
- [ ] Toast galat yang membedakan gangguan jaringan dari galat aplikasi.

#### F-99 · Performa · [UIUX] · P0 · BARU
Lihat NFR-01..NFR-05.

---

---

