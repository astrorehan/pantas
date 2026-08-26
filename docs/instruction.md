# INSTRUCTION & IMPLEMENTATION TASK LIST — PANTAS v1.0 "Competition Build"

> **Dokumen Panduan Eksekusi Teknis**  
> **Ajang:** HOLOGY 9.0 (House of Technology) — Cabang Lomba HoloDev (Software Development Competition)  
> **Tim:** Inilah 4 trio | **Target Release:** `v1.0.0` (7 September 2026) & `v1.1.0` (3 Oktober 2026)  
> **Sumber Utama:** [`docs/PRD.md`](PRD.md) v1.1  

> **Pelacak progres per fitur sekarang ada di [`docs/BACKLOG.md`](BACKLOG.md)** — 72 F-ID lengkap,
> digenerate dari PRD sehingga tidak bisa ketinggalan fitur. Berkas ini tetap dipakai untuk hal yang
> tidak punya F-ID: urutan fase, checklist runbook submission, dan kit demo offline (Fase 4).

---

## 📌 Aturan Eksekusi & Kontrak Pengkodean

1. **Prioritas Ketat (Strict Gate):**
   - **P0** = Wajib selesai dan lulus Acceptance Criteria sebelum P1 dimulai.
   - **P1** = Pembeda nilai (dikerjakan setelah seluruh P0 selesai).
   - **P2** = Nice-to-have.
2. **Traceability Rubrik (HOLOGY 9.0 HoloDev):** Setiap commit / PR **wajib** mencantumkan minimal satu tag rubrik:
   - `[TEMA]` (30% Penyisihan) | `[INOVASI]` (30% Penyisihan) | `[FUNGSI]` (15% Penyisihan / 30% Final) | `[UIUX]` (10% Final) | `[KODE]` (20% Final) | `[PRESENTASI]` (15% Final) | `[ARGUMEN]` (25% Final)
3. **Arsitektur Seam Frontend:**
   - **DILARANG** memanggil `supabase` atau `fetch` langsung dari file `src/app/**` atau `src/components/**`.
   - Seluruh pembacaan data wajib melalui `src/lib/data.ts`.
   - Seluruh mutasi data wajib melalui `src/lib/store.tsx`.
4. **Keamanan RLS Supabase:**
   - Setiap tabel baru wajib mengaktifkan RLS sebelum rilis (`NFR-SEC-01`).
   - Kode Rahasia Serah Terima (`order_kode`) diisolasi di tabel khusus dan **TIDAK BUKAN** milik RLS Petani (`NFR-SEC-03`).

---

## 🚀 FASE 1: FONDASI DESIGN SYSTEM "PANEN" & LAYOUT SHELL
> *Status: Selesai.*

### 🛠 Task 1.1: Design Tokens & System Warna (`globals.css` v2)
- [x] **[UIUX] P0** Perbarui `@theme` di `src/app/globals.css` dengan skala primitif lengkap:
  - `--color-green-50` s/d `950` (Brand Green), `--color-clay-50` s/d `700` (Aksen Tanah), `--color-stone-0` s/d `950` (Netral hangat).
- [x] **[UIUX] P0** Definisikan token grade semantik konsisten AI Engine:
  - Grade A (`#2d6a4f`), Grade B (`#b4783a`), Grade C (`#2563eb`), Reject (`#a01f1f`).
- [x] **[UIUX] P0** Terapkan token semantik light/dark mode (`--surface-canvas`, `--surface-raised`, `--text-primary`, `--border-subtle`, dll).
- [x] **[UIUX] P0** Tambahkan inline script anti-flash theme pada `<head>` di `layout.tsx` untuk membaca `localStorage` theme.

### 🛠 Task 1.2: Tipografi & Font Self-Hosted
- [x] **[UIUX] P0** Dapatkan dan pasang font **Bricolage Grotesque** (Display) dan **Inter** (Text/Body) via `next/font`.
- [x] **[UIUX] P0** Konfigurasi JetBrains Mono untuk komponen monospaced (Hash audit SHA-256 & kode).
- [x] **[UIUX] P0** Implemen skala tipografi (`display-lg` s/d `mono-sm`) dengan batas minimum teks tubuh petani 14px (`F-70`).

### 🛠 Task 1.3: Responsive AppShell & Hapus Max-Width Frame
- [x] **[UIUX] P0** **[F-75]** Hapus `@utility app-frame` (`max-width: 430px`) dari `globals.css` dan `layout.tsx`.
- [x] **[UIUX] P0** Implemen `AppShell` dinamis per breakpoint:
  - `< md`: Bottom tab bar navigation.
  - `md`: Left Rail (88px).
  - `lg+`: Left Sidebar (240px/256px) dapat diciutkan.
- [x] **[UIUX] P0** **[F-76]** Audit dan hapus seluruh class `max-w-[430px]` di `src/`. Pasang lint rule restriction agar tidak terjadi regresi.
- [x] **[UIUX] P0** **[F-78 & F-79]** Pastikan `overflow-x: auto` pada kontainer tabel/foto dan kuncikan aspect ratio gambar untuk mencegah CLS.

### 🛠 Task 1.4: 28 Komponen Primitif Design System Panen (`src/components/ui/`)
- [x] **[UIUX] P0** **[F-71]** Implemen/revamp komponen dasar dengan state lengkap (default, hover, active, focus-visible `2px`, disabled, loading):
  - `Button` (5 varian x 4 ukuran), `IconButton`, `Input`, `Textarea`, `Select`, `Combobox` (pilihan 12 komoditas).
  - `Checkbox`, `Radio`, `Switch`, `Slider`, `Card`, `Stat` (dengan provenance tooltip).
  - `GradeBadge`, `GradeDot`, `GradeBar` (animasi komposisi), `Tabs`, `Dialog` (focus trap + portal), `Sheet` (Bottom sheet mobile / Side drawer desktop).
  - `Popover`, `Tooltip`, `Table`, `DataGrid` (desktop dense), `Pagination`, `EmptyState` (ilustrasi SVG kustom), `Skeleton`, `Stepper`, `Timeline`, `FileDrop`, `Avatar`, `Breadcrumb`.

### 🛠 Task 1.5: Visual Regression & Design System Gallery Page
- [x] **[UIUX] P1** **[F-72]** Buat halaman `/dev/ds` (development only) yang merender seluruh komponen dalam berbagai state dan tema (Light/Dark).

### 🛠 Task 1.6: Boundary Error & CI Pipeline
- [x] **[FUNGSI] P0** **[F-98]** Buat `error.tsx` dan `not-found.tsx` bertema PANTAS di setiap segmen route.
- [x] **[FUNGSI] P0** Konfigurasi CI GitHub Actions: `npm ci` → `npm run gen:komoditas` → `tsc --noEmit` → `eslint` → `vitest run`.

---

## 🎯 FASE 2: FITUR P0 SUBMISSION BUILD (DEADLINE: 7 SEPTEMBER 2026)
> *Target: Seluruh kebutuhan kritis lomba & rubrik penilaian wajib berfungsi 100%.*
> *Status: Selesai 100%.*

### 🛠 Task 2.1: Onboarding, Landing Publik & Akun Demo Juri
- [x] **[TEMA][UIUX][PRESENTASI] P0** **[F-01]** Buat Halaman Landing Publik di `/` (Login dipindahkan ke `/masuk`):
  - Hero section + Tagline + Live Demo Grading tanpa login.
  - Section "Masalah dalam Angka" (susut pascapanen FLW Bappenas 62.8%).
  - Section "Cara Kerja" (4 langkah beranimasi saat scroll).
  - Section "Kedalaman Teknis & Pipeline AI".
  - Section "Dampak & Keberlanjutan".
- [x] **[FUNGSI] P0** **[F-02]** Revamp `/masuk`: Pisahkan mode Masuk & Daftar eksplisit, toggle show/hide password, indikator kekuatan password.
- [x] **[FUNGSI][PRESENTASI] P0** **[F-03]** Buat `supabase/seed_demo.sql` dengan lokasi geografi **DIY (Sleman, Kulon Progo, Bantul, Kota Yogyakarta)**:
  - Seed akun Petani (`petani@demo.pantas.id`), Pembeli (`pembeli@demo.pantas.id`), Admin (`admin@demo.pantas.id`).
- [x] **[PRESENTASI] P0** **[F-110]** Buat Halaman `/demo` (Pendaratan Juri):
  - Kartu kredensial 1-klik masuk + Skrip Demo 3 Menit + Tautan 5 layar utama + Link repo.
- [x] **[FUNGSI] P0** Buat API Route Handler `POST /api/demo/reset` (dikunci token bearer) untuk reset otomatis via Vercel Cron.
- [x] **[FUNGSI] P0** **[F-05]** Buat tombol "Lihat sebagai Pembeli/Petani/Admin" di menu akun (khusus `is_demo = true`).

### 🛠 Task 2.2: Revamp Grading AI & Laporan Audit
- [x] **[FUNGSI][INOVASI] P0** **[F-10]** Revamp Layar Pindai `/petani/pindai`:
  - Checklist kesiapan langsung (Ketajaman Laplacian, Luminans, ROI Koin).
  - Desktop-first `FileDrop` area untuk unggah foto batch.
  - Switch kamera depan/belakang & toggle torch senter.
- [x] **[FUNGSI][UIUX][INOVASI] P0** **[F-11]** Revamp Laporan Grading `/petani/hasil`:
  - Tabel rincian per-objek terdeteksi (ID, Grade, Ukuran mm², Solidity, Circularity, YOLO-2, Alasan).
  - Interactive highlighting: hover baris tabel menyorot bounding box di foto (desktop).
  - Feature Zoom & Pan foto beranotasi.
  - Ekspor Laporan PDF 1-halaman (Foto, Komposisi, Tabel Objek, SHA-256 Hash, QR).
  - Web Share API ke WhatsApp dengan tautan `/lacak/[hash]`.

### 🛠 Task 2.3: Auditing ML Model & Risk Mitigation
- [x] **[INOVASI] P0** **[F-107]** **Leakage Audit Wortel (100% Val Accuracy Check):**
  - Periksa split dataset train/val `carrot_cls.pt`. Pastikan tidak ada data leak/duplicate.
  - Jika val set kecil, dokumentasikan jumlah sampel validasi secara jujur (misal: "100% pada 40 gambar test").
- [x] **[INOVASI] P0** **[R-14]** **Penanganan Bobot Cabai `chili_cls.pt`:**
  - Selesaikan pelatihan model klasifikasi cabai.
  - Jika belum selesai, turunkan `VETO_CONF_MIN` khusus cabai agar tidak terjadi false-REJECT yang merugikan petani.

### 🛠 Task 2.4: Pricing Engine & Penerbitan Listing
- [x] **[FUNGSI][TEMA] P0** **[F-20]** Revamp Kartu Rekomendasi Harga `/petani/harga`:
  - Komponen `FormulaBreakdown` (menampilkan suku rumus & provenance harga acuan PIHPS).
  - Slider sensitivitas "Bagaimana jika Grade A naik 10%?".
- [x] **[FUNGSI] P0** **[F-21]** Alur Terbit Listing dari Hasil Grading:
  - Auto-fill estimasi berat batch dari kalibrasi AI.
  - Pilih foto utama, edit judul & deskripsi, pilih satuan (kg/ton/ikat), pratinjau sebelum tayang.

### 🛠 Task 2.5: Marketplace & Sistem Penawaran / Negosiasi
- [x] **[FUNGSI][UIUX] P0** **[F-30]** Revamp Katalog `/pembeli`:
  - Sidebar filter desktop (Komoditas, Grade, Slider Harga, Jarak, Stok, Filter AI report).
  - Sort eksplisit, responsive grid (3-4 kolom desktop), Infinite Scroll / Pagination, Skeleton loading.
- [x] **[FUNGSI] P0** **[F-31]** Detail Listing `/pembeli/produk/[id]`:
  - Galeri multi-foto, Panel Laporan Mutu AI (komposisi & link `/lacak/[hash]`), Kartu Profil Petani, Peta mini lokasi.
- [x] **[FUNGSI] P0** **[F-32]** Implemen Alur Penawaran/Negosiasi 48 Jam:
  - Buat tabel `penawaran` Supabase (RLS terikat).
  - Alur: Inquiry → Kirim Penawaran → Petani (Terima / Tolak / Tawar Balik) → Pesanan `dipesan`.
  - Cron `/api/cron/kedaluwarsa` untuk mentriggers status kedaluwarsa > 48 jam.

### 🛠 Task 2.6: Lifecycle Pesanan & Security Hardening Kode Serah Terima
- [x] **[FUNGSI] P0** **[F-40]** Implemen Pesanan Lifecycle & Visual `Timeline` (`dipesan` → `dikonfirmasi` → `serah_terima` → `selesai` / `batal`).
- [x] **[FUNGSI][INOVASI] P0** **[F-41]** **Penutupan Utang Keamanan v1 Kode Serah Terima:**
  - Buat tabel terpisah `order_kode` dengan RLS **hanya-pembeli**.
  - Petani memasukkan/scan QR kode serah terima via RPC `verifikasi_serah_terima` (`security definer`).
  - Pembeli menampilkan kode QR (menggunakan package `qrcode`), Petani melakukan scan via kamera.
  - Catat `berat_aktual_kg` dan `catatan_mutu` saat serah terima. Tanda terima PDF digital.

### 🛠 Task 2.7: Logistik & Rantai Pasok (Pilar Subtema Lomba)
- [x] **[FUNGSI][TEMA] P0** **[F-50]** Implemen Penjadwalan Penjemputan `/petani/logistik`:
  - Tabel `pengiriman` (metode: jemput mandiri / konsolidasi / kurir), pilih jendela waktu.
- [x] **[TEMA][INOVASI] P0** **[F-51]** Implemen Perencana Konsolidasi Rute Multi-Petani DIY (`/admin/rute`):
  - Tabel `rute` & `rute_item`.
  - Visualisasi Peta Admin: Heuristik *Nearest-Neighbour* penggabungan titik jemput berdekatan.
  - **Kartu Penghematan CO₂e & Jarak:** Bandingkan rute konsolidasi vs individual.
  - Tampilan Petani: "Penjemputan Anda tergabung dalam Rute #X".

### 🛠 Task 2.8: Traceability & Halaman Lacak Publik
- [x] **[INOVASI][TEMA] P0** **[F-60]** Implemen Halaman Lacak Publik `/lacak/[hash]`:
  - Akses publik tanpa login, di-cache CDN via Route Handler `/api/lacak/[hash]`.
  - Menampilkan: Foto beranotasi, Komposisi Grade, SHA-256 Hash Kanonik, Status Kalibrasi, Rantai Kustodi Logistik.
  - Tanpa membocorkan PII (Email, No HP, Alamat Presisi, Harga).
- [x] **[INOVASI][TEMA] P0** **[F-61]** Tambahkan QR Code link `/lacak/[hash]` pada PDF Laporan Grading, PDF Tanda Terima, dan Detail Listing.

### 🛠 Task 2.9: Dashboard Dampak Lingkungan & Sumber Bersitasi
- [x] **[TEMA][FUNGSI] P0** **[F-65]** Revamp Dashboard Dampak `/petani/dampak`:
  - **Ganti konstanta 1.7 kg CO₂e dengan Poore & Nemecek (2018):** Wortel (0.43), Timun/Cabai (0.53), Tomat (0.53 konservatif / 2.09).
  - Tampilkan Tooltip Provenance Sumber Data (Poore & Nemecek 2018, *Science*; Bappenas FLW 2021).
  - Tampilkan penghematan km logistik & estimasi nilai ekonomi vs harga tengkulak (0.7x harga acuan).
- [x] **[TEMA][PRESENTASI] P0** **[F-66]** Buat View Postgres `dampak_agregat` (hanya menghitung data `is_demo = false`) untuk ditampilkan di Landing Publik & Admin.

### 🛠 Task 2.10: Akun, Preferensi & PWA Accessibility
- [x] **[FUNGSI] P0** **[F-68 & F-69]** Halaman Profil & Pengaturan (Theme switch, Language switch, Voice guide toggle, Font-size accessibility toggle).
- [x] **[INOVASI][FUNGSI] P0** **[F-95]** PWA Implementation (Workbox service worker, precache shell, offline fallback page).
- [x] **[UIUX] P0** **[F-96]** Aksesibilitas WCAG 2.1 AA (Kontras warna ≥ 4.5:1, Keyboard navigation, Label ARIA, Axe-core audit 0 error).
- [x] **[PRESENTASI] P0** **[F-86]** Dynamic Open Graph Metadata (`/api/og/[type]/[id]`), `sitemap.xml`, `manifest.json`.

---

## ⚡ FASE 3: FITUR P1 PEMBEDA NILAI (JIKA P0 TELAH HIJAU)
> *Target: Fitur kelas atas untuk menambah bobot Inovasi (20%) dan Fungsionalitas (40%).*

- [x] **[FUNGSI] P1** **[F-90 & F-92]** Admin Dashboard (`/admin`) & Panel Kesehatan Layanan AI (Ping `/health`, Latensi p50/p95, Warm-keeper monitor).
- [x] **[FUNGSI] P1** **[F-33]** In-App Realtime Chat (`pesan` table + Supabase Realtime) terikat konteks penawaran/pesanan.
- [x] **[UIUX][FUNGSI] P1** **[F-34 / F-77]** Mode Bandingkan Listing (Bandingkan 4 listing berdampingan + Ekspor PDF).
- [x] **[FUNGSI][INOVASI] P1** **[F-12]** Multi-Photo Batch Scanning (`POST /predict/batch`).
- [x] **[FUNGSI][INOVASI] P1** **[F-14]** Antrean Pindai Offline (IndexedDB + Background Sync Service Worker).
- [x] **[FUNGSI] P1** **[F-13]** Riwayat Pindai Terpaginasi & Perbandingan 2 Hasil Pindaian.
- [x] **[FUNGSI] P1** **[F-42]** Sistem Rating & Ulasan Dua Arah (1-5 Bintang).
- [x] **[TEMA] P1** **[F-52 & F-53]** Checklist Rantai Dingin (Cold-chain) & Breakdown Estimasi Ongkos Angkut Transparan.
- [x] **[FUNGSI][TEMA] P1** **[F-22]** Vercel Cron Refresh Harga Acuan PIHPS (`/api/cron/harga`).
- [x] **[INOVASI] P1** **[F-100 & F-104]** Automated AI Regression Test (40 foto berlabel via `pytest`) & Property Test Algorithm Harga (`fast-check`).
- [x] **[UIUX] P1** **[F-84 & F-81]** Command Palette (`Ctrl/⌘+K`) & Pintasan Keyboard Desktop (`g+d`, `g+p`, `/`).
- [ ] **[UIUX][PRESENTASI] P1** **[F-97]** Internasionalisasi i18n Bahasa Indonesia / English (`next-intl`).
- [x] **[INOVASI] P1** **[F-101]** Estimasi Berat dari Luas Terkalibrasi.
- [x] **[FUNGSI] P1** **[F-102]** Zona Peringatan Blur 3-Tingkat (< 12 Tolak, 12-35 Peringatkan, > 35 Normal).
- [x] **[PRESENTASI][TEMA] P1** **[F-85 & F-15]** Halaman Tentang (`/tentang`) & Kartu Dokumentasi Transparansi Model (`/tentang/model`).
- [x] **[UIUX][INOVASI] P1** **[F-73]** Set Ikon Domain Kustom PANTAS (SVG 24px: Komoditas, Grade, Koin, Logistik).

---

## 🏆 FASE 4: RUNBOOK, DELIVERABLE LOMBA & FINAL OFFLINE (8 SEPTEMBER – 3 OKTOBER)

### 📋 Checklist Runbook Submission (6–7 September 2026)
- [ ] Terapkan seluruh SQL migration ke Supabase Production (`ap-southeast-1`).
- [ ] Jalankan `seed_demo.sql` di produksi; tes login manual 3 akun demo.
- [ ] Verifikasi Vercel Cron: Warm-keeper `/health` (tiap 5 mnt), Reset Demo (tiap 6 jam), Harga Acuan (harian).
- [ ] Set up UptimeRobot monitoring untuk `pantas-ai.vercel.app` & endpoint `/health` AI Engine.
- [ ] Jalankan 5 Golden Flow E2E Test via Playwright di Chrome, Firefox, Safari (Mobile 360px & Desktop 1440px):
  - **G1:** Petani Pindai → Terbit Listing.
  - **G2:** Pembeli Filter → Inquiry → Penawaran.
  - **G3:** Negosiasi Penawaran → Pesanan Dibuat.
  - **G4:** Logistik Konsolidasi → Scan QR Serah Terima → Dampak Bertambah.
  - **G5:** Akses Halaman Lacak Publik `/lacak/[hash]` Tanpa Sesi.
- [ ] Pastikan Skor Lighthouse ≥ 95 di 4 Kategori pada Landing Publik.
- [ ] Verifikasi File Pengumpulan: Proposal PDF `Inilah 4 trio_HoloDev_HOLOGY9.0_Muhammad Raihan Surya_Universitas Gadjah Mada.pdf` & Video Demo `HoloDev_HOLOGY9.0_Inilah 4 trio_PANTAS`.

### 🎭 Kit Demo Final Offline (3 Oktober 2026 — FILKOM UB)
- [ ] 2 Ponsel Android/iOS + 1 Laptop (Semua terinstall PWA & ter-login).
- [ ] Hotspot Seluler Independen (2 Operator Berbeda).
- [ ] Fisik Panen: Tomat & Cabai Segar + 3 Koin Rp500.
- [ ] Video Rekaman Cadangan 90 Detik (Alur Pindai → Lacak).
- [ ] Lembar Cetak Ringkasan Arsitektur & QR Code `/demo` untuk Dewan Juri.

---

**Dokumen ini siap digunakan sebagai acuan eksekusi task.**
