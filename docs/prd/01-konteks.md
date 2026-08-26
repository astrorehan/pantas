<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1–251.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Konteks — cara baca, ringkasan, lomba, masalah, persona, cakupan  
> Sumber: `docs/PRD.md` §baris 1–251
>
> [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Arsitektur sistem (as-built & target) →](./02-arsitektur.md)

<!-- PRD-SLICE-BEGIN -->
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

