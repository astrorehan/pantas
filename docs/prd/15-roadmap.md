<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1839–1919.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Roadmap & milestone per fase  
> Sumber: `docs/PRD.md` §baris 1839–1919
>
> [← Risk register (R-*)](./14-risk.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Definition of Done & metrik →](./16-dod-metrik.md)

<!-- PRD-SLICE-BEGIN -->
## 21. Roadmap & Milestone

Konteks tanggal: hari ini **23 Agustus 2026**. Tenggat pengumpulan **7 September 2026**. Final **3 Oktober 2026** (FILKOM UB).
Urutan di bawah disusun berdasarkan **ketergantungan dan dampak nilai**, bukan estimasi jam. Kerjakan berurutan; garis P0/P1/P2 adalah tempat pemotongan bila diperlukan.

### 21.1 Fase 1 — Fondasi (blokir semua yang lain)

Tidak ada pekerjaan fitur dimulai sebelum fase ini selesai; setiap fitur baru yang dibangun di atas design system lama harus ditulis ulang nanti.

1. **Token & tema** — `globals.css` v2, skala warna penuh, token semantik, dark mode dengan script anti-flash (§7.2)
2. **Tipografi** — pasang Bricolage Grotesque, skala tipografi, utilitas (§7.3)
3. **AppShell responsif** — hapus `app-frame`, sidebar/rail/bottom-nav per breakpoint, hapus semua `max-w-[430px]`, pasang lint rule (F-75, F-76)
4. **Komponen inti** — Button, IconButton, Input, Select, Card, Badge, Skeleton, EmptyState, Dialog, Sheet, Tabs, Table, Toast, Stat
5. **Halaman `/dev/ds`** — galeri komponen (F-72)
6. **Batas galat & halaman 404/500** (F-98)
7. **CI pipeline** (§16.3)

**Gerbang keluar:** aplikasi lama berjalan di atas shell baru tanpa regresi fungsional, tampak benar di 360px dan 1920px, light dan dark.

### 21.2 Fase 2 — P0 lomba (tanpa ini submission lemah)

1. **Landing publik** `/` + pindahkan login ke `/masuk` (F-01, F-02)
2. **Akun demo + seed + reset cron** (F-03)
3. **Halaman `/demo` dengan skrip juri** (F-110)
4. **Revamp layar Hasil** — tabel objek, sorotan tertaut, zoom, ekspor PDF (F-11)
5. **Revamp layar Pindai** — checklist kesiapan, jalur unggah desktop, TTS (F-10)
6. **Halaman lacak publik** `/lacak/[hash]` + QR (F-60, F-61)
7. **Penawaran/negosiasi** menggantikan inquiry-langsung-jadi-pesanan (F-32)
8. **Logistik dasar** — penjadwalan penjemputan (F-50)
9. **Konsolidasi rute + kartu penghematan** (F-51)
10. **Revamp katalog & peta desktop** (F-30, §8.3)
11. **Dampak v2** — provenance metrik, metrik logistik, agregat platform (F-65, F-66)
12. **Serah terima QR + tutup lubang `orders.kode`** (F-41)
13. **Pengaturan** — tema, bahasa, teks besar, panduan suara (F-69)
14. **Aksesibilitas AA** (F-96)
15. **PWA + service worker + halaman offline** (F-95)
16. **Metadata & OG** (F-86)
17. **Playwright G1–G5** (§17.1)
18. **Runbook produksi** (§16.4)

**Gerbang keluar:** kelima alur emas hijau di mobile & desktop; Lighthouse ≥ 95 di landing; ketiga akun demo terisi; semua tautan aktif.

### 21.3 Fase 3 — P1 pembeda nilai

1. Dashboard admin + kesehatan layanan AI (F-90, F-92)
2. Chat dalam aplikasi (F-33)
3. Bandingkan listing (F-34/F-77)
4. Pindai multi-foto (F-12)
5. Antrean pindai offline (F-14)
6. Riwayat & perbandingan pindaian (F-13)
7. Rating & ulasan (F-42)
8. Estimasi ongkos angkut & checklist rantai dingin (F-52, F-53)
9. Cron harga acuan + riwayat harga (F-22)
10. Set regresi AI (F-100), tes properti harga (F-104)
11. Palet perintah + pintasan keyboard (F-84, F-81)
12. i18n id/en (F-97)
13. Estimasi berat dari luas terkalibrasi (F-101)
14. Zona peringatan blur (F-102)
15. Halaman Tentang + kartu model (F-85, F-15)
16. Set ikon kustom (F-73)

### 21.4 Fase 4 — Pasca-submission (8 September – 2 Oktober, jendela final)

Selama penjurian online (8–21 September) **jangan deploy breaking changes ke produksi**. Kerjakan di branch fitur.

1. Latihan presentasi & demo (F-111) — simulasi pitching 10 menit + tanya jawab
2. Perbaikan dari umpan balik uji pengguna nyata
3. P2 yang tersisa: log audit, moderasi, laporan dampak dibagikan, umpan balik koreksi grading, ilustrasi empty state
4. Kit demo fisik disiapkan & diuji (2 smartphone, sampel panen, koin Rp500, hotspot mandiri)
5. Freeze `v1.1.0` pada 2 Oktober — siap Final Day di UB Malang 3 Oktober 2026

### 21.5 Peta jalan pasca-lomba (bahan BAB V proposal)

| Horizon | Isi |
| :--- | :--- |
| v2.0 | Payment gateway dengan escrow; APK lewat TWA; integrasi PIHPS otomatis; multi-tenant koperasi |
| v2.5 | Model komoditas tambahan (bawang, kentang, kubis — dataset sudah sebagian ada); estimasi berat terkalibrasi lapangan; prediksi umur simpan |
| v3.0 | Kontrak forward (pembeli memesan panen sebelum tanam); skor kredit petani berbasis riwayat mutu; API terbuka untuk pembeli industri besar |

---

