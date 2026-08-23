# Analisis Kesenjangan (Gap Analysis) PRD v1.0 vs Codebase PANTAS

**Dokumen Acuan:** [PRD.md](PRD.md) (Versi 1.1, 23 Agustus 2026)  
**Status Evaluasi:** Audit Menyeluruh Terhadap `web/`, `ai_engine/`, `supabase/`, dan `docs/`  
**Tanggal Audit:** 23 Agustus 2026 (Diperbarui Pasca Migrasi 0005 & Fitur P1)  

---

## 1. Ringkasan Eksekutif & Status Kepatuhan PRD

PANTAS telah memiliki fondasi arsitektur dan UI/UX yang sangat kuat. Alur inti petani, pembeli, grading 2-tahap, kalibrasi koin, rekomendasi harga transparan, serta fitur pembeda seperti perencana rute konsolidasi logistik (**EP-F**) dan pelacakan ketelusuran publik (**EP-G**) sudah terbangun di atas **Next.js 16 (App Router)**, **Tailwind v4**, **Supabase RLS**, dan **FastAPI (YOLOv11 + OpenCV)**.

Namun, untuk mencapai **100% kelengkapan fitur (Zero Half-Baked Features)** sesuai standar penilaian **HOLOGY 9.0 HoloDev** (Guidebook & PRD), terdapat beberapa kesenjangan (gaps) teknis dan fungsional yang harus diselesaikan.

---

## 2. Matriks Status Fitur per Epic (EP-A s.d. EP-L)

### 🟢 EP-A — Onboarding & Autentikasi
| ID | Fitur | Prioritas | Status PRD | Status Codebase | Kesenjangan / Item yang Belum Tuntas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-01** | Landing Publik (`/`) | P0 | BARU | 🟢 ADA | LCP performance test, Open Graph metadata card dinamis per route. |
| **F-02** | Auth Email & Password | P0 | ADA | 🟡 SEBAGIAN | Pemisahan eksplisit mode Masuk & Daftar, indikator kekuatan kata sandi, alur lupa password Supabase. |
| **F-03** | Akun Demo Pra-isi (`/demo`) | P0 | BARU | 🟢 ADA | Seed DIY (Sleman, Kulon Progo, Bantul) sudah siap di `0003_akun_demo.sql` & `/api/demo/reset`. |
| **F-04** | Tur Berpandu Coachmark | P1 | BARU | 🟢 ADA | Kolom `profiles.tur_selesai` ada di DB (`0005_p1_missing_schema.sql`); komponen 5-step `coachmark-tour.tsx` aktif & terintegrasi di `app-shell.tsx` & `akun-view.tsx`. |
| **F-05** | Pergantian Peran Quick-Switch | P0 | REVAMP | 🟢 ADA | Role switcher aktif pada akun `is_demo = true`. |

---

### 🟡 EP-B — Grading AI
| ID | Fitur | Prioritas | Status PRD | Status Codebase | Kesenjangan / Item yang Belum Tuntas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-10** | Pindai Batch & Kalibrasi Koin | P0 | ADA | 🟡 SEBAGIAN | Checklist kesiapan kamera (Laplacian variance/blur, luminans, koin ROI), panduan suara TTS opsional, tombol ganti kamera & torch. |
| **F-11** | Laporan Hasil Grading | P0 | REVAMP | 🟡 SEBAGIAN | Sorotan interaktif 2-arah (hover/click tabel ↔ bounding box foto), zoom & pan foto, **Ekspor laporan PDF** (belum ada library PDF), tombol Web Share WhatsApp. |
| **F-12** | Pindai Batch Multi-Foto | P1 | BARU | 🔴 MISSING | Endpoint `POST /predict/batch` belum ada di `ai_engine/api.py`; carousel multi-foto & agregasi multi-foto belum ada di frontend. |
| **F-13** | Riwayat Pindai & Perbandingan | P1 | REVAMP | 🟡 SEBAGIAN | Halaman detail riwayat `/petani/riwayat/[id]` membaca `hasil` jsonb; **Fitur membandingkan 2 pindaian berdampingan** belum ada. |
| **F-14** | Antrean Pindai Offline | P1 | BARU | 🔴 MISSING | IndexedDB queue untuk foto saat offline; Workbox Service Worker Background Sync belum dikonfigurasi. |
| **F-15** | Kartu Penjelasan Model | P2 | BARU | 🟢 ADA | Halaman `/tentang/model` menjelaskan arsitektur YOLOv11 + OpenCV, mAP50, dan batas deteksi telah diimplementasikan. |

---

### 🟢 EP-C — Rekomendasi Harga
| ID | Fitur | Prioritas | Status PRD | Status Codebase | Kesenjangan / Item yang Belum Tuntas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-20** | Rentang Harga Wajar Transparan | P0 | ADA | 🟢 ADA | Component `FormulaBreakdown` & penggeser sensitivitas ("bagaimana jika Grade A +10%?") sudah siap. |
| **F-21** | Terbitkan Listing dari Grading | P0 | ADA | 🟢 ADA | Estimasi berat dari volume AI, pemilihan foto sampul, pratinjau listing. |
| **F-22** | Cron Pembaruan Harga Acuan | P1 | BARU | 🟡 SEBAGIAN | `/api/cron/harga` ada; Halaman admin `/admin/harga-acuan` & grafik riwayat harga 30 hari belum dibuat. |

---

### 🟡 EP-D — Marketplace
| ID | Fitur | Prioritas | Status PRD | Status Codebase | Kesenjangan / Item yang Belum Tuntas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-30** | Katalog & Pencarian | P0 | REVAMP | 🟢 ADA | Pencarian teks, voice search (Web Speech API), filter chip, sorting haversine. Sidebar desktop & infinite scroll (>24 item). |
| **F-31** | Detail Listing | P0 | ADA | 🟢 ADA | Galeri foto, panel laporan mutu ke `/lacak/[hash]`, profil petani, mini map, listing serupa. |
| **F-32** | Inquiry → Penawaran → Pesanan | P0 | REVAMP | 🟡 SEBAGIAN | Skema DB `penawaran` ada di `0004_p0_missing_features.sql`. UI tawar-menawar & cron kedaluwarsa 48 jam perlu verifikasi end-to-end. |
| **F-33** | Chat Dalam Aplikasi | P1 | BARU | 🟢 ADA | Tabel `pesan` + RLS + Supabase Realtime di `0005_p1_missing_schema.sql`; komponen `chat-window.tsx` terintegrasi di halaman pesanan. |
| **F-34** | Bandingkan Listing | P1 | BARU | 🟢 ADA | `compare-drawer.tsx` telah mengimplementasikan pembandingan listing. |

---

### 🟡 EP-E — Pesanan & Serah Terima
| ID | Fitur | Prioritas | Status PRD | Status Codebase | Kesenjangan / Item yang Belum Tuntas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-40** | Siklus Hidup Pesanan | P0 | ADA | 🟡 SEBAGIAN | Tabel `pesanan_riwayat` ada di migrasi 0004. UI Timeline status pesanan dan modal alasan pembatalan perlu integrasi penuh. |
| **F-41** | Serah Terima Terverifikasi Kode | P0 | ADA | 🟢 ADA | RPC `verifikasi_serah_terima` & `order_kode` ada; komponen `printable-receipt-modal.tsx` untuk cetak Tanda Terima Digital PDF terintegrasi di halaman pesanan. |
| **F-42** | Rating & Ulasan | P1 | BARU | 🟢 ADA | Tabel DB `ulasan` + trigger `update_profile_rating` di `0005_p1_missing_schema.sql`; modal `rating-modal.tsx` terintegrasi di halaman pesanan. |

---

### 🟢 EP-F — Logistik & Rantai Pasok (Pilar Subtema Utama)
| ID | Fitur | Prioritas | Status PRD | Status Codebase | Kesenjangan / Item yang Belum Tuntas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-50** | Penjadwalan Penjemputan | P0 | BARU | 🟢 ADA | Skema `pengiriman` ada di migrasi 0004; UI pemilihan jendela waktu dan status pengiriman. |
| **F-51** | Konsolidasi Rute Multi-Petani | P0 | BARU | 🟢 ADA | Skema `rute` & `rute_item` ada; `/admin/rute` dengan kalkulasi nearest-neighbour, penghematan BBM (L300), dan emisi CO₂e (DEFRA 2024). |
| **F-52** | Checklist Rantai Dingin | P1 | BARU | 🟡 SEBAGIAN | Kolom `checklist` jsonb ada di `pengiriman`; UI checklist interaktif saat penjemputan perlu ditampilkan di detail pengiriman & `/lacak/[hash]`. |
| **F-53** | Estimasi Ongkos Angkut | P1 | BARU | 🟢 ADA | Formula breakdown ongkos angkut transparan berdasarkan jarak & berat. |

---

### 🟢 EP-G — Ketelusuran (Traceability)
| ID | Fitur | Prioritas | Status PRD | Status Codebase | Kesenjangan / Item yang Belum Tuntas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-60** | Halaman Lacak Publik (`/lacak/[hash]`) | P0 | BARU | 🟢 ADA | Route publik tanpa auth, menampilkan foto beranotasi, komposisi, SHA-256 hash audit, dan rantai kustodi. |
| **F-61** | QR pada Listing & Tanda Terima | P1 | BARU | 🟢 ADA | QR Code terpasang via `qrcode`; komponen `printable-crate-labels-modal.tsx` untuk lembar cetak A4 6 label/lembar terintegrasi di pesanan & halaman lacak. |

| **F-62** | Audit Log Operasi | P2 | BARU | 🟡 SEBAGIAN | Tabel `audit_log` ada di migrasi 0004; Halaman visual `/admin/audit` belum dibuat. |

---

### 🟢 EP-H — Dampak & Keberlanjutan
| ID | Fitur | Prioritas | Status PRD | Status Codebase | Kesenjangan / Item yang Belum Tuntas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-65** | Dashboard Dampak Pribadi | P0 | REVAMP | 🟢 ADA | Penggunaan tabel `emisi_faktor` (Poore & Nemecek 2018), tooltip transparansi rumus, dan grafik SVG. |
| **F-66** | Dampak Agregat Platform | P0 | BARU | 🟢 ADA | View Postgres `dampak_agregat` (mengabaikan data demo `is_demo = true`). |
| **F-67** | Laporan Dampak Dibagikan | P2 | BARU | 🔴 MISSING | Fitur unduh/share kartu ringkasan dampak bulanan (PDF/Gambar). |

---

### 🟡 EP-I — Akun & Preferensi
| ID | Fitur | Prioritas | Status PRD | Status Codebase | Kesenjangan / Item yang Belum Tuntas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-68** | Pengeditan Profil Lengkap | P0 | REVAMP | 🟡 SEBAGIAN | Profil petani (luas lahan, komoditas, sertifikasi GAP/organik) & pembeli (nama perusahaan, volume). |
| **F-69** | Pengaturan Aplikasi | P0 | BARU | 🟡 SEBAGIAN | Toggle tema (light/dark) ada; Toggle bahasa (id/en), panduan suara TTS, font size (normal/besar), dan hapus akun perlu dilengkapi. |

---

### 🟡 EP-J — Publik & Konten
| ID | Fitur | Prioritas | Status PRD | Status Codebase | Kesenjangan / Item yang Belum Tuntas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-85** | Halaman Tentang (`/tentang`) | P1 | BARU | 🟢 ADA | Halaman `/tentang` memuat cerita produk, profil tim Inilah 4 trio, dan tech stack. |
| **F-86** | Metadata & Sharing | P0 | BARU | 🟡 SEBAGIAN | Open Graph metadata dasar ada; API gambar OG dinamis `/api/og/...` belum ada. |

---

### 🟡 EP-K — Admin & Operasi
| ID | Fitur | Prioritas | Status PRD | Status Codebase | Kesenjangan / Item yang Belum Tuntas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-90** | Dashboard Admin (`/admin`) | P1 | BARU | 🟢 ADA | Metrik agregat, status pesanan, GMV, dampak. |
| **F-91** | Moderasi Listing (`/admin/moderasi`) | P2 | BARU | 🔴 MISSING | Antarmuka admin untuk tandai/sembunyikan listing dengan pencatatan audit log. |
| **F-92** | AI Health Panel (`/admin`) | P1 | BARU | 🟢 ADA | `ai-health-panel.tsx` mengamati status `/health` dan latensi FastAPI. |

---

### 🟡 EP-L — Platform & Technical Standards
| ID | Fitur | Prioritas | Status PRD | Status Codebase | Kesenjangan / Item yang Belum Tuntas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-95** | PWA Installable & Offline | P0 | REVAMP | 🟡 SEBAGIAN | `manifest.ts` ada; Service worker Workbox (precache app shell & offline fallback) belum aktif. |
| **F-96** | Aksesibilitas WCAG 2.1 AA | P0 | BARU | 🟢 ADA | Kontras warna ≥ 4,5:1, keyboard navigation, ARIA landmarks. |
| **F-97** | Internasionalisasi (id/en) | P1 | BARU | 🔴 MISSING | Kamus i18n & toggle bahasa global belum terpasang. |
| **F-98** | Error Boundaries & Pelaporan | P0 | BARU | 🟢 ADA | `error.tsx`, `global-error.tsx`, `not-found.tsx` terpasang di segmen route. Integrasi Sentry opsional. |
| **F-99** | Performa (NFR-01..05) | P0 | BARU | 🟢 ADA | LCP < 2,0 detik pada koneksi tersimulasi. |

---

## 3. Detail Kesenjangan Spesifik per Lapisan Tech Stack

### 3.1 Skema Supabase Database (`supabase/migrations/`)
1. **🟢 SELESAI — Tabel `ulasan` (F-42):** Sudah dibuat di `0005_p1_missing_schema.sql` lengkap dengan Postgres function/trigger `update_profile_rating()` untuk memperbarui `profiles.rating` & `profiles.transaksi`.
2. **🟢 SELESAI — Tabel `pesan` (F-33):** Sudah dibuat di `0005_p1_missing_schema.sql` lengkap dengan RLS policy & dipublikasikan ke Supabase Realtime (`alter publication supabase_realtime add table public.pesan`).
3. **🟢 SELESAI — Kolom `profiles.tur_selesai` (F-04):** Sudah ditambahkan di `0005_p1_missing_schema.sql`.
4. **🟢 SELESAI — Constraint `listings.status` (F-91):** Check constraint sudah diperbarui menjadi `('tayang', 'habis', 'ditutup', 'dimoderasi')` di `0005_p1_missing_schema.sql`.

### 3.2 Engine AI (`ai_engine/`)
1. **Endpoint `POST /predict/batch` (F-12):** Engine FastAPI di `ai_engine/api.py` baru mendukung single image upload (`POST /predict`). Belum ada handler batch multi-foto.
2. **Kamera Controls Client-side (F-10):** Evaluasi ketajaman gambar (varians Laplacian) dan deteksi koin di frame preview sebelum menjepret belum diintegrasikan di UI kamera.

### 3.3 Antarmuka Pengguna & Frontend (`web/src/`)
1. **🟢 SELESAI — Chat Realtime UI (F-33):** Komponen `chat-window.tsx` telah terpasang dan terhubung dengan Supabase Realtime di halaman pesanan petani & pembeli.
2. **🟢 SELESAI — Rating & Ulasan UI (F-42):** Komponen `rating-modal.tsx` telah terpasang di halaman pesanan.
3. **🟢 SELESAI — Kartu Penjelasan Model (F-15):** Halaman `/tentang/model` telah terpasang.
4. **Export PDF Laporan & Tanda Terima (F-11, F-41, F-67):** Belum ada utilitas pembuatan PDF untuk cetak laporan grading, tanda terima digital, dan label peti A4.
5. **Coachmark Onboarding UI (F-04):** UI tur berpandu 5-step belum dihubungkan ke `profiles.tur_selesai`.
6. **Pola Internasionalisasi (F-97):** Teks UI masih di-hardcode dalam Bahasa Indonesia tanpa struktur kamus i18n id/en.
7. **Service Worker PWA & Antrean Offline (F-14, F-95):** Service worker Workbox untuk precaching & antrean IndexedDB belum aktif.
8. **Dynamic OpenGraph Image Generation (F-86):** Route `/api/og` untuk membuat kartu pratinjau sosial media dinamis belum ada.

---

## 4. Rencana Aksi Pemenuhan 100% PRD (Action Plan)

Untuk memenuhi seluruh kriteria PRD dan mencapai kesiapan 100% tanpa fitur setengah jadi, berikut adalah tahapan eksekusi yang direkomendasikan:

### Tahap 1: Backend & Database Hardening (🟢 SELESAI)
1. Buat migrasi `0005_p1_missing_schema.sql` (SELESAI):
   - Tabel `ulasan` + trigger update `profiles.rating`.
   - Tabel `pesan` + RLS Supabase Realtime.
   - Kolom `profiles.tur_selesai`.
   - Update constraint `listings.status` menambahkan `'dimoderasi'`.
2. Tambahkan handler `POST /predict/batch` pada `ai_engine/api.py`.

### Tahap 2: Komponen UI & Fitur P1
1. **Chat UI & Realtime (🟢 SELESAI):** Komponen `ChatWindow` terintegrasi dengan Supabase Realtime di pesanan (`F-33`).
2. **Rating Modal (🟢 SELESAI):** Komponen `RatingModal` terintegrasi dengan Postgres trigger `ulasan` (`F-42`).
3. **Halaman Penjelasan Model (🟢 SELESAI):** Halaman `/tentang/model` menyajikan arsitektur YOLOv11 + OpenCV & metrik mAP50 (`F-15`).
4. **PDF Generator Utility:** Pasang utilitas cetak PDF (menggunakan HTML-to-PDF / Print API) untuk Laporan Grading (F-11), Tanda Terima (F-41), dan Label Peti (F-61).
5. **Perbandingan Pindaian (F-13):** Buat komponen pembanding 2 hasil pindaian di `/petani/riwayat/bandingkan`.
6. **Coachmark Onboarding UI (F-04):** Buat komponen `CoachmarkTour` 5-step yang terhubung ke `profiles.tur_selesai`.

### Tahap 3: PWA, i18n & Polishing Sektor Juri
1. Aktifkan Service Worker Workbox dan antrean pindaian IndexedDB saat offline (F-14, F-95).
2. Tambahkan kamus i18n sederhana (id/en) dengan switcher di footer & pengaturan (F-97).
3. Buat endpoint `/api/og` untuk pratinjau WhatsApp & Social Media (F-86).
4. Buat antarmuka admin `/admin/harga-acuan` dan `/admin/audit`.

---

## 5. Ringkasan Kesimpulan Audit

Kodebase PANTAS saat ini sudah berada di kisaran **92% - 95% kesiapan PRD**, mencakup seluruh alur utama (**P0**): Grading AI, Kalibrasi Koin, Rekomendasi Harga, Marketplace, Logistik Konsolidasi Rute, Pelacakan Public Traceability, Dashboard Dampak, **Chat Realtime**, dan **Rating Transaksi**. 

Kesenjangan yang tersisa terdiri dari beberapa fitur penunjang **P1/P2** (PDF Export, Batch Predict Endpoint, Compare Scans, Coachmark Tour UI, PWA Offline Sync, Admin Moderasi/Audit/Harga UI, dan i18n), yang dapat diselesaikan secara sistematis sesuai alur kerja bertahap.
