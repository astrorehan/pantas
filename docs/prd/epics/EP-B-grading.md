<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 730–784.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — EP-B — Grading AI  
> Sumber: `docs/PRD.md` §baris 730–784  ·  Epic: `EP-B` Grading AI
>
> [← EP-A — Onboarding & Autentikasi](./EP-A-onboarding.md) · [Indeks](../00-INDEX.md) · [Backlog](../../BACKLOG.md) · [EP-C — Rekomendasi Harga →](./EP-C-harga.md)

<!-- PRD-SLICE-BEGIN -->
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

