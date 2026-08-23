<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1960–akhir.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Lampiran — glosarium, keputusan, pertanyaan terbuka, referensi  
> Sumber: `docs/PRD.md` §baris 1960–akhir
>
> [← Definition of Done & metrik](./16-dod-metrik.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md)

<!-- PRD-SLICE-BEGIN -->
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
