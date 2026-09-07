# Paket Prompt Motion Grafis & Latar Video Demo PANTAS

Kumpulan prompt siap-tempel untuk Claude, guna memproduksi seluruh aset visual bergerak
video demo **PANTAS — HoloDev HOLOGY 9.0**. Dipakai berpasangan dengan
[STORYBOARD_DEMO.html](STORYBOARD_DEMO.html) dan [KETENTUAN_VIDEO_HOLODEV.md](KETENTUAN_VIDEO_HOLODEV.md).

Semua aset dikeluarkan sebagai **satu file HTML mandiri** yang dijalankan lokal di Chrome,
lalu direkam / dikomposit lewat OBS. Tidak perlu After Effects.

---

## 0. Peta adegan: mana yang butuh motion grafis

| Adegan | Jenis shot | Aset yang dibutuhkan |
| :--- | :--- | :--- |
| SC-01 Opening & Identitas Tim | Bumper + PiP kamera | **Prompt 2** (bumper pembuka) |
| SC-02 Anatomi Masalah 62,8% | Graphic overlay penuh | **Prompt 3** (infografis motion) |
| SC-03 Pindai & kalibrasi koin | Screencast | Prompt 1 (latar) + Prompt 6 (callout) |
| SC-04 Arsitektur Dual-Stage YOLOv11 | Diagram + cuplikan kode | **Prompt 4** (diagram pipeline) |
| SC-05 Laporan grading & hash | Screencast | Prompt 1 + Prompt 6 |
| SC-06 Harga adil PIHPS | Screencast | Prompt 1 + Prompt 6 |
| SC-07 Auto-listing | Screencast (ada toast kanan-bawah) | Prompt 1 — **webcam pindah ke kiri-bawah** |
| SC-08 Katalog pembeli | Screencast | Prompt 1 + Prompt 6 |
| SC-09 Sertifikat publik /lacak | Screencast | Prompt 1 |
| SC-10 Inquiry & pesanan | Screencast | Prompt 1 |
| SC-11 Konsolidasi rute | Screencast peta | Prompt 1 + Prompt 6 |
| SC-12 Serah terima RPC | Screencast | Prompt 1 |
| SC-13 Dashboard dampak | Screencast | Prompt 1 + Prompt 6 (stat pop) |
| SC-14 Closing | Kartu penutup | **Prompt 7** (bumper penutup) |
| Jeda antar Act | Kartu transisi 1,6 dtk | **Prompt 5** |

**Kalau waktu mepet**, kerjakan urutan ini dan berhenti di mana pun waktumu habis:
**Prompt 1 → Prompt 2 → Prompt 7 → Prompt 9 → Prompt 5 → Prompt 3 → Prompt 6 → Prompt 4.**
Prompt 1, 2, dan 7 saja sudah membuat video terlihat utuh dan rapi.
**Prompt 9 (thumbnail)** berdiri sendiri dan hanya butuh 10 menit — kerjakan lebih awal
kalau kamu belum memverifikasi akun YouTube untuk custom thumbnail.

---

> **Hemat token?** Pakai [PROMPT_RINGKAS.md](PROMPT_RINGKAS.md) — satu blok header
> 20 baris (bukan 90) dan prompt yang dipadatkan. Buka file ini hanya kalau hasil
> versi ringkas kurang detail untuk satu aset tertentu.

## Cara pakai prompt di bawah

1. Buka **chat Claude baru untuk setiap prompt** (jangan dicampur — konteksnya berat).
2. Tempel **BLOK A + BLOK B + isi prompt** dalam satu kiriman. BLOK A dan BLOK B selalu
   sama, cuma disalin ulang; itu yang menjaga semua aset terlihat satu keluarga.
3. Minta hasil sebagai file HTML, simpan di `video/aset/` (buat foldernya), buka di Chrome.
4. Iterasi lewat kalimat pendek: "geser blok tim 40px ke bawah", "perlambat reveal judul
   jadi 1200ms", "kurangi grain jadi 2%".

---

## BLOK A — Konteks & Sistem Desain (tempel di awal setiap prompt)

```
KONTEKS PRODUK
Nama: PANTAS (Penilaian Agrikultur Terstandar & Andal) — platform sortasi mutu panen
berbasis computer vision terkalibrasi koin Rp500 + marketplace hortikultura terintegrasi.
Tagline resmi: "Setiap Panen Pantas Dihargai"
Tim: Inilah 4 trio — Universitas Gadjah Mada
Anggota: M. Choirudin Ammar (Team Lead & AI Engineer), M. Raihan Surya (Fullstack Developer),
Ahmad Rafi Firdaus (Product Concept)
Kompetisi: HoloDev HOLOGY 9.0 — FILKOM Universitas Brawijaya
Live: pantas-ai.vercel.app

ARAH RASA VISUAL
Modern, bersih, tenang, presentatif — rasa keynote Apple, tapi paletnya hangat
(kertas & hutan), bukan abu-abu teknologi. Banyak ruang kosong, sudut membulat,
bayangan lembut dan hangat, hierarki tipografi tegas. Dilarang keras: emoji,
gradien neon, glassmorphism berlebihan, stok ikon 3D, drop shadow keras hitam pekat.

TOKEN WARNA (pakai persis, jangan diganti atau dikira-kira)
--canvas:#f6f3ed;  --canvas-subtle:#eae4d9; --surface:#ffffff; --surface-raised:#fcfbf9;
--sunken:#ede6dc;  --line:#d8cebc;          --line-strong:#b9aa93;
--ink:#1c1915;     --ink-muted:#575043;     --ink-subtle:#847a6b;
--brand:#1e5a2e;   --brand-deep:#143e20;    --brand-tint:#eaf5ed;
--brand-tint-strong:#d2ebd8;                --brand-border:#a4d5b0;
--clay:#a36224;    --clay-tint:#faf2ea;     --clay-border:#e2c09c;
Grade: A #1e5a2e (bg #eaf5ed) / B #8a571f (bg #fbf2e6) / C #9e3d0e (bg #faede6) /
Reject #9e2323 (bg #faeaea)

VARIAN GELAP (khusus bumper pembuka, kartu transisi, dan penutup)
--dark-canvas:#0d1310; --dark-raise:#141c17; --dark-line:#26332b;
--dark-ink:#f4f1ea;    --dark-ink-muted:#a9b3ab;
Aksen di atas gelap memakai --brand-border #a4d5b0 dan --clay-border #e2c09c.

TIPOGRAFI (Google Fonts, muat via <link>)
Display: 'Bricolage Grotesque' bobot 600/700/800 — judul, angka besar, wordmark
Teks:    'Inter' bobot 400/500/600/700 — paragraf, label, nama
Angka & kode: 'JetBrains Mono' bobot 400/500/700 — metrik, hash, harga, kode batch
Judul hero: 88–120px, tracking -0.03em, line-height 1.02
Subjudul: 30–38px, --ink-muted. Label kecil: 15px, uppercase, tracking 0.14em.

BENTUK & KEDALAMAN
Radius: 8 / 14 / 22 / 32 / 44 px. Kartu utama 32px, kartu kecil 14px, pil 999px.
Bayangan hangat berlapis, bukan hitam:
  0 1px 3px rgba(28,25,21,.05)
  0 6px 18px -6px rgba(28,25,21,.08)
  0 28px 64px -20px rgba(28,25,21,.16)
Garis tepi 1px --line, plus inner highlight rgba(255,255,255,.7) di kartu terang.
Grain film halus 3% di seluruh panggung (feTurbulence atau overlay noise), supaya
gradien tidak terlihat banding saat direkam.

BAHASA GERAK (WAJIB — ini yang bikin terasa Apple)
- Easing masuk: cubic-bezier(.16,1,.3,1). Easing pindah/keluar: cubic-bezier(.65,0,.35,1).
  DILARANG: bounce, elastic, spin, rotate 3D, easing linear, efek ketik mesin tik.
- Durasi: mikro 200–300ms, elemen biasa 600–900ms, elemen hero 1000–1400ms.
- Jarak gerak maksimal 40px. Resep masuk baku:
  opacity 0 -> 1, translateY 24px -> 0, scale .98 -> 1, filter blur(6px) -> blur(0).
- Stagger antar elemen 70ms; antar baris teks 90ms; antar item daftar 110ms.
- Judul besar masuk dengan mask-reveal (clip-path inset dari bawah) atau per-kata,
  bukan slide dari jauh.
- Seluruh panggung boleh drift sangat pelan (scale 1 -> 1.015 selama durasi penuh)
  supaya frame tidak terasa mati.
- Angka besar dihitung naik (count-up) dengan easing out, memakai font-variant-numeric:
  tabular-nums agar lebarnya tidak goyang.
- Tidak boleh ada elemen yang muncul mendadak tanpa transisi, dan tidak ada kedip.
```

## BLOK B — Format Keluaran Teknis (tempel setelah BLOK A)

```
FORMAT KELUARAN (WAJIB DIPATUHI)
- Satu file HTML tunggal dan mandiri. Boleh <link> ke Google Fonts. TANPA library lain:
  tanpa GSAP, Three.js, Tailwind CDN, html2canvas, anime.js. Animasi murni CSS
  keyframes / transition / Web Animations API.
- Panggung tetap 1920x1080 px:
  #stage { width:1920px; height:1080px; position:relative; overflow:hidden;
           transform-origin: top left; }
  Skalakan otomatis lewat JS (transform: scale(min(vw/1920, vh/1080))) supaya bisa
  dipratinjau di laptop tanpa mengubah satu pun koordinat asli. Body latar #0d1310,
  panggung selalu di tengah, tanpa scrollbar.
- Timeline deterministik: satu titik mulai, total durasi ditentukan di brief, lalu
  BERHENTI membeku di frame terakhir (tidak loop), kecuali diminta loop.
- Kontrol produksi wajib:
    tombol + tombol keyboard "R" = putar ulang dari 0
    ?rec=1   = sembunyikan seluruh UI kontrol, mulai otomatis setelah jeda 800ms
    ?t=<ms>  = lompat ke milidetik tertentu lalu diam (untuk ekspor frame diam)
    ?bg=solid (default) | ?bg=green (latar rata #00FF00 untuk chroma key) |
    ?bg=alpha (latar transparan, untuk Browser Source OBS)
- -webkit-font-smoothing: antialiased. Tidak ada teks terpotong, tidak ada overflow.
- Semua koordinat ditulis absolut dalam px terhadap panggung 1920x1080 (jangan pakai
  persentase yang menggeser posisi saat diskalakan).
- Di akhir jawaban, cetak tabel PETA WAKTU: kolom [detik mulai] [detik selesai]
  [elemen] [gerakan]. Ini dipakai untuk menyelaraskan voiceover.
```

---

# PROMPT 1 — Latar Panggung (dipakai sepanjang video)

Ini aset paling penting: satu latar yang membingkai screencast + webcam di Act 2–5,
sehingga rekaman layar mentah berubah jadi presentasi berbingkai ala keynote.

```
[TEMPEL BLOK A DI SINI]
[TEMPEL BLOK B DI SINI]

TUGAS
Buat "latar panggung" (stage background) 1920x1080 untuk video demo produk PANTAS.
Latar ini akan dipasang sebagai lapisan paling bawah di OBS; rekaman layar dan webcam
diletakkan di atasnya, tepat pada slot yang kamu sediakan. Jadi latar harus indah
sekaligus akurat secara koordinat.

KOMPOSISI LATAR (lapisan dari bawah ke atas)
1. Dasar rata warna --canvas #f6f3ed.
2. Mesh gradient sangat lembut: dua blob radial besar berblur kuat —
   blob hijau --brand-tint #eaf5ed opasitas 70% berpusat di sekitar (300, 180) radius
   sekitar 900px, dan blob clay --clay-tint #faf2ea opasitas 60% berpusat di sekitar
   (1650, 950) radius sekitar 800px. Hasil akhir harus nyaris tak terasa, bukan
   warna-warni.
3. Vignette hangat sangat tipis di empat sudut, rgba(28,25,21,.05).
4. Grain film 3%.
5. Kromo tetap (wordmark, pil act, progress bar) sesuai koordinat di bawah.

PENTING — TEKNIK: bangun seluruh latar sebagai satu elemen <svg> inline 1920x1080
(radialGradient, feGaussianBlur, feTurbulence untuk grain). Alasannya: SVG bisa
diserialisasi ke canvas tanpa library, sehingga bisa diunduh jadi PNG.

TIGA LAYOUT, dipilih lewat ?layout=a|b|c

LAYOUT A — "Fokus Layar" (default; dipakai SC-03, SC-05 sampai SC-13)
- Bingkai screencast: x=192, y=126, lebar=1536, tinggi=864, radius 22px.
  Gambar bingkainya sebagai kartu putih --surface dengan border 1px --line,
  inner highlight putih, dan bayangan berlapis hangat. Bagian dalam bingkai
  ditampilkan sebagai area kosong bertekstur --sunken dengan teks pemandu
  "SLOT REKAMAN LAYAR 1536x864" (teks pemandu ini hilang bila ?slot=empty).
- Slot webcam varian KANAN (default): lingkaran diameter 236px,
  kotak pembatas x=1550, y=782 (titik pusat 1668, 900). Beri ring 4px --surface
  dan bayangan lembut, sehingga terasa mengambang di atas sudut bingkai layar.
- Slot webcam varian KIRI (?cam=left): lingkaran diameter 236px,
  kotak pembatas x=134, y=782 (titik pusat 252, 900).
  Varian ini dipakai di adegan yang punya notifikasi toast di kanan bawah.
- Wordmark "PANTAS" (Bricolage Grotesque 700, 28px, tracking 0.16em, --brand-deep)
  di x=96, pusat vertikal y=68. Di sebelahnya titik bulat 8px --clay lalu teks
  "Setiap Panen Pantas Dihargai" (Inter 500, 15px, --ink-subtle).
- Pil penanda act di kanan atas: rata kanan ke x=1824, y=46, tinggi 44px, radius 999px,
  latar --surface, border 1px --line, isi teks mono kecil, contoh
  "ACT 2 - PINDAI & GRADING AI". Teks pil diisi lewat parameter URL ?act=...
- Progress bar tipis di bawah: x=96, y=1026, lebar=1728, tinggi=4, radius 2.
  Track --line opasitas 50%, isi --brand. Panjang isi diatur lewat ?p=0..100.
- Zona lower-third (biarkan kosong, hanya digambar saat ?guide=1):
  x=232, y=838, lebar maksimal 720, tinggi 108.

LAYOUT B — "Panggung Penuh" (dipakai SC-01, SC-02, SC-04)
- Tanpa bingkai layar. Area aman konten: x=120, y=96, lebar=1680, tinggi=888.
- Slot PiP kamera 16:9: x=1344, y=714, lebar=480, tinggi=270, radius 18px,
  ring 4px --surface dan bayangan. Untuk PiP 3 anggota tim berjas almamater UGM.
- Wordmark, pil act, dan progress bar sama persis dengan Layout A.

LAYOUT C — "Layar Ponsel" (opsional, bila SC-03 direkam dari perangkat mobile)
- Slot layar ponsel: x=286, y=111, lebar=396, tinggi=858, radius 44px, digambar
  sebagai bodi perangkat dengan bezel 10px --ink dan bayangan panjang.
- Panel keterangan di kanan: kartu --surface x=810, y=200, lebar=1014, tinggi=680,
  radius 32px, untuk poin-poin teks pendukung.

MODE TAMBAHAN
- ?guide=1  : tampilkan overlay pemandu — grid 12 kolom (margin 96, gutter 24,
              lebar kolom 122), garis tengah, kotak safe-area, dan label koordinat
              x/y/w/h pada setiap slot. Mode ini hanya untuk saya menyetel OBS.
- ?slot=empty : sembunyikan seluruh teks pemandu dan isian slot, sisakan latar bersih
              siap ekspor PNG.
- ?ambient=1 : hidupkan drift ambient — kedua blob gradien bergerak sangat pelan
              dalam loop mulus 40 detik (translate maksimal 60px, opacity naik-turun
              5%). Harus benar-benar seamless saat loop, tanpa lompatan.

TOMBOL UNDUH (tampil hanya saat bukan ?rec=1)
Sediakan panel kecil di luar panggung berisi tombol yang mengekspor PNG lewat
serialisasi SVG ke canvas lalu toBlob dan anchor download:
  1. "Unduh Latar A / B / C (1920x1080 PNG)" — versi ?slot=empty, area slot transparan.
  2. "Unduh Mask Layar (1536x864 PNG)" — persegi putih penuh radius 22px di atas
     latar transparan. Dipakai sebagai Image Mask di OBS agar sudut rekaman membulat.
  3. "Unduh Mask Webcam (236x236 PNG)" — lingkaran putih penuh di atas transparan.

KRITERIA DITERIMA
- Koordinat setiap slot persis seperti angka di atas, bisa dibuktikan lewat ?guide=1.
- Latar tetap enak dilihat walau semua slot kosong, bukan sekadar kotak abu-abu.
- Tidak ada elemen dekoratif yang masuk ke dalam area slot screencast.
- Cetak tabel akhir berisi nama slot, x, y, w, h, radius — untuk saya salin ke OBS.
```

---

# PROMPT 2 — Bumper Pembuka (SC-01, 0:00–0:20)

```
[TEMPEL BLOK A DI SINI]
[TEMPEL BLOK B DI SINI]

TUGAS
Buat bumper pembuka video demo PANTAS. Total durasi animasi 9000ms, lalu membeku di
frame terakhir (editor akan cross-dissolve ke rekaman landing page setelah detik ke-9).
Pakai VARIAN GELAP (--dark-canvas #0d1310) supaya kontras dengan badan video yang
berlatar kertas terang, persis pola pembukaan keynote.

TEKS YANG HARUS MUNCUL — salin persis, jangan diubah atau ditambah
  PANTAS
  Setiap Panen Pantas Dihargai
  Sistem sortasi mutu cerdas berbasis computer vision dan marketplace hortikultura
  TIM: Inilah 4 trio - Universitas Gadjah Mada
  M. Choirudin Ammar - Team Lead & AI Engineer
  M. Raihan Surya - Fullstack Developer
  Ahmad Rafi Firdaus - Product Concept
  HoloDev HOLOGY 9.0 - FILKOM Universitas Brawijaya
  pantas-ai.vercel.app

SLOT PiP KAMERA
Sediakan slot kosong 480x270 di x=1344, y=714, radius 18px, ring 4px, bayangan.
Isinya nanti rekaman 3 anggota tim berjas almamater. Slot ini muncul lewat fade
dan scale .96 ke 1 pada detik 4.2.

PAPAN WAKTU YANG DIINGINKAN (patuhi, boleh geser maksimal 200ms)
0.0-0.6s   Layar gelap. Satu garis cahaya horizontal setipis 1px warna --brand-border
           menyapu dari kiri ke kanan di tengah panggung, lalu memudar.
0.6-2.0s   Wordmark "PANTAS" muncul: Bricolage Grotesque 800, 140px, warna --dark-ink.
           Reveal per huruf dengan mask clip-path dari bawah, stagger 60ms, sekaligus
           letter-spacing menyempit dari 0.22em ke 0.04em selama 1200ms. Ini gerakan
           utamanya — harus mulus dan terasa mahal, bukan cepat.
2.0-2.9s   Tagline "Setiap Panen Pantas Dihargai" (Inter 500, 34px, --dark-ink-muted)
           mask-reveal dari bawah tepat di bawah wordmark.
2.9-3.6s   Tiga pil kecil grade muncul berurutan stagger 110ms sebagai motif produk:
           "GRADE A" (--grade-a), "GRADE B" (#8a571f), "GRADE C" (#9e3d0e).
           Pil bergaya outline tipis di atas gelap, mono 15px, radius 999px.
           Lalu satu baris deskripsi kecil di bawahnya.
3.6-4.2s   Garis pemisah 1px --dark-line memanjang dari 0 ke 720px, transform-origin kiri.
4.2-6.0s   Blok identitas tim naik: label "TIM" lalu "Inilah 4 trio - Universitas Gadjah
           Mada", disusul 3 nama anggota beserta perannya, stagger 110ms per baris.
           Nama pakai Inter 600 22px, peran pakai mono 15px --dark-ink-muted.
           Bersamaan, slot PiP kamera muncul.
6.0-7.0s   Baris kaki muncul di bawah panggung: "HoloDev HOLOGY 9.0 - FILKOM
           Universitas Brawijaya" di kiri dan "pantas-ai.vercel.app" di kanan,
           dipisah garis tipis di atasnya.
7.0-9.0s   Diam. Seluruh panggung menyelesaikan drift scale 1 ke 1.015 yang berjalan
           sejak detik 0. Tambahkan gradien hijau sangat samar yang perlahan menguat
           di sudut kiri atas sebagai penanda transisi ke adegan berikutnya.

TATA LETAK
Blok utama rata kiri, mulai x=160. Wordmark baseline sekitar y=430. Identitas tim
di bawahnya. Sisakan kuadran kanan-bawah untuk PiP kamera. Jangan pernah menaruh
teks di dalam area 1344,714 sampai 1824,984.

KRITERIA DITERIMA
- Reveal per huruf pada wordmark benar-benar mask (huruf tersingkap), bukan fade biasa.
- Tidak ada satu pun elemen yang bergerak lebih dari 40px.
- Frame terakhir (?t=9000) layak dipakai sebagai thumbnail YouTube.
- Sediakan juga ?variant=light yang memakai palet kertas terang, untuk saya bandingkan.
```

---

# PROMPT 3 — Infografis Anatomi Masalah (SC-02, 0:20–0:50)

```
[TEMPEL BLOK A DI SINI]
[TEMPEL BLOK B DI SINI]

TUGAS
Buat motion infografis 14000ms untuk adegan "Anatomi Masalah" video demo PANTAS.
Pakai palet TERANG (--canvas). Ini adegan yang menjelaskan urgensi masalah sebelum
demo produk dimulai, jadi angkanya harus menampar tapi tetap tenang dan kredibel.

DATA DAN TEKS — salin persis, jangan mengarang angka baru
  Angka hero: 62,8%
  Keterangan hero: sayuran di Indonesia hilang sebelum sampai ke konsumen
  Angka pendamping: Rp106-205 Triliun kerugian per tahun
  Sumber: Kajian Bappenas x World Resources Institute (2021)
  Lima persoalan rantai pasok:
    1. Sortir mutu dengan mata telanjang
    2. Asimetri harga - harga ditentukan sepihak
    3. Panen grade rendah langsung dibuang
    4. Logistik terfragmentasi per petani
    5. Tidak ada verifikasi mutu yang bisa diaudit
  Panel solusi: SOLUSI PANTAS
  Isi panel solusi: Ubah taksiran subjektif menjadi pengukuran objektif terkalibrasi
  koin Rp500, dengan audit publik SHA-256.

PAPAN WAKTU
0.0-1.6s   Angka "62,8%" menghitung naik dari 0,0% ke 62,8% dengan easing out selama
           1400ms. Bricolage Grotesque 800, 200px, warna --grade-reject #9e2323,
           tabular-nums supaya lebarnya tidak goyang. Muncul dari blur 10px ke 0.
1.6-2.4s   Keterangan hero mask-reveal di bawah angka, Inter 500, 32px.
2.4-3.2s   Chip sumber muncul: pil kecil --sunken, mono 15px, isi teks sumber.
           Kredibilitas harus terlihat sejak awal.
3.2-4.0s   Batang visual: satu grid 100 kotak kecil (10x10) mewakili 100 kg sayuran.
           62 kotak berubah dari --brand ke --grade-reject-bg dengan garis tepi
           --grade-reject, menyapu berurutan stagger 12ms per kotak. Sisanya tetap
           hijau. Ini metafora visualnya, jangan pakai pie chart.
4.0-7.5s   Lima kartu persoalan masuk berurutan stagger 160ms dari kiri ke kanan:
           kartu --surface, radius 22px, border 1px --line, bayangan lembut,
           nomor mono di pojok, judul Inter 600 21px. Setiap kartu masuk dengan
           resep baku (y 24px, scale .98, blur 6px).
7.5-8.6s   Angka "Rp106-205 Triliun" menghitung naik di bawah kelima kartu,
           JetBrains Mono 700, 56px, warna --clay.
8.6-10.5s  TRANSISI: kelima kartu meredup ke opasitas 0.25 dan menyusut ke scale .97,
           lalu panel "SOLUSI PANTAS" naik dari bawah menutupi sepertiga bawah
           panggung — kartu --brand-tint dengan border --brand-border, radius 32px.
10.5-12.0s Isi panel solusi mask-reveal baris per baris, disertai dua pil kecil
           "Pengukuran objektif" dan "Audit publik SHA-256".
12.0-14.0s Diam, drift halus, siap dipotong ke screencast.

KRITERIA DITERIMA
- Angka besar tidak pernah bergeser posisi saat menghitung (tabular-nums wajib).
- Grid 100 kotak rapi, gutter konsisten, tidak ada kotak yang mepet tepi panggung.
- Sumber Bappenas x WRI selalu terlihat sejak detik 3.2 sampai akhir.
- Sediakan ?step=1..5 untuk membekukan animasi di akhir tiap tahap, agar saya bisa
  merekam per bagian kalau tempo voiceover ternyata berbeda.
```

---

# PROMPT 4 — Diagram Pipeline AI Dual-Stage (SC-04, 1:25–1:55)

```
[TEMPEL BLOK A DI SINI]
[TEMPEL BLOK B DI SINI]

TUGAS
Buat animasi diagram arsitektur AI PANTAS, durasi 20000ms, palet TERANG.
Adegan ini adalah pembeda teknis utama kami di depan dewan juri: menunjukkan bahwa
pipeline kami bukan black-box tunggal, melainkan dua tahap YOLOv11 yang diapit
rule engine geometri yang bisa dijelaskan.

ALUR YANG DIVISUALKAN (tiga tahap, kiri ke kanan)
  Foto panen + koin Rp500
    -> TAHAP 1: YOLOv11 Segmentasi  (memisahkan komoditas dari latar)
    -> RULE ENGINE OpenCV           (mengukur panjang, rasio, circularity, solidity
                                     dalam mm persegi, dikalibrasi diameter koin 27mm)
    -> TAHAP 2: YOLOv11 Klasifikasi (deteksi bercak penyakit / kebusukan = hak veto mutlak)
    -> Keluaran: Grade A / B / C / Reject + alasan per butir + hash SHA-256

TEKS PENDUKUNG — pakai persis
  Judul: Arsitektur Dual-Stage YOLOv11 + Explainable Rule Engine
  Label kalibrasi: Koin Rp500 - diameter standar 27 mm - acuan mm persegi
  Label veto: Veto patologi mengalahkan skor geometri
  Metrik contoh: Ukuran rata-rata 1.840 mm persegi - Circularity 0.89
  Berjalan di: FastAPI container, latensi inferensi di bawah 200 ms

PAPAN WAKTU
0.0-1.2s   Judul mask-reveal di kiri atas area aman.
1.2-3.0s   Kartu input muncul di kiri: bingkai foto tomat (pakai placeholder kotak
           --sunken bertuliskan FOTO PANEN, saya akan menempel gambar sendiri nanti)
           dengan lingkaran koin Rp500 di sampingnya. Sebuah caliper/garis ukur
           beranimasi mengukur diameter koin lalu memunculkan label 27 mm.
3.0-6.5s   TAHAP 1: panah mengalir ke kartu kedua. Di dalam kartu, mask segmentasi
           tersapu menutupi objek (clip-path menyapu dari kiri, warna --brand
           opasitas 0.35, garis tepi --brand 2px). Muncul badge "YOLOv11-seg".
6.5-11.0s  RULE ENGINE: kartu ketiga. Tampilkan empat baris metrik yang muncul
           berurutan stagger 140ms dengan nilai yang menghitung naik:
           panjang, rasio, circularity, solidity. Di sampingnya, ilustrasi bounding
           box dengan garis ukur horizontal dan vertikal yang memanjang saat metrik
           terkait muncul. Ini bagian terpenting — beri porsi visual paling besar.
11.0-15.0s TAHAP 2: kartu keempat. Satu bercak merah --grade-c muncul dengan pulse
           halus di atas objek, lalu badge "VETO PATOLOGI" masuk dan garis alur
           berubah warna dari --brand ke --grade-c. Ini menegaskan mekanisme veto.
15.0-18.0s KELUARAN: kartu kanan menampilkan distribusi grade sebagai empat bar
           horizontal yang tumbuh: A 60%, B 25%, C 15%, Reject 0%, masing-masing
           dengan warna grade. Di bawahnya chip mono "sha256:c28a59b..." yang
           masuk terakhir dengan mikro-pulse sekali.
18.0-20.0s Diam. Seluruh alur terlihat utuh dalam satu frame, siap di-screenshot
           untuk dipakai di slide proposal juga.

PANEL KODE (opsional, di bawah diagram)
Sediakan panel gelap radius 22px berisi cuplikan JSON ambang batas grade yang
tersorot baris per baris mengikuti tahap yang sedang aktif. Isi contoh:
  { "tomat": { "grade_a": { "min_mm2": 1600, "min_circularity": 0.82,
    "max_defect_ratio": 0.02 }, "grade_b": { "min_mm2": 1100 } } }
Font JetBrains Mono 17px, syntax highlight sederhana (kunci --clay, angka --brand,
string --ink-muted). Baris aktif diberi latar --brand-tint dan penanda kiri 3px.

KRITERIA DITERIMA
- Arah alur selalu kiri ke kanan, tidak pernah berbalik atau berpotongan.
- Setiap panah beranimasi memanjang (stroke-dashoffset), bukan sekadar fade.
- Kata "veto" harus terasa tegas secara visual, bukan sekadar teks kecil.
- Sediakan ?stage=1|2|3|4 untuk membekukan di akhir tiap tahap.
```

---

# PROMPT 5 — Kartu Transisi Antar Act

```
[TEMPEL BLOK A DI SINI]
[TEMPEL BLOK B DI SINI]

TUGAS
Buat satu file berisi lima kartu transisi antar babak untuk video demo PANTAS.
Durasi masing-masing 1600ms (masuk 500ms, tahan 700ms, keluar 400ms) lalu berhenti.
Kartu dipilih lewat ?act=2|3|4|5|6. Pakai VARIAN GELAP supaya terasa seperti
"lampu diredupkan sejenak" di antara dua segmen terang.

ISI KARTU — salin persis dari storyboard
  act=2  ACT 2  |  Alur Petani: Pindai Kamera & Kalibrasi Koin Rp500      |  75 detik
  act=3  ACT 3  |  Harga Adil Berbasis PIHPS & Auto-Listing Marketplace   |  70 detik
  act=4  ACT 4  |  Alur Pembeli Industri: Discovery, Audit Publik & Order |  75 detik
  act=5  ACT 5  |  Konsolidasi Rute Dingin & Verifikasi Handshake RPC     |  65 detik
  act=6  ACT 6  |  Dashboard Dampak Lingkungan & Penutup Resmi            |  45 detik
Angka durasi hanya untuk referensi internal saya, JANGAN ditampilkan di kartu.

DESAIN
- Nomor act besar (Bricolage Grotesque 800, 180px) berwarna --dark-line, ditempatkan
  sebagai elemen latar di kanan, sebagian terpotong tepi panggung.
- Label "ACT 2" kecil bergaya mono uppercase tracking lebar, warna --brand-border.
- Judul act Inter 600, 46px, --dark-ink, rata kiri di x=160, maksimal dua baris.
- Garis aksen 4px selebar 88px warna --brand di atas label.

GERAK
Masuk: seluruh blok teks mask-reveal dari bawah dengan stagger 80ms, sementara satu
lapisan --dark-canvas menyapu masuk dari kiri menutupi panggung (wipe halus dengan
easing cubic-bezier(.65,0,.35,1), tepi wipe diberi gradien lembut selebar 120px,
bukan garis keras).
Keluar: lapisan menyapu keluar ke kanan sambil teks memudar.

KRITERIA DITERIMA
- Frame 0 dan frame terakhir keduanya transparan penuh (?bg=alpha), supaya kartu ini
  bisa ditumpuk langsung di atas potongan video tanpa perlu memotong klip.
- Total tepat 1600ms untuk semua varian, agar ritmenya seragam.
- Cetak kelima kartu sebagai pratinjau berjajar saat ?preview=all.
```

---

# PROMPT 6 — Kit Overlay untuk Adegan Screencast

Ini yang membuat Act 2–5 tidak terasa seperti rekaman layar mentah: lower-third,
penanda fitur, sorotan kursor, dan pop-up angka yang ditumpuk di atas screencast.

```
[TEMPEL BLOK A DI SINI]
[TEMPEL BLOK B DI SINI]

TUGAS
Buat satu file "kit overlay" berisi tujuh komponen bergerak yang akan ditumpuk di
atas rekaman layar video demo PANTAS. Setiap komponen dipanggil lewat parameter URL
sehingga saya bisa merender puluhan varian tanpa menyentuh kode.
Latar default HARUS ?bg=alpha (transparan) karena ini lapisan overlay.
Sediakan juga ?bg=green untuk chroma key bila editor saya tidak mendukung alpha.

KOMPONEN DAN PARAMETERNYA

1. ?el=lower-third&title=...&sub=...&pos=left|right
   Kartu identitas kiri-bawah, muncul 700ms, tahan sesuai ?hold=ms (default 4000),
   keluar 400ms. Kartu --surface radius 22px, garis aksen vertikal 4px --brand di
   kiri, judul Inter 600 26px, sub mono 16px --ink-subtle.
   Contoh pemakaian: title=Pak Warsono sub=Petani Tomat - Pakem, Sleman
                     title=Rina Pradita sub=Pembeli Industri - PT Sedap Makmur
                     title=Admin Koperasi sub=Perencana Konsolidasi Rute

2. ?el=feature-tag&code=F-13&label=...
   Pil kecil kanan-atas berisi kode fitur dan namanya, masuk dengan slide 20px.
   Contoh: code=F-11 label=Kalibrasi Koin Rp500
           code=F-13 label=Laporan Mutu Human-Readable
           code=F-20 label=Harga Acuan PIHPS
           code=F-40 label=Geolokasi Haversine
           code=F-48 label=Verifikasi Serah Terima Server RPC
           code=F-60 label=Hash Audit SHA-256

3. ?el=spotlight&x=..&y=..&r=..
   Sorotan lingkaran: seluruh panggung diberi lapisan gelap rgba(13,19,16,.55)
   dengan lubang lingkaran di koordinat yang diminta, tepi lubang diberi feather
   40px dan ring 2px --brand-border. Masuk 600ms, radius menyusut dari r+60 ke r.
   Dipakai untuk menyorot bounding box tomat atau badge hash.

4. ?el=callout&x=..&y=..&text=...&dir=up|down|left|right
   Garis penunjuk yang memanjang (stroke-dashoffset) dari titik koordinat menuju
   label teks berlatar --surface radius 14px. Ujung garis diberi titik bulat 8px
   --brand yang berdenyut sekali saat tiba.

5. ?el=stat&value=1.240&unit=kg&label=Pangan Terselamatkan&sub=Setara 482 kg CO2e dicegah
   Kartu angka besar yang menghitung naik, Bricolage 800 96px, tabular-nums.
   Dipakai menimpa dashboard dampak agar angka terasa berbobot.

6. ?el=kbd&keys=Ctrl+Shift+P
   Penanda tombol keyboard di bawah tengah, gaya kapsul --sunken border --line-strong,
   muncul 200ms dan hilang 1200ms kemudian. Untuk memperjelas aksi keyboard.

7. ?el=hash&value=sha256:c28a59b...
   Chip mono lebar dengan ikon gembok sederhana (SVG inline, bukan font ikon),
   masuk dengan reveal per karakter cepat 25ms per karakter lalu berhenti,
   diikuti badge hijau "Terverifikasi Tidak Berubah" yang masuk 300ms setelahnya.

ATURAN BERSAMA
- Semua komponen otomatis menyesuaikan lebar terhadap panjang teks, tanpa pernah
  keluar dari safe-area 96px.
- Semua komponen punya siklus penuh masuk-tahan-keluar dan berhenti sendiri,
  supaya saya tinggal merekam sekali lalu memotong sesuai kebutuhan.
- Tambahkan halaman indeks ?el=index yang menampilkan seluruh komponen sekaligus
  dengan tautan contoh URL siap klik untuk masing-masing.

KRITERIA DITERIMA
- Dengan ?bg=alpha, hasil tangkapan Browser Source OBS benar-benar transparan,
  tanpa kotak putih tersisa di belakang kartu.
- Teks tetap terbaca di atas latar terang maupun gelap (beri bayangan halus).
```

---

# PROMPT 7 — Kartu Penutup (SC-14, 20 detik)

```
[TEMPEL BLOK A DI SINI]
[TEMPEL BLOK B DI SINI]

TUGAS
Buat kartu penutup resmi video demo PANTAS. Total durasi 20000ms tepat, lalu
membeku. Pakai VARIAN GELAP supaya berpasangan dengan bumper pembuka.
Ini frame terakhir yang dilihat dewan juri, jadi harus tenang, rapi, dan mudah
dibaca dari jauh — bukan padat.

TEKS — salin persis
  PANTAS
  Setiap Panen Pantas Dihargai
  Kutipan (dicetak besar, ini inti pesannya):
    "Selisih satu tingkat grade menentukan penghasilan satu keluarga petani.
     Sekarang, selisih itu bisa dihitung, dan bisa dibantah."
  Coba langsung: pantas-ai.vercel.app
  Kode sumber: github.com/astrorehan/pantas
  Audit publik tanpa login: pantas-ai.vercel.app/lacak/[hash]
  Tim Inilah 4 trio - Universitas Gadjah Mada
  HoloDev HOLOGY 9.0 - FILKOM Universitas Brawijaya
  Terima kasih Dewan Juri

SLOT QR
Sediakan kotak 260x260 di kanan bawah area konten (x=1440, y=640) dengan bingkai
putih radius 22px dan padding 16px, berisi placeholder bergaris putus-putus
bertuliskan "QR pantas-ai.vercel.app". Sertakan komentar di dalam kode yang
menjelaskan cara mengganti placeholder ini dengan file PNG QR milik saya lewat
data URI. Jangan mencoba menggambar QR palsu yang tidak bisa dipindai.

PAPAN WAKTU
0.0-1.4s   Panggung masuk dari gelap. Wordmark PANTAS mask-reveal per huruf
           (gerakannya cermin dari bumper pembuka, tapi 30% lebih cepat).
1.4-2.4s   Tagline mask-reveal.
2.4-5.5s   Kutipan masuk baris per baris, stagger 220ms, Bricolage Grotesque 600,
           46px, line-height 1.28, maksimal tiga baris, lebar maksimal 1100px.
           Tanda kutip pembuka digambar besar (120px) sebagai elemen dekoratif
           --dark-line di belakang baris pertama.
5.5-7.5s   Blok tautan masuk: tiga baris dengan ikon SVG sederhana (globe, kode,
           gembok), teks mono 22px --dark-ink, stagger 130ms.
           Bersamaan, kartu QR muncul dengan scale .94 ke 1.
7.5-9.5s   Blok identitas tim dan kompetisi masuk di bawah, dipisah garis tipis.
9.5-11.0s  Baris "Terima kasih Dewan Juri" masuk terakhir, Inter 500 28px,
           warna --brand-border.
11.0-20.0s Diam total. Hanya drift scale 1 ke 1.012 dan satu gradien hijau sangat
           samar yang menguat perlahan dari bawah. Jangan ada gerakan lain —
           bagian ini menemani voiceover penutup dan fade-out BGM di detik ke-18.

TATA LETAK
Kolom kiri (x=160, lebar 1180): wordmark, tagline, kutipan, tautan, identitas.
Kolom kanan (x=1440): kartu QR. Jaga safe-area 96px di semua sisi.

KRITERIA DITERIMA
- Semua tautan terbaca jelas jika video ditonton di layar ponsel.
- Frame ?t=20000 layak dipakai sebagai gambar sampul submisi.
- Sediakan ?variant=light untuk perbandingan.
- Sediakan ?dur=20000 agar durasi total bisa saya ubah tanpa mengedit kode,
  dengan seluruh papan waktu ikut menskala proporsional.
```

---

# PROMPT 8 (opsional) — Ekspor Frame PNG jadi MP4 Mulus

Pakai ini hanya kalau hasil rekaman layar dari HTML terasa patah-patah. Teknik ini
merender setiap frame secara deterministik lewat `?t=`, jadi hasilnya 60fps sempurna.

```
[TEMPEL BLOK B DI SINI]

TUGAS
Buatkan skrip Node.js sekali pakai bernama render-frames.mjs yang:
1. Memakai Playwright (chromium) untuk membuka file HTML lokal berukuran panggung
   1920x1080 pada deviceScaleFactor 1 dan viewport tepat 1920x1080.
2. Untuk setiap frame dari 0 sampai DURASI_MS dengan langkah 1000/60 ms, membuka URL
   file HTML dengan parameter ?rec=1&t=<ms>, menunggu font selesai dimuat
   (document.fonts.ready) dan satu requestAnimationFrame, lalu menyimpan screenshot
   PNG ke folder out/ dengan nama berpadding nol enam digit.
3. Menerima argumen CLI: --file, --dur, --fps, --out.
4. Mencetak progres per 60 frame.

Sertakan juga satu baris perintah ffmpeg untuk menggabungkan hasilnya menjadi
MP4 H.264 yuv420p 60fps kualitas tinggi, dan satu baris alternatif untuk
menghasilkan MOV ProRes 4444 dengan alpha bila frame-nya transparan.

Tulis kode yang ringkas, tanpa dependensi selain playwright, dan sertakan perintah
instalasi di komentar paling atas.
```

---


---

# PROMPT 9 — Thumbnail YouTube

Thumbnail ini punya dua penonton sekaligus: **dewan juri** yang membuka tautan dari
dokumen submisi, dan **algoritma YouTube**. Prioritaskan juri — jangan bergaya
clickbait, tapi tetap harus terbaca saat kecil.

**Aturan teknis YouTube:** 1280×720 px (16:9), maksimal 2 MB, format JPG/PNG.
Yang harus diingat: thumbnail sering tampil sekecil **246×138 px** di sidebar dan
lebih kecil lagi di ponsel. Sudut kanan bawah selalu tertutup badge durasi
(kira-kira 120×40 px) — jangan taruh apa pun yang penting di situ.

```
[TEMPEL BLOK A DI SINI]

TUGAS
Buat thumbnail YouTube untuk video demo produk PANTAS (kompetisi HoloDev HOLOGY 9.0,
Universitas Brawijaya). Keluarkan sebagai satu file HTML mandiri berukuran panggung
1280x720 px, dengan tombol unduh PNG.

Buat TIGA varian dalam satu file, dipilih lewat ?v=1|2|3, supaya saya bisa
membandingkan berdampingan sebelum memutuskan.

VARIAN 1 — "Angka Menampar" (paling kuat untuk YouTube)
- Latar gelap --dark-canvas #0d1310 dengan mesh gradient hijau sangat samar.
- Elemen dominan: angka "62,8%" — Bricolage Grotesque 800, sekitar 210px,
  warna --grade-reject #9e2323 dengan sedikit glow hangat agar tidak tenggelam.
- Di bawahnya, dua baris pendek: "SAYURAN INDONESIA" / "HILANG SEBELUM DIJUAL"
  (Inter 700, 40px, --dark-ink, tracking rapat).
- Di kanan: slot foto tomat berbingkai rounded 28px, miring 3 derajat, dengan
  bounding box hijau --brand bergaya deteksi AI dan label kecil mono
  "GRADE A - 1.840 mm2" menempel di sudut kotak. Ini yang menjual sisi teknisnya.
- Wordmark "PANTAS" kecil di kiri atas + pil "HOLOGY 9.0" di sampingnya.

VARIAN 2 — "Bukti Produk" (paling meyakinkan untuk juri)
- Latar terang --canvas #f6f3ed dengan mesh gradient hangat.
- Elemen dominan: satu kartu rounded 32px berisi slot screenshot laporan grading
  (rasio 16:10), diberi bayangan berlapis hangat sehingga terasa mengambang.
  Kartu dimiringkan 2 derajat dan sedikit terpotong tepi kanan panggung, memberi
  kesan ada lebih banyak yang bisa dilihat di dalam video.
- Di kiri, blok teks rata kiri:
    label kecil mono "DEMO PRODUK - HOLODEV HOLOGY 9.0"
    judul besar "GRADING PANEN" / "PAKAI KOIN Rp500"
    (Bricolage Grotesque 800, 76px, --ink, dua baris)
    satu baris pendukung Inter 500 26px --ink-muted:
    "Computer vision terkalibrasi + audit publik SHA-256"
- Elemen kunci: gambar koin Rp500 dengan garis ukur "27 mm" di sampingnya,
  ditempatkan menimpa sudut kartu. Koin ini metafora produk kami, harus terlihat.

VARIAN 3 — "Identitas Bersih" (paling aman, gaya keynote)
- Latar gelap, komposisi sangat lapang, hampir tidak ada elemen.
- Wordmark "PANTAS" raksasa (Bricolage Grotesque 800, sekitar 150px, --dark-ink)
  dengan tagline "Setiap Panen Pantas Dihargai" di bawahnya.
- Tiga pil grade A / B / C berjajar kecil sebagai aksen.
- Baris kaki: "Tim Inilah 4 trio - Universitas Gadjah Mada" dan
  "HoloDev HOLOGY 9.0 - Universitas Brawijaya".
- Tanpa foto. Kekuatannya di tipografi dan ruang kosong.

ATURAN KETERBACAAN (WAJIB, ini yang paling sering gagal)
- Teks terbesar minimal 110px. Teks terkecil yang masih boleh ada minimal 26px.
  Apa pun di bawah 26px hapus saja — tidak akan terbaca di ponsel.
- Maksimal 6 kata untuk teks utama. Jangan menaruh kalimat panjang.
- Kontras teks terhadap latar minimal rasio 7:1.
- Zona terlarang: kotak 1160,680 sampai 1280,720 (badge durasi YouTube) harus
  benar-benar kosong.
- Safe margin 64px di semua sisi untuk elemen penting.
- Jangan pakai emoji, panah merah melingkar, wajah kaget, atau border neon.
  Nada kami profesional dan ilmiah, bukan clickbait.

SLOT GAMBAR
Setiap slot foto digambar sebagai placeholder bergaris putus-putus dengan label
ukuran pikselnya. Sertakan komentar di kode yang menjelaskan cara mengganti dengan
foto saya sendiri lewat data URI atau path relatif. Foto yang akan saya pakai sudah
ada di repo: web/public/img/contoh/tomato.jpg dan web/public/img/contoh/chili.jpg.
Jangan menggambar ilustrasi tomat vektor — hasilnya akan terlihat murah.

MODE PENGUJIAN — INI PENTING
Sediakan ?test=1 yang menampilkan varian aktif secara berjajar dalam empat ukuran
sekaligus di satu halaman: 1280x720 (penuh), 480x270, 246x138 (ukuran sidebar
YouTube), dan 168x94 (ukuran daftar ponsel). Beri label ukuran di bawah masing-masing.
Kalau teks utama sudah tidak terbaca di 168x94, desainnya gagal dan harus diperbesar.

Sediakan juga ?grid=1 (grid 12 kolom + safe margin + zona terlarang badge durasi)
dan ?mono=1 (render grayscale, untuk menguji apakah komposisi masih bekerja tanpa
bergantung pada warna).

KELUARAN
- Satu file HTML mandiri. Google Fonts boleh, library lain tidak.
- Panggung #stage 1280x720 px, koordinat absolut, diskalakan agar muat di viewport.
- Tombol "Unduh PNG 1280x720" untuk tiap varian. Bangun latar dan bentuk sebagai
  SVG inline supaya bisa diserialisasi ke canvas tanpa library. Untuk foto raster,
  gambar ulang ke canvas lewat drawImage sebelum toBlob.
- Pastikan hasil unduhan di bawah 2 MB. Kalau memakai foto, ekspor sebagai JPEG
  kualitas 0.92, bukan PNG.
- Di akhir jawaban, cetak tabel: varian, ukuran font terbesar, ukuran font terkecil,
  jumlah kata teks utama, dan penilaianmu sendiri apakah lolos uji 168x94.
```

## Kalau hasilnya belum kuat

- "Teks utama masih tenggelam di ukuran 168x94. Perbesar jadi minimal 140px, kurangi
  jadi maksimal 4 kata, dan naikkan kontrasnya."
- "Terlalu banyak elemen. Sisakan hanya satu titik fokus, hapus sisanya."
- "Fotonya terlalu kecil. Perbesar sampai memenuhi 45% lebar panggung dan biarkan
  terpotong tepi, jangan dipaksa muat utuh."
- "Uji ?mono=1 gagal — komposisinya bergantung pada warna. Perbaiki hierarkinya
  lewat ukuran dan kontras, bukan warna."

## Setelah thumbnail jadi

- Unggah lewat YouTube Studio → Details → Thumbnail → Upload file.
  Butuh akun terverifikasi (nomor HP) agar tombol custom thumbnail aktif.
  Verifikasi ini kadang perlu waktu — cek sekarang, jangan menunggu menit terakhir.
- Frame terakhir bumper pembuka (`?t=9000` dari Prompt 2) bisa jadi cadangan
  thumbnail kalau custom thumbnail belum bisa dipakai.
## Cara Merakit di OBS (tanpa perlu editor video)

Ini alasan kenapa Prompt 1 memaksa koordinat absolut: seluruh video bisa dirakit
langsung di OBS, jadi hasil rekaman sudah berbingkai rapi tanpa proses edit.

**Setelan dasar OBS**
- Settings → Video: Base Resolution **1920x1080**, Output Resolution **1920x1080**, FPS **60**.
- Settings → Output → Recording: format `mkv`, encoder NVENC H.264, CQP 18, preset Quality.
  (Konversi ke mp4 lewat File → Remux Recordings setelah selesai — mkv aman kalau OBS crash.)

**Susunan sumber dalam satu scene, dari bawah ke atas**

| Urutan | Sumber | Transform (Edit Transform) |
| :--- | :--- | :--- |
| 1 (bawah) | Image → `latar-a.png` | Pos 0,0 · Size 1920x1080 |
| 2 | Display/Window Capture (browser demo) | Pos **192,126** · Bounding box "Scale to inner bounds" **1536x864** |
| 3 | Filter pada sumber 2: **Image Mask/Blend** → `mask-layar.png`, tipe *Alpha Mask (Alpha Channel)* | membuat sudut rekaman membulat 22px |
| 4 | Video Capture Device (webcam) | Pos **1550,782** · Size **236x236** · Crop agar wajah di tengah |
| 5 | Filter pada sumber 4: **Image Mask/Blend** → `mask-webcam.png` | webcam jadi lingkaran |
| 6 (atas) | Browser Source → `overlay-kit.html?el=lower-third&title=...&bg=alpha` | Pos 0,0 · Size 1920x1080 · centang *Shutdown source when not visible* |

Browser Source di OBS menghormati latar transparan, jadi `?bg=alpha` langsung bekerja —
tidak perlu chroma key sama sekali.

**Scene terpisah yang perlu dibuat**
- `00-BUMPER` → Browser Source `bumper-pembuka.html?rec=1`, 1920x1080.
- `01-MASALAH` → Browser Source `infografis-masalah.html?rec=1`.
- `02-PIPELINE` → Browser Source `diagram-pipeline.html?rec=1`.
- `10-DEMO` → susunan tabel di atas (dipakai ulang untuk semua adegan screencast;
  cukup ganti teks pil act lewat URL Browser Source, atau duplikat scene per act).
- `99-PENUTUP` → Browser Source `kartu-penutup.html?rec=1`.

Rekam per scene, lalu sambung di editor apa pun. Transisi antar scene pakai
`Fade 400ms` di OBS, atau tumpuk kartu transisi dari Prompt 5.

---

## Checklist sebelum take

- [ ] Browser demo: zoom **100%**, bookmark bar disembunyikan (Ctrl+Shift+B), ekstensi
      dimatikan, mode incognito untuk SC-09, jendela diatur tepat 1920x1080.
- [ ] Notifikasi Windows dimatikan (Focus Assist → Alarms only). Wajib — satu pop-up
      Discord bisa membatalkan satu take.
- [ ] Semua file HTML aset dibuka dengan `?rec=1` supaya panel kontrol tidak ikut terekam.
- [ ] Font Google sudah ter-cache: buka setiap file sekali dalam keadaan online sebelum
      merekam, agar tidak ada kedip font di frame awal.
- [ ] Kursor: gerakkan tenang, jeda 0,5–1 detik sebelum setiap klik penting.
- [ ] Audio: BGM akustik instrumental, ducking ke -24 dB saat narator bicara.
- [ ] Durasi total: alur ringkas 3:45 atau alur lengkap 7:30 — keduanya aman di bawah
      batas 10 menit.
- [ ] Nama berkas akhir: `HoloDev_HOLOGY9.0_Inilah 4 trio_PANTAS`.

---

## Kalau hasil dari Claude belum pas

Kalimat perbaikan yang paling sering berhasil, tempel apa adanya:

- "Gerakannya masih terasa murah. Perlambat semua entrance jadi 900ms, ganti easing ke
  cubic-bezier(.16,1,.3,1), dan kurangi jarak translateY jadi maksimal 24px."
- "Terlalu ramai. Hapus semua elemen dekoratif yang tidak menyampaikan informasi,
  perbesar ruang kosong, dan naikkan ukuran judul 20%."
- "Kontras teks kurang. Naikkan --ink-muted ke --ink untuk teks di bawah 20px."
- "Latar terlihat banding saat direkam. Naikkan grain ke 4% dan tambahkan dithering
  halus pada gradien."
- "Blok X keluar dari safe-area. Semua konten harus berada dalam kotak 96,96 sampai
  1824,984. Perbaiki dan tunjukkan ulang tabel koordinatnya."
- "Frame terakhir belum layak jadi thumbnail. Susun ulang komposisi frame ?t=<durasi>
  supaya seimbang dan tunjukkan pratinjaunya."
