# MATERI PRESENTASI PANTAS

> **Diverifikasi ulang terhadap kodebase** pada 13 Agustus 2026.
> Bagian **§4 Delta** berisi klaim proposal yang **sudah tidak akurat** — pakai angka di §3, bukan angka di PDF.

---

## 1. Identitas & Framing

| Item | Isi |
| :--- | :--- |
| Nama produk | **PANTAS** — Platform Sistem Sortasi Sayur Cerdas & Marketplace Hortikultura |
| Tim | **Inilah 4 trio** — Universitas Gadjah Mada, Teknologi Informasi, Fakultas Teknik (3 orang) |
| Subtema | Ketahanan Pangan dan Pertanian Cerdas (HOLOGY 9.0 HoloDev) |
| Repo | https://github.com/astrorehan/pantas.git |
| Demo | https://pantas-ai.vercel.app/ (halaman `/demo` = masuk 1-tap, tanpa mengetik) |
| Akun demo | `petani@demo.pantas.id` / `pembeli@demo.pantas.id` / `admin@demo.pantas.id` — semua `demo1234`; data reset otomatis tiap 6 jam, ditandai `is_demo` |

**Anggota & kontribusi**

| Nama & NIM | Peran | Kontribusi |
| :--- | :--- | :--- |
| Muhammad Choirudin Ammar · 25/556251/TK/62735 | AI Engineer | Pipeline AI dua tahap (YOLOv11 segmentasi & klasifikasi), grading rule engine berbasis geometri, kalibrasi ukuran, evaluasi akurasi per komoditas |
| Muhammad Raihan Surya · 25/560713/TK/63338 | Fullstack Developer | Aplikasi web end-to-end (Next.js + Supabase), integrasi AI Engine ke antarmuka, alur petani–pembeli menyeluruh |
| Ahmad Rafi Firdaus · 25/560526/TK/63314 | Konseptor / Product Ideation | Ide dasar produk, keselarasan solusi dengan masalah riil petani & subtema, user journey petani dan pembeli |

**Kalimat pitch (1 slide, 1 napas):**
> Mutu panen hortikultura hari ini dinilai dengan mata telanjang. PANTAS mengubahnya jadi pengukuran: foto + koin Rp500, dua tahap YOLOv11 + rule engine geometri, keluar komposisi Grade A/B/C/REJECT dengan alasan yang bisa dibaca manusia dan hash SHA-256 yang bisa diaudit siapa pun — lalu dari komposisi itu lahir harga wajar, listing, logistik terkonsolidasi, dan serah terima terverifikasi.

---

## 2. Materi Naratif per Bab (siap dipotong jadi slide)

### 2.1 Masalah (BAB I)

Angka pembuka — **semua ada rujukannya, jangan diubah**:

- Kehilangan hasil panen hortikultura **40–60%**; penyebab utama disebut eksplisit: penanganan pascapanen lemah, **sortir (grading) tidak standar**, penyimpanan tanpa kendali suhu, pengeringan tidak memadai.
- Kajian *Food Loss and Waste Indonesia* (2021 — Bappenas × Waste4Change × WRI): kerugian ekonomi **Rp106–205 triliun/tahun**.
- FAO (2023): food loss Indonesia **±12 juta ton/tahun**; global, **±14%** pangan hilang sebelum sampai pasar di negara berkembang.
- Kajian yang sama: **sayuran = penyumbang kehilangan terbesar, 62,8%** dari total pasokan sayuran domestik. ← ini kartu truf slide masalah.

**Lima persoalan berulang** (bagus jadi 5 ikon sejajar):

1. **Mutu dinilai dengan mata, bukan ukuran.** Tengkulak menaksir grade sekilas; petani tidak punya alat bantah. Selisih satu tingkat grade pada cabai = selisih signifikan per kilogram.
2. **Asimetri informasi harga.** Petani tahu harga di tingkat petani, tidak tahu harga acuan pasar hari itu, dan tidak punya cara menghubungkan mutu ke harga secara kuantitatif.
3. **Grade rendah dibuang, bukan dialihkan.** Panen di bawah standar pasar segar dibiarkan membusuk, padahal industri olahan (saus, keripik, pakan) menerimanya dengan harga tetap positif. Food loss murni karena ketiadaan kanal.
4. **Logistik terfragmentasi.** Petani kecil mengirim sendiri-sendiri, ongkos per kilogram membengkak, sebagian rusak di jalan tanpa rantai dingin.
5. **Pembeli tidak bisa memverifikasi klaim mutu.** Tanpa bukti yang dapat diaudit, pembeli mendiskon harga sebagai asuransi risiko — diskonnya ditanggung petani.

### 2.2 Tujuan (BAB I)

- Penilaian mutu (cabai, tomat, timun, wortel) objektif & konsisten berbasis computer vision, pengganti taksiran visual.
- Menjembatani asimetri harga lewat rekomendasi harga wajar yang **rumusnya transparan**.
- Membuka kanal pasar untuk grade B/C langsung ke pembeli industri.
- Ketertelusuran yang **dapat diaudit publik** — klaim mutu diverifikasi tanpa saling percaya buta.
- Efisiensi logistik lewat konsolidasi rute penjemputan multi-petani.

### 2.3 Pemetaan ke subtema (BAB III) — slide "kenapa kami cocok"

| Sasaran Guidebook | Realisasi di PANTAS |
| :--- | :--- |
| Efisiensi rantai pasok | Konsolidasi rute penjemputan multi-petani; pencocokan pembeli terdekat berbasis geolokasi |
| Transparansi distribusi | Timeline status pesanan; halaman pelacakan publik `/lacak/[hash]` dengan hash audit SHA-256 |
| Kualitas produk | Grading objektif dua tahap dengan kalibrasi ukuran nyata memakai koin Rp500 |
| Keamanan produk | Deteksi busuk/penyakit sebagai **mekanisme veto** di tahap klasifikasi + checklist rantai dingin saat logistik |

### 2.4 Fitur per peran (BAB III)

**Petani** — pindai berkalibrasi koin Rp500 dengan laporan foto beranotasi & alasan grade yang bisa dibaca manusia; riwayat pemindaian; auto-listing ke marketplace begitu hasil keluar, lengkap rentang harga wajar + simulasi "bagaimana jika"; manajemen pesanan masuk, chat dalam aplikasi, serah terima terverifikasi kode; penjadwalan penjemputan + estimasi ongkos angkut berdasar jarak & berat; dashboard dampak pribadi (kg terselamatkan, estimasi CO2e dicegah); profil (luas lahan, komoditas, sertifikasi GAP/organik).

**Pembeli industri** — katalog & pencarian dengan filter, pencarian suara, urut jarak; detail listing (galeri foto, laporan mutu tertaut ke halaman pelacakan publik, profil petani, peta); alur **inquiry → penawaran → pesanan** + chat; bandingkan beberapa listing berdampingan; peta harga sentra hortikultura; rating & ulasan pasca-transaksi; akses halaman pelacakan publik + hash SHA-256 untuk verifikasi sebelum maupun sesudah membeli.

**Admin/Koperasi** — dashboard agregat (GMV, status pesanan platform, dampak keberlanjutan menyeluruh); konsolidasi rute multi-petani dengan kalkulasi nearest-neighbour, estimasi hemat bahan bakar & CO2e dicegah; panel kesehatan AI Engine (status & latensi FastAPI real-time).

**AI Grading Engine** — dual-stage YOLOv11 (YOLO-1 segmentasi/auto-masking, YOLO-2 klasifikasi kesehatan sebagai veto); rule engine berbasis konfigurasi JSON yang menghitung geometri (panjang, rasio, circularity, solidity) untuk Grade A/B/C/REJECT secara **explainable**; kalibrasi koin Rp500 tanpa perangkat tambahan; estimasi berat batch dari luas terkalibrasi × faktor densitas; hash audit SHA-256 sebagai fondasi ketertelusuran publik.

### 2.5 Manfaat & dampak (BAB IV)

- **Petani** — alat penilaian objektif; dasar tawar-menawar berbasis data; pendapatan dari grade B/C yang sebelumnya berisiko dibuang.
- **Pembeli** — kepastian mutu yang dapat diverifikasi lewat pelacakan publik + hash, mengurangi kebutuhan mendiskon harga sebagai asuransi risiko; checklist rantai dingin & konsolidasi logistik menopang keamanan produk.
- **Lingkungan** — bekerja tepat di kategori komoditas dengan food loss tertinggi (sayuran, 62,8%); dashboard dampak menghitung estimasi CO2e dicegah memakai faktor emisi per komoditas dari **Poore & Nemecek (2018), *Science***. WRI (2023): rantai pasok berbasis data dapat menurunkan kehilangan pangan **10–20%**.
- **Ekosistem** — proof of concept bahwa dual-stage CV + rule engine geometri bisa dipakai menilai mutu komoditas segar dengan akurasi tinggi, dan berpotensi direplikasi ke komoditas hortikultura lain.
- **Pembanding** — TaniHub & RegoPantes membuktikan digitalisasi membuka akses pasar; PANTAS menambah lapisan **penilaian mutu otomatis berbasis computer vision** yang belum ada di platform-platform tersebut.

### 2.6 Tahapan pengembangan (BAB VI)

1. **Riset & perumusan** — lima persoalan inti → tesis produk → **12 epic (EP-A … EP-L)**: onboarding, grading AI, harga, marketplace, pesanan, logistik, ketertelusuran, dampak, akun, publik, admin, platform.
2. **Perancangan data & arsitektur** — skema Supabase inkremental lewat berkas migrasi bernomor: skema inti → security hardening → fitur P0 → skema P1 (chat, rating, coachmark) → kalibrasi berat & ulasan → konsol admin & audit peristiwa.
3. **AI Engine dua tahap** — dataset lewat `ai_engine/scrape_dataset.py` + kurasi manual, dipisah jadi dataset segmentasi (YOLO-1) dan dataset klasifikasi hasil auto-masking latar putih (`ai_engine/prepare_dataset.py`); model dilatih terpisah per komoditas; digabung lewat `ai_engine/grading_engine.py`. Stabilitas dijaga set regresi otomatis `ai_engine/test_regresi_grading.py`.
4. **Aplikasi web** — Next.js di atas dua seam arsitektur: `src/lib/data.ts` untuk **seluruh pembacaan** (fallback otomatis ke data demo bila Supabase belum dikonfigurasi) dan `src/lib/store.tsx` untuk **seluruh penulisan** — aplikasi jalan penuh dalam mode demo tanpa satu pun environment variable. AI Engine masuk lewat `POST /predict` dari alur pindai kamera.
5. **Pengujian & audit** — audit kesesuaian kodebase vs PRD (`docs/GAP_ANALYSIS.md`) per epic (ADA / SEBAGIAN / MISSING); pytest (AI Engine), vitest (frontend), TypeScript, lint, Lighthouse CI (`web/lighthouserc.cjs`).
6. **Peluncuran & demo** — web di Vercel, AI Engine dikemas Docker; tiga akun demo agar juri mencoba seluruh alur tanpa registrasi.

### 2.7 Kendala — **ini justru kekuatan naratifnya** (BAB VII)

1. **Ketimpangan dataset antar-komoditas.** Cabai ±6.675 gambar, tomat ±9.790, timun ±1.250, wortel ±788. Dampaknya terukur: recall wortel 78,1% vs cabai 94,5%.
2. **Kegagalan model tunggal di awal.** Satu model untuk empat komoditas → halusinasi antar-kelas (tomat ditebak cabai) + `CUDA out of memory` di atas 50.000 gambar latih. Solusi: empat model spesialis single-class per komoditas — dua masalah hilang sekaligus, tiap model lebih fokus & ringan.
3. **Keterbatasan validasi kalibrasi ukuran.** `AutoCalibrator` belum punya uji kelayakan koin; pada foto tanpa koin ia bisa memilih blob bulat lain sebagai acuan. Diungkap terbuka sebagai `xfail` beralasan di set regresi. **→ status ini sudah berubah, baca §4.**

---

## 3. Angka & Fakta Terverifikasi (pakai ini di slide)

### 3.1 Rapor model — YOLO-1 (segmentasi, mask)

| Komoditas | Precision | Recall | mAP50 (Mask) | Status |
| :--- | ---: | ---: | ---: | :--- |
| Cabai | 97,8% | 94,5% | 97,4% | Sangat tajam (Epoch 40) |
| Timun | 95,9% | 89,8% | 96,0% | Sangat tajam (Epoch 100) |
| Tomat | 94,5% | 84,5% | 90,3% | Sangat baik (Epoch 100) |
| Wortel | 91,1% | 78,1% | 87,4% | Sangat bagus (Epoch 100) |

### 3.2 Rapor model — YOLO-2 (klasifikasi sehat/busuk)

Evaluasi terakhir, rata-rata makro dua kelas. Angka digenerate `ai_engine/eval_yolo2_cls.py` → `metrik_yolo2.json` → `web/src/lib/metrik-model.generated.ts`; situs **tidak bisa** mengutip angka berbeda dari hasil evaluasi.

| Komoditas | Bobot | Potongan validasi | Akurasi | F1 makro | Catatan wajib ikut tampil |
| :--- | :--- | ---: | ---: | ---: | :--- |
| Timun | `cucumber_cls.pt` (3,0 MB) | 112 | 98,2% | 0,982 | Split paling bersih — 5 dari 112 gambar sumber beririsan |
| Tomat | `tomato_cls.pt` (3,0 MB) | 200 | 97,5% | 0,975 | Stabil |
| Wortel | `carrot_cls.pt` (3,0 MB) | 110 | 100,0% | 1,000 | ⚠ **optimistis** — 73 dari 85 gambar sumber validasi juga muncul di sisi latih |
| Cabai | `chili_cls.pt` (3,0 MB) | 16 | 81,3% | 0,812 | Veto berjalan; set validasi terlalu kecil untuk diklaim |

**Kalimat yang dipakai untuk wortel** (jangan tulis "100%" telanjang di slide mana pun):
> "100,0% dari 110 potongan, 73 dari 85 sumbernya beririsan dengan latih."

### 3.3 Dataset

| Komoditas | Dataset YOLO-1 (segmentasi) |
| :--- | ---: |
| Tomat | ±9.790 gambar |
| Cabai | 6.675 gambar |
| Timun | ±1.250 gambar |
| Wortel | ±788 gambar |

Dataset YOLO-2 cabai: 313 gambar crop ketat (150 sehat / 163 busuk). Komoditas lain memakai auto-masking latar putih.

### 3.4 Skala kodebase (per 13 Agustus 2026)

| Metrik | Nilai | Sumber |
| :--- | :--- | :--- |
| Fitur berkode F-ID | **72** (bukan 69) | `docs/BACKLOG.md` |
| Selesai | **67/72 (93%)** | `docs/BACKLOG.md` |
| P0 | 37/38 | idem |
| P1 | 26/26 | idem |
| P2 | 4/8 | idem |
| Baris PRD | **2.014–2.015 baris** | `docs/PRD.md` |
| Epic | 12 (EP-A … EP-L) | `docs/prd/epics/` |
| Migrasi Supabase | **16 berkas** (`0001_init` … `0016_audit_peristiwa_inti`) | `supabase/migrations/` |
| Varian komoditas | 11 berkas config di `ai_engine/grading_configs/` (4 komoditas dasar) | folder tersebut |

### 3.5 Stack teknologi (versi nyata di `web/package.json`)

| Lapisan | Teknologi |
| :--- | :--- |
| Frontend | Next.js **16.2.10** (App Router), React **19.2.4**, Tailwind CSS v4, **next-intl 4.13** (bilingual ID/EN), Leaflet + react-leaflet, lucide-react, sonner (toast), qrcode, PWA |
| Backend & Data | Supabase — Postgres, Auth email+password, Storage, **RLS di seluruh tabel**, Realtime untuk chat & pesanan |
| AI Engine | FastAPI (Python) membungkus `PantasModel` YOLOv11 (Ultralytics) untuk segmentasi & klasifikasi, OpenCV untuk kalibrasi geometri & rule engine, dikemas Docker |
| Infrastruktur | Vercel (hosting web + cron harga acuan `0 22 * * *`), Hugging Face Spaces (Docker port 7860) untuk layanan AI, GitHub Actions (CI + reset demo), Supabase ap-southeast-1 |
| QA | vitest + fast-check (property test), pytest, TypeScript `--noEmit`, ESLint, Playwright 5 alur emas, Lighthouse CI, axe, cek anggaran bundle |

---

## 4. ⚠️ Delta — Klaim Proposal yang Sudah Tidak Akurat

Proposal disusun sebelum beberapa PR mendarat. Yang berikut **harus diperbaiki di slide**.

| # | Klaim di proposal | Kondisi sekarang | Sumber |
| :--- | :--- | :--- | :--- |
| 1 | "62 dari 69 fitur (90%) selesai", "kisaran 92%–95% kesiapan" | **67 dari 72 fitur (93%)**. P0 37/38, P1 26/26, P2 4/8. 5 fitur bertanda 🔍 belum diaudit | `docs/BACKLOG.md` |
| 2 | "PRD ±1.897 baris" | **2.014 baris** (README & BACKLOG menyebut 2.015) | `docs/PRD.md` |
| 3 | "11 berkas migrasi Supabase (0001 … 0011)" | **16 berkas**, sampai `0016_audit_peristiwa_inti.sql`. Tambahan sesudahnya: pesan tak bisa ditulis ulang (0012), pesanan realtime & alur maju (0013), hapus riwayat grading (0014), **konsol admin (0015)**, **audit peristiwa inti (0016)** | `supabase/migrations/` |
| 4 | **BAB V:** "model klasifikasi (YOLO-2) cabai masih berstatus dalam proses pelatihan" | **Sudah selesai.** `chili_cls.pt` ada, `model.py` memuatnya tanpa pengecualian komoditas — veto patologi cabai **aktif**. Keterbatasan yang benar: set validasinya hanya **16 potongan**, cukup untuk regresi tapi tidak cukup untuk mengklaim akurasi | `docs/prd/07-ai-engine.md` |
| 5 | **BAB V & VII:** "penambahan uji kelayakan koin pada AutoCalibrator" sebagai rencana jangka pendek / kendala terbuka | **Sudah ditutup di hilir (F-108, selesai).** `ai_engine/plausibilitas.py` membandingkan **median** luas objek terhadap rentang fisik per komoditas dan **menolak seluruh fotonya** bila di luar rentang — bukan sekadar mengosongkan berat. Yang **masih** terbuka dan boleh disebut: koin palsu yang kebetulan menghasilkan skala wajar tetap lolos; `calibration.py` sendiri belum sembuh, dan `xfail`-nya masih berdiri | `ai_engine/plausibilitas.py`, `docs/AI_ENGINE.md` |
| 6 | Tabel YOLO-2 wortel: "100,0% — **Sempurna** ✅" | Angka benar, **labelnya salah**. Investigasi F-107 (selesai) mengonfirmasi **kebocoran data**: split dibagi per potongan objek, bukan per gambar sumber, sehingga 73 dari 85 gambar sumber validasi juga muncul di sisi latih. Kelas seimbang persis 55/55, jadi bukan itu penyebabnya. Skor wortel **dan** tomat harus dibaca sebagai **batas atas**. Utang v1.1: split ulang per gambar sumber lalu evaluasi ulang | `docs/prd/07-ai-engine.md` |
| 7 | "mAP50 87,4%–97,4% pada empat komoditas" (BAB IV) | Angkanya benar, tapi jangan dicampur dengan klaim README "akurasi validasi 96%–100%" — README itu sendiri sudah usang terhadap tabel YOLO-2 (cabai 81,3%) | `docs/AI_ENGINE.md` |
| 8 | Infrastruktur: "**Self-Hosted Local Server** (AI Engine)" | Topologi resmi: **Hugging Face Spaces (Docker, port 7860)**, dengan warm-keeper wajib karena free tier tidur setelah 48 jam idle. Tanpa `NEXT_PUBLIC_PREDICT_URL`, aplikasi jatuh ke mode demo — bukan mati | `docs/prd/10-deployment.md`, `web/.env.example` |
| 9 | "4 komoditas" saja | Di atas 4 model dasar berdiri **11 berkas config varian** (rawit, merah keriting, merah besar, hijau besar; ceri, beef, merah, sayur; timun lokal & baby; wortel). Daftar di UI digenerate dari folder itu, jadi tidak mungkin menyimpang dari kemampuan engine | `ai_engine/grading_configs/`, `komoditas.generated.ts` |
| 10 | GAP_ANALYSIS lama dipakai sebagai status terkini | Dokumen itu **snapshot lama**, sudah tertinggal 2+ minggu dan dua PR besar. Kalau perlu status, kutip `docs/BACKLOG.md` (digenerate otomatis), bukan GAP_ANALYSIS | — |
| 11 | Reset data demo "secara berkala" | Spesifik: **tiap 6 jam**, ditandai `is_demo` di basis data sehingga tidak mencemari statistik platform. Penjadwalannya di GitHub Actions (`reset-demo.yml`), karena Vercel Hobby membatasi cron | `README.md`, `web/.env.example` |
| 12 | Kendala #3 dibingkai murni sebagai kelemahan | Bingkai ulang jadi **kasus nyata + penanganan**: pindaian produksi 10 Agustus 2026 menghasilkan dua tomat @151.295 mm², 11,86 kg berdua, komposisi A 100%, dengan `kalibrasi.valid = true` di sebelahnya. Skala menggelembung 12× menaikkan tiap objek melewati ambang Grade A. Gerbang plausibilitas lahir dari kejadian itu | `docs/prd/07-ai-engine.md` |

---

## 5. Materi Baru — Belum Ada di Proposal, Layak Masuk Slide

Semua sudah mendarat di `main`.

1. **Bilingual penuh sampai render server (F-112).** ID/EN lewat `next-intl`, pilihan bahasa disimpan di cookie `pantas-locale` agar komponen server membacanya sebelum render. Bug yang diperbaiki konkret: `/lacak/[hash]` dulu merender badan halaman dalam Indonesia sementara header & footer ikut Inggris — satu halaman dua bahasa. Nilai jual untuk juri internasional.
2. **Konsol operator/admin (migrasi 0015).** Halaman `admin/audit` (log audit) dan `admin/moderasi` (moderasi listing), ditambah `ringkasan-platform.tsx` untuk agregat GMV & dampak.
3. **Audit peristiwa inti (migrasi 0016) + siklus hidup rute & jejak audit (F-109).** Aksi penting terekam, bukan hanya hasil grading.
4. **Gerbang plausibilitas skala (F-108)** — lihat §4 baris 5. Ini fitur paling "bercerita": ditemukan oleh set regresi sendiri, dari insiden produksi nyata, ditutup di hilir, sisa utangnya dinyatakan terbuka.
5. **Kejujuran metodologis sebagai posisi produk.** Kutipan PRD yang bisa dipakai verbatim di slide penutup: *"PANTAS melaporkan angka apa adanya beserta konteksnya. Kejujuran metodologis adalah nilai jual, bukan kelemahan."* Kartu model (F-15) membaca berkas metrik yang digenerate, sehingga **angka dan keterbatasannya tidak bisa berpisah** — halaman `/tentang/model` menampilkan keduanya bersamaan.
6. **Pesan tidak bisa ditulis ulang (migrasi 0012)** — chat sebagai catatan, bukan sekadar UI.
7. **Estimasi berat punya loop kalibrasi nyata.** View `densitas_kalibrasi_view` memasangkan luas terkalibrasi tiap laporan dengan berat timbangan pesanannya; `calibrate_density.py` menghitung median gram/mm² dan menulis ulang `densitas_faktor.json`. Selama `n_sampel` masih 0, kartu di aplikasi menyatakan "belum tervalidasi timbangan" — tidak menyamar sebagai hasil lapangan. Tiga aturan tegas: selalu rentang bukan satu angka; tanpa kalibrasi koin tidak ada estimasi; estimasi tidak pernah menggantikan timbangan (`orders.berat_aktual_kg` yang mengikat transaksi).
8. **Rentang plausibilitas per komoditas** (bagus jadi tabel visual):

| Komoditas | Rentang luas satu buah (mm²) | Acuan |
| :--- | :--- | :--- |
| Tomat | 100 – 12.000 | ceri Ø15 mm (177) … beef Ø100 mm (7.854) |
| Cabai | 30 – 5.000 | rawit 25×6 mm (150) … keriting 140×15 mm (2.100) |
| Wortel | 500 – 20.000 | 120×30 mm (3.600) … 250×50 mm (12.500) |
| Timun | 800 – 30.000 | 180×40 mm (7.200) … 350×60 mm (21.000) |

Tiga sifat yang disengaja: rentang **longgar** (2–3× lebih lebar dari ukuran pasar — sasarannya galat orde besaran, bukan panen yang kebetulan besar); **median bukan rata-rata**; komoditas tanpa rentang **tidak pernah ditolak** dan payload berbunyi `diperiksa: false` alih-alih mengaku sudah memeriksa.

9. **Set regresi grading, apa adanya (F-100).** Cakupannya baru **11 dari 40 foto** — hanya cabai lengkap (10 frame split test YOLO-1 yang belum pernah dilatih), tomat satu foto adegan, wortel & timun nol. Kekurangan itu dilaporkan sebagai **skip beralasan** di keluaran pytest, bukan disembunyikan. Labelnya `baseline`, bukan `manual`: set ini mendeteksi **perubahan**, bukan membuktikan **akurasi**.

---

## 6. Peta Jalan (BAB V — masih valid)

**Jangka pendek (AI):**
- Perbesar set validasi cabai (16 potongan terlalu kecil untuk klaim akurasi).
- Split ulang YOLO-2 **per gambar sumber**, bukan per potongan objek, lalu evaluasi ulang wortel & tomat.
- Tambah data latih wortel (dataset terkecil ±788 gambar, recall terendah 78,1%).
- Sembuhkan `calibration.py` sendiri — uji kelayakan koin di hulu, bukan hanya gerbang plausibilitas di hilir.

**Pasca-kompetisi:**

| Horizon | Rencana |
| :--- | :--- |
| v2.0 | Payment gateway dengan escrow; APK lewat Trusted Web Activity; integrasi otomatis feed harga PIHPS; multi-tenant koperasi |
| v2.5 | Model komoditas tambahan (bawang, kentang, kubis — dataset sudah sebagian ada); estimasi berat terkalibrasi data lapangan; prediksi umur simpan |
| v3.0 | Kontrak forward (pembeli memesan sebelum musim tanam); skor kredit petani berbasis riwayat mutu; API terbuka untuk pembeli industri besar |

---

## 7. Brief Desain (untuk pembuatan slide)

### 7.1 Prinsip visual — diambil dari design system produk agar deck & aplikasi satu bahasa

- **Berbukti (evidential).** Data tampil sebagai bukti: foto beranotasi, angka dengan sumber, hash yang bisa disalin. **Estetika laporan laboratorium, bukan estetika iklan.**
- **Lapang.** Hirarki tipografi tegas, ruang putih berani.
- **Anti-pola yang dilarang** (berlaku juga untuk slide): gradient mesh dekoratif, glassmorphism, ilustrasi 3D stok, emoji sebagai ikon, drop shadow ungu, kartu ber-radius > 20px.

### 7.2 Palet

```
Brand hijau   green-500  #40916c   ← warna utama
              green-600  #2d6a4f   green-700 #1b4332  green-300 #7fc3a1  green-50 #eef7f2
Aksen tanah   clay-500   #b4783a   clay-300 #e2b27c   clay-50  #fdf6ee
Netral hangat stone-50   #faf9f7   stone-200 #e6e3de  stone-600 #57534e  stone-900 #171614
              (netral HANGAT, bukan abu-abu kebiruan)

Semantik grade — WAJIB konsisten dengan output ai_engine, jangan diganti:
  Grade A  #2d6a4f      Grade B  #b4783a
  Grade C  #2563eb      REJECT   #a01f1f
```

Radius: 4 / 6 / 10 / 14 / 20 px. Bayangan halus (`0 2px 8px rgb(0 0 0 / 0.06)`), bukan bayangan tebal.

### 7.3 Tipografi

| Peran | Font |
| :--- | :--- |
| Display / judul slide / angka besar | **Bricolage Grotesque** (variable, OFL) — bobot 800, tracking −0.02em s.d. −0.03em |
| Body / teks UI | **Inter** (variable) |
| Hash, kode, angka teknis | **JetBrains Mono** — pakai ini setiap kali menampilkan hash SHA-256 atau `area_mm²`, supaya artefak audit terbaca beda dari teks biasa |

### 7.4 Aset visual yang perlu disiapkan

1. **Diagram alur end-to-end** (paling penting, 1 slide penuh):
   `[Foto + koin Rp500] → [YOLO-1 Segmentasi & Auto-Masking] → [YOLO-2 Klasifikasi Penyakit (veto)] → [Rule Engine JSON: geometri + gerbang plausibilitas] → [Grade A/B/C/REJECT + hash SHA-256] → [Harga wajar → Listing → Logistik → Serah terima]`
2. **Before/after auto-masking** — foto mentah vs latar putih bersih. Menjelaskan kenapa dua tahap lebih baik daripada satu.
3. **Screenshot produk** (ambil dari akun demo): layar Pindai petani, layar Hasil dengan foto beranotasi + tabel objek, halaman `/lacak/[hash]` dengan hash & QR, katalog pembeli + peta harga sentra, konsol admin (rute konsolidasi + panel kesehatan AI).
4. **Kartu insiden kalibrasi** — visualisasi "dua tomat @151.295 mm², 11,86 kg, A 100%, `kalibrasi.valid = true`" lalu gerbang plausibilitas menolaknya. Ini slide kendala yang menjual.
5. **Grafik batang rapor model** — pakai empat warna grade sebagai palet kategori; sertakan ukuran set validasi sebagai label kecil di tiap batang (jangan pisahkan angka dari konteksnya).
6. **Ikon lima persoalan** — garis tunggal, satu palet, tema pertanian (konsisten dengan gaya ilustrasi produk).

### 7.5 Struktur slide usulan (±14 slide)

| # | Slide | Isi inti |
| ---: | :--- | :--- |
| 1 | Judul | PANTAS · Inilah 4 trio · UGM · Ketahanan Pangan dan Pertanian Cerdas |
| 2 | Masalah dalam angka | 40–60% · Rp106–205 T · 62,8% sayuran |
| 3 | Lima persoalan | 5 ikon + satu kalimat masing-masing |
| 4 | Solusi dalam satu kalimat | Pitch di §1 |
| 5 | Cara kerja | Diagram alur end-to-end |
| 6 | Kenapa dua tahap | Before/after masking + kegagalan model tunggal (halusinasi + CUDA OOM) |
| 7 | Grading yang bisa dijelaskan | Rule engine JSON, geometri, contoh alasan grade |
| 8 | Bukti yang bisa diaudit | Hash SHA-256 + `/lacak/[hash]` + QR |
| 9 | Dari mutu ke harga & pasar | Harga wajar transparan, kanal grade B/C, marketplace |
| 10 | Logistik & dampak | Konsolidasi rute nearest-neighbour, hemat BBM, CO2e (Poore & Nemecek 2018) |
| 11 | Rapor model apa adanya | Tabel §3.1 & §3.2 **beserta** catatan kebocoran & ukuran split |
| 12 | Kendala & penanganannya | Ketimpangan dataset · model tunggal gagal · insiden kalibrasi → gerbang plausibilitas |
| 13 | Kesiapan & peta jalan | 67/72 fitur (93%) · v2.0 / v2.5 / v3.0 |
| 14 | Penutup | "Kejujuran metodologis adalah nilai jual, bukan kelemahan." + tautan demo & akun |

### 7.6 Aturan angka di deck — jangan dilanggar

- Setiap metrik model tampil **bersama ukuran set validasinya**.
- Wortel tidak pernah ditulis "100% ✅ Sempurna".
- Klaim kesiapan pakai **67/72 (93%)**, sumber `docs/BACKLOG.md`, bukan 62/69.
- Estimasi berat selalu disebut **rentang** dan selalu disertai "tidak menggantikan timbangan".
- Cabai YOLO-2 **bukan** "masih dilatih" — sebut "veto aktif, set validasi 16 potongan".

---

## 8. Daftar Pustaka (bawa ke slide sumber)

- Bappenas & World Resources Institute (WRI) Indonesia. (2021). *Kajian Food Loss and Waste di Indonesia*.
- Direktorat Jenderal Hortikultura, Kementerian Pertanian RI. (t.t.). *Seberapa Pentingkah Kerugian akibat Penyakit Pasca Panen pada Komoditas Hortikultura*. hortikultura.pertanian.go.id.
- Poore, J., & Nemecek, T. (2018). Reducing food's environmental impacts through producers and consumers. *Science*, 360(6392), 987–992.
- FAO (2023) — data food loss Indonesia & global.
- World Resources Institute (2023) — rantai pasok berbasis data menurunkan kehilangan pangan 10–20%.
