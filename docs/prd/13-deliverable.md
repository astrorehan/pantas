<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1769–1816.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Deliverable lomba — checklist, peta proposal, pitch deck  
> Sumber: `docs/PRD.md` §baris 1769–1816
>
> [← Judge experience & demo kit](./12-judge-demo.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Risk register (R-*) →](./14-risk.md)

<!-- PRD-SLICE-BEGIN -->
## 19. Deliverable Lomba

### 19.1 Checklist pengumpulan (7 September 2026, 23.59 WIB)

| # | Deliverable | Format / Detail | Status |
| :--- | :--- | :--- | :--- |
| 1 | Proposal | `Inilah 4 trio_HoloDev_HOLOGY9.0_Muhammad Raihan Surya_Universitas Gadjah Mada.pdf` (Maks 30 hal) | ☐ |
| 2 | Tautan Deployment | `https://pantas-ai.vercel.app` (Aplikasi web aktif & responsif) | ☐ |
| 3 | Video Demo | `HoloDev_HOLOGY9.0_Inilah 4 trio_PANTAS` (Maks 10 menit, public YouTube/GDrive) | ☐ |
| 4 | Source Code Archive | Format `.zip` / `.rar` disertai `README.md` (panduan instalasi, cara menjalankan, env, akun demo) | ☐ |
| 5 | Dokumen Teknis | Dokumentasi API, ERD, Arsitektur Sistem, Kartu Model AI (`docs/`) | ☐ |
| 6 | Akun Demo | Dicantumkan di proposal, form, README, dan `/demo` (`petani@demo.pantas.id`, `pembeli@demo.pantas.id`, `admin@demo.pantas.id`) | ☐ |

### 19.2 Peta proposal → dokumen ini (Format Lampiran HOLOGY 9.0)

| Struktur Proposal Guidebook | Sumber di PRD ini |
| :--- | :--- |
| a) Judul / Nama Perangkat Lunak | PANTAS — Platform Sistem Sortasi Mutu Cerdas & Marketplace Hortikultura |
| b) Abstrak (1 Halaman) | §1.1 Ringkasan Eksekutif & Tesis Solusi |
| c) Latar Belakang Ide Perangkat Lunak | §3.1 Masalah Riil (P1–P5), Data Bappenas/FAO, Urgensi Ketahanan Pangan |
| d) Tujuan & Manfaat Dikembangkan | §3.2 Tesis Produk, §3.3 Keselarasan Tema HOLOGY 9.0, Dampak Sosial-Ekonomi |
| e) Fitur Aplikasi | §10 Spesifikasi Fitur Lengkap (EP-A s.d. EP-L), Fitur Petani, Pembeli, Admin |
| f) Metode Pengembangan (Riset & Desain) | §7 Design System Panen, §4 Persona & JTBD, §17.4 Uji Pengguna |
| g) Analisis Kebutuhan & Desain Solusi | §5 Cakupan Produk, §8 Algoritma Harga, §14 NFR Keamanan & Kinerja |
| h) Arsitektur Sistem | §6 Diagram Arsitektur, §11 Model Data & ERD, §12 Kontrak API, §13 AI Engine |
| i) Mockup atau Gambaran Aplikasi | Desain visual responsif mobile & desktop, alur pindai, katalog, tracking |
| j) Rencana Implementasi | §21 Roadmap, Tahapan Fase 1–4, Peta Jalan Pasca-Lomba |
| k) Lampiran | Surat Pernyataan Orisinalitas (sesuai template HOLOGY 9.0) & Rapor AI |

### 19.3 Format Video Demo (Maksimal 10 Menit)

- Judul Video: `HoloDev_HOLOGY9.0_Inilah 4 trio_PANTAS`
- Hak Akses: Umum (Public) / Unlisted GDrive/YouTube
- Konten: Identitas tim (Inilah 4 trio - UGM), latar belakang singkat, demo fungsionalitas end-to-end aplikasi secara live (Pindai → Grading AI → Rekomendasi Harga → Listing Marketplace → Pembelian & Logistik Konsolidasi → Scan QR Serah Terima → Lacak Publik & Dashboard Dampak).

### 19.4 Kepatuhan aturan Guidebook

| Aturan guidebook | Kepatuhan |
| :--- | :--- |
| Dilarang template jadi tanpa pengembangan | Seluruh komponen UI ditulis sendiri (§7.4). Desain mandiri di `src/components/ui/`. Halaman `/dev/ds` menjadi bukti. |
| Icon, logo, font disediakan peserta | Logo PANTAS orisinal; set ikon domain kustom (F-73); font berlisensi OFL (Bricolage Grotesque & Inter). |
| Karya orisinal, belum pernah dilombakan/publikasi | Repositori bersih, commit atomic orisinal tim, terlampir surat orisinalitas bermaterai. |
| Tim 3 orang 1 institusi | Inilah 4 trio (3 Mahasiswa UGM). |
| Link aktif selama penjurian | NFR-10..14 + warm-keeper cron Vercel aktif 24/7. |
| Akun demo fungsional | `/demo` 1-tap login untuk Petani, Pembeli, Admin, auto-reset data tiap 6 jam. |

---

