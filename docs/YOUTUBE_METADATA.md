# Metadata Unggahan YouTube — Video Demo PANTAS

Untuk submisi **HoloDev (Software Development Competition) HOLOGY 9.0**, Universitas Brawijaya.
Ketentuan sumber: [KETENTUAN_VIDEO_HOLODEV.md](KETENTUAN_VIDEO_HOLODEV.md) ·
Struktur adegan: [STORYBOARD_DEMO.html](STORYBOARD_DEMO.html)

---

## 1. Judul Video

**Pakai ini (paling aman, persis format wajib Lampiran B Guidebook):**

```
HoloDev_HOLOGY9.0_Inilah 4 trio_PANTAS
```

**Alternatif** — kalau ingin lebih terbaca di pencarian, format wajib tetap di depan
dan pemisahnya em dash, jangan ubah bagian sebelum tanda pisah:

```
HoloDev_HOLOGY9.0_Inilah 4 trio_PANTAS — Sortasi Mutu Panen Berbasis Computer Vision & Marketplace Hortikultura
```

> Batas judul YouTube 100 karakter. Alternatif di atas 108 karakter, jadi kalau mau
> dipakai, potong jadi: `HoloDev_HOLOGY9.0_Inilah 4 trio_PANTAS — Sortasi Mutu Panen Berbasis AI` (72 karakter).

**Setelan unggah wajib:** Visibilitas **Public** (atau Unlisted), bukan Private.
Kalau lewat Google Drive: *Anyone with the link can view*.

---

## 2. Deskripsi Video

Salin apa adanya. Sesuaikan timestamp setelah final cut (lihat bagian 3).

```
PANTAS — Setiap Panen Pantas Dihargai
Video Demo Produk · HoloDev (Software Development Competition) HOLOGY 9.0
Fakultas Ilmu Komputer, Universitas Brawijaya

Tim: Inilah 4 trio — Universitas Gadjah Mada
• M. Choirudin Ammar — Team Lead & AI Engineer
• M. Raihan Surya — Fullstack Developer
• Ahmad Rafi Firdaus — Product Concept

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MASALAH

Berdasarkan kajian Bappenas bersama World Resources Institute (2021), 62,8% sayuran
di Indonesia hilang sebelum sampai ke konsumen, menyumbang kerugian hingga Rp106–205
triliun per tahun. Akarnya bukan teknologi tanam, melainkan penilaian mutu: panen
ditaksir sekilas dengan mata telanjang oleh tengkulak, harga ditentukan sepihak, dan
hasil panen bergrade rendah dibuang begitu saja.

SOLUSI

PANTAS (Penilaian Agrikultur Terstandar & Andal) mengubah taksiran subjektif menjadi
pengukuran objektif yang bisa diaudit siapa pun. Cukup foto hasil panen bersama koin
Rp500 sebagai acuan kalibrasi fisik — tanpa alat ukur khusus — dan sistem mengeluarkan
laporan mutu terukur, rekomendasi harga adil, serta sertifikat ketertelusuran publik.

FITUR YANG DIDEMOKAN

• Kalibrasi koin Rp500 (diameter standar 27 mm) sebagai acuan ukuran nyata per mm²
• Grading dual-stage YOLOv11 + OpenCV Rule Engine yang menjelaskan alasan per butir
  (luas mm², circularity, solidity), dengan deteksi patologi sebagai hak veto mutlak
• Hash audit SHA-256 pada setiap laporan mutu — hasil grading tidak bisa dimanipulasi
• Rekomendasi harga adil berbasis harga acuan PIHPS Bank Indonesia dikalikan pengali
  mutu batch, dengan rumus yang dibuka suku per suku
• Kanal penyelamatan Grade B & C ke industri pengolahan, bukan dibuang
• Auto-listing ke marketplace: foto beranotasi, laporan grade, dan sertifikat audit
  tersemat otomatis tanpa input ulang
• Discovery pemasok berbasis jarak (rumus Haversine) dan mode bandingkan antar petani
• Sertifikat ketertelusuran publik di /lacak/[hash] — terbuka tanpa login, zero PII
• Konsolidasi rute penjemputan multi-petani (Nearest-Neighbour) + checklist rantai dingin
• Verifikasi serah terima lewat kode aman yang dicocokkan di sisi server (Supabase RPC)
• Dashboard dampak: kilogram pangan terselamatkan dan estimasi emisi CO₂e yang dicegah

COBA LANGSUNG (tanpa registrasi)

Aplikasi live   : https://pantas-ai.vercel.app
Kode sumber     : https://github.com/astrorehan/pantas
Login 1-tap     : https://pantas-ai.vercel.app/demo
                  Tersedia tiga persona siap pakai — Petani, Pembeli Industri, dan
                  Admin Koperasi. Tanpa password. Data demo direset otomatis tiap 6 jam.
Audit publik    : buka /lacak/[hash] dari laporan mana pun, tanpa sesi login

TUMPUKAN TEKNOLOGI

Frontend  : Next.js (App Router), TypeScript, React
Backend   : Supabase (PostgreSQL, Row Level Security, RPC)
AI Engine : FastAPI, YOLOv11 dual-stage, OpenCV rule engine
Deploy    : Vercel (web) + container FastAPI (inference)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DAFTAR ISI

00:00 Pembuka & Identitas Tim
00:20 Anatomi Masalah: 62,8% Food Loss Hortikultura
00:50 Pindai Panen & Kalibrasi Koin Rp500
01:25 Laporan Grading Terukur & Hash Audit SHA-256
02:05 Formulasi Harga Adil Berbasis PIHPS
02:45 Sisi Pembeli Industri & Sertifikat Ketertelusuran Publik
03:20 Verifikasi Serah Terima Kode Aman
03:45 Penutup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REFERENSI DATA

• Bappenas & World Resources Institute Indonesia (2021), Kajian Food Loss and Waste
  di Indonesia — angka kehilangan 62,8% dan kerugian Rp106–205 triliun per tahun
• Poore, J. & Nemecek, T. (2018), "Reducing food's environmental impacts through
  producers and consumers", Science 360(6392) — faktor emisi kalkulator dampak CO₂e
• Pusat Informasi Harga Pangan Strategis (PIHPS) Bank Indonesia — harga acuan komoditas

KREDIT MUSIK

• "Laufey - From The Start - Piano Karaoke Instrumental Cover with Lyrics"
  oleh PianoNest
• "Laufey - Dreamer (Instrumental)"
  oleh Mei Mei The Bunny

Seluruh source code dan aset produk merupakan karya orisinal Tim Inilah 4 trio.
AI digunakan sebagai alat bantu brainstorming, coding, dan debugging; ide serta
implementasi produk akhir murni kerja tim.

#HOLOGY9 #HoloDev #UniversitasBrawijaya #UniversitasGadjahMada #PANTAS
#KetahananPangan #PertanianCerdas #ComputerVision #FoodLoss #AgriTech
```

---

## 3. Daftar Isi — Dua Versi

YouTube membaca timestamp otomatis jadi chapter kalau: chapter pertama `00:00`,
minimal 3 chapter, dan tiap chapter minimal 10 detik. Keduanya di bawah sudah memenuhi.

### Versi Alur Ringkas (7 adegan inti + penutup, total 04:05)

```
00:00 Pembuka & Identitas Tim
00:20 Anatomi Masalah: 62,8% Food Loss Hortikultura
00:50 Pindai Panen & Kalibrasi Koin Rp500
01:25 Laporan Grading Terukur & Hash Audit SHA-256
02:05 Formulasi Harga Adil Berbasis PIHPS
02:45 Sisi Pembeli Industri & Sertifikat Ketertelusuran Publik
03:20 Verifikasi Serah Terima Kode Aman
03:45 Penutup
```

### Versi Alur Lengkap (14 adegan, total 07:05)

```
00:00 Pembuka & Identitas Tim
00:20 Anatomi Masalah: 62,8% Food Loss Hortikultura
00:50 Pindai Panen & Kalibrasi Koin Rp500
01:25 Arsitektur Dual-Stage YOLOv11 & Rule Engine
01:55 Laporan Grading Terukur & Hash Audit SHA-256
02:35 Formulasi Harga Adil Berbasis PIHPS
03:15 Auto-Listing ke Marketplace
03:45 Sisi Pembeli: Discovery Haversine & Mode Bandingkan
04:20 Sertifikat Ketertelusuran Publik /lacak/[hash]
04:45 Inquiry Penawaran & Pembentukan Pesanan
05:15 Konsolidasi Rute Dingin Nearest-Neighbour
05:55 Verifikasi Serah Terima Kode Aman
06:20 Dashboard Dampak Lingkungan & Telemetri AI
06:45 Penutup
```

> Catatan: storyboard mencantumkan SC-14 mulai `03:25` pada alur ringkas — itu tidak
> konsisten dengan SC-12 yang berakhir `03:45`. Angka di atas dihitung ulang dari
> durasi tiap adegan. Cocokkan lagi dengan final cut sebelum publikasi.

---

## 4. Tag YouTube

Batas 500 karakter total. Salin satu baris:

```
PANTAS, HOLOGY 9.0, HoloDev, Universitas Brawijaya, Universitas Gadjah Mada, software development competition, computer vision pertanian, grading hasil panen, YOLOv11, food loss Indonesia, ketahanan pangan, pertanian cerdas, agritech Indonesia, marketplace hortikultura, sortasi mutu panen, PIHPS, Next.js, Supabase, FastAPI, demo produk, video demo, ketertelusuran pangan, SHA-256 audit
```

---

## 5. Catatan Hak Cipta Musik — Baca Sebelum Unggah

Kedua lagu yang dipakai adalah **cover/instrumental dari komposisi Laufey**. Yang
berada di domain kreator (PianoNest, Mei Mei The Bunny) hanyalah rekaman cover-nya;
hak cipta komposisi dan liriknya tetap milik pemegang asli. Konsekuensinya:

1. **YouTube Content ID** kemungkinan besar memasang klaim otomatis. Efeknya biasanya
   monetisasi dialihkan ke pemegang hak — video tetap tayang dan tetap bisa dinilai
   juri. Tapi di sebagian wilayah bisa juga diblokir, dan itu berarti juri di wilayah
   tersebut tidak bisa menonton.
2. **Guidebook Bab C.2 & D.3** mensyaratkan seluruh aset bebas dari pelanggaran hak
   cipta. Mencantumkan kredit tidak sama dengan mengantongi lisensi.

Pilihan yang aman, urut dari paling direkomendasikan:

- **Ganti dengan musik berlisensi bebas.** YouTube Audio Library (di dalam YouTube
  Studio, sudah pasti bebas klaim), Pixabay Music, atau Kevin MacLeod (CC-BY).
  Cari kata kunci: *warm acoustic piano*, *gentle documentary*, *hopeful minimal piano* —
  rasa yang mirip dengan dua lagu tersebut.
- **Tetap pakai, tapi unggah dulu sebagai Unlisted** beberapa jam sebelum deadline,
  cek tab Copyright di YouTube Studio. Kalau statusnya hanya klaim monetisasi tanpa
  pembatasan wilayah, aman untuk dilanjutkan ke Public.
- **Turunkan drastis volume BGM** (ducking ke -30 dB atau lebih rendah) sehingga
  narasi mendominasi — mengurangi kemungkinan terdeteksi, walaupun tidak menjamin.

Kalau musik akhirnya diganti, perbarui blok KREDIT MUSIK di deskripsi.
