<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1320–1426.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Spesifikasi AI Engine — pipeline, cakupan model, pekerjaan v1.0  
> Sumber: `docs/PRD.md` §baris 1320–1426  ·  Epic: `EP-B` Grading AI
>
> [← Kontrak API — FastAPI, route handler, aturan seam](./06-kontrak-api.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Algoritma harga & faktor emisi CO₂e →](./08-algoritma-harga.md)

<!-- PRD-SLICE-BEGIN -->
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

