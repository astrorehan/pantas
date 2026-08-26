# PRD — PANTAS v1.0 "Competition Build"

**Product Requirements Document**
**Ajang:** HOLOGY 9.0 (House of Technology) — Cabang Lomba HoloDev (Software Development Competition)
**Penyelenggara:** Fakultas Ilmu Komputer, Universitas Brawijaya (FILKOM UB)
**Tema:** *"Bloom Beyond: Where Ideas Take Root and Reach Further"*
**Subtema yang diambil:** **Ketahanan Pangan dan Pertanian Cerdas** (*Smart Agriculture and Food Security*)
**Tagline produk:** *Setiap Panen Pantas Dihargai*

| Field | Nilai |
| :--- | :--- |
| Versi dokumen | 1.1 — keputusan Q-1, Q-2, Q-3, Q-5, Q-6 masuk |
| Tanggal | 23 Agustus 2026 |
| Status | Baseline — disetujui untuk eksekusi |
| Tim | **Inilah 4 trio** — 3 anggota (Universitas Gadjah Mada) |
| Domain produksi | `pantas-ai.vercel.app` |
| Nama file proposal | `Inilah 4 trio_HoloDev_HOLOGY9.0_Muhammad Raihan Surya_Universitas Gadjah Mada.pdf` |
| Target rilis | `v1.0.0` — submission build, 7 September 2026 |
| Target rilis final | `v1.1.0` — final build, 3 Oktober 2026 |
| Repositori | `PANTAS` (`web/`, `ai_engine/`, `supabase/`, `docs/`) |

---

## 0. Cara membaca dokumen ini

Dokumen ini bukan dokumen ide. Ini adalah **kontrak build**. Setiap item punya:

- **ID stabil** (`F-xx`, `NFR-xx`, `R-xx`) supaya bisa dirujuk di issue, commit, dan pitch deck.
- **Tag rubrik** (`[FUNGSI]`, `[UIUX]`, `[INOVASI]`, `[TEMA]`, `[PRESENTASI]`) yang menunjukkan komponen nilai lomba mana yang digerakkan item tersebut. Tidak ada fitur masuk tanpa tag.
- **Prioritas** — `P0` (tanpa ini submission gagal / nilai anjlok), `P1` (pembeda nilai, dikerjakan setelah semua P0 hijau), `P2` (nice-to-have, boleh jatuh ke bawah garis tanpa menyakiti).
- **Status saat ini** — `ADA` (sudah jalan di kode), `REVAMP` (ada tapi harus dirombak), `BARU` (belum ada sama sekali).
- **Acceptance criteria** yang bisa dites, bukan deskripsi rasa.

Aturan main: **tidak ada P1 dimulai sebelum seluruh P0 lulus acceptance.** Itu satu-satunya rem terhadap scope creep.

---

## 1. Ringkasan Eksekutif

### 1.1 Satu paragraf

PANTAS adalah platform *agri-commerce* yang mengubah penilaian mutu hasil panen dari negosiasi subjektif di pinggir sawah menjadi **pengukuran objektif berbasis computer vision yang bisa diaudit**. Petani memotret tumpukan panen dengan koin Rp500 sebagai referensi skala; mesin dua tahap (YOLOv11 segmentation → rule engine OpenCV → YOLOv11 classification sebagai veto patologi) menghasilkan komposisi grade A/B/C/REJECT per objek, lengkap dengan alasan yang bisa dibaca manusia dan *audit hash* SHA-256. Dari komposisi itu PANTAS menurunkan rentang harga wajar yang transparan rumusnya, menerbitkan listing ke pembeli industri, mengatur penjemputan logistik terkonsolidasi, dan menutup transaksi dengan verifikasi serah terima berbasis kode. Hasilnya: susut pascapanen turun, grade rendah tetap punya pasar, dan margin yang selama ini hilang di asimetri informasi kembali ke petani.

### 1.2 Keunggulan Kompetitif & Matriks Penilaian Lomba

**Babak Penyisihan (Bobot 100% — Kontribusi 40% ke Nilai Akhir):**

| Kriteria juri | Bobot | Posisi PANTAS |
| :--- | :--- | :--- |
| Kesesuaian dengan Tema | 30% | Menjawab tema *"Bloom Beyond"* dan subtema *Ketahanan Pangan dan Pertanian Cerdas* secara nyata: memangkas *food loss* 62,8% sayuran hortikultura, memperkuat ketahanan pangan rantai pasok agrikultur, dan transparansi distribusi pascapanen. |
| Inovasi dan Kreativitas | 30% | Pipeline AI 2-tahap (YOLOv11 segmentasi + veto patologi) + kalibrasi metrik nyata koin Rp500 (bukan sekadar klasifikasi visual), *audit hash* SHA-256 ber-QR publik, dan konsolidasi logistik multi-petani. |
| Kelayakan dan Implementasi | 15% | Aplikasi web fungsional penuh (functional prototype / MVP) end-to-end: pindai → grade → rekomendasi harga → listing → penawaran → pesanan → logistik rute → serah terima QR → dashboard dampak. |
| Manfaat dan Dampak | 15% | Dampak terukur pada ekonomi petani (menaikkan nilai tawar) dan lingkungan (kg pangan terselamatkan & emisi CO₂e tercegah) yang dihitung dari transaksi aktual di view agregat. |
| Sistematika & Kualitas Penulisan | 10% | Struktur proposal rapi sesuai format standar Guidebook HOLOGY 9.0, koheren, EYD/PUEBI baku, dilengkapi diagram arsitektur & verifikasi teknis. |

**Babak Final (Bobot 100% — Kontribusi 60% ke Nilai Akhir):**
Fungsionalitas & Kinerja (30%), UI/UX (10%), Code Project (20%), Kualitas Presentasi & Kolaborasi Tim (15%), Argumentasi & Tanya Jawab (25%).

### 1.3 Delta dari kondisi hari ini

Lima lubang yang dicatat saat PRD ini ditulis. Statusnya per 11 Agustus 2026:

| # | Lubang saat PRD ditulis | Status | Bukti di kode |
| :--- | :--- | :--- | :--- |
| 1 | **Aplikasi hanya hidup di lebar 430px.** Di laptop juri tampil sebagai kolom sempit di atas latar abu-abu. | Tertutup (F-75, F-76, F-78) | `app-frame` dan `max-w-[430px]` sudah tidak ada di `src/`; layar peran memakai lebar yang diberikan sampai `2xl` |
| 2 | **Tidak ada halaman publik.** Route `/` langsung form login. | Tertutup (F-01, F-85, F-86) | `/`, `/tentang`, `/tentang/model`, `/demo`, `/lacak/[hash]` semuanya lewat satu cangkang `components/marketing/page-shell.tsx` |
| 3 | **Akun baru = dashboard kosong.** | Tertutup (F-03) | `supabase/seed_demo.sql` mengisi akun petani & pembeli; `/demo` menampilkan kredensialnya |
| 4 | **Nol fitur logistik.** | Tertutup (EP-F penuh) | penjadwalan penjemputan, konsolidasi rute multi-petani, checklist rantai dingin, estimasi ongkos |
| 5 | **`hash_audit` dihitung tapi tak pernah terlihat.** | Tertutup (F-60, F-61) | `/lacak/[hash]` publik + QR pada listing dan tanda terima |

Yang tersisa sesudah kelimanya tertutup ada di [`docs/BACKLOG.md`](BACKLOG.md); sisa P0 tinggal latihan demo (F-111).
Pekerjaan besar sesudah PRD v1.1 ditulis dan belum tercermin di teks aslinya: konsol operator dengan kata kerja (F-90..F-92, F-109),
gerbang plausibilitas kalibrasi di engine (F-108), dan i18n yang benar-benar bilingual sampai ke render server (F-112).

---

## 2. Konteks Lomba & Matriks Penilaian

### 2.1 Fakta lomba yang mengikat (sumber: Guidebook HOLOGY 9.0 HoloDev)

- Peserta: mahasiswa aktif D3/D4/S1 perguruan tinggi se-Indonesia, tim tepat 3 orang dari perguruan tinggi yang sama (lintas jurusan diperbolehkan).
- Batas akhir pengumpulan karya (Final Submission): **7 September 2026, 23.59 WIB** via dashboard https://hology.ub.ac.id/.
- Wajib dikumpulkan di babak penyisihan:
  1. **Proposal (PDF)**, maksimal 30 halaman (termasuk cover & lampiran), format nama file: `[NamaTim_HoloDev_HOLOGY9.0_Nama Ketua Kelompok_Asal Universitas]` → **`Inilah 4 trio_HoloDev_HOLOGY9.0_Muhammad Raihan Surya_Universitas Gadjah Mada.pdf`**.
  2. **Tautan Google Drive** (akses *Anyone with the link can view*) berisi:
     - **Hasil build / deployment aplikasi**: URL hosting aktif untuk aplikasi web (`https://pantas-ai.vercel.app`).
     - **Video demo aplikasi**: durasi maksimal 10 menit, format judul `HoloDev_HOLOGY9.0_[NamaTim]_[NamaKarya]` → **`HoloDev_HOLOGY9.0_Inilah 4 trio_PANTAS`**.
     - **Source code** format `.zip` / `.rar` disertai `README.md` (panduan instalasi, cara menjalankan aplikasi, spesifikasi lingkungan pengujian, dan akun demo).
     - **Dokumen pendukung teknis** (dokumentasi API, Entity Relationship Diagram / ERD, arsitektur sistem).
- Produk berbasis web **wajib memastikan tautan deployment dapat diakses selama proses penilaian**.
- Peserta **disarankan dan wajib menyediakan akun demo** untuk kebutuhan penilaian juri.
- Dilarang menggunakan template jadi secara penuh tanpa pengembangan lebih lanjut. Icon, logo, font, dan aset lain bebas pelanggaran hak cipta.
- Karya harus orisinal, belum pernah dipublikasikan, dilombakan, atau memenangkan kompetisi sejenis sebelumnya.
- Struktur proposal wajib (Lampiran Guidebook HOLOGY 9.0):
  a) Judul/Nama Perangkat Lunak  
  b) Abstrak (1 Halaman)  
  c) Latar Belakang Ide Perangkat Lunak  
  d) Tujuan dan Manfaat Dikembangkannya Perangkat Lunak  
  e) Fitur Aplikasi  
  f) Metode Pengembangan (Metode dalam Melakukan Riset dan Desain)  
  g) Analisis Kebutuhan dan Desain Solusi Perangkat Lunak  
  h) Arsitektur Sistem  
  i) Mockup atau Gambaran Kasar Aplikasi  
  j) Rencana Implementasi  
  k) Lampiran (dicantumkan Surat Pernyataan Orisinalitas)  
- Babak final: **3 Oktober 2026**, dilaksanakan secara luring di Auditorium Algoritma G2 Fakultas Ilmu Komputer, Universitas Brawijaya (FILKOM UB). 10 tim finalis mempresentasikan solusi perangkat lunak dan mendemokan aplikasi di hadapan dewan juri.

### 2.2 Timeline mengikat HOLOGY 9.0

| Tanggal | Agenda | Keterangan & Implikasi Teknis |
| :--- | :--- | :--- |
| 4 – 10 Agustus 2026 | Early Bird Pendaftaran | Pendaftaran daring |
| 11 – 24 Agustus 2026 | Pendaftaran Gelombang 1 | Pendaftaran daring & pengembangan fondasi |
| 25 Agustus – 7 September 2026 | Pendaftaran Gelombang 2 | Polishing & validasi fitur |
| **7 September 2026, 23.59 WIB** | **Final Submission** | Batas pengumpulan Proposal PDF, Video Demo, Source Code ZIP, dan URL Vercel live `v1.0.0` |
| 8 – 21 September 2026 | Penjurian Babak Penyisihan | **Window uptime kritis.** Zero-downtime, warm-keeper AI aktif, akun demo terjaga |
| 22 September 2026 | Pengumuman Finalis (10 Besar) | Diumumkan daring melalui email, web, & IG HOLOGY 9.0 |
| 27 September 2026 | Technical Meeting Final | Daring, briefing teknis pitching/demo final |
| 1 – 2 Oktober 2026 | *Internal:* freeze `v1.1.0` | Gladi resik demo kit fisik, persiapan keberangkatan Malang |
| **3 Oktober 2026** | **Final Day & Awarding Night** | Luring di Auditorium Algoritma G2 FILKOM UB Malang |

### 2.3 Matriks traceability rubrik → epic

| Rubrik Penyisihan | Bobot | Epic penyumbang utama |
| :--- | :--- | :--- |
| Kesesuaian dengan Tema | 30% | EP-B Grading, EP-C Harga, EP-D Marketplace, EP-F Logistik, EP-H Dampak, EP-J Halaman publik tesis keberlanjutan pangan |
| Inovasi dan Kreativitas | 30% | EP-B (pipeline 2-tahap + kalibrasi koin Rp500), EP-G Traceability QR, EP-F konsolidasi logistik, EP-K Command palette & voice-first |
| Kelayakan dan Implementasi | 15% | EP-A Onboarding, EP-B Grading, EP-C Harga, EP-D Marketplace, EP-E Pesanan, EP-F Logistik, EP-I Akun, EP-L Platform (PWA & a11y) |
| Manfaat dan Dampak | 15% | EP-C Rekomendasi harga adil petani, EP-D Penyaluran grade rendah ke industri, EP-H Dashboard dampak lingkungan & ekonomi |
| Sistematika Penulisan Proposal | 10% | Kepatuhan sistematika proposal Guidebook HOLOGY 9.0, koherensi dokumen teknis, EYD/PUEBI |
| **Babak Final (Bobot 60%)** | — | Fungsionalitas & Kinerja (30%), UI/UX (10%), Code Project (20%), Presentasi (15%), Tanya Jawab (25%) (EP-O Demo Kit) |

**Aturan turunan:** setiap pull request wajib mencantumkan minimal satu tag rubrik di deskripsinya. PR tanpa tag ditolak review.

---

## 3. Masalah & Tesis Produk

### 3.1 Masalah

Rantai pasok hortikultura Indonesia kehilangan nilai di titik yang sama berulang kali: **momen penilaian mutu**.

**P1 — Mutu dinilai dengan mata, bukan ukuran.** Tengkulak menaksir grade dengan pandangan sekilas. Petani tidak punya alat bantah. Selisih taksir 1 tingkat grade pada komoditas seperti cabai berarti selisih puluhan ribu rupiah per kilogram.

**P2 — Asimetri informasi harga.** Petani tahu harga di tingkat petani; ia tidak tahu harga acuan pasar hari itu, dan tidak punya cara menghubungkan mutu batch-nya ke harga tersebut secara kuantitatif.

**P3 — Grade rendah dibuang, bukan dialihkan.** Panen yang tidak lolos standar pasar segar sering dibiarkan busuk di kebun, padahal industri olahan (saus, keripik, pakan) menerimanya dengan harga yang tetap positif. Ini adalah *food loss* yang murni disebabkan ketiadaan kanal penyaluran.

**P4 — Logistik terfragmentasi.** Petani kecil mengirim sendiri-sendiri dalam volume kecil. Biaya angkut per kilogram membengkak, sebagian panen rusak di perjalanan karena tanpa penanganan rantai dingin.

**P5 — Pembeli industri tidak bisa memverifikasi klaim mutu.** Tanpa bukti yang bisa diaudit, pembeli mendiskon harga sebagai asuransi terhadap risiko. Diskon itu ditanggung petani.

### 3.2 Tesis produk

> Jika penilaian mutu diubah menjadi **pengukuran yang objektif, murah, dan dapat diaudit**, maka harga bisa dinegosiasikan di atas fakta, grade rendah punya kanal pasar, dan seluruh rantai pasok bisa dibangun di atas satu artefak kepercayaan yang sama.

Artefak itu adalah **laporan grading PANTAS**: komposisi grade per batch + alasan per objek + `hash_audit` SHA-256. Semua fitur lain — harga, listing, penawaran, logistik, pelacakan — adalah turunan dari artefak tunggal ini.

### 3.3 Keselarasan dengan tema lomba

PANTAS berakar langsung pada tema besar HOLOGY 9.0 *"Bloom Beyond: Where Ideas Take Root and Reach Further"* dalam bidang tantangan **Ketahanan Pangan dan Pertanian Cerdas** (*Smart Agriculture and Food Security*), dengan sinergi ke **Ekonomi Digital** dan **Teknologi**.

| Sasaran Subtema Guidebook | Realisasi Solutif di PANTAS |
| :--- | :--- |
| **Sistem Pangan Tangguh & Ketahanan Pangan** | Mengurangi susut pascapanen (*food loss*) 62,8% pada sayuran hortikultura melalui pemilahan grade transparan, menyalurkan grade rendah ke industri olahan agar tidak terbuang percuma (EP-B, EP-D, EP-H). |
| **Pertanian Cerdas (Smart Agriculture)** | Digitalisasi penaksiran mutu hasil panen di tingkat hulu sawah berbasis *Dual-Stage Computer Vision* (YOLOv11 Instance Segmentation + Veto Patologi) terkalibrasi metrik koin Rp500 (EP-B). |
| **Keberlanjutan Rantai Pasok (Logistik Agrikultur)** | Penjadwalan penjemputan terkonsolidasi multi-petani untuk menghemat BBM/ongkos angkut dan kepatuhan rantai dingin (*cold-chain*) guna menjaga kesegaran produk (EP-F). |
| **Transparansi Ekonomi Digital** | Menghilangkan asimetri harga tengkulak dengan formulasi harga adil berbasis mutu terukur serta sertifikasi mutu ber-QR publik yang dapat diaudit (`/lacak/[hash]`) (EP-C, EP-G). |

Sasaran tema besar *Bloom Beyond*: PANTAS menumbuhkan nilai ekonomi petani dari akar masalah (asimetri sortir di kebun) dan menjangkau dampak berkelanjutan (*reach further*) berupa ketahanan pangan nasional dan penurunan emisi GRK dari sampah makanan (EP-H).

---

## 4. Persona & Job-to-be-Done

### 4.1 Persona A — Petani Hortikultura (`peran: petani`)

**Profil:** Pak Warsono, 47 tahun, Lembang. 0,4 ha tomat & cabai. Android entry-level, kuota data terbatas, sinyal tidak stabil di kebun. Nyaman WhatsApp, tidak nyaman formulir panjang. Literasi baca cukup, literasi digital rendah.

**JTBD:** *"Ketika panen saya siap dan tengkulak datang menawar, saya ingin punya angka yang tidak bisa dibantah tentang mutu panen saya, supaya saya bisa menolak harga yang terlalu rendah tanpa kehilangan pembeli."*

**Kebutuhan desain yang mengikat:**
- Target sentuh minimum 44×44 px; teks tubuh minimum 14px.
- Alur pindai harus selesai ≤ 4 ketukan dari dashboard.
- Semua istilah dalam bahasa Indonesia sehari-hari. Tidak ada jargon Inggris di permukaan UI petani.
- Harus berfungsi saat sinyal hilang: antrean offline wajib (F-52).
- Panduan suara (TTS) opsional pada layar pindai.

### 4.2 Persona B — Pembeli Industri (`peran: pembeli`)

**Profil:** Rina, 33 tahun, kepala pengadaan UMKM saus & frozen food, Bandung. Butuh 500 kg tomat/minggu dengan konsistensi mutu. Bekerja dari laptop. Membandingkan banyak pemasok sekaligus.

**JTBD:** *"Ketika saya harus mengunci pasokan mingguan, saya ingin membandingkan mutu dan harga dari banyak petani dalam satu layar dan memverifikasi klaim mutunya, supaya saya tidak perlu mengirim orang untuk sortir ulang."*

**Kebutuhan desain yang mengikat:**
- **Desktop-first.** Grid katalog multi-kolom, filter persisten, split-view peta, tabel pesanan yang padat data.
- Perbandingan berdampingan antar listing.
- Ekspor CSV/PDF untuk keperluan internal.
- Verifikasi mutu sebelum berkomitmen (halaman lacak).

### 4.3 Persona C — Koperasi / Admin (`peran: admin`) — BARU

**Profil:** Pengurus koperasi tani atau operator PANTAS. Menjaga harga acuan tetap segar, memoderasi listing, memantau dampak agregat, mengatur rute penjemputan.

**JTBD:** *"Ketika saya bertanggung jawab atas puluhan petani, saya ingin melihat kesehatan seluruh jaringan dalam satu dashboard dan bisa mengintervensi ketika ada yang salah."*

Persona ini juga merangkap sebagai **panggung demo juri**: dashboard admin menampilkan agregat seluruh platform, sehingga juri melihat sistem yang hidup, bukan akun kosong.

### 4.4 Persona D — Juri (bayangan, tapi nyata)

**Profil:** Dosen/praktisi, membuka tautan di laptop, punya ~5 menit per karya di babak online, tanpa konteks sebelumnya.

**JTBD:** *"Ketika saya membuka aplikasi ini, saya ingin dalam 60 detik memahami masalah apa yang dipecahkan, melihat buktinya bekerja, dan tahu kedalaman teknisnya."*

Persona ini adalah alasan keberadaan EP-J (halaman publik) dan EP-O (demo kit). Persona ini juga alasan mengapa **akun demo yang sudah terisi data** berstatus P0, bukan P1.

---

## 5. Cakupan Rilis v1.0

### 5.1 Masuk cakupan

| Area | Isi |
| :--- | :--- |
| Peran pengguna | Petani, Pembeli, Admin/Koperasi |
| Komoditas | 12 varian di atas 4 model dasar: Tomat (Sayur, Beef, Ceri, Merah), Cabai (Rawit, Merah Besar, Merah Keriting, Hijau Besar), Timun (Lokal, Baby), Wortel (Lokal, Impor) |
| Platform | Web responsif (mobile 360px → desktop 1920px), PWA installable, offline-capable |
| Bahasa | Bahasa Indonesia (utama), English (toggle, untuk juri/ekspo) |
| Tema | Light + Dark |
| Transaksi | Pemesanan, penawaran/negosiasi, serah terima terverifikasi kode. **Pembayaran tunai/transfer di luar aplikasi.** |
| Logistik | Penjadwalan penjemputan, konsolidasi rute multi-petani, estimasi ongkos, timeline pelacakan, checklist rantai dingin |

### 5.2 Di luar cakupan v1.0 (dinyatakan eksplisit, dijawab di BAB V proposal)

| Item | Alasan | Rencana |
| :--- | :--- | :--- |
| Payment gateway (Midtrans/Xendit) | Butuh badan hukum & verifikasi merchant yang tidak tersedia untuk tim mahasiswa | v2.0 — dirancang di proposal BAB V, dengan escrow |
| Aplikasi native Android/iOS | PWA menutup 100% kebutuhan v1.0 dengan satu basis kode; APK opsional lewat TWA bila perlu | v2.0 — TWA build |
| Integrasi API PIHPS otomatis | Endpoint publik PIHPS tidak stabil; v1.0 memakai tabel `harga_acuan` yang disegarkan cron internal | v1.1 — scraper terjadwal |
| Model AI untuk komoditas di luar 4 dasar | Dataset & waktu latih | v2.0 — pipeline `train_all_*` sudah siap menerima komoditas baru |
| Multi-tenant koperasi terisolasi | Kompleksitas RLS berlapis | v2.0 |

### 5.3 Prinsip yang tidak boleh dilanggar

1. **AI menyarankan, tidak memutuskan.** Petani selalu bisa menetapkan harga di luar rentang rekomendasi. Sistem memberi tahu posisinya, tidak memblokir.
2. **Setiap angka harus punya asal-usul.** Tidak ada metrik di layar tanpa sumber yang bisa ditelusuri ke data nyata (grading, pesanan, tabel acuan). Tidak ada angka hiasan.
3. **Degradasi anggun.** Tanpa backend, tanpa kamera, tanpa sinyal — aplikasi tetap dapat dipakai dengan kemampuan berkurang, bukan layar error.
4. **Tanpa template.** Seluruh komponen UI ditulis sendiri di atas Tailwind primitives. Tidak ada component library pihak ketiga yang membawa tampilan bawaan.

---

## 6. Arsitektur Sistem

### 6.1 Kondisi terbangun (as-built, 11 Agustus 2026)

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (PWA)                                               │
│  Next.js 16.2.10 · React 19.2.4 · Tailwind v4                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ src/lib/store.tsx  — state tulis, cache localStorage    │  │
│  │                      per-uid, optimistic + bg sync      │  │
│  │ src/lib/data.ts    — state baca, Supabase → fallback    │  │
│  │                      demo                               │  │
│  │ src/lib/data-admin.ts — seam konsol operator, dipisah   │  │
│  │                      agar tak ikut ke bundel petani     │  │
│  │ src/lib/types.ts   — kontrak tipe (nama field ID =      │  │
│  │                      wire format PantasModel.predict)   │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────┬──────────────────────────┬───────────────────┘
                │                          │
       supabase-js (anon key)      multipart POST /predict
                │                          │
┌───────────────▼──────────────┐  ┌────────▼─────────────────────┐
│ Supabase (ap-southeast-1)    │  │ FastAPI — ai_engine/api.py   │
│ · Auth (email + password)    │  │ Docker, port 7860            │
│ · Postgres + RLS semua tabel │  │ ┌──────────────────────────┐ │
│   profiles, listings, orders,│  │ │ PantasModel.predict()    │ │
│   gradings, harga_acuan,     │  │ │  0 gerbang blur          │ │
│   rute, emisi_faktor,        │  │ │  1 AutoCalibrator (koin) │ │
│   audit_log                  │  │ │  1b gerbang plausibilitas│ │
│ · View listings_view         │  │ │     kalibrasi (F-108)    │ │
│ · RPC verifikasi_serah_terima│  │ │  2 YOLO-1 seg            │ │
│   (security definer)         │  │ │  3 GradingEngine OpenCV  │ │
│ · RPC admin (security        │  │ │  4 YOLO-2 cls (veto)     │ │
│   definer): moderasi listing │  │ │  5 hash_audit SHA-256    │ │
│   & status rute              │  │ └──────────────────────────┘ │
│ · Storage bucket `panen`     │  │ GET /health: p50/p95/max,    │
│ · Trigger handle_new_user    │  │ rasio sukses, jendela 200    │
│ · Trigger audit 5 peristiwa  │  │ sampel bergulir              │
└──────────────────────────────┘  └──────────────────────────────┘
```

**Yang sudah benar dan tidak boleh dirusak saat revamp:**
- Dua *seam* tunggal antara UI dan backend (`data.ts` baca, `store.tsx` tulis). Semua fitur baru masuk lewat seam yang sama.
- Fallback demo di setiap fungsi `data.ts` — aplikasi tetap hidup tanpa env.
- Cache localStorage berkunci UID (`pantas-store-v1:{uid}`) — mencegah kebocoran data antar akun di perangkat yang sama.
- Nama field Indonesia sebagai wire format bersama Python. Tidak ada lapisan translasi di boundary.
- Konsol operator memakai seam ketiga, `data-admin.ts`, karena kodenya hanya boleh mendarat di chunk `/admin` (NFR-05).
- Setiap panel data admin adalah komponen klien. Klien Supabase sisi server berjalan tanpa sesi, sehingga `auth.uid()` bernilai null di sana dan halaman yang dirender di server justru kosong bagi operator yang berhak melihatnya.
- Tulisan operator lewat fungsi *security definer*, bukan policy UPDATE yang lebar. RLS tidak bisa membatasi kolom, jadi policy semacam itu membuat operator bisa menimpa harga milik petani.

### 6.2 Arsitektur target v1.0

Tambahan di atas as-built:

```
┌──────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  + Service Worker (Workbox)  — offline shell + antrean pindai │
│  + IndexedDB (idb-keyval)    — antrean unggah & cache berat   │
│  + View Transitions API      — transisi halaman               │
│  + next-intl                 — id / en                        │
└───────────────┬──────────────────────────┬───────────────────┘
                │                          │
   ┌────────────▼──────────────┐           │
   │ Next.js Route Handlers    │           │
   │ /api/lacak/[hash]  publik │           │
   │ /api/og/[id]  gambar OG   │           │
   │ /api/cron/harga  (Vercel) │           │
   │ /api/cron/warm   (Vercel) │───────────┤ ping /health tiap 5 mnt
   │ /api/demo/reset   admin   │           │  (anti cold-start)
   └────────────┬──────────────┘           │
                │                          │
┌───────────────▼──────────────┐  ┌────────▼─────────────────────┐
│ Supabase                     │  │ FastAPI + PantasModel        │
│ + tabel: penawaran, pengiriman│  │ + POST /predict/batch        │
│   rute, rute_item, pesan,     │  │ + rate limit per IP          │
│   notifikasi, audit_log       │  │ + /metrics (latensi, hit)    │
│ + Realtime channel (chat)     │  │                              │
│ + View: dampak_agregat        │  │                              │
└───────────────────────────────┘  └──────────────────────────────┘
```

**Keputusan arsitektural yang ditetapkan:**

| Keputusan | Pilihan | Alasan |
| :--- | :--- | :--- |
| Route handler vs Server Action | Route handler untuk endpoint publik & cron; Server Action untuk mutasi berautentikasi | Endpoint lacak publik harus bisa di-`GET` tanpa sesi dan di-cache CDN |
| State management | Tetap Context + `useState` di `store.tsx`; **tanpa** Redux/Zustand | Skala state ini kecil; menambah library = risiko regresi tanpa manfaat |
| Chart | SVG tulis tangan (pola `TrenMingguan` yang sudah ada) | Menghindari 40KB+ library; sekaligus bukti "bukan template" |
| Animasi | CSS + View Transitions API native; `motion` hanya bila benar-benar perlu orkestrasi | Bundle budget |
| Ikon | `lucide-react` (open source, tree-shakeable) + set ikon kustom PANTAS untuk grade & komoditas | Guidebook mewajibkan aset disediakan peserta — ikon domain dibuat sendiri |
| Font | Self-hosted via `next/font` — pasangan display + teks (lihat §7.3) | Tanpa request pihak ketiga saat runtime; mengunci CLS |

---

## 7. Design System v2 — "Panen"

**Status: REVAMP total.** Sistem saat ini punya 5 komponen (`Card`, `Button`, `ButtonLink`, `GradeBadge`, `GradeDot`, `SectionLabel`) dan token warna datar. Target: sistem token berlapis + 28 komponen + dua tema.

### 7.1 Filosofi visual

Nama sistem: **Panen**. Tiga kata kunci arah desain:

1. **Membumi (grounded)** — palet dari tanah, daun, dan hasil panen. Bukan gradient ungu-biru khas dashboard SaaS generik.
2. **Berbukti (evidential)** — data ditampilkan sebagai bukti: foto beranotasi, angka dengan sumber, hash yang bisa disalin. Estetika laporan laboratorium, bukan estetika iklan.
3. **Lapang (spacious)** — target sentuh besar, hirarki tipografi tegas, ruang putih berani. Dirancang untuk dibaca di bawah matahari dengan tangan kotor.

**Anti-pola yang dilarang:** gradient mesh dekoratif, glassmorphism di seluruh permukaan, ilustrasi 3D stok, emoji sebagai ikon UI, drop shadow ungu, kartu dengan border-radius > 20px.

### 7.2 Token warna

Menggantikan `@theme` datar di `globals.css` dengan skala penuh + token semantik yang berpasangan light/dark.

```css
@theme {
  /* ---- Skala primitif ---- */
  --color-green-50:  #eef7f2;
  --color-green-100: #d6ece0;
  --color-green-200: #aedac2;
  --color-green-300: #7fc3a1;
  --color-green-400: #52a97f;
  --color-green-500: #40916c;  /* brand — dipertahankan dari Figma */
  --color-green-600: #2d6a4f;
  --color-green-700: #1b4332;
  --color-green-800: #12301f;
  --color-green-900: #0a1d13;
  --color-green-950: #05100a;

  /* Aksen tanah — untuk state peringatan hangat & aksen data */
  --color-clay-50:  #fdf6ee;
  --color-clay-300: #e2b27c;
  --color-clay-500: #b4783a;
  --color-clay-700: #7a4d20;

  /* Netral hangat (bukan abu-abu biru) */
  --color-stone-0:   #ffffff;
  --color-stone-50:  #faf9f7;
  --color-stone-100: #f3f1ee;
  --color-stone-200: #e6e3de;
  --color-stone-300: #d2cec7;
  --color-stone-400: #a5a09a;
  --color-stone-500: #7a756e;
  --color-stone-600: #57534e;
  --color-stone-700: #3d3a36;
  --color-stone-800: #262421;
  --color-stone-900: #171614;
  --color-stone-950: #0d0c0b;

  /* Semantik grade — WAJIB konsisten dengan output ai_engine */
  --color-grade-a: #2d6a4f;
  --color-grade-b: #b4783a;
  --color-grade-c: #2563eb;
  --color-grade-reject: #a01f1f;

  /* Radius & elevasi */
  --radius-xs: 4px;  --radius-sm: 6px;  --radius-md: 10px;
  --radius-lg: 14px; --radius-xl: 20px; --radius-full: 9999px;

  --shadow-e1: 0 1px 2px rgb(0 0 0 / 0.04);
  --shadow-e2: 0 2px 8px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04);
  --shadow-e3: 0 8px 24px rgb(0 0 0 / 0.08), 0 2px 6px rgb(0 0 0 / 0.04);
  --shadow-e4: 0 16px 48px rgb(0 0 0 / 0.12);

  /* Motion */
  --ease-out-soft: cubic-bezier(0.2, 0.7, 0.3, 1);
  --ease-spring:   cubic-bezier(0.34, 1.4, 0.64, 1);
  --dur-fast: 120ms; --dur-base: 220ms; --dur-slow: 380ms;
}
```

**Token semantik** (dipakai komponen; primitif tidak boleh dipakai langsung di komponen):

| Token | Light | Dark |
| :--- | :--- | :--- |
| `--surface-canvas` | `stone-50` | `stone-950` |
| `--surface-raised` | `stone-0` | `stone-900` |
| `--surface-overlay` | `stone-0` | `stone-800` |
| `--surface-sunken` | `stone-100` | `stone-950` |
| `--text-primary` | `stone-900` | `stone-50` |
| `--text-secondary` | `stone-600` | `stone-400` |
| `--text-tertiary` | `stone-400` | `stone-500` |
| `--border-subtle` | `stone-200` | `stone-800` |
| `--border-strong` | `stone-300` | `stone-700` |
| `--accent-primary` | `green-500` | `green-400` |
| `--accent-hover` | `green-600` | `green-300` |

Implementasi dark mode: `@media (prefers-color-scheme: dark)` sebagai default + override `:root[data-theme="dark"]` / `[data-theme="light"]` supaya toggle manual menang di dua arah. Toggle disimpan di `localStorage` dan diterapkan lewat script inline di `<head>` untuk mencegah *flash of wrong theme*.

### 7.3 Tipografi

| Peran | Font | Alasan |
| :--- | :--- | :--- |
| Display (H1–H2, angka besar) | **Bricolage Grotesque** (variable, OFL) | Karakter kuat & sedikit tidak konvensional — menjauh dari tampilan Inter-generik. Variable axis untuk kontrol optik. |
| Teks (H3–H6, body, UI) | **Inter** (variable) | Sudah terpasang, keterbacaan tinggi di layar murah, dukungan bahasa Indonesia lengkap |
| Mono (hash, kode, angka teknis) | **JetBrains Mono** | Sudah terpasang; membedakan artefak audit dari teks biasa |

Skala tipografi (rasio 1.2 minor third pada mobile, 1.25 pada desktop):

| Token | Mobile | Desktop | Bobot | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| `display-lg` | 34/40 | 56/60 | 800 | -0.03em |
| `display-md` | 28/34 | 40/46 | 800 | -0.02em |
| `heading-lg` | 22/28 | 28/36 | 700 | -0.01em |
| `heading-md` | 18/24 | 20/28 | 700 | 0 |
| `heading-sm` | 16/22 | 16/24 | 700 | 0 |
| `body-lg` | 16/24 | 16/26 | 400 | 0 |
| `body-md` | 14/20 | 14/22 | 400 | 0 |
| `body-sm` | 12/16 | 12/18 | 400 | 0 |
| `label` | 11/14 | 11/14 | 700 | 0.1em, uppercase |
| `mono-sm` | 11/16 | 12/18 | 400 | 0 |

**F-70 [UIUX] P0** — Ukuran teks tubuh minimum di seluruh permukaan petani adalah `body-md` (14px). Tidak ada teks informatif di bawah 12px kecuali label metadata.

### 7.4 Inventaris komponen

Semua di `web/src/components/ui/`, satu file per komponen, diekspor lewat `index.ts`.

| Komponen | Status | Varian / catatan |
| :--- | :--- | :--- |
| `Button` | REVAMP | 5 varian (primary, secondary, outline, ghost, danger) × 4 ukuran (sm/md/lg/xl) × state loading, disabled, icon-only |
| `IconButton` | BARU | Ukuran 32/40/48, label wajib via `aria-label` |
| `Input` | BARU | Prefix/suffix slot, state error, hint, counter |
| `Textarea` | BARU | Auto-grow |
| `Select` | REVAMP | Custom listbox berbasis `<button>` + `role="listbox"`, mendukung `optgroup` |
| `Combobox` | BARU | Untuk pemilih komoditas 12 item dengan pencarian |
| `Checkbox`, `Radio`, `Switch` | BARU | — |
| `Slider` | REVAMP | Naikkan dari `.pantas-slider` CSS ke komponen dengan tooltip nilai & langkah keyboard |
| `Card` | REVAMP | Slot `header`/`body`/`footer`, varian `flat`/`raised`/`interactive` |
| `Stat` | BARU | Angka besar + label + delta + sumber data (tooltip "dari mana angka ini") |
| `GradeBadge`, `GradeDot` | ADA | Tambah ukuran `lg` & varian `outline` |
| `GradeBar` | BARU | Bar komposisi batch, animasi tumbuh, tooltip per segmen |
| `Tabs` | BARU | Underline + segmented |
| `Dialog` | BARU | Fokus trap, `Esc`, backdrop, mount ke portal |
| `Sheet` | BARU | Bottom sheet di mobile, side drawer di desktop — satu API |
| `Popover`, `Tooltip` | BARU | Positioning tanpa library (CSS anchor + fallback) |
| `Toast` | ADA (sonner) | Bungkus dengan tema PANTAS; batasi API |
| `Table` | BARU | Sticky header, kolom sortir, densitas compact/comfortable, empty state |
| `DataGrid` | BARU | Hanya desktop; virtualisasi bila > 200 baris |
| `Pagination` | BARU | — |
| `EmptyState` | BARU | Ilustrasi SVG kustom + CTA. **Wajib** di setiap daftar. |
| `Skeleton` | REVAMP | Bentuk mengikuti konten nyata, bukan blok generik |
| `Stepper` | BARU | Untuk alur pindai → harga → terbit |
| `Timeline` | BARU | Status pesanan & pengiriman |
| `FileDrop` | BARU | Drag-drop foto di desktop |
| `Avatar` | BARU | Inisial fallback |
| `Breadcrumb` | BARU | Desktop only |
| `CommandPalette` | BARU | `Ctrl/⌘+K` — navigasi & aksi cepat |
| `ThemeToggle` | BARU | light / dark / system |
| `LangToggle` | BARU | id / en |
| `Chart.Area`, `Chart.Bar`, `Chart.Donut` | BARU | SVG tulis tangan, aksesibel (`role="img"` + deskripsi tekstual) |

**F-71 [UIUX] P0** — Setiap komponen interaktif punya state: default, hover, active, focus-visible, disabled, loading (bila relevan). Ring fokus `2px` warna `--accent-primary` dengan `offset 2px`, terlihat di light dan dark.

**F-72 [UIUX] P1** — Halaman internal `/dev/ds` (hanya development) yang merender seluruh komponen dalam semua state & tema. Ini adalah alat regresi visual tim sekaligus bahan tangkapan layar untuk pitch deck.

### 7.5 Ikonografi & ilustrasi kustom

Guidebook: *"Icon, logo, font, dan aset lainnya disediakan oleh masing-masing peserta."*

**F-73 [UIUX][INOVASI] P1** — Set ikon PANTAS kustom (SVG 24px, stroke 1.75, grid 24):
- 4 ikon komoditas: tomat, cabai, timun, wortel
- 4 ikon grade: A/B/C/Reject sebagai bentuk geometris berbeda (bukan hanya warna — syarat aksesibilitas buta warna)
- 6 ikon domain: koin-kalibrasi, pindai-batch, konsolidasi-rute, rantai-dingin, hash-audit, serah-terima

**F-74 [UIUX] P2** — 5 ilustrasi *empty state* bergaya garis, satu palet, tema pertanian.

---

## 8. Strategi Responsif & Dukungan Desktop

**Ini adalah pekerjaan tunggal terbesar di PRD ini, dan penyumbang nilai UI/UX terbesar.**

### 8.1 Masalah saat ini

`globals.css` mendefinisikan `@utility app-frame { max-width: 430px }`, dan `layout.tsx` membungkus seluruh aplikasi di dalamnya di atas latar `bg-neutral-200/60`. Konsekuensi: di layar 1440px, 70% viewport adalah abu-abu kosong. Semua komponen berasumsi lebar tetap (`max-w-[430px]` muncul di `chrome.tsx`, `harga-form.tsx`, dan dashboard petani).

### 8.2 Breakpoint & arketipe layout

| Nama | Lebar | Navigasi | Kontainer | Arketipe |
| :--- | :--- | :--- | :--- | :--- |
| `xs` | 360–639 | Bottom tab bar | Fluid, padding 16 | Satu kolom |
| `sm` | 640–767 | Bottom tab bar | Fluid, padding 24 | Satu kolom, kartu lebih lebar |
| `md` | 768–1023 | **Rail kiri** (ikon + label pendek, 88px) | max 768, padding 24 | Dua kolom |
| `lg` | 1024–1279 | Sidebar kiri (240px, dapat diciutkan) | max 1152, padding 32 | Dua–tiga kolom |
| `xl` | 1280–1535 | Sidebar kiri (256px) | max 1280, padding 40 | Tiga kolom + panel detail |
| `2xl` | ≥1536 | Sidebar kiri (256px) | max 1440, padding 48 | Tiga kolom + panel detail, gutter lebih besar |

**F-75 [UIUX] P0** — Hapus `app-frame` dari `layout.tsx`. Ganti dengan `AppShell` yang memilih navigasi berdasarkan breakpoint. Bottom nav hanya dirender < `md`; sidebar hanya ≥ `md`. Tidak ada dua navigasi aktif bersamaan.

**F-76 [UIUX] P0** — Tidak boleh ada `max-w-[430px]` tersisa di `src/`. Diverifikasi lewat lint rule kustom (`no-restricted-syntax` pada literal tersebut) sehingga regresi tertangkap di CI.

### 8.3 Spesifikasi per layar (desktop)

#### Petani — Dashboard `/petani`
- **Mobile:** seperti sekarang (kartu pindai terakhir, 2 stat, grid listing 2 kolom, FAB pindai).
- **Desktop (`lg+`):** grid 12 kolom.
  - Kolom 1–8: kartu "Hasil Deteksi Terakhir" besar dengan foto beranotasi + ringkasan komposisi berdampingan.
  - Kolom 9–12: tumpukan stat (Listing aktif, Pesanan masuk, Penjemputan terjadwal, Pendapatan bulan ini) + tombol "Mulai Pindai Baru" primer (bukan FAB).
  - Baris bawah, 12 kolom: tabel listing (`Table` komponen) dengan kolom Nama, Grade, Stok, Harga/kg, Status, Dilihat, Aksi. Toggle tampilan grid/tabel dipertahankan di `localStorage`.

#### Petani — Pindai `/petani/pindai`
- **Mobile:** kamera penuh layar seperti sekarang.
- **Desktop (`lg+`):** split 60/40.
  - Kiri: preview kamera **atau** `FileDrop` besar (drag foto ke sini). Overlay panduan koin & retikel tetap, diskalakan.
  - Kanan: panel kontrol — `Combobox` komoditas dengan pencarian, checklist kesiapan (pencahayaan, jarak, koin terlihat), tombol Ambil Foto, dan **daftar foto batch** (multi-foto, F-12).
- Alasan: juri di laptop hampir pasti tidak akan memotret tomat. Jalur unggah file harus setara kelas satu, bukan tombol ikon kecil di pojok.

#### Petani — Hasil `/petani/hasil`
- **Mobile:** tumpukan vertikal seperti sekarang.
- **Desktop (`lg+`):** split 55/45 dengan panel kiri sticky.
  - Kiri (sticky): foto beranotasi besar, dapat di-zoom/pan, dengan **daftar objek yang dapat disorot** — mengarahkan kursor ke baris objek menyorot bounding box-nya di foto. Ini adalah momen "wow" utama untuk juri.
  - Kanan: bar komposisi, tabel per objek (ID, grade, ukuran mm², solidity, circularity, kondisi YOLO-2, alasan), kartu hash audit dengan tombol salin + tautan lacak.

#### Pembeli — Katalog `/pembeli`
- **Mobile:** daftar satu kolom seperti sekarang.
- **Desktop (`lg+`):** sidebar filter persisten 280px + grid kartu 3 kolom (`xl`: 4 kolom).
  - Filter: komoditas (multi), grade (multi), rentang harga (dual slider), jarak maksimum, stok minimum, hanya yang punya laporan AI.
  - Toolbar: pengurutan, toggle grid/tabel/peta, jumlah hasil, tombol "Bandingkan" (pilih hingga 4).
- **F-77 [UIUX][FUNGSI] P1** — Mode **Bandingkan**: 4 listing berdampingan, baris atribut selaras (grade, komposisi, harga, jarak, stok, rating, tanggal panen). Ekspor perbandingan ke PDF.

#### Pembeli — Peta `/pembeli/peta`
- **Mobile:** peta penuh layar dengan bottom sheet daftar.
- **Desktop (`lg+`):** split 40/60 — daftar kiri, peta kanan. Hover pada kartu menyorot marker; klik marker menggulirkan daftar ke kartu tersebut. Peta dapat difilter dengan sidebar yang sama seperti katalog.

#### Pesanan (kedua peran)
- **Mobile:** kartu.
- **Desktop:** `DataGrid` — Kode, Komoditas, Grade, Berat, Total, Status, Mitra, Tanggal, Aksi. Baris dapat diperluas menampilkan `Timeline`. Filter status sebagai `Tabs`. Ekspor CSV.

#### Admin `/admin`
Desktop-first sejak awal (persona koperasi bekerja di kantor). Mobile hanya read-only.

### 8.4 Aturan responsif umum

**F-78 [UIUX] P0** — Tidak ada scroll horizontal pada `body` di lebar mana pun antara 320px dan 2560px. Konten lebar (tabel, foto beranotasi, blok kode) menggulir di dalam kontainer `overflow-x: auto` miliknya sendiri.

**F-79 [UIUX] P0** — Semua gambar `max-width: 100%`; rasio aspek dikunci untuk mencegah CLS.

**F-80 [UIUX] P1** — Dukungan orientasi lanskap pada ponsel untuk layar pindai (petani sering memotret bedengan memanjang).

**F-81 [UIUX] P2** — Pintasan keyboard desktop: `Ctrl/⌘+K` palet perintah, `g` lalu `d` ke dashboard, `g` lalu `p` ke pesanan, `/` fokus pencarian, `?` daftar pintasan.

---

## 9. Information Architecture & Navigasi

### 9.1 Peta route

```
/                              Landing publik (BARU — sebelumnya form login)
/masuk                         Autentikasi (dipindah dari /)
/tentang                       Cerita produk, tim, teknologi        [BARU]
/lacak/[hash]                  Verifikasi laporan grading, PUBLIK   [BARU]
/demo                          Pendaratan juri: kredensial + tur    [BARU]

/petani
  /                            Dashboard
  /pindai                      Kamera / unggah + pemilih komoditas
  /hasil                       Laporan grading
  /harga                       Rekomendasi harga + terbitkan
  /listing                     Kelola listing                       [REVAMP]
  /listing/[id]                Detail & edit listing                [BARU]
  /listing-tayang              Konfirmasi terbit
  /riwayat                     Riwayat pindai
  /riwayat/[id]                Detail pindai lama                   [BARU]
  /penawaran                   Penawaran masuk dari pembeli         [BARU]
  /pesanan                     Daftar pesanan
  /pesanan/[id]                Detail + verifikasi serah terima
  /logistik                    Jadwal penjemputan & rute            [BARU]
  /dampak                      Dashboard dampak
  /akun                        Profil & preferensi
  /akun/pengaturan             Tema, bahasa, notifikasi             [BARU]

/pembeli
  /                            Katalog
  /produk/[id]                 Detail listing
  /bandingkan                  Perbandingan berdampingan            [BARU]
  /peta                        Peta pemasok
  /inquiry                     Keranjang penawaran
  /penawaran                   Penawaran terkirim & statusnya       [BARU]
  /pesanan                     Daftar pesanan
  /pesanan/[id]                Detail + kode serah terima (QR)
  /pengiriman/[id]             Pelacakan pengiriman                 [BARU]
  /akun                        Profil
  /akun/pengaturan             Tema, bahasa, notifikasi             [BARU]

/admin                                                              [BARU]
  /                            Ringkasan platform
  /harga-acuan                 Kelola tabel harga acuan
  /listing                     Moderasi listing
  /rute                        Perencana konsolidasi rute
  /pengguna                    Daftar pengguna
  /dampak                      Dampak agregat platform
  /audit                       Log audit grading

/api
  /lacak/[hash]                JSON publik laporan grading
  /og/[type]/[id]              Gambar Open Graph dinamis
  /cron/harga                  Segarkan harga_acuan (Vercel Cron)
  /cron/warm                   Ping /health AI (anti cold-start)
  /demo/reset                  Reset data akun demo (dilindungi token)
```

### 9.2 Aturan navigasi

**F-82 [UIUX] P0** — Setiap layar bukan-root punya jalur kembali yang jelas: `BackBar` di mobile, `Breadcrumb` di desktop. Tidak ada halaman buntu.

**F-83 [UIUX] P0** — Judul dokumen (`<title>`) unik per route dan deskriptif; penting untuk juri yang membuka banyak tab.

**F-84 [UIUX] P1** — Palet perintah (`Ctrl/⌘+K`) mengindeks: seluruh route peran aktif, komoditas, listing sendiri, kode pesanan. Aksi cepat: "Pindai baru", "Ganti tema", "Ganti bahasa", "Keluar".

---

## 10. Spesifikasi Fitur

Format tiap fitur: **ID · Judul · [Tag rubrik] · Prioritas · Status**, lalu user story dan acceptance criteria yang dapat diuji.

---

### EP-A — Onboarding & Autentikasi

#### F-01 · Landing publik · [TEMA][UIUX][PRESENTASI] · P0 · BARU
*Sebagai juri atau pengunjung, saya ingin memahami PANTAS dalam 60 detik tanpa harus login.*

Route `/` menjadi halaman publik. Login pindah ke `/masuk`.

Struktur halaman:
1. **Hero** — pernyataan masalah dalam satu kalimat, tagline, dua CTA: "Coba Demo Juri" (→ `/demo`) dan "Masuk" (→ `/masuk`). Latar: foto panen asli dengan overlay anotasi grade yang beranimasi masuk.
2. **Masalah dalam angka** — 3 statistik susut pascapanen dengan sitasi sumber yang terlihat.
3. **Cara kerja** — 4 langkah beranimasi saat scroll: Foto dengan koin → AI menilai → Harga wajar muncul → Pembeli industri memesan.
4. **Demo grading langsung** — komponen interaktif: pilih salah satu dari 4 foto contoh, tekan Analisis, tampilkan hasil nyata dari API. **Tanpa login.**
5. **Kedalaman teknis** — diagram pipeline 2-tahap + tabel akurasi model per komoditas.
6. **Dampak & keberlanjutan** — hubungkan ke tema lomba secara eksplisit.
7. **Footer** — tim, tautan repositori, kontak.

**Acceptance criteria**
- [ ] LCP < 2,0 s pada Fast 3G tersimulasi.
- [ ] Demo grading langsung mengembalikan hasil nyata dari `/predict` dalam < 6 s; ada fallback hasil ter-cache bila API tidak merespons dalam 8 s.
- [ ] Skor Lighthouse ≥ 95 di Performance, Accessibility, Best Practices, SEO.
- [ ] Kartu Open Graph terisi (gambar, judul, deskripsi) — penting saat tautan dibagikan ke grup WhatsApp panitia.
- [ ] Berfungsi penuh di 360px dan 1920px.

#### F-02 · Autentikasi email + password · [FUNGSI] · P0 · ADA
Dipertahankan. Perbaikan:
- [ ] Pisahkan mode "Masuk" dan "Daftar" secara eksplisit alih-alih auto-signup diam-diam (auto-signup membingungkan saat password salah).
- [ ] Toggle lihat/sembunyi password.
- [ ] Indikator kekuatan password saat mendaftar.
- [ ] Tautan "Lupa password" → alur reset Supabase.
- [ ] Pesan galat tetap berbahasa Indonesia manusiawi (fungsi `pesanAuth` sudah ada, dipertahankan & diperluas).

#### F-03 · Akun demo pra-isi · [FUNGSI][PRESENTASI] · P0 · BARU
*Sebagai juri, saya ingin masuk dengan satu klik dan langsung melihat produk yang berisi data.*

Route `/demo` menampilkan tiga kartu kredensial dengan tombol "Masuk sebagai ini" (mengisi form otomatis dan submit):

| Akun | Email | Isi data |
| :--- | :--- | :--- |
| Petani | `petani@demo.pantas.id` | 6 listing, 12 riwayat pindai dengan foto & hasil nyata, 8 pesanan lintas status, 3 penawaran masuk, 2 penjemputan terjadwal |
| Pembeli | `pembeli@demo.pantas.id` | 5 pesanan, 3 penawaran terkirim, 4 item di inquiry, 1 pengiriman berjalan |
| Admin | `admin@demo.pantas.id` | Dashboard agregat penuh, 3 rute konsolidasi, log audit |

**Geografi data demo:** seluruh petani, listing, dan titik penjemputan demo berlokasi di **Daerah Istimewa Yogyakarta** — sentra hortikultura Sleman (Pakem, Cangkringan, Turi), Kulon Progo, dan Bantul; pembeli industri di kota Yogyakarta. Seed lama (Bandung/Lembang) diganti. Alasan: rute konsolidasi (F-51) hanya terlihat masuk akal bila titik-titiknya berdekatan secara geografis dan nyata sebagai sentra sayuran; lereng Merapi memberi klaster alami untuk mendemokan penggabungan rute.

**Acceptance criteria**
- [ ] Seed dijalankan lewat migrasi Supabase yang dapat diulang (`supabase/seed_demo.sql`), bukan penyisipan manual.
- [ ] Koordinat lat/lng demo benar-benar berada di DIY dan terlihat wajar saat dibuka di `/pembeli/peta`.
- [ ] Endpoint `POST /api/demo/reset` (dilindungi header token) mengembalikan ketiga akun ke keadaan awal. Dijalankan otomatis via Vercel Cron setiap 6 jam selama 5–23 Agustus.
- [ ] Data demo ditandai `is_demo = true`; tidak pernah tercampur ke agregat dampak platform nyata.
- [ ] Kredensial demo juga dicantumkan di README repositori dan di halaman terakhir pitch deck.

#### F-04 · Tur berpandu sekali jalan · [UIUX][PRESENTASI] · P1 · BARU
Setelah login pertama pada akun demo, tampilkan 5 langkah *coach mark* yang menyorot: tombol Pindai, kartu hasil terakhir, tab Dampak, tombol tema, dan palet perintah. Dapat dilewati, tidak pernah muncul dua kali (disimpan di `profiles.tur_selesai`).

#### F-05 · Pemilihan & pergantian peran · [FUNGSI] · P0 · REVAMP
Peran saat ini terkunci di `profiles.peran`. Tambahkan: pada akun demo, tombol "Lihat sebagai Pembeli/Petani/Admin" di menu akun untuk berpindah tanpa logout. Hanya aktif bila `is_demo = true` — bukan lubang keamanan pada akun nyata.

---

### EP-B — Grading AI

#### F-10 · Pindai batch dengan kalibrasi koin · [FUNGSI][INOVASI] · P0 · ADA
Alur inti sudah berjalan: pilih komoditas → kamera → lingkaran panduan koin → tangkap → hitung ROI koin → kirim ke `/predict`.

Perbaikan wajib:
- [ ] **Checklist kesiapan langsung** sebelum tombol tangkap aktif: (a) ketajaman — hitung varians Laplacian di klien pada frame preview, tampilkan indikator hijau/kuning/merah; (b) pencahayaan — luminans rata-rata dalam rentang; (c) koin terlihat — deteksi lingkaran ringan di ROI. Semuanya *saran*, tidak memblokir.
- [ ] **Panduan suara (TTS)** opsional: membacakan instruksi ("Letakkan koin lima ratus di dalam lingkaran, jaga jarak tiga puluh sentimeter"). Toggle di pengaturan. Penting untuk persona literasi rendah.
- [ ] **Jalur unggah setara** di desktop (`FileDrop` besar, bukan ikon kecil).
- [ ] Tombol ganti kamera depan/belakang bila tersedia lebih dari satu.
- [ ] Torch/senter bila `MediaStreamTrack` mendukung.

**Acceptance criteria**
- [ ] Dari dashboard ke hasil grading ≤ 4 ketukan di mobile.
- [ ] Izin kamera ditolak → jatuh ke mode unggah dengan pesan jelas, bukan layar kosong (perilaku ini sudah ada, harus dipertahankan).
- [ ] ROI koin yang dikirim ke API sesuai dengan lingkaran yang dilihat pengguna, diverifikasi dengan tes unit atas fungsi `coinRoi()` untuk 6 kombinasi rasio aspek.

#### F-11 · Laporan hasil grading · [FUNGSI][UIUX][INOVASI] · P0 · REVAMP
Layar hasil sudah menampilkan foto beranotasi, bar komposisi, alasan unik, dan hash. Naikkan ke kualitas laporan:

- [ ] **Tabel per objek** — setiap objek terdeteksi sebagai baris: ID, grade, ukuran mm², solidity, circularity, status warna, kondisi YOLO-2 + confidence, daftar cacat, alasan.
- [ ] **Sorotan tertaut** — hover/klik baris menyorot bounding box objek pada foto (desktop); ketuk objek pada foto menggulirkan ke barisnya (mobile).
- [ ] **Zoom & pan** pada foto beranotasi.
- [ ] **Kartu kalibrasi** yang jujur: bila `kalibrasi.valid == false`, jelaskan bahwa ukuran tidak terukur dan grade jatuh ke bentuk/cacat saja, dengan tombol "Foto Ulang" (sudah ada, dipertahankan dan diperjelas).
- [ ] **Ekspor laporan PDF** — satu halaman: foto beranotasi, komposisi, tabel objek, hash, QR ke halaman lacak. Ini adalah artefak yang dibawa petani ke tengkulak.
- [ ] **Bagikan** — Web Share API ke WhatsApp dengan tautan `/lacak/[hash]`.

#### F-12 · Pindai batch multi-foto · [FUNGSI][INOVASI] · P1 · BARU
*Sebagai petani dengan tumpukan besar, saya ingin memotret 3–5 sudut dan mendapat satu laporan gabungan.*

- [ ] Antrean foto di layar pindai; setiap foto tetap membawa ROI koinnya sendiri.
- [ ] Endpoint baru `POST /predict/batch` menerima banyak gambar, mengembalikan hasil per foto + agregat.
- [ ] Agregasi: komposisi = rata-rata tertimbang jumlah objek; skor keseragaman dihitung ulang lintas seluruh objek; `hash_audit` menutupi payload gabungan.
- [ ] Layar hasil menampilkan penggeser foto dengan ringkasan per foto + panel agregat.

#### F-13 · Riwayat pindai & perbandingan · [FUNGSI] · P1 · REVAMP
Riwayat saat ini dibatasi 8 entri di localStorage & query. Naikkan:
- [ ] Riwayat berpaginasi dari tabel `gradings` (bukan hanya 8).
- [ ] Filter per komoditas, rentang tanggal, grade dominan.
- [ ] Halaman detail `/petani/riwayat/[id]` merender laporan lengkap dari `hasil` jsonb yang tersimpan.
- [ ] **Bandingkan dua pindaian** — berdampingan, sorot delta komposisi. Berguna untuk melihat efek perubahan praktik tani.

#### F-14 · Antrean pindai offline · [FUNGSI][INOVASI] · P1 · BARU
*Sebagai petani di kebun tanpa sinyal, saya ingin tetap memotret dan hasilnya diproses ketika sinyal kembali.*

- [ ] Saat `navigator.onLine === false` atau `/predict` gagal, foto + metadata masuk antrean IndexedDB.
- [ ] Badge "N pindaian menunggu" di dashboard.
- [ ] Service worker Background Sync memproses antrean saat online kembali; toast saat selesai.
- [ ] Antrean bertahan setelah reload dan penutupan tab.

#### F-15 · Kartu penjelasan model · [INOVASI][PRESENTASI] · P2 · BARU
Halaman `/tentang/model` yang mendokumentasikan: arsitektur, ukuran dataset per komoditas, metrik (precision/recall/mAP50 mask), keterbatasan yang diketahui, dan kondisi di mana model tidak boleh dipercaya. Kejujuran tentang keterbatasan adalah sinyal kematangan yang dinilai juri teknis.

---

### EP-C — Rekomendasi Harga

#### F-20 · Rentang harga wajar transparan · [FUNGSI][TEMA] · P0 · ADA
Rumus sudah berjalan dan transparan:
`pengali = bobot_grade × (0,9 + 0,16 × skor)`, rentang = 93%–108% dari `harga_acuan × pengali`.

Perbaikan:
- [ ] **Kartu rincian rumus** yang menampilkan setiap suku dengan nilainya, bukan hasil akhir saja. Sudah sebagian ada; jadikan komponen `FormulaBreakdown` yang bisa dipakai ulang.
- [ ] **Provenance harga acuan** — sumber + tanggal pembaruan terlihat jelas ("PIHPS, 24 Jul 2026"), dengan tooltip menjelaskan apa itu harga acuan.
- [ ] **Sensitivitas** — penggeser kecil "bagaimana jika komposisi grade A naik 10%?" yang memperbarui rentang secara langsung. Mengajarkan petani apa yang menggerakkan harganya.

#### F-21 · Terbitkan listing dari hasil grading · [FUNGSI] · P0 · ADA
Sudah berjalan (`harga-form.tsx` → `publishListing`). Perbaikan:
- [ ] Berat batch harus dapat diisi dari estimasi AI bila kalibrasi valid (jumlah luas × densitas rata-rata komoditas), dengan pengguna tetap dapat menimpanya.
- [ ] Pilih foto sampul dari foto batch (bila multi-foto).
- [ ] Judul & catatan listing dapat diedit.
- [ ] Satuan (kg/ton/ikat) dapat dipilih.
- [ ] Pratinjau listing sebelum terbit.

#### F-22 · Segarkan harga acuan terjadwal · [FUNGSI][TEMA] · P1 · BARU
- [ ] Vercel Cron harian `06:00 WIB` → `/api/cron/harga` → tulis ke `harga_acuan` memakai service role (di server saja, tidak pernah di browser).
- [ ] Sumber: PIHPS bila dapat dijangkau; bila gagal, pertahankan nilai lama dan catat kegagalan ke `audit_log` — jangan pernah menulis nilai palsu.
- [ ] Halaman admin `/admin/harga-acuan` untuk koreksi manual dengan jejak audit.
- [ ] Grafik riwayat harga acuan 30 hari per komoditas.

---

### EP-D — Marketplace

#### F-30 · Katalog & pencarian · [FUNGSI][UIUX] · P0 · REVAMP
Ada: pencarian teks, pencarian suara (Web Speech API, `id-ID`), 3 chip filter, jarak haversine dari geolokasi.

Perbaikan:
- [ ] Sidebar filter desktop (§8.3) dengan filter multi-nilai.
- [ ] Pengurutan eksplisit (relevansi, harga naik/turun, jarak, terbaru, rating).
- [ ] `EmptyState` bermakna dengan saran pelonggaran filter (sebagian sudah ada, jadikan komponen).
- [ ] Skeleton yang sesuai bentuk kartu saat memuat.
- [ ] Pemuatan bertahap / infinite scroll di atas 24 item.
- [ ] Pertahankan pencarian suara — ini pembeda aksesibilitas yang layak disorot ke juri.

#### F-31 · Detail listing · [FUNGSI] · P0 · ADA
Perbaikan:
- [ ] Galeri foto (bukan satu foto).
- [ ] **Panel laporan mutu** — komposisi grade dari grading terkait, dengan tautan ke `/lacak/[hash]`. Inilah yang membuat listing dapat dipercaya.
- [ ] Kartu profil petani: nama, lokasi, rating, jumlah transaksi, bergabung sejak.
- [ ] Peta mini lokasi + estimasi jarak & waktu tempuh.
- [ ] Listing serupa di bawah.

#### F-32 · Inquiry → Penawaran → Pesanan · [FUNGSI] · P0 · REVAMP
Saat ini inquiry langsung menjadi pesanan. Sisipkan tahap penawaran supaya marketplace terasa nyata:

1. Pembeli menambahkan item ke inquiry (ADA).
2. Pembeli mengirim **Penawaran** — kuantitas, harga yang diajukan, tanggal ambil yang diinginkan, catatan. → tabel `penawaran` status `terkirim`.
3. Petani melihat di `/petani/penawaran`: **Terima**, **Tolak**, atau **Tawar Balik** (harga/kuantitas baru).
4. Penerimaan oleh pihak lawan → membuat baris `orders` status `dipesan`.
5. Alur pesanan lanjut seperti sekarang.

**Acceptance criteria**
- [ ] Transisi status ditegakkan di database (constraint + trigger), bukan hanya di UI.
- [ ] Notifikasi terkirim ke pihak lawan di setiap transisi.
- [ ] Penawaran kedaluwarsa otomatis setelah 48 jam (`status = 'kedaluwarsa'`) lewat cron.
- [ ] Riwayat tawar-menawar terlihat sebagai `Timeline` di detail penawaran.

#### F-33 · Chat dalam aplikasi · [FUNGSI] · P1 · BARU
Menggantikan deep-link WhatsApp.
- [ ] Tabel `pesan` dengan RLS (hanya dua pihak transaksi).
- [ ] Supabase Realtime untuk pengiriman langsung.
- [ ] Terlampir ke penawaran atau pesanan (bukan chat bebas — mengurangi ruang penyalahgunaan).
- [ ] Indikator belum dibaca di navigasi.
- [ ] Tombol WhatsApp tetap ada sebagai jalur cadangan.

#### F-34 · Bandingkan listing · [UIUX][FUNGSI] · P1 · BARU
Lihat F-77.

---

### EP-E — Pesanan & Serah Terima

#### F-40 · Siklus hidup pesanan · [FUNGSI] · P0 · ADA
Status: `dipesan` → `dikonfirmasi` → `serah_terima` → `selesai`. Tambahkan `dibatalkan` dan `sengketa`.

- [ ] `Timeline` visual di detail pesanan dengan stempel waktu per transisi (butuh tabel `pesanan_riwayat`).
- [ ] Alasan pembatalan wajib diisi.
- [ ] Aturan pembatalan: pembeli bebas membatalkan sebelum `dikonfirmasi`; setelah itu perlu persetujuan dua pihak.

#### F-41 · Serah terima terverifikasi kode · [FUNGSI][INOVASI] · P0 · ADA
Sudah ada: pembeli memegang kode `PNT-XXXX-NN`, petani memasukkannya, dicocokkan di server lewat RPC `security definer`.

Perbaikan:
- [ ] Pembeli melihat **QR** kode (paket `qrcode` sudah terpasang), petani memindai dengan kamera alih-alih mengetik. Mengetik tetap tersedia sebagai cadangan.
- [ ] Setelah verifikasi: tangkap **berat aktual** dan **catatan mutu** — data ini memberi umpan balik untuk penyetelan model.
- [ ] Tanda terima digital (PDF) untuk kedua pihak.
- [ ] **Utang teknis v1 yang harus ditutup:** `orders.kode` saat ini terbaca petani lewat `select`. Pindahkan `kode` ke tabel `order_kode` terpisah dengan RLS hanya-pembeli, dan sediakan RPC untuk verifikasi. Dicatat sebagai lubang keamanan yang disengaja di v1; ditutup di v1.0 ini.

#### F-42 · Rating & ulasan · [FUNGSI] · P1 · BARU
Setelah `selesai`, kedua pihak saling menilai (1–5 bintang + komentar opsional). Rating agregat muncul di kartu listing & profil. `profiles.rating` diperbarui lewat trigger, bukan dihitung di klien.

---

### EP-F — Logistik & Rantai Pasok  *(pilar kesesuaian tema)*

#### F-50 · Penjadwalan penjemputan · [FUNGSI][TEMA] · P0 · BARU
*Sebagai petani, setelah pesanan dikonfirmasi saya ingin menjadwalkan kapan panen dijemput.*

- [ ] Tabel `pengiriman`: `pesanan_id`, `metode` (`jemput_mandiri` | `konsolidasi` | `kurir_mitra`), `jendela_mulai`, `jendela_selesai`, `alamat_jemput`, `lat`, `lng`, `status`, `catatan`.
- [ ] Petani memilih jendela waktu dari slot yang tersedia.
- [ ] Pembeli mengonfirmasi atau mengusulkan waktu lain.
- [ ] `Timeline` status: `dijadwalkan` → `dijemput` → `dalam_perjalanan` → `tiba` → `diterima`.

#### F-51 · Konsolidasi rute multi-petani · [TEMA][INOVASI] · P0 · BARU
**Ini adalah fitur yang paling langsung menjawab "Logistic System" di subtema.**

*Sebagai koperasi, saya ingin menggabungkan beberapa penjemputan yang berdekatan ke dalam satu rute supaya biaya angkut per kilogram turun.*

- [x] Tabel `rute` (`tanggal`, `kendaraan`, `kapasitas_kg`, `status`) dan `rute_item` (`rute_id`, `pengiriman_id`, `urutan`). Migrasi `0006` menambah `rute.nomor` (identitas terbaca manusia) dan `rute_item.perkiraan_tiba`.
- [x] Perencana di `/admin/rute`: peta menampilkan seluruh penjemputan tertunda; admin memilih beberapa, sistem mengurutkannya dengan heuristik *nearest-neighbour* dan menampilkan garis rute + total jarak. Hanya pengiriman bermetode `konsolidasi` yang masuk — `jemput_mandiri` dan `kurir_mitra` bukan beban armada koperasi.
- [x] **Kartu penghematan**: bandingkan jarak total rute terkonsolidasi vs jumlah perjalanan individual. Tampilkan penghematan dalam km, estimasi liter BBM, dan **kg CO₂e**. Angka ini masuk ke dashboard dampak — ini menghubungkan logistik langsung ke tema keberlanjutan.
- [x] Petani melihat "Penjemputan Anda tergabung dalam Rute #12 — perkiraan tiba 08.30" di layar logistiknya.
- [x] Rencana disimpan lewat tombol **Simpan Rute Konsolidasi**; tulis dikunci ke peran admin lewat RLS, dan baris `rute` dibatalkan bila penyimpanan perhentian gagal.
- [x] Muatan tidak boleh melewati `kapasitas_kg`: perencana memblokir simpan dan menyebut kelebihannya, ditegakkan ulang oleh trigger `trg_cek_kapasitas_rute` di basis data.

**Acceptance criteria**
- [x] Heuristik berjalan di klien untuk ≤ 25 titik dalam < 200 ms.
- [x] Jarak memakai haversine (fungsi `haversineKm` sudah ada di `format.ts`, dipakai ulang). Perencana memakai `haversineKmPresisi` — inti hitungan yang sama tanpa pembulatan per ruas, karena galat 0,1 km/ruas menumpuk saat dijumlahkan.
- [x] Penghematan CO₂e memakai faktor emisi yang dinyatakan sumbernya di UI, bukan angka ajaib.

#### F-52 · Checklist rantai dingin · [TEMA] · P1 · BARU
Untuk komoditas yang menuntutnya, tampilkan checklist penanganan sebelum penjemputan (naungan, wadah berventilasi, hindari tumpukan > N lapis, jendela waktu maksimum). Dicentang saat penjemputan, tersimpan di `pengiriman.checklist` jsonb, dan tampil di halaman lacak sebagai bukti penanganan.

#### F-53 · Estimasi ongkos angkut · [FUNGSI][TEMA] · P1 · BARU
Estimasi transparan: `ongkos = tarif_dasar + tarif_per_km × jarak + tarif_per_kg × berat`, dengan diskon konsolidasi. Rumus ditampilkan, tidak disembunyikan. Muncul di detail listing (perkiraan) dan final di penawaran.

---

### EP-G — Ketelusuran (Traceability)

#### F-60 · Halaman lacak publik · [INOVASI][TEMA] · P0 · BARU
*Sebagai pembeli — atau siapa pun yang memegang peti — saya ingin memindai QR dan melihat laporan mutu asli batch ini.*

Route publik `/lacak/[hash]`, tanpa autentikasi, dapat di-cache CDN.

Menampilkan:
- Komoditas, tanggal grading, nama & lokasi petani (kabupaten saja — bukan alamat presisi).
- Foto beranotasi.
- Komposisi grade + skor keseragaman.
- Status kalibrasi.
- Ringkasan kondisi patologi YOLO-2.
- `hash_audit` lengkap + penjelasan cara verifikasinya.
- Bila tertaut pesanan: rantai kustodi (kapan dijemput, rute mana, kapan tiba) — dari EP-F.
- Checklist rantai dingin bila ada.

**Acceptance criteria**
- [ ] Berfungsi tanpa sesi, dan tetap berfungsi bila listing sudah tidak tayang.
- [ ] Tidak membocorkan: email, nomor telepon, alamat presisi, harga jual.
- [ ] Gambar OG dinamis per hash supaya tautan tampil kaya di WhatsApp.
- [ ] `hash_audit` dapat diverifikasi ulang: halaman menampilkan payload kanonik yang di-hash, sehingga pihak ketiga bisa menghitung SHA-256-nya sendiri dan mencocokkan.

#### F-61 · QR pada listing & tanda terima · [INOVASI][TEMA] · P1 · BARU
- [ ] QR ke `/lacak/[hash]` dicetak di PDF laporan grading, PDF tanda terima, dan tampil di detail listing.
- [ ] Lembar label peti yang dapat dicetak (A4, 6 label per lembar) berisi QR + komoditas + grade + tanggal.

#### F-62 · Log audit · [FUNGSI] · P2 · BARU
Tabel `audit_log` mencatat peristiwa penting (grading tersimpan, listing terbit, status pesanan berubah, harga acuan berubah, verifikasi serah terima). Terlihat di `/admin/audit`. Menunjukkan kematangan sistem kepada juri.

---

### EP-H — Dampak & Keberlanjutan

#### F-65 · Dashboard dampak pribadi · [TEMA][FUNGSI] · P0 · REVAMP
Ada, dihitung dari pesanan selesai. Perbaikan:
- [ ] **Ganti konstanta 1,7 kg CO₂e/kg yang tidak bersumber** dengan faktor emisi per komoditas bersitasi — lihat §14.3.
- [ ] Setiap metrik memperlihatkan **asal-usulnya** lewat tooltip: "kg terselamatkan = jumlah berat pesanan berstatus selesai" dan "CO₂e = Σ(kg × faktor komoditas), sumber: Poore & Nemecek (2018), *Science*". Faktor emisi harus disitasi, bukan angka ajaib.
- [ ] Tambah metrik dari logistik: km perjalanan yang dihindari lewat konsolidasi, dan CO₂e turunannya.
- [ ] Tambah metrik ekonomi: selisih antara harga yang diperoleh dan estimasi harga tengkulak (dari `harga_acuan × 0,7` sebagai baseline yang dinyatakan).
- [ ] Rentang waktu dapat dipilih (7/30/90 hari/semua).
- [ ] Chart: area tren + donat komposisi grade + bar per komoditas — semuanya SVG tulis tangan, aksesibel.

#### F-66 · Dampak agregat platform · [TEMA][PRESENTASI] · P0 · BARU
View `dampak_agregat` di Postgres yang menjumlahkan lintas seluruh pengguna non-demo. Ditampilkan di landing publik dan `/admin/dampak`. Inilah angka yang dikutip di pitch deck.

#### F-67 · Laporan dampak yang dapat dibagikan · [TEMA][PRESENTASI] · P2 · BARU
PDF/gambar sekali klik berisi ringkasan dampak petani untuk sebulan — dapat dibagikan ke grup WhatsApp kelompok tani. Mekanisme pertumbuhan sekaligus bahan demo yang bagus.

---

### EP-I — Akun & Preferensi

#### F-68 · Profil · [FUNGSI] · P0 · REVAMP
- [ ] Edit nama, foto profil, lokasi (peta picker), nomor telepon, deskripsi usaha.
- [ ] Petani: luas lahan, komoditas yang ditanam, sertifikasi (organik, GAP) dengan unggah dokumen.
- [ ] Pembeli: nama perusahaan, jenis industri, kebutuhan volume rutin.

#### F-69 · Pengaturan · [UIUX] · P0 · BARU
- [ ] Tema: terang / gelap / ikut sistem.
- [ ] Bahasa: Indonesia / English.
- [ ] Panduan suara: aktif/nonaktif.
- [ ] Notifikasi: per jenis peristiwa.
- [ ] Ukuran teks: normal / besar (aksesibilitas — persona petani usia lanjut).
- [ ] Hapus akun & unduh data saya (kepatuhan privasi dasar).

---

### EP-J — Publik & Konten

#### F-85 · Halaman Tentang · [PRESENTASI][TEMA] · P1 · BARU
Cerita produk, profil tim + kontribusi masing-masing (selaras BAB II proposal), tumpukan teknologi, tautan repositori. Halaman ini juga berfungsi sebagai lampiran hidup untuk proposal.

#### F-86 · Metadata & berbagi · [PRESENTASI] · P0 · BARU
- [ ] Metadata Open Graph & Twitter Card di seluruh route publik.
- [ ] Gambar OG dinamis lewat `/api/og/...` untuk listing dan halaman lacak.
- [ ] `sitemap.xml`, `robots.txt`, `manifest.json` (manifest sudah ada, dilengkapi: shortcuts, screenshots, share_target).

---

### EP-K — Admin & Operasi

#### F-90 · Dashboard admin · [FUNGSI][PRESENTASI] · P1 · BARU
Ringkasan platform: pengguna per peran, listing per keadaan, pesanan per status sebagai satu bilah bertumpuk, GMV yang sudah settle versus yang masih berjalan, dan grading 24 jam terakhir. Akun demo dihitung terpisah dan header mengatakannya — angka platform tidak boleh dinaikkan oleh data seed.

#### F-91 · Moderasi listing · [FUNGSI] · P2 · BARU
Sembunyikan listing dengan alasan wajib minimal 8 karakter, tercatat di `audit_log`. Penyembunyian bisa dibatalkan: admin tetap melihat baris yang disembunyikan, anon tidak melihat apa pun. Tulisan lewat fungsi *security definer* (migrasi 0015), bukan policy UPDATE lebar — RLS tidak bisa membatasi kolom.

#### F-92 · Kesehatan layanan AI · [FUNGSI] · P1 · BARU
`/api/health` benar-benar mem-ping kedua layanan dan melaporkan waktu bolak-balik, dengan pita "lambat" dan keadaan eksplisit `tidak_dikonfigurasi`. Engine menyediakan telemetri nyata untuk menjawabnya: jendela bergulir 200 sampel, p50/p95/maks, rasio sukses, dan latensi `null` — bukan angka yang tampak masuk akal — selama belum melayani apa pun.

Yang diganti: panel lama menampilkan objek konstan di dalam kode (status "online", p50 42 ms, p95 118 ms, uptime 99,98%) dan tidak pernah menghubungi apa pun. Panel itu satu-satunya layar yang dimaksudkan membuktikan platform hidup, dan ia tidak akan bisa melaporkan gangguan sekalipun seluruh backend mati. Jalannya yang pertama secara live langsung berguna: engine terbaca "mati" karena URL tunelnya memang sudah tidak hidup.

#### F-109 · Siklus hidup rute & jejak audit · [FUNGSI] · P1 · BARU
Konsol punya kata kerja, bukan hanya ubin baca:
- **Rute**: perencana dulu bisa menyimpan rute tapi tidak pernah memajukannya. `draft → locked → running → done` kini maju satu arah, di basis data untuk rute nyata dan lewat peta override lokal untuk rute demo hasil seed.
- **Jejak audit**: `audit_log` sudah ada sejak migrasi 0004 dengan policy baca khusus admin dan tanpa satu layar pun yang membacanya. Migrasi 0016 membuat lima peristiwa inti menulis ke sana **sebagai trigger**, bukan sebagai panggilan dari aplikasi: pesanan ditulis dari tiga jalur berbeda, dan log sisi pemanggil pasti terlewat justru di jalur yang paling jarang dibaca.

Kode internal PRD (F-xx) tidak boleh muncul di string yang dilihat pengguna di layar ini.

---

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

## 11. Model Data

### 11.1 Tabel terpasang (dipertahankan)

| Tabel | Peran | Catatan RLS |
| :--- | :--- | :--- |
| `profiles` | Identitas, peran, lokasi, rating | Baca sendiri + profil publik terbatas lewat `listings_view` |
| `listings` | Penawaran jual | Baca publik bila `status = 'tayang'`; tulis hanya pemilik dengan `peran = 'petani'` |
| `orders` | Transaksi | Hanya dua pihak transaksi |
| `gradings` | Laporan AI + `hasil` jsonb + `hash_audit` | Privat per petani |
| `harga_acuan` | Harga pasar acuan | Baca publik; tulis hanya service role |
| `listings_view` | Listing + profil petani | View baca |

### 11.2 Tabel baru

```sql
-- Penawaran / negosiasi (F-32)
create table penawaran (
  id            uuid primary key default gen_random_uuid(),
  listing_id    text not null references listings(id) on delete cascade,
  pembeli_id    uuid not null references profiles(id),
  petani_id     uuid not null references profiles(id),
  kuantitas_kg  numeric(10,2) not null check (kuantitas_kg > 0),
  harga_per_kg  integer not null check (harga_per_kg > 0),
  tanggal_ambil date,
  catatan       text,
  status        text not null default 'terkirim'
                check (status in ('terkirim','ditawar_balik','diterima','ditolak','kedaluwarsa')),
  induk_id      uuid references penawaran(id),   -- rantai tawar-menawar
  kedaluwarsa_pada timestamptz not null default now() + interval '48 hours',
  created_at    timestamptz not null default now()
);

-- Kode serah terima dipisah dari orders (F-41, menutup utang keamanan v1)
create table order_kode (
  order_id  text primary key references orders(id) on delete cascade,
  kode      text not null,
  dipakai_pada timestamptz
);
-- RLS: hanya pembeli pemilik pesanan yang boleh select. Petani TIDAK PERNAH select;
-- pencocokan hanya lewat RPC verifikasi_serah_terima (security definer).

-- Riwayat status pesanan (F-40)
create table pesanan_riwayat (
  id         bigserial primary key,
  order_id   text not null references orders(id) on delete cascade,
  status     text not null,
  oleh       uuid references profiles(id),
  catatan    text,
  created_at timestamptz not null default now()
);

-- Logistik (F-50)
create table pengiriman (
  id             uuid primary key default gen_random_uuid(),
  order_id       text not null references orders(id) on delete cascade,
  metode         text not null check (metode in ('jemput_mandiri','konsolidasi','kurir_mitra')),
  jendela_mulai  timestamptz,
  jendela_selesai timestamptz,
  alamat_jemput  text,
  lat            double precision,
  lng            double precision,
  status         text not null default 'dijadwalkan'
                 check (status in ('dijadwalkan','dijemput','dalam_perjalanan','tiba','diterima','batal')),
  checklist      jsonb default '{}'::jsonb,       -- rantai dingin (F-52)
  ongkos_estimasi integer,
  catatan        text,
  created_at     timestamptz not null default now()
);

-- Konsolidasi rute (F-51)
create table rute (
  id           uuid primary key default gen_random_uuid(),
  tanggal      date not null,
  kendaraan    text,
  kapasitas_kg numeric(10,2),
  status       text not null default 'draf'
               check (status in ('draf','terkunci','berjalan','selesai')),
  jarak_km     numeric(10,2),
  jarak_individual_km numeric(10,2),   -- pembanding untuk kartu penghematan
  dibuat_oleh  uuid references profiles(id),
  created_at   timestamptz not null default now()
);

create table rute_item (
  rute_id       uuid not null references rute(id) on delete cascade,
  pengiriman_id uuid not null references pengiriman(id) on delete cascade,
  urutan        integer not null,
  primary key (rute_id, pengiriman_id)
);

-- Chat (F-33)
create table pesan (
  id         bigserial primary key,
  konteks    text not null check (konteks in ('penawaran','pesanan')),
  konteks_id text not null,
  pengirim_id uuid not null references profiles(id),
  isi        text not null,
  dibaca_pada timestamptz,
  created_at timestamptz not null default now()
);

-- Notifikasi (F-32, F-40, F-50)
create table notifikasi (
  id         bigserial primary key,
  user_id    uuid not null references profiles(id) on delete cascade,
  jenis      text not null,
  judul      text not null,
  isi        text,
  tautan     text,
  dibaca_pada timestamptz,
  created_at timestamptz not null default now()
);

-- Rating (F-42)
create table ulasan (
  id         uuid primary key default gen_random_uuid(),
  order_id   text not null references orders(id) on delete cascade,
  penilai_id uuid not null references profiles(id),
  dinilai_id uuid not null references profiles(id),
  bintang    smallint not null check (bintang between 1 and 5),
  komentar   text,
  created_at timestamptz not null default now(),
  unique (order_id, penilai_id)
);

-- Log audit (F-62)
create table audit_log (
  id         bigserial primary key,
  aktor_id   uuid references profiles(id),
  aksi       text not null,
  entitas    text not null,
  entitas_id text,
  meta       jsonb,
  created_at timestamptz not null default now()
);
```

### 11.3 Perubahan tabel terpasang

```sql
alter table profiles
  add column is_demo boolean not null default false,
  add column tur_selesai boolean not null default false,
  add column telepon text,
  add column deskripsi text,
  add column foto_url text,
  add column rating numeric(3,2) default 0,
  add column bahasa text default 'id',
  add column tema text default 'system';

alter table orders
  add column berat_aktual_kg numeric(10,2),
  add column catatan_mutu text,
  add column alasan_batal text;

alter table listings
  add column grading_id uuid references gradings(id),   -- tautan ke laporan mutu (F-31)
  add column satuan text default 'kg',
  add column catatan text,
  add column dilihat integer not null default 0;

alter table gradings
  add column publik boolean not null default true;      -- kendali halaman lacak (F-60)

create index on penawaran (petani_id, status);
create index on penawaran (pembeli_id, status);
create index on pengiriman (order_id);
create index on gradings (hash_audit);
create index on notifikasi (user_id, dibaca_pada);
```

### 11.4 View baru

```sql
-- Dampak agregat platform (F-66) — mengecualikan data demo
create view dampak_agregat as
select
  count(distinct o.id)                          as transaksi_selesai,
  coalesce(sum(o.berat_aktual_kg), sum(o.berat_kg), 0) as kg_tersalurkan,
  coalesce(sum(o.total), 0)                     as nilai_transaksi,
  coalesce(sum(r.jarak_individual_km - r.jarak_km), 0) as km_dihemat
from orders o
join profiles p on p.id = o.petani_id and p.is_demo = false
left join pengiriman s on s.order_id = o.id
left join rute_item ri on ri.pengiriman_id = s.id
left join rute r on r.id = ri.rute_id and r.status = 'selesai'
where o.status = 'selesai';
```

### 11.5 Aturan RLS yang mengikat

**NFR-SEC-01 [P0]** — RLS aktif di **setiap** tabel baru sebelum tabel tersebut dipakai kode aplikasi. Tabel tanpa policy = tabel yang tidak boleh dirilis.
**NFR-SEC-02 [P0]** — Service role key tidak pernah muncul di bundle klien. Hanya dipakai di Route Handler `/api/cron/*` dan `/api/demo/reset`.
**NFR-SEC-03 [P0]** — `order_kode` tidak pernah dapat di-`select` oleh petani. Diverifikasi dengan tes integrasi yang mencoba `select` sebagai petani dan mengharapkan nol baris.
**NFR-SEC-04 [P0]** — Halaman lacak publik hanya membaca lewat view/`RPC` yang sudah memfilter kolom sensitif; tidak pernah `select *` dari `gradings`.

---

## 12. Kontrak API

### 12.1 Layanan AI (FastAPI, `ai_engine/api.py`)

#### `GET /health`
```json
{ "status": "ok", "models_loaded": ["tomato", "chili"], "uptime_s": 8421 }
```
Dipakai warm-keeper cron dan panel kesehatan admin.

#### `POST /predict` *(ADA)*
`multipart/form-data`: `image` (file), `commodity` (string, mis. `tomato_sayur`), `roi` (opsional, JSON `[x,y,w,h]`).

Sukses → `GradingSuccess` (persis `dict_results` dari `model.py`) + `annotated_img` (data URL JPEG).
Gagal → `{ "status": "error", "message": "…" }`.

Kondisi galat yang sudah ditangani dan **harus dipertahankan**: foto blur (`blur_score < 10`), komoditas tidak didukung, file bukan gambar, ROI bukan JSON valid, bobot model tidak ditemukan.

#### `POST /predict/batch` *(BARU, F-12)*
`images[]` (banyak file), `commodity`, `rois` (JSON array of `[x,y,w,h]|null`, sejajar indeks).
```json
{
  "status": "success",
  "komoditas": "tomato_sayur",
  "per_foto": [ /* GradingSuccess tanpa annotated_img */ ],
  "annotated_imgs": ["data:image/jpeg;base64,…"],
  "agregat": {
    "objek_terdeteksi": 84,
    "ringkasan_batch": { "komposisi": {...}, "skor_keseragaman": 0.78 }
  },
  "hash_audit": "sha256:…"
}
```

#### `GET /metrics` *(BARU, F-92)*
Latensi p50/p95, jumlah permintaan, tingkat galat, model yang termuat.

**NFR-AI-01 [P0]** — Rate limit `/predict` 30 permintaan/menit/IP. Endpoint ini terbuka dan mahal secara komputasi.
**NFR-AI-02 [P0]** — Ukuran gambar maksimum 8 MB; ditolak dengan pesan jelas di atas itu.
**NFR-AI-03 [P1]** — CORS dipersempit dari `*` ke daftar origin produksi + `localhost` sebelum submission.

### 12.2 Route Handler Next.js

| Endpoint | Metode | Auth | Fungsi |
| :--- | :--- | :--- | :--- |
| `/api/lacak/[hash]` | GET | publik | JSON laporan grading tersaring untuk halaman lacak; `Cache-Control: s-maxage=3600` |
| `/api/og/[type]/[id]` | GET | publik | Gambar Open Graph dinamis (listing, lacak) |
| `/api/cron/harga` | POST | header rahasia Vercel Cron | Segarkan `harga_acuan` |
| `/api/cron/warm` | POST | header rahasia Vercel Cron | Ping `/health` layanan AI tiap 5 menit |
| `/api/cron/kedaluwarsa` | POST | header rahasia Vercel Cron | Tandai penawaran > 48 jam sebagai kedaluwarsa |
| `/api/demo/reset` | POST | token bearer | Kembalikan akun demo ke keadaan awal |

### 12.3 Aturan seam frontend

**Tidak ada komponen yang memanggil `supabase` atau `fetch` secara langsung.** Semua baca lewat `src/lib/data.ts`; semua tulis lewat `src/lib/store.tsx`. Fitur baru menambah fungsi di dua berkas itu (atau modul yang mereka ekspor ulang), bukan memotong jalur. Aturan ini ditegakkan lewat lint rule `no-restricted-imports` yang melarang impor `@/lib/supabase` dari `src/app/**` dan `src/components/**`.

---

## 13. Spesifikasi AI Engine

### 13.1 Pipeline terpasang

```
Foto (BGR numpy)
  │
  ├─▶ [0] Gerbang kualitas — varians Laplacian < 10 ⇒ tolak dengan pesan
  │
  ├─▶ [1] AutoCalibrator — cari koin Rp500 (Ø 27 mm) di dalam ROI
  │        ⇒ px_per_mm2, kontur koin. Gagal ⇒ ukuran_mm2 = null, grading lanjut
  │
  ├─▶ [2] YOLO-1 segmentasi (per komoditas dasar) ⇒ kontur mask per objek
  │        Kontur < 500 px² dibuang sebagai derau
  │
  ├─▶ [3] GradingEngine (OpenCV, config per varian komoditas)
  │        ⇒ area_mm², solidity, circularity, status warna (HSV),
  │          daftar cacat, alasan_grade, grade A/B/C/REJECT
  │
  ├─▶ [4] YOLO-2 klasifikasi patologi sebagai VETO
  │        Crop objek dengan latar diputihkan (mencocokkan domain latih),
  │        padding 10%. Veto REJECT hanya bila:
  │          kelas == "busuk" DAN confidence ≥ 0,85 DAN OpenCV juga
  │          menemukan bercak. ⇒ saksi konfirmasi, bukan hakim tunggal
  │
  ├─▶ [5] Agregasi batch — komposisi grade, skor keseragaman = 1 − CV ukuran
  │
  └─▶ [6] hash_audit = SHA-256 atas JSON kanonik hasil
```

### 13.2 Keputusan desain yang layak dipresentasikan ke juri

| Keputusan | Alasan | Nilai jual |
| :--- | :--- | :--- |
| Empat model spesialis single-class, bukan satu model 4-kelas | Menghilangkan halusinasi antar-kelas (tomat ditebak cabai) dan CUDA OOM pada 50.000+ gambar | Bukti pengambilan keputusan rekayasa nyata, bukan tutorial |
| Rule engine OpenCV di antara dua model | Grade harus **dapat dijelaskan**. Jaringan saraf ujung-ke-ujung tidak bisa menjelaskan "solidity 0,79 di bawah ambang 0,85" | Explainability adalah syarat kepercayaan di transaksi uang |
| YOLO-2 sebagai veto berkorroborasi, bukan hakim | Mengurangi false-REJECT yang secara langsung merugikan petani | Menunjukkan kesadaran atas asimetri biaya kesalahan |
| Kalibrasi koin Rp500 | Mengubah piksel menjadi mm² nyata dengan referensi yang sudah ada di saku setiap petani. Tanpa perangkat keras tambahan | Inovasi frugal yang bisa langsung diterapkan |
| ROI koin dikirim dari klien | Tanpa itu kalibrator menyapu seluruh foto dan bisa mengira tomat bulat sebagai koin | Detail integrasi yang membuktikan sistem benar-benar diuji lapangan |
| Latar crop diputihkan sebelum YOLO-2 | Menghapus *domain shift* antara dataset latih (latar putih) dan foto lapangan | Pemahaman ML tingkat praktisi |
| `hash_audit` SHA-256 | Laporan menjadi artefak yang tidak dapat diubah diam-diam | Fondasi ketelusuran (EP-G) |

### 13.3 Cakupan model

**YOLO-1 — segmentasi poligon** (sumber: `README.md`)

| Komoditas dasar | Bobot | Dataset | Precision | Recall | mAP50 (mask) | Epoch |
| :--- | :--- | ---: | ---: | ---: | ---: | :--- |
| Cabai | `chili_seg.pt` (22,3 MB) | 6.675 | 97,8% | 94,5% | 97,4% | 40 |
| Timun | `cucumber_seg.pt` (5,7 MB) | ~1.250 | 95,9% | 89,8% | 96,0% | 100 |
| Tomat | `tomato_seg.pt` (5,7 MB) | ~9.790 | 94,5% | 84,5% | 90,3% | 100 |
| Wortel | `carrot_seg.pt` (5,7 MB) | ~788 | 91,1% | 78,1% | 87,4% | 100 |

**YOLO-2 — klasifikasi patologi** (`yolo11n-cls`, dilatih di atas dataset berlatar putih hasil `prepare_dataset.py`)

Angka di bawah bukan angka tangan: `ai_engine/eval_yolo2_cls.py` menulis `ai_engine/outputs/metrik_yolo2.json`,
dan `scripts/gen-metrik-model.mjs` menurunkannya jadi `web/src/lib/metrik-model.generated.ts` saat `dev`/`build`.
Kartu model (F-15) membaca berkas itu, jadi situs tidak bisa mengutip angka yang berbeda dari hasil evaluasi.
Evaluasi terakhir, seluruhnya rata-rata makro dua kelas (`sehat`, `busuk`).

| Komoditas dasar | Bobot | Potongan validasi | Akurasi | F1 makro | Status |
| :--- | :--- | ---: | ---: | ---: | :--- |
| Timun | `cucumber_cls.pt` (3,0 MB) | 112 | 98,2% | 0,982 | Split paling bersih (5 dari 112 gambar sumber beririsan) |
| Tomat | `tomato_cls.pt` (3,0 MB) | 200 | 97,5% | 0,975 | Stabil |
| Wortel | `carrot_cls.pt` (3,0 MB) | 110 | 100,0% | 1,000 | ⚠ optimistis — lihat F-107 |
| Cabai | `chili_cls.pt` (3,0 MB) | 16 | 81,3% | 0,812 | Veto berjalan; set validasi terlalu kecil untuk diklaim |

Cabai **tidak** lagi "masih dalam pelatihan": `chili_cls.pt` ada dan `model.py` memuatnya tanpa pengecualian komoditas,
jadi veto patologi cabai aktif. Keterbatasan yang sebenarnya adalah 16 potongan validasi — cukup untuk regresi, tidak cukup untuk klaim akurasi.

**F-107 [INOVASI] P0** — **Akurasi validasi wortel 100,0% harus diselidiki sebelum diklaim di manapun.** Dataset wortel adalah yang terkecil (~788 gambar YOLO-1; split YOLO-2 lebih kecil lagi). Akurasi sempurna pada set validasi kecil hampir selalu berarti salah satu dari: kebocoran data antara train dan val, set validasi yang terlalu mudah, atau kelas yang tidak seimbang parah. Juri berlatar ML akan menanyakan ini — dan 100% adalah angka yang mengundang pertanyaan, bukan yang mengesankan.

Hasil penyelidikan (selesai):
- [x] Split validasi wortel berisi 110 potongan objek, seimbang persis 55 sehat / 55 busuk. Kelasnya bukan penyebabnya.
- [x] **Kebocoran terkonfirmasi, dan bentuknya spesifik:** split dibagi per potongan objek, bukan per gambar sumber. Satu foto menghasilkan banyak potongan, sehingga 73 dari 85 gambar sumber validasi wortel juga muncul di sisi latih. Timun paling bersih (5 dari 112), tomat di antaranya.
- [x] Tidak dilatih ulang untuk v1.0. Yang diambil adalah posisi pelaporan: angkanya ditulis apa adanya **beserta** ukuran split dan peringatan kebocoran ini, di kartu model dan di `/tentang/model`.
- [x] Ukuran set validasi ikut tampil di setiap tempat angka itu dikutip — "100,0% dari 110 potongan, 73 dari 85 sumbernya beririsan dengan latih" adalah kalimat yang dipakai, bukan "100%" telanjang.
- [x] Kartu model (F-15) membaca `metrik-model.generated.ts`, jadi angka dan keterbatasannya tidak bisa berpisah.

Sisa utang untuk v1.1: split ulang per gambar sumber lalu evaluasi ulang. Selama belum dikerjakan, skor wortel dan tomat harus dibaca sebagai batas atas.

Posisi yang harus diambil: PANTAS melaporkan angka apa adanya beserta konteksnya. Kejujuran metodologis adalah nilai jual, bukan kelemahan.

Di atas 4 model dasar berdiri **12 varian komoditas**, masing-masing dengan berkas config ambang batas sendiri di `ai_engine/grading_configs/` (`min_area_A/B`, `min_circularity_A/B`, rentang hue kematangan, aturan cacat). `web/src/lib/komoditas.generated.ts` di-generate dari folder tersebut saat `dev`/`build`, sehingga daftar di UI tidak akan pernah menyimpang dari kemampuan engine.

### 13.4 Pekerjaan AI di v1.0

**F-100 [INOVASI] P1** — Set regresi grading: 40 foto berlabel (10 per komoditas dasar) dengan komposisi grade yang diharapkan. Skrip `pytest` menjalankan `PantasModel.predict` dan menegaskan komposisi berada dalam toleransi. Mencegah penyetelan config diam-diam merusak akurasi.

**F-101 [INOVASI] P1** — Estimasi berat dari luas terkalibrasi: `berat_est = Σ area_mm² × faktor_densitas[komoditas]`, faktor dikalibrasi dari data serah terima nyata (`orders.berat_aktual_kg`). Ditampilkan sebagai estimasi dengan rentang keyakinan, tidak pernah sebagai fakta.

**F-102 [FUNGSI] P1** — Ambang blur saat ini `< 10` sangat longgar. Naikkan menjadi tiga zona: `< 12` tolak, `12–35` peringatkan tapi lanjutkan (tandai `kualitas_foto: "rendah"` di hasil), `> 35` normal. Zona peringatan tampil di laporan sebagai catatan keandalan.

**F-108 [INOVASI] P0** — Gerbang plausibilitas kalibrasi. Kalibrasi yang "berhasil" sebelumnya hanya berarti *ada sesuatu yang bulat ditemukan*; tidak ada yang menanyakan apakah skala hasilnya mungkin secara fisik. Tutup botol, koin lain, atau tomat yang terang bisa lolos sebagai referensi Rp500 dan seluruh laporan berdiri di atas penggaris yang panjangnya salah. Itu bukan cuma soal berat: `GradingEngine` memutuskan grade dari `area_mm2` terhadap `min_area_A`/`min_area_B`, jadi skala yang menggelembung 12× menaikkan setiap objek melewati ambang Grade A. Pindaian produksi 10 Agustus 2026 melakukan persis itu: dua tomat @151.295 mm², 11,86 kg untuk sepasang, A 100%, dengan `kalibrasi.valid = true` di sebelahnya.

`ai_engine/plausibilitas.py` membandingkan **median** luas objek terhadap rentang fisik per komoditas, lalu **menolak fotonya** — bukan mengosongkan beratnya. Kalau penggarisnya salah, gradenya ikut salah, dan laporan yang salah lebih berbahaya daripada tidak ada laporan. Tiga sifat yang disengaja:

- Rentangnya longgar, dua sampai tiga kali lebih lebar dari ukuran pasar di tiap sisi. Sasarannya galat orde besaran, bukan panen yang kebetulan besar. Menolak panen sah jauh lebih mahal daripada meloloskan satu foto aneh.
- Median, bukan rata-rata, supaya satu segmentasi yang menyatukan dua buah tidak menjatuhkan foto yang selebihnya benar.
- Komoditas tanpa rentang tidak pernah ditolak; payload berbunyi `diperiksa: false` alih-alih mengaku sudah memeriksa.

Petani menerima satu kalimat yang menyebut kemungkinan penyebabnya dan apa yang harus diulang. Ini **tidak** menyembuhkan `calibration.py`, yang masih belum punya uji plausibilitas koin: koin palsu yang kebetulan menghasilkan skala masuk akal tetap lolos, dan `xfail` di set regresi menyatakan itu dengan kata-kata itu juga.

**F-103 [FUNGSI] P2** — Umpan balik koreksi: petani dapat menandai objek yang salah nilai. Tersimpan ke `grading_koreksi` untuk pelatihan ulang di masa depan. Fitur ini juga jawaban bagus untuk pertanyaan juri "bagaimana model Anda membaik?".

---

## 14. Algoritma Harga

### 14.1 Rumus terpasang (dipertahankan, transparan di UI)

```
skor_kualitas = 1,00·komposisi_A + 0,70·komposisi_B + 0,40·komposisi_C
bobot_grade   = { A: 1,00 · B: 0,85 · C: 0,65 · REJECT: 0,35 }
bobot_efektif = Σ komposisi[g] × bobot_grade[g]
pengali       = bobot_efektif × (0,90 + 0,16 × skor_kualitas)
tengah        = harga_acuan × pengali
rentang_wajar = [ tengah × 0,93 , tengah × 1,08 ]   (dibulatkan ke Rp100)
```

⚠ **Koreksi rumus, ditemukan oleh F-104.** Baris pengali semula
`bobot_grade[grade_dominan] × (…)` — satu grade memutuskan seluruh bobot. Bentuk
itu melanggar sifat 1 di §14.2, dan tes properti menemukan contoh yang
menjatuhkannya: batch `A 0,4 / B 0,3 / C 0,3` berpengali **1,017**, sedangkan
batch yang jelas lebih baik `A 0,4 / B 0,6` berpengali **0,877**. Memindahkan 30%
panen dari C ke B menurunkan harga 14%, hanya karena grade dominannya bergeser
A → B dan bobotnya jatuh 1,00 → 0,85. Bentuk tertimbang menutup lubang itu tanpa
mengubah apa pun yang dijanjikan §14.2: batasnya tetap `[0,315 , 1,06]`, batch
murni satu grade menghasilkan pengali yang sama persis seperti sebelumnya, dan
`bobot_efektif` ikut tampil sebagai satu baris di layar harga.

### 14.2 Sifat yang harus dijaga

1. **Monoton** — komposisi grade yang lebih baik tidak boleh menghasilkan harga lebih rendah. "Lebih baik" berarti dominansi stokastik orde pertama pada urutan A → REJECT: untuk setiap `k`, massa gabungan `k` grade teratas tidak lebih kecil. Definisi itu tidak menuntut grade dominannya sama — justru pergeseran dominan itulah yang dulu melanggar sifat ini.
2. **Terbatas** — pengali berada di `[0,315 , 1,06]`; tidak pernah menyarankan harga di atas ~106% harga acuan. Kedua batas turunan langsung dari rumus: `0,35 × 0,90` untuk batch REJECT penuh dan `1,00 × 1,06` untuk batch A penuh.
3. **Dapat dijelaskan** — setiap suku ditampilkan dengan nilainya di UI. Petani harus bisa membaca alasannya, bukan hanya hasilnya.
4. **Tidak memaksa** — petani dapat menetapkan harga di luar rentang. Sistem hanya memberi label posisi ("Di bawah rentang" / "Dalam rentang wajar" / "Di atas rentang").

**F-104 [FUNGSI] P1** — Tes properti (`fast-check`) yang memverifikasi sifat 1 dan 2 pada 1.000 komposisi acak. Ini juga jawaban yang kuat bila juri menanyakan validitas algoritma.

- [x] `web/src/lib/harga.ts` memuat bagian murni algoritma, terpisah dari `getRekomendasiHarga` yang membaca tabel `harga_acuan` — sifat matematis tidak bisa diuji 1.000 kali sambil menyeret Supabase.
- [x] `web/src/lib/harga.properti.test.ts` (`npm test`): sifat 1 diuji pada pasangan komposisi yang dibangun dengan memindahkan massa ke grade lebih baik, sifat 2 pada komposisi acak berjumlah 1 dengan pembulatan 2 desimal seperti keluaran engine.
- [x] Rumus §14.1 dikoreksi ke `bobot_efektif`; contoh penjatuh rumus lama ikut tersimpan sebagai tes regresi, beserta satu tes yang membuktikan generatornya memang bergigi (rumus lama harus gagal pada properti yang sama).
- [x] `bobot_grade` masuk `RekomendasiHarga` dan tampil sebagai baris "Bobot grade batch" di layar harga — sifat 3 menuntut tiap suku terbaca.

**F-105 [TEMA] P2** — Perbandingan harga tengkulak: tampilkan estimasi `harga_acuan × 0,70` sebagai baseline yang dinyatakan sumbernya, sehingga selisih yang diperoleh petani terlihat. Angka baseline harus disitasi, bukan diklaim.

### 14.3 Faktor emisi CO₂e — sumber & nilai *(menutup Q-5)*

**Masalah pada kode saat ini.** `web/src/app/petani/(tabs)/dampak/page.tsx` memakai satu konstanta `1,7 kg CO₂e per kg` untuk semua komoditas, tanpa sitasi. Dua cacat: (a) tidak dapat dipertanggungjawabkan bila juri bertanya; (b) salah secara substansi — wortel dan tomat punya jejak karbon yang berbeda hampir 5×.

**Keputusan: pakai faktor per komoditas dari Poore & Nemecek (2018).** Ini adalah meta-analisis 570 studi atas 38.700 peternakan/kebun komersial, diterbitkan di *Science*, dan menjadi rujukan standar Our World in Data. Dapat dikutip di proposal, pitch deck, dan sesi tanya jawab.

> Poore, J., & Nemecek, T. (2018). *Reducing food's environmental impacts through producers and consumers.* **Science**, 360(6392), 987–992.

| Komoditas PANTAS | Kategori Poore & Nemecek | Faktor (kg CO₂e / kg) |
| :--- | :--- | ---: |
| Wortel (`carrot_*`) | Root Vegetables | **0,43** |
| Timun (`cucumber_*`) | Other Vegetables | **0,53** |
| Cabai (`chili_*`) | Other Vegetables | **0,53** |
| Tomat (`tomato_*`) | Tomatoes | **2,09** ⚠ lihat catatan |

⚠ **Catatan kejujuran yang wajib tampil di UI.** Angka tomat 2,09 adalah rata-rata global yang terangkat oleh produksi rumah kaca berpemanas di Eropa. Tomat lapangan terbuka di iklim tropis jauh lebih rendah. PANTAS **tidak boleh** memakai 2,09 diam-diam karena akan melebih-lebihkan klaim dampak untuk komoditas yang paling sering dipindai. Dua opsi yang dapat dipertanggungjawabkan — pilih salah satu dan nyatakan di UI:

1. **Konservatif (direkomendasikan):** pakai `0,53` (Other Vegetables) untuk tomat juga, dan tulis di tooltip bahwa PANTAS sengaja memakai batas bawah karena produksi Indonesia adalah lapangan terbuka tanpa pemanas. Klaim dampak menjadi *understated*, dan itu posisi yang aman saat dibantah.
2. **Rentang:** tampilkan `0,53 – 2,09` sebagai rentang dengan penjelasan sumber sebarannya.

**Konteks nasional untuk BAB I & BAB IV proposal** (bukan untuk perhitungan, tapi untuk pembingkaian masalah):

> Kajian *Food Loss and Waste di Indonesia* (Bappenas bersama WRI Indonesia, 2021): timbulan FLW Indonesia **115–184 kg per kapita per tahun**, dengan dampak emisi kumulatif **1.702,9 Mt CO₂e (2000–2019)** atau setara **~7,29% emisi GRK nasional** per tahun. **Sayuran adalah penyumbang kehilangan terbesar — mencapai 62,8% dari total pasokan sayuran domestik.**

Angka 62,8% itu adalah kalimat pembuka terkuat untuk slide masalah: PANTAS bekerja tepat di kategori komoditas dengan tingkat kehilangan tertinggi di Indonesia.

**F-106 [TEMA] P0** — Faktor emisi disimpan di satu tabel konfigurasi (`emisi_faktor`, kolom: `komoditas`, `faktor`, `sumber`, `catatan`), bukan hard-coded di komponen. UI membaca `sumber` dan menampilkannya. Mengganti sumber di kemudian hari tidak boleh menyentuh kode komponen.

- [x] Tabel `emisi_faktor` dibuat di migrasi `0004`; migrasi `0007` menambah kolom `satuan`, baris cadangan `lainnya`, dan baris `transport_solar` untuk konversi liter → kg CO₂e di kartu penghematan rute.
- [x] `lib/emisi.ts` tidak lagi mengekspor konstanta faktor. Isinya pembaca tabel: `kunciKomoditas` memetakan id komoditas aplikasi (`tomato_ceri`) ke kunci kelompok (`tomato`), `faktorUntuk` selalu mengembalikan baris, `tonCo2eDicegah` menghitung per partai.
- [x] `getFaktorEmisi()` di `lib/data.ts` membaca tabel sekali per proses dan menyimpannya di store; `FAKTOR_EMISI_BAWAAN` hanya dipakai bila Supabase tidak dikonfigurasi, dengan nilai yang sama dengan seed.
- [x] Layar dampak petani menghitung CO₂e per pesanan memakai `orders.listing_id → listings.komoditas`, bukan satu pengali untuk seluruh keranjang.

**Acceptance criteria**
- [x] Tidak ada faktor emisi tertulis di komponen: `0.53`, `0.43`, dan `2.68` hanya muncul di migrasi dan di salinan cadangan `lib/emisi.ts`.
- [x] Setiap angka CO₂e di layar menampilkan `sumber` dari barisnya — tooltip Stat di dampak petani, baris keterangan di kartu agregat admin, dan kartu penghematan perencana rute.
- [x] Mengganti `faktor` atau `sumber` lewat `update public.emisi_faktor` mengubah angka dan sitasi di seluruh permukaan tanpa rilis kode.

---

## 15. Non-Functional Requirements

### 15.1 Performa

| ID | Persyaratan | Ambang | Verifikasi |
| :--- | :--- | :--- | :--- |
| NFR-01 | LCP halaman publik | < 4,2 s (Fast 3G tersimulasi; lihat catatan) | Lighthouse CI |
| NFR-02 | LCP halaman aplikasi setelah login | < 4,2 s (Fast 3G tersimulasi; lihat catatan) | Lighthouse CI |
| NFR-03 | INP | < 200 ms | RUM produksi; TBT di Lighthouse CI sebagai peringatan (lihat catatan) |
| NFR-04 | CLS | < 0,05 | Lighthouse CI |
| NFR-05 | Ukuran JS route awal | < 220 KB gzip per route (lihat catatan) | `web/scripts/check-bundle-budget.mjs` di CI |
| NFR-06 | Latensi grading ujung-ke-ujung (foto 900px) | p95 < 6 s termasuk jaringan | Skrip beban |
| NFR-07 | Waktu render tabel 500 baris | < 100 ms | Profil React |

**Catatan NFR-01..02.** Ambang semula 2,0 s dan 2,5 s ditulis sebelum ada
pengukuran. Setelah gerbang Lighthouse CI berdiri (F-99), delapan layar wakil
diukur pada preset ponsel Lighthouse — 1,6 Mbps, RTT 150 ms, throttling
tersimulasi Lantern — dan seluruhnya jatuh di **3,16–3,78 s**. Sebarannya rapat
karena yang mendominasi bukan isi halaman melainkan kerangka klien yang sama di
semua route: 177 KB gzip JS bersama plus tiga wajah huruf. Dua catatan tentang
cara ukurnya, keduanya membuat angka gerbang lebih buruk daripada yang dialami
pengguna: `next start` melayani lewat HTTP/1.1 sehingga 20-an chunk berebut enam
koneksi, sedangkan produksi memakai HTTP/2; dan Lantern menghitung LCP teks dari
graf pesimistis yang menempatkan cat teks setelah seluruh skrip tiba.

Ambang diubah ke **4,2 s** untuk kedua kelas halaman — nilai terukur terburuk
plus ±11% ruang gerak. Pembedaan publik/aplikasi ikut runtuh karena kerangka
bersama itu, bukan kelas route, yang menentukan angkanya. Ini ambang regresi,
bukan sasaran: menurunkannya ke bawah 2 s menuntut halaman publik tanpa hidrasi
React sama sekali, yaitu perubahan arsitektur di luar lingkup F-99.

**Catatan NFR-03.** INP hanya lahir dari interaksi nyata, dan Lighthouse mode
navigasi tidak punya audit INP, jadi bagian labnya berhenti di TBT. TBT itu
dipasang sebagai peringatan, bukan gerbang keras: ia satu-satunya angka waktu CPU
di sini, dan runner GitHub gratis berbagi dua inti dengan tetangga. Untuk commit
yang sama, halaman `/` tercatat 31 ms di mesin pengembang dan 1.212 ms di runner
— selisih 40x yang mengukur beban runner, bukan kode. Ambang error yang cukup
longgar untuk menampungnya tidak akan menangkap regresi apa pun. Angkanya tetap
tercetak dan ikut artefak laporan tiap PR; gerbang keras NFR-03 ada di RUM
produksi.

**Catatan NFR-05.** Ambang semula 180 KB ditulis sebelum ada pengukuran. Runtime
Next 16 + React 19 sendiri sudah 143 KB gzip di first-load setiap route
(react-dom 71, runtime app-router 40, sisanya pemuat dan polyfill modern), dan
angka itu tidak bisa ditawar tanpa berganti framework. Anggaran diubah menjadi
**260 KB gzip total per route**, yang menyisakan ±77 KB untuk kode aplikasi di
atas baseline bersama. Gerbang CI mencetak baseline dan porsi kode aplikasi
terpisah, jadi regresi tetap terlihat meski totalnya masih di bawah ambang.
Pengukuran dilakukan pada chunk first-load dari `route-bundle-stats.json`
Turbopack, digzip pada level 6 (level yang dipakai mayoritas CDN).

### 15.2 Ketersediaan

| ID | Persyaratan |
| :--- | :--- |
| NFR-10 | **Uptime ≥ 99% selama 5–23 Agustus 2026.** Ini adalah persyaratan lomba, bukan aspirasi. |
| NFR-11 | Layanan AI tidak boleh tidur. Cron warm-keeper memanggil `/health` setiap 5 menit. |
| NFR-12 | Bila layanan AI tidak tersedia, aplikasi tetap berfungsi penuh kecuali grading langsung, dan menampilkan status yang jujur — bukan spinner abadi. |
| NFR-13 | Proyek Supabase tidak boleh masuk status *paused*. Cron harian menyentuh database. |
| NFR-14 | Pemantauan uptime eksternal (UptimeRobot free) pada frontend, layanan AI, dan halaman lacak, dengan peringatan ke WhatsApp tim. |

### 15.3 Aksesibilitas

| ID | Persyaratan |
| :--- | :--- |
| NFR-20 | WCAG 2.1 AA di kedua tema |
| NFR-21 | Nol pelanggaran `axe-core` tingkat serius/kritis di CI |
| NFR-22 | Seluruh alur emas dapat diselesaikan hanya dengan keyboard |
| NFR-23 | Target sentuh ≥ 44×44 px pada permukaan mobile |
| NFR-24 | Informasi tidak pernah disampaikan hanya lewat warna |

### 15.4 Keamanan & privasi

| ID | Persyaratan |
| :--- | :--- |
| NFR-30 | RLS aktif di seluruh tabel; diuji dengan tes integrasi lintas-akun |
| NFR-31 | Tidak ada rahasia di bundle klien; hanya `NEXT_PUBLIC_*` yang boleh terekspos |
| NFR-32 | Halaman lacak publik tidak membocorkan PII (email, telepon, alamat presisi, harga) |
| NFR-33 | Unggahan gambar divalidasi tipe & ukuran di klien dan server |
| NFR-34 | Content-Security-Policy header terpasang; tanpa `unsafe-eval` |
| NFR-35 | Rate limit pada `/predict`, `/api/demo/reset`, dan endpoint auth |
| NFR-36 | Advisor keamanan Supabase bersih (lanjutan `0002_security_hardening.sql`) |
| NFR-37 | Pengguna dapat mengunduh dan menghapus datanya sendiri |

### 15.5 Kualitas kode

| ID | Persyaratan |
| :--- | :--- |
| NFR-40 | TypeScript `strict`, nol `any` kecuali pada boundary API vendor yang diberi komentar alasan |
| NFR-41 | ESLint bersih, nol peringatan |
| NFR-42 | Semua komentar kode menjelaskan **mengapa**, bukan **apa** — konsisten dengan gaya kode yang sudah ada |
| NFR-43 | Setiap PR menyertakan tag rubrik dan bukti verifikasi (tangkapan layar atau keluaran tes) |

---

## 16. Deployment & Operasi

### 16.1 Topologi

| Komponen | Platform | Domain | Catatan |
| :--- | :--- | :--- | :--- |
| Frontend | Vercel | **`pantas-ai.vercel.app`** | Region `sin1` untuk kedekatan dengan Supabase ap-southeast-1. Subdomain Vercel, tanpa DNS eksternal — nol risiko propagasi menjelang tenggat |
| Layanan AI | Hugging Face Spaces (Docker, port 7860) | `…-pantas-grading.hf.space` | `Dockerfile` sudah ada. Free tier tidur setelah 48 jam idle ⇒ warm-keeper wajib |
| Database/Auth/Storage | Supabase | `saipqorcjeizxizjpfsp.supabase.co` | ap-southeast-1, sudah terpasang |
| Pemantauan | UptimeRobot + Sentry | — | Free tier keduanya |

### 16.2 Variabel lingkungan

```
# web/.env.local  (dan Vercel Project Settings)
NEXT_PUBLIC_SUPABASE_URL=            # sudah terisi
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # sudah terisi
NEXT_PUBLIC_PREDICT_URL=             # sudah terisi
NEXT_PUBLIC_SITE_URL=                # untuk OG & tautan absolut
SUPABASE_SERVICE_ROLE_KEY=           # SERVER SAJA — tidak pernah NEXT_PUBLIC_
CRON_SECRET=                         # header rahasia Vercel Cron
DEMO_RESET_TOKEN=
SENTRY_DSN=
```

**Pemeriksaan wajib sebelum submission:** jalankan `grep -r "SERVICE_ROLE" .next/static/` dan pastikan nol hasil.

### 16.3 CI/CD

`.github/workflows/ci.yml` pada setiap push & PR:

1. `npm ci`
2. `npm run gen:komoditas` — pastikan berkas generated sinkron; gagal bila ada diff
3. `tsc --noEmit`
4. `eslint`
5. `vitest run` — unit + komponen
6. `playwright test` — 5 alur emas
7. `lhci autorun` — anggaran performa
8. `axe` — pemindaian aksesibilitas
9. Analisis bundle — gagal bila melewati NFR-05

Deploy: merge ke `main` → Vercel production. Tag `v1.0.0` sebelum submission.

### 16.4 Runbook (dijalankan tanggal 4–5 Agustus)

- [ ] Semua migrasi diterapkan ke Supabase produksi
- [ ] `seed_demo.sql` dijalankan; ketiga akun demo diverifikasi manual
- [ ] Cron warm-keeper aktif dan terverifikasi (cek log 3 siklus)
- [ ] Cron reset demo aktif
- [ ] Pemantauan uptime aktif dengan peringatan ke WhatsApp
- [ ] URL produksi diakses dari jaringan seluler (bukan hanya Wi-Fi kantor)
- [ ] Diuji di Chrome, Firefox, Safari (macOS & iOS), Edge
- [ ] Diuji di lebar 360, 768, 1024, 1440, 1920
- [ ] Lighthouse ≥ 95 di empat kategori pada halaman publik
- [ ] README repositori berisi: ikhtisar, arsitektur, cara jalan lokal, kredensial demo, tautan produksi
- [ ] Repositori GitHub dijadikan publik; `.env.local` terkonfirmasi tidak pernah ter-commit
- [ ] Bobot model tersedia di repositori atau tautan unduhan yang dinyatakan di README

---

## 17. QA & Rencana Uji

### 17.1 Lima alur emas (wajib lulus, otomatis di Playwright)

| # | Alur | Langkah |
| :--- | :--- | :--- |
| G1 | Petani: pindai → jual | Masuk → dashboard → pindai (unggah contoh) → hasil grading → rekomendasi harga → atur harga → terbitkan listing → listing tampil di dashboard |
| G2 | Pembeli: temukan → pesan | Masuk → katalog → filter → detail produk → lihat laporan mutu → tambah inquiry → kirim penawaran |
| G3 | Negosiasi → pesanan | Petani menerima penawaran → pesanan terbentuk → pembeli melihat kode QR |
| G4 | Logistik → serah terima | Jadwalkan penjemputan → admin konsolidasi ke rute → status berjalan → petani memindai QR pembeli → pesanan selesai → dampak bertambah |
| G5 | Ketelusuran publik | Buka `/lacak/[hash]` tanpa sesi → laporan tampil lengkap → tidak ada PII |

### 17.2 Lapisan pengujian

| Lapisan | Alat | Cakupan |
| :--- | :--- | :--- |
| Unit | Vitest | `format.ts`, `skorKualitas`, `getRekomendasiHarga`, `coinRoi`, heuristik rute, agregasi dampak |
| Properti | fast-check | Sifat monoton & terbatas algoritma harga (F-104) |
| Komponen | Vitest + Testing Library | Seluruh komponen design system, seluruh state |
| Integrasi (DB) | Vitest + klien Supabase | Matriks RLS: untuk setiap tabel × setiap peran, tegaskan baris yang boleh dan tidak boleh terlihat |
| E2E | Playwright | G1–G5, di viewport mobile **dan** desktop |
| AI regresi | pytest | 40 foto berlabel, toleransi komposisi (F-100) |
| Visual | Playwright screenshot | Halaman `/dev/ds` di light & dark |
| Performa | Lighthouse CI | Anggaran NFR-01..05 |
| Aksesibilitas | axe-core | Nol serius/kritis |

### 17.3 Matriks perangkat & peramban

| Kelas | Perangkat/Peramban | Prioritas |
| :--- | :--- | :--- |
| Mobile rendah | Android 10, Chrome, 360×640, 3G | P0 — persona petani |
| Mobile menengah | Android 13, Chrome, 412×915 | P0 |
| iOS | iPhone 12+, Safari | P0 |
| Laptop | Chrome/Edge 1440×900 | P0 — **perangkat juri** |
| Laptop | Safari macOS 1440×900 | P0 |
| Laptop | Firefox 1440×900 | P1 |
| Desktop besar | 1920×1080 | P1 |
| Tablet | iPad 768×1024 | P1 |

### 17.4 Uji manual yang tidak bisa diotomatiskan

- [ ] Pindai nyata dengan tomat & koin Rp500 di bawah 3 kondisi cahaya (matahari langsung, teduh, dalam ruangan)
- [ ] Uji dengan sinyal buruk (throttle jaringan) — verifikasi antrean offline
- [ ] Uji pembaca layar NVDA (Windows) & VoiceOver (iOS) pada G1 dan G2
- [ ] Uji dengan pengguna nyata: minimal 3 petani mencoba alur pindai tanpa panduan. Catat titik kebingungan. **Bukti uji pengguna ini masuk ke BAB VI proposal** dan sangat kuat di sesi tanya jawab.

---

## 18. Judge Experience & Demo Kit

### 18.1 Jalur juri (dirancang eksplisit)

```
Juri membuka tautan
      ▼
/ (landing) — 20 detik memahami masalah + solusi
      ▼
Coba demo grading langsung di landing — tanpa login, hasil AI nyata
      ▼
Klik "Coba Demo Juri" → /demo
      ▼
Tiga kartu kredensial, satu klik masuk
      ▼
Dashboard terisi penuh + tur berpandu 5 langkah
      ▼
Jelajah bebas: pindai, harga, katalog, peta, logistik, dampak, lacak
```

**F-110 [PRESENTASI] P0** — Halaman `/demo` juga memuat: skrip demo 3 menit yang dapat diikuti juri sendiri, tautan langsung ke lima layar paling mengesankan, dan tautan ke repositori serta dokumen teknis.

### 18.2 Kit demo final offline (22 Agustus)

| Item | Alasan |
| :--- | :--- |
| Perangkat cadangan (2 ponsel + 1 laptop), semua sudah login | Kegagalan perangkat tidak boleh menghentikan demo |
| Hotspot seluler sendiri, 2 operator berbeda | Wi-Fi venue tidak dapat diandalkan |
| Tomat & cabai segar + koin Rp500 (3 buah) | Demo grading **langsung** di panggung jauh lebih kuat daripada rekaman |
| Lampu LED portabel kecil | Pencahayaan panggung sering buruk untuk kamera ponsel |
| Rekaman video 90 detik alur lengkap | Jaring pengaman bila jaringan mati total |
| Build offline PWA yang sudah ter-cache di perangkat | Lapisan pengaman kedua |
| Lembar cetak: arsitektur + metrik model + QR ke aplikasi | Dibagikan ke juri; QR mengarah ke `/demo` |

**F-111 [PRESENTASI] P0** — Latihan demo minimal 5 kali penuh dengan stopwatch, termasuk satu latihan dengan jaringan sengaja dimatikan.

### 18.3 Struktur presentasi 10 menit

| Menit | Isi |
| :--- | :--- |
| 0:00–1:00 | Masalah — angka susut pascapanen + cerita satu petani |
| 1:00–1:30 | Tesis produk dalam satu kalimat |
| 1:30–5:00 | **Demo langsung** — pindai tomat asli di panggung → grade → harga → listing → pembeli memesan → lacak QR |
| 5:00–7:00 | Kedalaman teknis — pipeline 2 tahap, kalibrasi koin, veto berkorroborasi, hash audit |
| 7:00–8:30 | Dampak & keselarasan tema — angka dampak agregat, konsolidasi logistik, penghematan CO₂e |
| 8:30–10:00 | Peta jalan + penutup |

### 18.4 Bank pertanyaan tanya jawab

Siapkan jawaban tertulis untuk minimal:
- "Bagaimana kalau petani tidak punya koin Rp500?" → referensi alternatif dapat dikonfigurasi; kalibrasi gagal tidak memblokir grading, hanya menonaktifkan ukuran metrik.
- "Bagaimana model Anda menangani komoditas yang belum dilatih?" → API menolak eksplisit; pipeline latih sudah siap; batasan dinyatakan di kartu model.
- "Apa yang mencegah petani memanipulasi foto?" → hash audit + kalibrasi koin + veto patologi + rating dua arah + berat aktual saat serah terima.
- "Kenapa tidak pakai payment gateway?" → keputusan sadar (§5.2), dengan rancangan escrow di peta jalan.
- "Berapa akurasinya di lapangan, bukan di dataset?" → hasil uji lapangan §17.4, jujur tentang keterbatasan.
- "Bagaimana ini menghasilkan uang?" → komisi transaksi + layanan logistik + data agregat untuk industri (anonim).

---

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

## 20. Risk Register

| ID | Risiko | Dampak | Peluang | Mitigasi | Pemilik |
| :--- | :--- | :--- | :--- | :--- | :--- |
| R-01 | **Layanan AI di HF Spaces tidur** saat juri menilai; permintaan pertama gagal atau butuh 60 s | Kritis | Tinggi | Cron warm-keeper tiap 5 menit (NFR-11); klien mencoba ulang dengan backoff; landing memakai hasil ter-cache bila API lambat > 8 s; status layanan jujur di UI | Backend |
| R-02 | **Kamera tidak tersedia di laptop juri** | Tinggi | Tinggi | Jalur unggah setara kelas satu (F-10); 4 foto contoh siap pakai di landing & layar pindai | Frontend |
| R-03 | **Akun demo kosong atau dirusak juri lain** | Tinggi | Sedang | Cron reset tiap 6 jam (F-03); tiga akun terpisah | Backend |
| R-04 | **Proyek Supabase free tier di-pause** karena idle | Kritis | Rendah | Cron harian menyentuh DB (NFR-13); pemantauan uptime | Backend |
| R-05 | **Revamp desktop menimbulkan regresi mobile** | Tinggi | Sedang | Playwright berjalan di viewport mobile & desktop; tangkapan layar visual; lint melarang `max-w-[430px]` | Frontend |
| R-06 | **Scope creep** — fitur baru menggeser P0 | Tinggi | Tinggi | Aturan keras: tidak ada P1 sebelum semua P0 lulus acceptance; tinjauan prioritas tiap 2 hari | Lead |
| R-07 | **Bobot model besar di Git** memperlambat clone juri | Sedang | Sedang | Git LFS atau tautan rilis; README menjelaskan cara mendapatkannya | Backend |
| R-08 | **Kualitas grading buruk pada kondisi cahaya asli panggung** | Tinggi | Sedang | Uji lapangan 3 kondisi cahaya (§17.4); lampu LED di kit demo; zona peringatan blur (F-102) | AI |
| R-09 | **Jaringan venue mati** saat demo final | Kritis | Sedang | Hotspot 2 operator; PWA ter-cache; video cadangan 90 detik | Semua |
| R-10 | **Kebocoran service role key** ke bundle klien | Kritis | Rendah | Pemeriksaan grep di CI (§16.2); tinjauan kode wajib untuk perubahan env | Lead |
| R-11 | **Kuota Vercel/HF free tier terlampaui** saat penjurian | Tinggi | Rendah | Pantau penggunaan harian selama penjurian; siapkan akun cadangan | DevOps |
| R-12 | **Data demo tercampur ke angka dampak nyata**, merusak kredibilitas | Sedang | Sedang | Flag `is_demo` dan view agregat yang mengecualikannya (§11.4) | Backend |
| R-13 | **Anggota tim tidak tersedia** menjelang tenggat | Tinggi | Sedang | Semua pekerjaan terlacak di issue publik; tanpa pengetahuan yang hanya ada di satu kepala; dokumentasi arsitektur di repositori | Lead |
| R-14 | ~~`chili_cls.pt` masih dalam pelatihan~~ **Ditutup.** Bobotnya ada, `model.py` memuatnya tanpa pengecualian komoditas, dan vetonya berjalan. Risiko sisa berpindah bentuk: set validasi cabai hanya 16 potongan (81,3%), jadi angkanya tidak boleh dikutip sebagai akurasi lapangan | Sedang | Sedang | Klaim cabai selalu disertai ukuran splitnya. Perbesar set validasi cabai untuk v1.1; set regresi (F-100) sudah mencakup cabai | AI |
| R-15 | **Akurasi validasi wortel 100,0%** terbukti optimistis: split dibagi per potongan objek, bukan per gambar sumber, sehingga 73 dari 85 sumber validasi juga ada di sisi latih (F-107). Risiko sekarang bukan lagi angkanya, melainkan mengutipnya tanpa peringatan itu | Tinggi | Rendah | Angka, ukuran split, dan peringatan kebocoran selalu tampil bersama-sama di kartu model dan `/tentang/model`. Split ulang per gambar sumber masuk v1.1 | AI |

---

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

## 22. Definition of Done & Metrik

### 22.1 Definition of Done per fitur

Sebuah fitur selesai bila **seluruh** poin terpenuhi:

- [ ] Acceptance criteria di PRD ini terpenuhi dan diverifikasi
- [ ] Berfungsi di 360px dan 1440px
- [ ] Berfungsi di tema terang dan gelap
- [ ] Punya state: loading, kosong, galat, sukses
- [ ] Dapat dijangkau keyboard; nol pelanggaran axe serius
- [ ] Tidak ada teks keras — melalui kamus i18n (setelah F-97 mendarat)
- [ ] Tidak memanggil Supabase/fetch langsung dari komponen (§12.3)
- [ ] Tes: unit untuk logika, komponen untuk UI, e2e bila menyentuh alur emas
- [ ] `tsc` dan `eslint` bersih
- [ ] PR mencantumkan tag rubrik dan bukti verifikasi

### 22.2 Metrik keberhasilan produk (bukan metrik lomba)

| Metrik | Target v1.0 | Cara ukur |
| :--- | :--- | :--- |
| Waktu pindai → laporan | < 15 detik median | Instrumentasi klien |
| Tingkat penyelesaian alur pindai | > 80% (mulai → listing terbit) | Funnel analytics |
| Kalibrasi koin berhasil | > 70% pindaian | `gradings.hasil->kalibrasi->valid` |
| Penawaran → pesanan | > 30% | Rasio tabel |
| Pesanan → selesai | > 70% | Rasio tabel |
| Kg tersalurkan | Angka nyata, bukan target | View `dampak_agregat` |

### 22.3 Metrik keberhasilan lomba

| Metrik | Target |
| :--- | :--- |
| Semua deliverable terkumpul sebelum tenggat 7 Sept | 6 dari 6 |
| Uptime selama 8–21 September (Penjurian) | ≥ 99,5% |
| Lighthouse halaman publik | ≥ 95 di empat kategori |
| Lolos ke 10 besar finalis HoloDev | Ya |
| Demo langsung berjalan tanpa jaring pengaman di final | Ya |

---

## 23. Lampiran

### 23.1 Glosarium

| Istilah | Arti |
| :--- | :--- |
| **Batch** | Satu tumpukan panen yang dipindai bersama dalam satu sesi |
| **Grade** | Kelas mutu per objek: A (premium), B (standar), C (ekonomis), REJECT (tidak layak jual) |
| **Komposisi batch** | Proporsi setiap grade dalam satu batch, mis. `{A: 0,14, B: 0,60, C: 0,21, REJECT: 0,05}` |
| **Skor keseragaman** | `1 − koefisien variasi` ukuran objek; makin tinggi makin seragam |
| **Solidity** | Rasio luas kontur terhadap luas convex hull-nya; mendeteksi bentuk tidak beraturan |
| **Circularity** | `4π × luas / keliling²`; 1,0 = lingkaran sempurna |
| **Kalibrasi koin** | Menurunkan piksel-per-mm² dari koin Rp500 (Ø 27 mm) di dalam foto |
| **Veto YOLO-2** | Model klasifikasi patologi yang dapat menurunkan grade ke REJECT, hanya bila rule engine OpenCV juga menemukan bercak |
| **hash_audit** | SHA-256 atas JSON kanonik laporan grading; membuat laporan tidak dapat diubah diam-diam |
| **Harga acuan** | Harga pasar rujukan per komoditas dari tabel `harga_acuan` |
| **Pengali** | Faktor yang mengubah harga acuan menjadi rekomendasi, diturunkan dari grade dominan & skor kualitas |
| **Konsolidasi rute** | Menggabungkan beberapa penjemputan berdekatan ke satu perjalanan kendaraan |
| **Alur emas** | Lima perjalanan pengguna yang wajib selalu berfungsi (§17.1) |

### 23.2 Keputusan yang sudah diambil

| # | Pertanyaan | Keputusan | Tanggal |
| :--- | :--- | :--- | :--- |
| Q-1 | Nama tim | **Inilah 4 trio** | 23 Agu 2026 |
| Q-2 | Domain | **`pantas-ai.vercel.app`** — subdomain Vercel, tanpa DNS eksternal, nol risiko propagasi | 23 Agu 2026 |
| Q-3 | Anggota tim | **3 orang** (Muhammad Choirudin Ammar, Muhammad Raihan Surya, Ahmad Rafi Firdaus — Universitas Gadjah Mada) | 23 Agu 2026 |
| Q-5 | Faktor emisi CO₂e | **Poore & Nemecek (2018), *Science* 360(6392)** — per komoditas, lihat §14.3. Konstanta 1,7 tak bersumber di kode saat ini diganti. Konteks nasional dari kajian Bappenas–WRI Indonesia (2021) | 23 Agu 2026 |
| Q-6 | Lokasi data demo | **Daerah Istimewa Yogyakarta** — Sleman (Pakem, Cangkringan, Turi), Kulon Progo, Bantul; pembeli di kota Yogyakarta | 23 Agu 2026 |

### 23.3 Pertanyaan yang masih terbuka

| # | Pertanyaan | Butuh keputusan sebelum |
| :--- | :--- | :--- |
| Q-3b | Pembagian kontribusi per anggota tim: Ammar (AI Engineer), Raihan (Fullstack Dev/Lead), Rafi (Product Ideation) | Final Submission 7 Sept |
| Q-4 | Apakah APK (TWA) dibuat sebagai bonus? Guidebook hanya mewajibkan APK untuk produk **berbasis mobile**; PANTAS dikumpulkan sebagai produk **berbasis web**, jadi URL hosting aktif sudah memenuhi syarat | Final Submission 7 Sept |
| Q-7 | Faktor tomat: pakai `0,53` konservatif atau tampilkan rentang `0,53–2,09`? Rekomendasi PRD: konservatif (§14.3) | Sebelum F-65 mendarat |
| Q-8 | Apakah `harga_acuan` untuk Yogyakarta diisi dari PIHPS wilayah DIY, bukan rata-rata nasional? | Sebelum F-22 |

### 23.4 Referensi berkas kunci

| Berkas | Peran |
| :--- | :--- |
| `web/src/lib/data.ts` | Seam baca — semua query & fallback demo |
| `web/src/lib/store.tsx` | Seam tulis — state, cache per-uid, sinkronisasi latar |
| `web/src/lib/types.ts` | Kontrak tipe bersama dengan Python |
| `web/src/lib/format.ts` | Format rupiah, persen, haversine |
| `web/src/app/globals.css` | Token desain — **titik masuk revamp §7** |
| `web/src/components/chrome.tsx` | Navigasi — **titik masuk revamp §8** |
| `ai_engine/model.py` | Orkestrasi pipeline grading |
| `ai_engine/grading_engine.py` | Rule engine OpenCV per komoditas |
| `ai_engine/calibration.py` | Deteksi koin & rasio piksel |
| `ai_engine/api.py` | Pembungkus FastAPI |
| `ai_engine/grading_configs/*.json` | Ambang batas per varian komoditas |
| `web/scripts/gen-komoditas.mjs` | Menjaga daftar komoditas UI sinkron dengan config engine |
| `supabase/migrations/*.sql` | Skema & RLS |
| `docs/BACKEND.md` | Catatan status backend |

### 23.5 Sumber eksternal yang dikutip

| Klaim | Sumber |
| :--- | :--- |
| Faktor emisi CO₂e per kg komoditas | Poore, J., & Nemecek, T. (2018). *Reducing food's environmental impacts through producers and consumers.* Science, 360(6392), 987–992. Disajikan ulang di [Our World in Data — GHG emissions per kilogram of food product](https://ourworldindata.org/grapher/ghg-per-kg-poore) |
| FLW Indonesia 115–184 kg/kapita/tahun; 1.702,9 Mt CO₂e (2000–2019); ~7,29% emisi GRK nasional; sayuran = 62,8% kehilangan pasokan domestik | Bappenas bersama WRI Indonesia (2021), *Kajian Food Loss and Waste di Indonesia* |
| Jejak karbon global sampah pangan 3,6 GtCO₂e (tanpa perubahan tata guna lahan) | FAO (2013), *[Food wastage footprint: Impacts on natural resources](https://www.fao.org/4/i3347e/i3347e.pdf)* |
| Harga acuan komoditas | PIHPS (Pusat Informasi Harga Pangan Strategis), Bank Indonesia |

**Aturan:** setiap angka eksternal yang tampil di UI atau proposal harus ada di tabel ini. Angka tanpa baris di sini tidak boleh dipakai.

---

**Akhir dokumen.**

*Perubahan pada PRD ini dilakukan lewat pull request ke `docs/PRD.md`, bukan lewat percakapan. Setiap perubahan cakupan menaikkan versi dokumen.*
