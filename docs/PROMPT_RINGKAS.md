# Prompt Ringkas — Aset Video Demo PANTAS

Versi hemat token dari [PROMPT_MOTION_GRAFIS.md](PROMPT_MOTION_GRAFIS.md).
Cara pakai: tempel **BLOK R** + **satu prompt** saja. Kalau hasilnya kurang detail,
baru buka versi panjang untuk prompt itu.

---

## BLOK R — tempel di awal setiap prompt

```
PANTAS — platform sortasi mutu panen berbasis computer vision + marketplace
hortikultura. Video demo HoloDev HOLOGY 9.0 (Univ. Brawijaya).
Tim "Inilah 4 trio" — Universitas Gadjah Mada. Tagline: Setiap Panen Pantas Dihargai.

PALET TERANG: canvas #f6f3ed · surface #ffffff · sunken #ede6dc · line #d8cebc ·
ink #1c1915 · ink-muted #575043 · brand #1e5a2e · brand-tint #eaf5ed ·
brand-border #a4d5b0 · clay #a36224. Grade A #1e5a2e / B #8a571f / C #9e3d0e / Reject #9e2323.
PALET GELAP: bg #0d1310 · surface #141c17 · line #26332b · teks #f4f1ea · muted #a9b3ab.

FONT: Bricolage Grotesque (judul & angka besar) · Inter (teks) · JetBrains Mono (kode & metrik).
RASA: keynote Apple tapi hangat — lapang, radius 22–32px, bayangan lembut hangat
berlapis, grain 3%. Haram: emoji, gradien neon, glassmorphism, ikon 3D, clickbait.

GERAK: easing cubic-bezier(.16,1,.3,1) · durasi 600–900ms (hero 1200ms) ·
masuk = opacity 0→1 + translateY 24px→0 + scale .98→1 + blur 6px→0 · stagger 70ms ·
judul besar pakai mask-reveal (clip-path), bukan slide. Haram: bounce, spin, easing
linear, gerak lebih dari 40px, elemen muncul mendadak.

KELUARAN: satu file HTML mandiri, tanpa library apa pun (CSS/WAAPI saja), Google
Fonts boleh. Panggung #stage 1920x1080px, semua koordinat absolut px, auto-scale ke
viewport lewat transform. Timeline deterministik lalu freeze di frame akhir.
Wajib ada: tombol/tekan R = replay · ?rec=1 (sembunyikan UI, autostart 800ms) ·
?t=<ms> (lompat ke milidetik itu lalu diam) · ?bg=solid|green|alpha.
Akhiri jawaban dengan tabel PETA WAKTU (detik → elemen → gerakan).
```

---

## P1 · Latar panggung (dipakai sepanjang video) — PRIORITAS 1

```
[BLOK R]

Buat latar panggung 1920x1080 sebagai <svg> inline (radialGradient + feGaussianBlur +
feTurbulence) supaya bisa diserialisasi ke canvas dan diunduh PNG tanpa library.
Latar: canvas #f6f3ed + blob hijau #eaf5ed (pusat ~300,180 r~900) + blob clay #faf2ea
(pusat ~1650,950 r~800), keduanya sangat samar, + vignette tipis + grain 3%.

Slot dengan koordinat WAJIB persis (?layout=a|b|c):
A "Fokus Layar" (default): bingkai screencast x192 y126 w1536 h864 radius 22 (kartu
  putih, border 1px, bayangan hangat berlapis) · webcam lingkaran Ø236 kotak x1550
  y782 dengan ring 4px · varian ?cam=left kotak x134 y782.
B "Panggung Penuh": tanpa bingkai, area aman x120 y96 w1680 h888, PiP kamera 16:9
  x1344 y714 w480 h270 radius 18.
C "Layar Ponsel": slot x286 y111 w396 h858 radius 44 + panel kanan x810 y200 w1014 h680.

Kromo tetap di semua layout: wordmark PANTAS x96 pusat-y68 · pil act rata kanan x1824
y46 h44 (teks lewat ?act=...) · progress bar x96 y1026 w1728 h4 (isi lewat ?p=0..100).

Mode: ?guide=1 (grid 12 kolom margin 96 gutter 24, safe-area, label koordinat tiap slot)
· ?slot=empty (latar bersih siap ekspor) · ?ambient=1 (blob drift loop mulus 40 detik).

Tombol unduh PNG: latar 1920x1080, mask layar 1536x864 (putih rounded 22 di atas
transparan), mask webcam 236x236 (lingkaran putih). Cetak tabel koordinat semua slot.
```

---

## P2 · Bumper pembuka, 9 detik (SC-01) — PRIORITAS 2

```
[BLOK R]

Bumper pembuka, total 9000ms lalu freeze. PALET GELAP.
Teks persis: PANTAS / Setiap Panen Pantas Dihargai / TIM: Inilah 4 trio - Universitas
Gadjah Mada / M. Choirudin Ammar - Team Lead & AI Engineer / M. Raihan Surya - Fullstack Developer /
Ahmad Rafi Firdaus - Product Concept / HoloDev HOLOGY 9.0 - FILKOM Universitas
Brawijaya / pantas-ai.vercel.app

Papan waktu:
0.0–0.6 garis cahaya 1px #a4d5b0 menyapu kiri→kanan lalu memudar
0.6–2.0 wordmark PANTAS (Bricolage 800, 140px) mask-reveal per huruf stagger 60ms,
        letter-spacing menyempit 0.22em→0.04em selama 1200ms — ini gerakan utamanya
2.0–2.9 tagline mask-reveal (Inter 500, 34px)
2.9–3.6 tiga pil outline GRADE A/B/C stagger 110ms
3.6–4.2 garis pemisah memanjang 0→720px dari kiri
4.2–6.0 blok tim naik stagger 110ms per baris + slot PiP kamera muncul (fade+scale .96→1)
6.0–7.0 baris kaki: kompetisi di kiri, URL di kanan
7.0–9.0 diam; seluruh panggung menyelesaikan drift scale 1→1.015 sejak detik 0

Layout rata kiri dari x160, wordmark baseline ~y430. Slot PiP kosong 480x270 di
x1344 y714 radius 18 — jangan taruh teks apa pun di area 1344,714–1824,984.
Frame ?t=9000 harus layak jadi thumbnail. Sediakan ?variant=light.
```

---

## P3 · Kartu penutup, 20 detik (SC-14) — PRIORITAS 3

```
[BLOK R]

Kartu penutup, total 20000ms lalu freeze. PALET GELAP (berpasangan dengan bumper).
Teks persis:
PANTAS / Setiap Panen Pantas Dihargai
Kutipan besar: "Selisih satu tingkat grade menentukan penghasilan satu keluarga
petani. Sekarang, selisih itu bisa dihitung, dan bisa dibantah."
Coba langsung: pantas-ai.vercel.app · Kode sumber: github.com/astrorehan/pantas ·
Audit publik tanpa login: pantas-ai.vercel.app/lacak/[hash]
Tim Inilah 4 trio - Universitas Gadjah Mada
HoloDev HOLOGY 9.0 - FILKOM Universitas Brawijaya
Terima kasih Dewan Juri

Papan waktu: 0–1.4 wordmark mask-reveal per huruf · 1.4–2.4 tagline · 2.4–5.5 kutipan
baris per baris stagger 220ms (Bricolage 600, 46px, maks 3 baris, lebar maks 1100px,
tanda kutip 120px sebagai dekor di belakang baris pertama) · 5.5–7.5 tiga baris tautan
+ kartu QR muncul · 7.5–9.5 identitas tim · 9.5–11.0 "Terima kasih Dewan Juri"
(#a4d5b0) · 11.0–20.0 DIAM TOTAL, hanya drift scale 1→1.012.

Kolom kiri x160 lebar 1180. Slot QR 260x260 di x1440 y640, bingkai putih radius 22,
placeholder putus-putus — beri komentar cara ganti dengan PNG saya via data URI.
JANGAN gambar QR palsu. Sediakan ?dur=20000 (papan waktu ikut menskala) dan ?variant=light.
```

---

## P4 · Thumbnail YouTube — PRIORITAS 4

```
[BLOK R] — tapi panggung 1280x720 px, bukan 1920x1080.

Tiga varian thumbnail dalam satu file, pilih lewat ?v=1|2|3:
v1 "Angka Menampar" — latar gelap, angka 62,8% (Bricolage 800, ~210px, #9e2323)
   dominan, dua baris SAYURAN INDONESIA / HILANG SEBELUM DIJUAL, di kanan slot foto
   tomat rounded 28px miring 3° dengan bounding box hijau + label mono "GRADE A - 1.840 mm2".
v2 "Bukti Produk" — latar terang, kartu screenshot laporan grading rounded 32px
   mengambang miring 2° dan terpotong tepi kanan; kiri: judul GRADING PANEN / PAKAI
   KOIN Rp500 (Bricolage 800, 76px) + koin Rp500 dengan garis ukur 27 mm menimpa kartu.
v3 "Identitas Bersih" — gelap, sangat lapang, wordmark PANTAS ~150px + tagline +
   tiga pil grade + baris kaki tim & kompetisi. Tanpa foto.

Aturan keras: teks utama maks 6 kata & minimal 110px · teks terkecil minimal 26px
(di bawah itu hapus) · kontras minimal 7:1 · zona 1160,680–1280,720 WAJIB kosong
(badge durasi YouTube) · safe margin 64px · haram emoji, panah merah, wajah kaget.

Slot foto = placeholder putus-putus berlabel ukuran; beri komentar cara ganti dengan
web/public/img/contoh/tomato.jpg. JANGAN gambar ilustrasi tomat vektor.

Wajib ada ?test=1 yang menampilkan varian aktif berjajar di 1280x720, 480x270,
246x138, dan 168x94 dengan label ukuran. Kalau teks utama tak terbaca di 168x94,
desain gagal — perbesar. Juga ?grid=1 dan ?mono=1 (grayscale).
Tombol unduh JPEG kualitas 0.92 (bukan PNG) agar di bawah 2 MB.
```

---

## P5 · Kartu transisi antar act

```
[BLOK R]

Lima kartu transisi, masing-masing tepat 1600ms (masuk 500 / tahan 700 / keluar 400),
dipilih lewat ?act=2|3|4|5|6. PALET GELAP.
Isi: ACT 2 Alur Petani: Pindai Kamera & Kalibrasi Koin Rp500 · ACT 3 Harga Adil
Berbasis PIHPS & Auto-Listing Marketplace · ACT 4 Alur Pembeli Industri: Discovery,
Audit Publik & Order · ACT 5 Konsolidasi Rute Dingin & Verifikasi Handshake RPC ·
ACT 6 Dashboard Dampak Lingkungan & Penutup Resmi.

Desain: nomor act raksasa (Bricolage 800, 180px, warna #26332b) sebagai elemen latar
di kanan yang sebagian terpotong tepi · label "ACT n" mono uppercase #a4d5b0 · judul
Inter 600 46px rata kiri x160 maks 2 baris · garis aksen 4px selebar 88px warna #1e5a2e.

Gerak: teks mask-reveal stagger 80ms sementara lapisan #0d1310 menyapu masuk dari kiri
(easing cubic-bezier(.65,0,.35,1), tepi wipe bergradien 120px, bukan garis keras);
keluar menyapu ke kanan sambil teks memudar.

Frame pertama DAN terakhir harus transparan penuh di ?bg=alpha, supaya bisa ditumpuk
langsung di atas klip tanpa memotong. Tambahkan ?preview=all (kelima kartu berjajar).
```

---

## P6 · Kit overlay untuk adegan screencast

```
[BLOK R] — default ?bg=alpha (ini lapisan overlay), sediakan juga ?bg=green.

Tujuh komponen dalam satu file, dipanggil lewat URL, masing-masing punya siklus
penuh masuk→tahan (?hold=ms, default 4000)→keluar lalu berhenti sendiri:

1 ?el=lower-third&title=..&sub=..  kartu kiri-bawah, garis aksen 4px #1e5a2e,
  judul Inter 600 26px, sub mono 16px. Contoh: title=Pak Warsono sub=Petani Tomat -
  Pakem, Sleman · title=Rina Pradita sub=Pembeli Industri - PT Sedap Makmur
2 ?el=feature-tag&code=F-13&label=..  pil kanan-atas. Contoh: F-11 Kalibrasi Koin
  Rp500 · F-20 Harga Acuan PIHPS · F-40 Geolokasi Haversine · F-60 Hash SHA-256
3 ?el=spotlight&x=&y=&r=  lapisan gelap rgba(13,19,16,.55) dengan lubang lingkaran
  ber-feather 40px + ring 2px; radius menyusut dari r+60 ke r
4 ?el=callout&x=&y=&text=&dir=up|down|left|right  garis penunjuk memanjang
  (stroke-dashoffset) ke label, ujungnya titik 8px yang berdenyut sekali
5 ?el=stat&value=1.240&unit=kg&label=..&sub=..  angka besar count-up, tabular-nums
6 ?el=kbd&keys=Ctrl+Shift+P  kapsul tombol keyboard, muncul 200ms hilang 1200ms
7 ?el=hash&value=sha256:c28a59b...  chip mono reveal per karakter 25ms + badge hijau
  "Terverifikasi Tidak Berubah" 300ms setelahnya

Semua auto-menyesuaikan lebar teks, tidak pernah keluar safe-area 96px, dan tetap
terbaca di atas latar terang maupun gelap. Tambahkan ?el=index berisi seluruh
komponen dengan tautan contoh siap klik.
```

---

## P7 · Infografis anatomi masalah (SC-02)

```
[BLOK R] — palet TERANG.

Motion infografis 14000ms. Data (jangan mengarang angka baru): 62,8% sayuran
Indonesia hilang sebelum sampai konsumen · kerugian Rp106-205 Triliun per tahun ·
sumber Kajian Bappenas x World Resources Institute (2021).
Lima persoalan: 1 Sortir mutu dengan mata telanjang · 2 Asimetri harga, ditentukan
sepihak · 3 Panen grade rendah langsung dibuang · 4 Logistik terfragmentasi per
petani · 5 Tidak ada verifikasi mutu yang bisa diaudit.
Panel solusi: SOLUSI PANTAS — Ubah taksiran subjektif menjadi pengukuran objektif
terkalibrasi koin Rp500, dengan audit publik SHA-256.

Papan waktu: 0–1.6 angka 62,8% count-up (Bricolage 800, 200px, #9e2323, tabular-nums,
blur 10px→0) · 1.6–2.4 keterangan mask-reveal · 2.4–3.2 chip sumber · 3.2–4.0 grid
100 kotak (10x10) — 62 kotak berubah hijau→merah menyapu stagger 12ms per kotak
(metafora visualnya ini, JANGAN pie chart) · 4.0–7.5 lima kartu persoalan stagger
160ms · 7.5–8.6 angka Rp106-205 Triliun count-up (mono 700, 56px, #a36224) ·
8.6–10.5 kartu meredup ke .25 lalu panel SOLUSI PANTAS naik dari bawah (#eaf5ed,
border #a4d5b0, radius 32) · 10.5–12.0 isi panel + dua pil · 12.0–14.0 diam.

Angka besar tidak boleh bergeser saat menghitung. Tambahkan ?step=1..5 untuk
membekukan di akhir tiap tahap.
```

---

## P8 · Diagram pipeline AI dual-stage (SC-04)

```
[BLOK R] — palet TERANG.

Animasi diagram arsitektur, 20000ms, alur selalu kiri→kanan tanpa berpotongan:
Foto panen + koin Rp500 → TAHAP 1 YOLOv11 Segmentasi → RULE ENGINE OpenCV (panjang,
rasio, circularity, solidity dalam mm², dikalibrasi diameter koin 27mm) → TAHAP 2
YOLOv11 Klasifikasi patologi (hak veto mutlak) → Grade A/B/C/Reject + alasan per
butir + hash SHA-256.
Judul: Arsitektur Dual-Stage YOLOv11 + Explainable Rule Engine.

Papan waktu: 0–1.2 judul · 1.2–3.0 kartu input, caliper mengukur koin lalu label
27 mm · 3.0–6.5 mask segmentasi tersapu menutupi objek (#1e5a2e opasitas .35, tepi
2px) + badge YOLOv11-seg · 6.5–11.0 RULE ENGINE — empat metrik count-up stagger
140ms disertai garis ukur yang memanjang (beri porsi visual TERBESAR di sini) ·
11.0–15.0 bercak merah #9e3d0e pulse + badge VETO PATOLOGI, warna garis alur berubah
· 15.0–18.0 empat bar grade tumbuh A 60% B 25% C 15% Reject 0% + chip
sha256:c28a59b... · 18.0–20.0 diam, alur utuh dalam satu frame.

Setiap panah beranimasi memanjang (stroke-dashoffset), bukan fade. Opsional panel
kode gelap berisi JSON ambang batas grade yang tersorot mengikuti tahap aktif.
Tambahkan ?stage=1|2|3|4.
```

---

## P9 · Ekspor frame jadi 60fps (opsional)

```
Buat skrip Node.js render-frames.mjs: pakai Playwright chromium, viewport tepat
1920x1080 deviceScaleFactor 1; untuk tiap frame 0..DURASI dengan langkah 1000/60 ms,
buka file HTML lokal dengan ?rec=1&t=<ms>, tunggu document.fonts.ready + satu
requestAnimationFrame, simpan PNG ke out/ dengan padding nol 6 digit.
Argumen CLI: --file --dur --fps --out. Cetak progres tiap 60 frame.
Sertakan satu baris ffmpeg untuk menggabung jadi MP4 H.264 yuv420p 60fps, dan satu
baris alternatif MOV ProRes 4444 dengan alpha. Tanpa dependensi selain playwright.
```

---

## Kalimat perbaikan (kalau hasilnya meleset)

- "Gerakannya terasa murah. Perlambat semua entrance jadi 900ms, easing
  cubic-bezier(.16,1,.3,1), translateY maksimal 24px."
- "Terlalu ramai. Sisakan satu titik fokus, hapus sisanya, perbesar ruang kosong."
- "Ada elemen keluar safe-area. Semua konten harus di dalam 96,96–1824,984.
  Perbaiki dan cetak ulang tabel koordinatnya."
- "Uji 168x94 gagal — teks utama tak terbaca. Perbesar minimal 140px, maks 4 kata."
- "Frame ?t=<durasi> belum seimbang untuk thumbnail. Susun ulang komposisinya."
