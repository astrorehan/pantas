# 🧠 PANTAS AI Engine — Dokumentasi Teknis & Laporan Model

Dokumen ini berisi spesifikasi teknis mendalam mengenai **AI Grading Engine** pada sistem PANTAS, mencakup arsitektur Dual-Stage YOLOv11, mesin aturan (Rule Engine), metrik rapor akurasi model, serta struktur dataset training.

---

## 🚀 Arsitektur Dual-Stage YOLO + Rule Engine

Untuk mengatasi masalah bias latar belakang (seperti tekstur meja, bayangan, atau warna tangan) dan mencapai akurasi tingkat industri, arsitektur sistem PANTAS menggunakan pendekatan **Dua Tahap (Dual-Stage)** dipadukan dengan **Mesin Sortasi (Grading Engine)** berbasis aturan.

```
[Gambar Mentah] ➡️ [YOLO 1: Segmentation & Masking] ➡️ [YOLO 2: Classification] ➡️ [Grading Engine (JSON)] ➡️ [Grade Akhir]
```

### 1. YOLO 1 (Instance Segmentation) — Sang Pemotong
Tugas model ini hanyalah mengenali bentuk asli komoditas dan "mengguntingnya" (*masking*) dari lingkungan sekitarnya. Seluruh latar belakang diubah menjadi putih bersih (*auto-masking*).
- Menghilangkan *noise* (bayangan, tangan, meja).
- Memungkinkan perhitungan geometri yang presisi (panjang, rasio, tingkat kebulatan/*circularity*, *solidity*, dan keparahan cacat).

### 2. YOLO 2 (Classification) — Sang Pendeteksi Penyakit
Tugas model ini adalah menganalisa gambar yang sudah dipotong dan dibersihkan oleh YOLO 1 untuk mendeteksi penyakit/pembusukan pada kulit luar komoditas. Model ini sangat fokus pada tekstur permukaan buah/sayur.

### 3. Grading Engine (JSON Rule-Based) — Sang Pengambil Keputusan
Keputusan akhir (*Grade A, B, C, REJECT*) tidak diambil secara acak oleh AI. Kami menggunakan mesin aturan (berbasis file konfigurasi JSON di `ai_engine/grading_configs/`) untuk menggabungkan hasil prediksi AI dengan pengukuran geometri secara dinamis. Contoh aturan:
- Jika `sehat` namun ukuran terlalu kecil ➡️ **Grade B**
- Jika `sehat` dan lonjong/bulat sempurna ➡️ **Grade A**
- Jika luasan bercak / pembusukan (dari YOLO 2) melebihi batas toleransi ➡️ **REJECT**

---

## 📊 Rapor Akurasi Model AI

Karena sistem PANTAS menggunakan dua otak AI yang berbeda, evaluasinya terbagi menjadi dua bagian:

### 1. Rapor Akurasi YOLO 1 (Segmentasi Poligon)
Model pemotong (*masking*) dievaluasi berdasarkan kemampuannya mengenali lekuk luar buah (*Precision*, *Recall*, dan *mAP50 Mask*).

| Komoditas | Precision | Recall | mAP50 (Mask) | Status / Epoch |
| :--- | :--- | :--- | :--- | :--- |
| **Cabai (Chili)** | **97,8%** | **94,5%** | **97,4%** | Sangat Tajam (Epoch 40) ✅ |
| **Timun (Cucumber)** | **95,9%** | **89,8%** | **96,0%** | Sangat Tajam (Epoch 100) ✅ |
| **Tomat (Tomato)** | **94,5%** | **84,5%** | **90,3%** | Sangat Baik (Epoch 100) ✅ |
| **Wortel (Carrot)** | **91,1%** | **78,1%** | **87,4%** | Sangat Bagus (Epoch 100) ✅ |

### 2. Rapor Akurasi YOLO 2 (Klasifikasi Penyakit & Mutu)
Model klasifikasi ini dilatih menggunakan dataset yang sudah melalui proses "cuci bersih" (latar putih), menghasilkan akurasi tinggi tanpa *overfitting*. Metrik ini sekarang dihasilkan secara otomatis melalui `ai_engine/eval_yolo2_cls.py`.

| Komoditas | Akurasi Validasi | F1-Score | Kondisi | Status Model |
| :--- | :--- | :--- | :--- | :--- |
| **Cabai (Chili)** | **81,3%** | **81,2%** | Latar Putih Bersih | Cukup (Dataset masih terbatas) |
| **Tomat (Tomato)** | **97,5%** | **97,5%** | Latar Putih Bersih | Sangat Stabil ✅ |
| **Timun (Cucumber)** | **98,2%** | **98,2%** | Latar Putih Bersih | Sangat Stabil ✅ |
| **Wortel (Carrot)** | **100,0%** | **100,0%** | Latar Putih Bersih | Sempurna ✅ |

---

## 📂 Rekapitulasi Dataset (Data Training)

Sistem ini menggunakan dua himpunan data terpisah untuk melatih kedua otaknya:

### 1. Dataset YOLO 1 (Segmentasi Poligon)
Dataset ini murni ditujukan agar AI bisa mengenali dan menggunting bentuk sayuran. Semua kelas varietas turunan telah **dilebur menjadi 1 kelas tunggal** (contoh: *banana pepper* & *bird-s eye chili* dilebur menjadi kelas `0: chili`) agar AI fokus pada deteksi bentuk buah.
- **Cabai (Chili):** 6.675 gambar poligon (Penggabungan dataset lama & baru)
- **Tomat (Tomato):** ~9.790 gambar poligon
- **Timun (Cucumber):** ~1.250 gambar poligon
- **Wortel (Carrot):** ~788 gambar poligon

### 2. Dataset YOLO 2 (Klasifikasi Sehat vs Busuk)
Dataset ini dipotong (*crop*) secara ketat dan difilter agar hanya berisi area kulit komoditas untuk mendeteksi pembusukan/penyakit.
- **Cabai (Chili):** 313 gambar (*crop* ketat: 150 sehat, 163 busuk)
- **Komoditas Lainnya:** Menggunakan metode *Auto-Masking* latar putih bersih via `ai_engine/prepare_dataset.py`.

---

## 🛠️ Struktur Komponen `ai_engine/`

- `ai_engine/export_models/` : Direktori penyimpanan model hasil *training* (YOLO 1 `.pt` dan YOLO 2 `.pt`).
- `ai_engine/grading_configs/` : Kumpulan aturan batas standar (JSON) penentuan mutu untuk masing-masing varietas.
- `ai_engine/model.py` : Mesin utama *Inference* yang memadukan YOLO 1, Masking, ekstraksi geometri, dan YOLO 2.
- `ai_engine/grading_engine.py` : Logika kalkulasi geometri (*solidity*, *circularity*) dan eksekusi aturan JSON.
- `ai_engine/test_integration.py` : *Script* untuk menyimulasikan dan melihat hasil grading akhir pada suatu gambar.
- `ai_engine/prepare_dataset.py` : Alat pencuci otomatis (*auto-masking*) yang menyulap dataset mentah menjadi dataset berlatar putih untuk dilatih ke YOLO 2.
- `ai_engine/weight_estimator.py` : Estimasi berat batch dari luas terkalibrasi (F-101).
- `ai_engine/plausibilitas.py` : Gerbang kewajaran skala — menolak foto yang kalibrasinya menghasilkan buah di luar ukuran fisik yang mungkin.
- `ai_engine/test_unit_plausibilitas.py` : Tes gerbang di atas (murni Python, tanpa bobot YOLO).
- `ai_engine/densitas_faktor.json` : Faktor densitas areal (gram/mm²) per komoditas — satu-satunya sumber angka estimasi berat.
- `ai_engine/calibrate_density.py` : Menyetel ulang faktor di atas dari serah terima nyata.
- `ai_engine/test_regresi_grading.py` : Set regresi grading (F-100) — `pytest`, komposisi berlabel per foto.
- `ai_engine/build_regresi_set.py` : Menyusun `regresi/foto/` dan mencatat baseline komposisinya.
- `ai_engine/eval_yolo2_cls.py` : Skrip evaluasi akurasi metrik klasifikasi YOLO 2 (F1-Score, matriks kebingungan) yang terhubung langsung ke antarmuka kartu transpransi model.

---

## 🧪 Set Regresi Grading (F-100)

Penyetelan `grading_configs/*.json` tidak boleh menggeser akurasi tanpa ada yang
menyadarinya. `regresi/manifest.json` menyimpan komposisi grade yang diharapkan
per foto; `pytest` menjalankan `PantasModel.predict` dan menegaskan pergeserannya
masih di dalam toleransi (komposisi ±0,10 absolut per grade, jumlah objek ±20%
dengan lantai 1 objek).

```bash
cd ai_engine
.venv/Scripts/python.exe -m pip install -r requirements-dev.txt
.venv/Scripts/python.exe -m pytest test_regresi_grading.py
```

Dua hal yang dinyatakan apa adanya oleh set ini:

- **Labelnya `baseline`, bukan `manual`.** Angka harapan adalah keluaran engine
  yang dikunci pada commit pendaftaran foto, bukan penilaian manusia. Set ini
  mendeteksi **perubahan**, bukan membuktikan **akurasi**. Bila suatu kegagalan
  memang disengaja, baseline digenerate ulang secara sadar:
  `python build_regresi_set.py --hanya chili`.
- **Cakupannya baru 11 dari 40 foto.** Hanya cabai yang lengkap (10 frame split
  *test* YOLO-1 — bagian dataset yang belum pernah dilatih). Tomat punya satu
  foto adegan, wortel dan timun tidak punya sama sekali: yang tersimpan di repo
  untuk keduanya hanya potongan klasifikasi 224×224, dan komposisi grade dari
  satu objek bukan komposisi batch. Kekurangan itu dilaporkan sebagai skip
  beralasan pada keluaran `pytest`, bukan disembunyikan.

> ⚠️ **Cacat terbuka yang ditemukan set ini.** `AutoCalibrator` tidak punya uji
> kelayakan koin: pada foto tanpa koin Rp500 ia memilih blob bulat mana pun
> (ujung cabai, tepi piring) lalu melaporkan `kalibrasi.valid = true`. Akibatnya
> `ukuran_mm2` dikarang — `chili-02.jpg` menghasilkan tiga cabai seluas
> 0,11–0,16 m² masing-masing. 10 dari 11 foto set regresi kena.
> `test_foto_tanpa_koin_tidak_boleh_terkalibrasi` menandainya `xfail` dengan
> alasan tercetak; tes itu yang akan membuktikan `calibration.py` sudah sembuh.
>
> **Sudah tertutup di hilir** oleh gerbang kewajaran skala di bawah — laporan
> yang dibangun di atas skala palsu itu kini ditolak sebelum sampai ke petani.
> Yang belum tertutup: koin palsu yang kebetulan menghasilkan skala masih wajar.

---

## 📏 Gerbang Kewajaran Skala

`ai_engine/plausibilitas.py`. Kalibrasi yang "berhasil" hanya berarti ada benda
bulat yang terbaca — bukan bahwa benda itu koin Rp500. Karena `grading_engine`
mengambil keputusan grade dari `area_mm2` (ambang `min_area_A` / `min_area_B`),
penggaris yang salah panjang merusak dua hal sekaligus: estimasi beratnya **dan**
gradenya.

Kasus nyata dari produksi (10 Agustus 2026): dua butir tomat, luas 151.295 mm²
masing-masing, berat 11,86 kg berdua, komposisi **A 100%** — dengan
`kalibrasi.valid = true` di sampingnya.

Gerbangnya membandingkan **median** luas objek terhadap rentang ukuran fisik
komoditasnya. Di luar rentang, fotonya **ditolak seluruhnya** (`status: "error"`
beserta alasan yang bisa ditindaklanjuti petani), bukan sekadar dikosongkan
beratnya: kalau penggarisnya salah, gradenya ikut salah, dan laporan yang salah
lebih berbahaya daripada laporan yang tidak jadi.

| Komoditas | Rentang luas satu buah (mm²) | Acuan |
| --- | --- | --- |
| `tomato` | 100 – 12.000 | ceri Ø15 mm (177) … beef Ø100 mm (7.854) |
| `chili` | 30 – 5.000 | rawit 25×6 mm (150) … keriting 140×15 mm (2.100) |
| `carrot` | 500 – 20.000 | 120×30 mm (3.600) … 250×50 mm (12.500) |
| `cucumber` | 800 – 30.000 | 180×40 mm (7.200) … 350×60 mm (21.000) |

Tiga sifat yang disengaja:

- **Rentangnya longgar** — dua sampai tiga kali lebih lebar dari ukuran pasar di
  tiap sisi. Yang ditangkap adalah kesalahan berlipat (5x, 10x, 100x), bukan
  panen yang kebetulan besar. Menolak panen yang sah jauh lebih mahal daripada
  meloloskan satu foto meragukan.
- **Median, bukan rata-rata.** Satu segmentasi yang menyatukan dua buah tidak
  boleh menjatuhkan foto yang selebihnya benar.
- **Komoditas tanpa rentang tidak pernah ditolak.** Komoditas baru masuk ke model
  lebih dulu daripada ke tabel ini; sampai rentangnya ditulis, gerbang diam
  (`diperiksa: false`) — dan itu dilaporkan apa adanya di payload, bukan disamarkan
  sebagai lolos.

```bash
cd ai_engine
python -m pytest test_unit_plausibilitas.py
```

---

## ⚖️ Estimasi Berat & Loop Kalibrasinya (F-101)

`berat_est = Σ area_mm² × faktor_densitas[komoditas]`, dilaporkan di
`ringkasan_batch.estimasi_berat`. Tiga aturan yang dipegang engine:

1. **Selalu rentang, tidak pernah satu angka.** Payload memuat `min_kg`/`max_kg`
   dari `rel_ketidakpastian` faktor yang dipakai.
2. **Tanpa kalibrasi koin, tidak ada estimasi.** `kalibrasi.valid == false`
   membuat `ukuran_mm2` kehilangan arti milimeter, jadi engine mengembalikan
   `tersedia: false` beserta alasannya — bukan angka tebakan.
3. **Estimasi tidak pernah menggantikan timbangan.** Berat yang mengikat
   transaksi tetap `orders.berat_aktual_kg` yang dicatat saat serah terima.

Justru berat serah terima itulah yang menutup lingkarannya. View
`public.densitas_kalibrasi_view` (migrasi `0010`) memasangkan luas terkalibrasi
tiap laporan grading dengan berat timbangan pesanannya, lalu:

```bash
cd ai_engine
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python calibrate_density.py --dry-run
```

menghitung median gram/mm² per komoditas dan menulis ulang
`densitas_faktor.json`. Selama `n_sampel` sebuah komoditas masih 0, angkanya
turunan geometri — dan kartu estimasi di aplikasi menyatakannya sebagai
"belum tervalidasi timbangan", bukan sebagai hasil kalibrasi lapangan.

---

## 💻 Cara Menguji Coba AI Engine (Inference)

Jalankan *script* simulasi integrasi untuk melihat langsung mesin pemisah mutu bekerja:

```bash
cd ai_engine
python test_integration.py
```

*Script* ini akan memuat model terbaru dari `export_models`, membaca aturan JSON di `grading_configs`, memproses gambar uji, dan mengeluarkan detail evaluasinya secara *real-time*.

### Persyaratan Sistem AI Engine
- Python >= 3.10
- Ultralytics (YOLOv11)
- OpenCV (`cv2`)
- NumPy
- PyTorch (direkomendasikan versi CUDA untuk deteksi *real-time*)
