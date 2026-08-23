# PANTAS — Prompt Deck Presentasi

Kumpulan prompt untuk membangun **satu slide per prompt** dengan bantuan AI (Claude, ChatGPT, v0, Gamma, Figma Slides — apa pun yang bisa menulis HTML).
Sumber warna & komponen: kodebase `web/src/app/globals.css` + `web/src/components/**`.

**Deck ini seluruhnya terang.** Tidak ada slide berlatar gelap. Irama antar-babak dibangun oleh empat *lantai terang* dengan kepekatan berbeda — KERTAS, OAT, TINT, SUNKEN — bukan oleh pergantian gelap/terang. Penjelasannya ada di BLOK SISTEM, dan tiap brief slide menyebut lantainya sendiri.

## Cara pakai

1. Buka slide yang mau dibuat, misal **S09**.
2. Salin **BLOK SISTEM** (bagian di bawah ini, utuh) → tempel ke chat AI.
3. Lanjutkan dengan menyalin **PROMPT S09** tepat di bawahnya, dalam pesan yang sama.
4. Kirim. Hasilnya satu berkas HTML mandiri berukuran 1920×1080.
5. Ulangi untuk slide berikutnya di **chat baru** (biar tiap slide dirancang segar, bukan menyalin slide sebelumnya).

> Kalau ingin konsistensi visual lebih ketat, sertakan juga HTML slide sebelumnya sebagai referensi — tapi tegaskan: *"pakai token yang sama, tapi arketipe tata letaknya harus berbeda."*

Ekspor: buka HTML di Chrome → Print → Save as PDF → ukuran kustom 1920×1080 px, margin 0, background graphics ON. Gabungkan PDF per slide jadi satu deck.

---

# BLOK SISTEM

> **Salin seluruh blok di bawah ini setiap kali membangun slide.**

```text
=== PANTAS DECK — SISTEM DESAIN (WAJIB DIPATUHI) ===

PERAN
Kamu desainer presentasi senior sekaligus front-end engineer. Kamu membuat SATU slide
untuk presentasi kompetisi (subtema: Ketahanan Pangan dan Pertanian Cerdas — HOLOGY 9.0 HoloDev). Audiens: juri akademik & industri. Bahasa slide: Bahasa Indonesia.
Kualitas yang diminta: setara deck konferensi produk, bukan template rapat kantor.

OUTPUT
- Satu berkas HTML mandiri. Tanpa framework, tanpa CDN, kecuali Google Fonts.
- Kanvas tetap 1920x1080 px (16:9), dibungkus <div class="slide"> position:relative;
  overflow:hidden. Skalakan ke layar dengan
  transform: scale(min(100vw/1920, 100vh/1080)); transform-origin: center center.
- Semua ikon = inline SVG, stroke 1.75px, stroke-linecap/linejoin round, gaya lucide
  (outline, bukan filled). Tanpa emoji, tanpa clip art, tanpa gambar raster.
- Placeholder foto/tangkapan layar = kotak background --sunken, radius md, border 1px
  dashed --line-strong, berisi label mono 18px: [FOTO: deskripsi]. Beri atribut
  data-ganti="..." agar mudah dicari saat diganti aset asli.
- Sertakan catatan penyaji sebagai komentar HTML <!-- SPEAKER: ... --> di akhir berkas.

FONT
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Inter:wght@400..700&family=JetBrains+Mono:wght@400;600&display=swap');
--font-display: 'Bricolage Grotesque', system-ui, sans-serif;   /* judul & angka */
--font-sans:    'Inter', system-ui, sans-serif;                  /* badan teks */
--font-mono:    'JetBrains Mono', ui-monospace, monospace;       /* hash, versi, kode */

PALET — hanya warna di daftar ini. Dilarang menambah warna lain.
DECK INI SELURUHNYA TERANG. Tidak ada slide berlatar gelap, di babak mana pun.

[TOKEN — berlaku di semua slide]
--canvas #f2ede3   --surface #fcfbf8   --overlay #ffffff   --sunken #eae3d7
--ink #1e1b15      --muted #544d40     --label #655c4e
--line #d8cebb     --line-strong #b7a98f
--brand #246634    --brand-deep #1a4d26  --brand-dark #12361b
--brand-tint #eaf6ed  --brand-tint-strong #d2ead8  --on-brand #ffffff
--grade-a #246634  --grade-b #825726   --grade-c #9e3b0a   --grade-reject #9a1c1c
--clay-100 #f3ddc4 --clay-300 #ddae78  --clay-500 #b57c3b  --clay-700 #69451c
--danger-tint #f7dcdc

--field-base #1a4d26  --field-ink #fcfbf8  --field-muted #a7d3b2
--field-active-bg #d2ead8  --field-active-ink #1a4d26

Hijau tanda merek: #338448 (green-500). Hanya untuk logo/aksen dekoratif — JANGAN
dipakai sebagai warna teks (kontrasnya hanya 4,05:1 di atas kartu).
Palet ini hijau daun (hue ~135) dan netral gandum, bukan mint/teal dan bukan abu.

TIGA LANTAI TERANG — pengganti irama gelap/terang
Perpindahan babak ditandai LATAR yang berbeda kepekatan, bukan slide gelap. Tiap
brief menyebut lantainya. Jangan menukar sendiri.

  LANTAI KERTAS — latar #fcfbf8 rata.
    Paling terang, paling sunyi. Untuk pernyataan tunggal dan penutup tenang.
    Kartu di atasnya WAJIB varian flat (border --line): kartu --surface di atas
    latar --surface tidak akan terlihat.

  LANTAI OAT — latar #f2ede3 rata. Lantai kerja, mayoritas slide isi.
    Kartu memakai --surface + shadow e2. Ini kondisi baku.

  LANTAI TINT — latar bergradien
    linear-gradient(140deg, #d2ead8 0%, #eaf6ed 46%, #fcfbf8 100%).
    Untuk hook, pembatas babak, dan penutup. Terbaca "berbeda" tanpa jadi gelap.
    Kartu di atasnya memakai --surface + shadow e3 supaya tetap terangkat.

  LANTAI SUNKEN — latar #eae3d7 rata. Varian tenang dari OAT, untuk slide yang
    harus terasa menahan napas (pertanyaan yang belum dijawab, argumen berpindah
    topik). Kartu --surface + shadow e2; kontras kartu-ke-latar paling tinggi di
    sini, jadi kartunya terasa mengambang lebih jauh.

PITA LADANG — satu-satunya bidang hijau pekat yang diizinkan
Bidang --field-base (#1a4d26) boleh dipakai HANYA sebagai pita/panel aksen,
maksimal 35% luas kanvas, dan TIDAK BOLEH jadi latar slide. Teksnya --field-ink,
sekunder --field-muted, pil aktif --field-active-bg / --field-active-ink.
Gunanya mengutip chrome aplikasi yang asli dan memberi jangkar visual — bukan
untuk menggelapkan slide lewat pintu belakang.

TIPOGRAFI (skala kanvas 1920x1080)
nama          | font    | ukuran/leading | weight | tracking  | catatan
hero-number   | display | 240 / 0.86     | 800    | -0.04em   | angka hook, 1 per deck-babak
display-lg    | display | 112 / 1.02     | 800    | -0.03em   | judul sampul & pembatas
display-md    | display |  76 / 1.06     | 800    | -0.025em  | pernyataan besar, angka statistik
heading       | display |  52 / 1.12     | 700    | -0.015em  | judul slide isi
subheading    | display |  34 / 1.25     | 700    | -0.01em   | judul kartu
body-lg       | sans    |  26 / 1.55     | 400    | 0         | paragraf utama
body          | sans    |  22 / 1.5      | 400    | 0         | isi kartu
caption       | sans    |  17 / 1.45     | 400    | 0         | warna --muted / --label
eyebrow       | sans    |  15            | 700    | 0.12em    | UPPERCASE, warna --label
mono          | mono    |  18 / 1.4      | 400    | 0         | hash, versi model, path berkas
Semua angka statistik: font-variant-numeric: tabular-nums.
Ukuran teks terkecil di slide: 17px. Slide harus terbaca dari jarak 6 meter.

GRID & FURNITUR
- Margin: 104px kiri/kanan, 88px atas, 96px bawah. 12 kolom, gutter 32px.
- Baris atas (y=88): eyebrow slide di kiri; pil babak mono di kanannya bila relevan.
- Garis rambut 1px --line membentang penuh di y=1000.
- Kaki kiri: "PANTAS · Ketahanan Pangan & Pertanian Cerdas" caption --label.
- Kaki kanan: nomor slide mono, format "09/25".
- Slide hook, pembatas babak, dan penutup BOLEH melanggar grid (full-bleed).

RADIUS / ELEVASI
radius: xs 6 · sm 10 · md 20 · lg 28 · xl 36 · full 9999
e2: 0 1px 2px rgb(61 56 46/.09), 0 8px 24px -8px rgb(61 56 46/.12), inset 0 1px 0 rgb(255 255 255/.7)
e3: 0 2px 6px -1px rgb(61 56 46/.09), 0 22px 52px -14px rgb(61 56 46/.14), inset 0 1px 0 rgb(255 255 255/.7)
e4: 0 4px 10px -2px rgb(61 56 46/.10), 0 46px 92px -26px rgb(61 56 46/.18), inset 0 1px 0 rgb(255 255 255/.7)
Bayangannya hangat (rgb 61 56 46), bukan hitam murni — hitam di atas netral gandum
terbaca sebagai noda abu. Hairline inset putih adalah separuh dari ilusi kedalaman:
jangan dihapus.
Di lantai KERTAS, turunkan satu tingkat elevasi (kartu yang di lantai OAT memakai e2
memakai border --line saja di sini) — bayangan di atas latar hampir putih menumpuk
jadi kotor.

MOTION (hanya bila brief slide memintanya)
--ease-out-soft cubic-bezier(.2,.7,.3,1); --ease-spring cubic-bezier(.34,1.4,.64,1)
durasi: 120ms / 220ms / 380ms.
@keyframes rise { from {opacity:0; transform:translateY(14px)} to {opacity:1; transform:none} }
@keyframes grow { from {transform:scaleX(0)} to {transform:scaleX(1)} }  /* origin kiri */
Selalu bungkus: @media (prefers-reduced-motion: reduce) { animation: none !important }

RESEP KOMPONEN — pakai ulang, jangan menciptakan gaya baru
 1. Card raised  — bg --surface, radius md, shadow e2, TANPA border, padding 40.
 2. Card flat    — bg --surface, border 1px --line, radius md, tanpa bayangan.
                   Wajib dipakai untuk panel di DALAM kartu lain.
 3. Card glass   — bg rgba(252,251,248,.72), backdrop-filter: blur(20px) saturate(150%),
                   border 1px rgba(255,255,255,.6), inset 0 1px 0 rgba(255,255,255,.7).
 4. Surface brand — linear-gradient(140deg, var(--brand-tint) 0%, var(--surface) 62%).
                   Dipakai untuk satu kartu penanda di layar, bukan untuk semuanya.
 5. Tombol utama — background: linear-gradient(180deg,
                   color-mix(in srgb, var(--brand) 90%, #fff) 0%, var(--brand) 55%,
                   color-mix(in srgb, var(--brand) 93%, #000) 100%);
                   teks --on-brand, radius md, tinggi 64, padding 0 36, bold, shadow e2.
 6. GradeBadge  — DUA BAGIAN: (a) PELAT persegi 56x56 berisi huruf A/B/C, display 800,
                   ukuran 34, warna --surface, background = warna grade-nya;
                   (b) BADAN bertint (14% warna grade dicampur --surface) berisi kata sifat
                   UPPERCASE 20px bold tracking .09em, warna = warna grade.
                   Radius 10px di sisi kiri; dua sudut KANAN dipangkas 12px dengan
                   clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px,
                   100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%);
                   overflow:hidden. Garis jahitan pemisah: inset -2px 0 0
                   color-mix(in srgb, var(--surface) 55%, transparent).
                   REJECT tanpa huruf: segitiga + arsir
                   repeating-linear-gradient(-45deg, transparent 0 6px, rgb(0 0 0/.3) 6px 12px).
                   Kata sifat: A "PREMIUM", B "STANDAR", C "OLAHAN", REJECT "TOLAK".
                   Bentuk pengaman buta warna: A lingkaran, B belah ketupat, C persegi,
                   REJECT segitiga.
 7. GradeBar    — batang radius-full tinggi 28-40, background --sunken; segmen berwarna
                   grade dipisah gap 4px, masing-masing radius 6; huruf putih di tengah
                   segmen bila lebarnya >= 12%. Legenda di bawah: bentuk + huruf + persen.
 8. Stat tile   — eyebrow (--label) di atas, angka display-md tabular-nums, satuan 60%
                   ukuran angka, keterangan caption di bawah. Bila berjajar, dipisah
                   garis rambut vertikal 1px --line — bukan kotak-kotak terpisah.
 9. Chip/Badge  — tinggi 40, radius full, padding 0 20, 15px bold.
                   neutral: bg --sunken / teks --muted · brand: bg --brand-tint / teks --brand-deep
                   warn: bg --clay-100 / teks --clay-700 · danger: bg --danger-tint / teks #9a1c1c
10. Stepper/Timeline — rel 2px --line; simpul lingkaran 20px; aktif = isi --brand +
                   cincin 8px --brand-tint; selesai = ikon centang; tenggat = mono.
11. Tabel       — header eyebrow di atas garis 1px --line-strong; baris dipisah 1px --line;
                   kolom angka rata kanan + tabular-nums; baris sorot pakai bg --brand-tint.
                   TANPA zebra striping, TANPA garis vertikal.
12. Pita ladang — bilah/panel hijau --field-base, teks --field-ink, sekunder
                   --field-muted, pil aktif bg --field-active-bg teks --field-active-ink.
                   Maksimal 35% luas kanvas. Bukan latar slide.
13. Bingkai ponsel — 428x926 unit, radius 56, bezel 12px --ink, layar bg --canvas,
                   pil notch 120x10 --ink di atas tengah. Untuk cuplikan aplikasi.
14. Sitasi      — caption --label, diawali "Sumber: ", di bawah-kiri blok datanya.
15. Pil babak   — mono 15px uppercase di dalam pil border 1px --line, tinggi 36.

ATURAN WAJIB
- Kontras teks minimal 4,5:1. Jangan menaruh --brand (#246634) sebagai teks tipis di
  atas --sunken, dan jangan menaruh teks --ink di atas pita ladang (pakai --field-ink).
- Latar slide selalu terang. Kalau sebuah brief terasa butuh "slide gelap untuk
  penekanan", jawabannya adalah naik ke lantai TINT atau memasang pita ladang —
  bukan menggelapkan kanvas.
- Satu slide = satu gagasan. Maksimal 6 blok informasi. Maksimal ~55 kata badan teks
  (kecuali slide tabel/rapor).
- Hierarki tegas: 1 elemen dominan, 1 pendukung, sisanya tenang. Kalau semua besar,
  tidak ada yang besar.
- Ruang kosong adalah keputusan desain. Jangan isi 100% kanvas.
- Format angka Indonesia: desimal koma (97,4%), ribuan titik (9.790), mata uang
  "Rp106 triliun". Persentase selalu pakai koma, bukan titik.
- Istilah teknis tetap apa adanya: YOLOv11, mAP50, F1-score, SHA-256, FastAPI,
  Supabase, Next.js, OpenCV, Docker, PWA.
- Salin angka data PERSIS dari brief. Dilarang membulatkan, menambah, atau mengarang.

LARANGAN KERAS
- Gradien ungu/biru/cyan gaya "AI SaaS", glow neon, mesh gradient, bayangan berwarna.
- Emoji, ikon 3D, stock illustration, mencampur ikon outline dengan ikon filled.
- Deret bullet titik-bulat lebih dari 4 baris — ubah jadi kartu, kolom, atau tabel.
- Teks di atas foto tanpa lapisan gelap (scrim) minimal 45%.
- Font selain tiga yang ditentukan. Italic pada font display.
- Hijau di luar ramp yang diberikan (jangan #22c55e, jangan emerald/teal Tailwind).
- Latar gelap, latar hitam, dark mode, "night theme", inversi warna penuh. Deck ini
  terang seluruhnya.
- Judul slide berupa kata benda telanjang ("Fitur", "Teknologi"). Judul harus menyatakan
  sesuatu ("Empat komoditas, empat model spesialis").
- Meniru tata letak slide sebelumnya. Tiap slide punya arketipe sendiri (lihat brief).

=== AKHIR BLOK SISTEM ===
```

---

# PETA DECK

23 slide utama + 3 lampiran. Semuanya terang. Kolom **Lantai** yang membangun irama
babak (TINT untuk pembuka/pembatas/penutup, SUNKEN untuk jeda, KERTAS untuk sunyi,
OAT untuk kerja). Kolom **Arketipe** sengaja tidak pernah berulang.

**Babak DEMO hanya satu slide (S17).** Demo dijalankan langsung di aplikasi web
`pantas-ai.vercel.app`, bukan di dalam deck — jadi deck tidak perlu slide pendamping
per peran, tidak perlu bingkai panggung kosong, dan tidak perlu storyboard tangkapan
layar. S17 tampil sebelum penyaji pindah ke browser dan tampil lagi setiap kali ia
kembali; agenda tiga alur dan kredensial ada di situ semua.

| # | Slide | Babak | Lantai | Arketipe tata letak |
|---|---|---|---|---|
| S01 | Angka yang hilang | Hook | **TINT** | Angka penuh layar (tipografi sebagai gambar) |
| S02 | Sayuran, korban terbesar | Hook | **KERTAS** | Belah diagonal + batang proporsi 62,8% |
| S03 | PANTAS — sampul | Hook | **TINT** + pita ladang | Sampul terbelah: wordmark kiri, metadata kanan |
| S04 | Lima retakan | Masalah | OAT | Kisi 5 kartu asimetris (1 besar + 4) |
| S05 | Anatomi satu tawar-menawar | Masalah | OAT | Alur horizontal + kebocoran nilai |
| S06 | Empat pertanyaan | Masalah | **SUNKEN** | Kartu bernomor besar, jawaban ditahan |
| S07 | Tesis produk | Solusi | **KERTAS** + panel surface-brand | Satu kalimat besar di tengah |
| S08 | Dari foto ke serah terima | Solusi | OAT | Rel stepper 6 simpul |
| S09 | Mesin dua tahap | Solusi | OAT | Diagram kotak-dan-panah |
| S10 | Koin Rp500 | Solusi | **KERTAS** | Detail hero + garis ukur teknis (blueprint) |
| S11 | Harga yang bisa dibantah | Solusi | OAT | Kartu rumus + mock UI slider |
| S12 | Bukti yang tidak bisa diubah | Solusi | OAT | Hash monospace raksasa + kartu lacak |
| S13 | Jalan pulang muatan | Solusi | OAT | Peta rute sebelum/sesudah + kunci serah terima |
| S14 | Rapor YOLO-1 | Bukti | OAT | Tabel + batang mAP50 |
| S15 | Rapor YOLO-2 | Bukti | OAT | Empat cincin akurasi + catatan jujur |
| S16 | Peta subtema & teknologi | Bukti | OAT | Matriks 2 kolom + strip stack |
| S17 | SESI DEMO (satu-satunya) | Demo | **TINT** + pita ladang | Pembatas full-bleed + papan kendali demo |
| S18 | Siapa yang diuntungkan | Dampak | OAT | Empat kolom pemangku kepentingan |
| S19 | Dampak keberlanjutan | Dampak | **SUNKEN** | Rantai sebab-akibat + angka CO2e |
| S20 | Kendala yang kami buka | Dampak | OAT | Tiga kartu masalah→bukti→tindakan |
| S21 | Peta jalan | Masa depan | OAT | Tiga horizon sebagai lajur miring |
| S22 | Penutup | Penutup | **TINT** | Pernyataan + tautan demo |
| S23 | Terima kasih | Penutup | **KERTAS** | Kartu QnA + daftar pustaka kecil |
| A01 | Tim Inilah 4 trio | Lampiran | OAT | Tiga kartu profil |
| A02 | Tahapan pengembangan | Lampiran | OAT | Enam fase + angka rekayasa |
| A03 | Pustaka & lampiran | Lampiran | **KERTAS** | Daftar dua kolom |

---

# PROMPT PER SLIDE

## S01 — Angka yang hilang

```text
=== BRIEF SLIDE 01 dari 23 ===
BABAK: HOOK  ·  LANTAI: TINT  ·  ARKETIPE: angka penuh layar

TUJUAN
Slide pembuka dingin. Belum ada logo, belum ada nama tim. Juri harus terdiam tiga
detik sebelum penyaji bicara. Satu angka, satu kalimat, tidak ada yang lain.

TATA LETAK
Angka "Rp106–205 TRILIUN" ditulis sebagai hero-number, memenuhi lebar kanvas dari
margin kiri ke margin kanan (setel ukuran font sampai benar-benar pas, boleh
sampai 220–260px, dua baris: "Rp106–205" di baris pertama, "TRILIUN" di baris kedua
dengan tracking dilebarkan 0.02em). Warna --ink (#1e1b15). Kata "TRILIUN" diberi
warna --brand-deep (#1a4d26) untuk memisahkan satuan dari besaran — cukup pekat
untuk lolos kontras di atas latar tint.
Di bawahnya, satu baris body-lg warna --muted:
  "Nilai pangan yang hilang di Indonesia. Setiap tahun."
Di atas angka, eyebrow: "FOOD LOSS INDONESIA"
Sitasi di kaki kiri: "Sumber: Bappenas, Waste4Change & WRI Indonesia (2021)"
Kaki kanan: nomor slide "01/25" mono.

DIREKTIF VISUAL
- Latar lantai TINT: linear-gradient(140deg, #d2ead8 0%, #eaf6ed 46%, #fcfbf8 100%).
  Sudut kiri-atas paling hijau, sudut kanan-bawah hampir putih — arah gradien ini
  membuat angka (rata kiri) duduk di bagian terpekat.
- Tekstur bedengan: 40–60 garis vertikal tipis 1px warna rgba(36,102,52,.07), jarak
  tak beraturan, hanya di sepertiga bawah kanvas, memudar ke atas dengan
  mask-image linear-gradient(to top, black, transparent).
- Di kanan-bawah kanvas: siluet 4 komoditas (cabai, tomat, timun, wortel) digambar
  sebagai outline tipis SVG 1.5px warna rgba(36,102,52,.12), ukuran ~180px,
  tumpang tindih halus — penanda visual bahwa masalah besar ini bekerja di tingkat kebun.

LARANGAN SLIDE INI
Dilarang menaruh logo, nama tim, atau dekorasi lain. Slide ini harus terasa sunyi.

SPEAKER: "Seratus enam sampai dua ratus lima triliun rupiah. Itu yang hilang setiap tahun."
```

## S02 — Sayuran, korban terbesar

```text
=== BRIEF SLIDE 02 dari 23 ===
BABAK: HOOK  ·  LANTAI: KERTAS  ·  ARKETIPE: belah diagonal + batang proporsi

TUJUAN
Menyempitkan angka raksasa slide sebelumnya ke satu kategori komoditas — tempat
PANTAS bekerja. Ini slide yang membuat masalahnya terasa spesifik, bukan makro.

TATA LETAK
Kanvas dibelah garis diagonal halus (dari kiri-bawah ke kanan-atas, kemiringan
~12 derajat) memakai clip-path; bidang kiri-atas #fcfbf8 (kertas), bidang
kanan-bawah #eaf6ed (tint muda). Garis batasnya sendiri 1px --line.
Perbedaan dua bidang ini hanya 1,08:1 — memang sengaja nyaris tak terlihat, seperti
lipatan kertas. Yang membelah slide sebenarnya adalah isinya, bukan warnanya.

KIRI (kolom 1–6):
  eyebrow "KOMODITAS PENYUMBANG TERBESAR"
  angka display besar (ukuran ~180px) "62,8%"  warna --ink,
  di bawahnya body-lg --muted:
    "dari total pasokan sayuran domestik hilang sebelum sampai ke konsumen."
  Sitasi: "Sumber: Kajian Food Loss and Waste Indonesia (2021)"

KANAN (kolom 7–12): batang proporsi vertikal setinggi 620px, lebar 240px,
  radius lg, background --sunken. Bagian bawah 62,8% diisi warna --grade-reject
  (#9a1c1c) dengan arsir repeating-linear-gradient(-45deg, transparent 0 8px,
  rgba(0,0,0,.22) 8px 16px) — arsir yang sama dengan penanda REJECT di produk.
  Sisa 37,2% di atas diisi --grade-a (#246634) polos.
  Label melekat di sisi kanan batang: "HILANG 62,8%" dan "SAMPAI 37,2%",
  eyebrow + mono warna --ink, dengan garis penunjuk 1px --line-strong.
  Batang diberi shadow e2 supaya terangkat dari lantai kertas.

STRIP BAWAH (di atas garis kaki): tiga angka pendukung berjajar, dipisah garis
rambut vertikal, gaya Stat tile ringkas:
  "12 juta ton" / "food loss Indonesia per tahun (FAO, 2023)"
  "14%" / "pangan hilang sebelum pasar di negara berkembang (FAO)"
  "40–60%" / "kehilangan hasil panen di sektor hortikultura"

DIREKTIF VISUAL
- Batang boleh dianimasikan dengan keyframe grow versi vertikal (scaleY, origin bawah),
  durasi 380ms, delay 200ms.
- Angka 62,8% harus jadi objek terbesar kedua setelah batang. Jangan biarkan strip
  bawah bersaing — turunkan ke ukuran caption + display kecil.

LARANGAN SLIDE INI
Jangan pakai pie chart. Jangan pakai ikon sayur di sini (disimpan untuk S14).

SPEAKER: "Dan yang paling besar hilangnya justru sayuran — komoditas yang kami pilih."
```

## S03 — Sampul PANTAS

```text
=== BRIEF SLIDE 03 dari 23 ===
BABAK: HOOK  ·  LANTAI: TINT + pita ladang  ·  ARKETIPE: sampul terbelah

TUJUAN
Sampul resmi. Baru di sini identitas muncul — setelah masalahnya ditegakkan.

TATA LETAK
Dua bidang vertikal tanpa garis pemisah, dibedakan oleh kepadatan isi saja.

KIRI (kolom 1–7), rata kiri, blok diposisikan di sepertiga atas–tengah:
  eyebrow "PANTAS · KETAHANAN PANGAN DAN PERTANIAN CERDAS"
  wordmark "PANTAS" — display-lg diperbesar ke ~190px, weight 800, tracking -0.04em,
  warna --ink. Huruf "A" pertama diberi perlakuan khusus: palang horizontalnya
  diganti bentuk daun/miring 12 derajat berwarna #338448 (gambar sebagai SVG overlay
  presisi, bukan emoji). Kalau sulit presisi, alternatif: titik daun kecil di atas
  huruf A. Harus rapi — kalau tidak yakin rapi, biarkan wordmark polos.
  Di bawahnya, subheading warna --brand-deep (#1a4d26):
    "Platform Sistem Sortasi Sayur Cerdas & Marketplace Hortikultura"
  Lalu satu kalimat body-lg --muted, maksimal dua baris:
    "Mengubah penilaian mutu panen dari taksiran mata menjadi pengukuran yang
     bisa diaudit."

KANAN (kolom 8–12), rata kiri di dalam kolomnya, disusun sebagai daftar metadata
dengan garis rambut 1px --line di antara barisnya (gaya kolofon buku, BUKAN kartu):
  TIM            Inilah 4 trio
  INSTITUSI      Universitas Gadjah Mada
  PROGRAM STUDI  Teknologi Informasi, Fakultas Teknik
  ANGGOTA        Muhammad Choirudin Ammar · AI Engineer
                 Muhammad Raihan Surya · Fullstack Developer
                 Ahmad Rafi Firdaus · Konseptor & Product Ideation
  DEMO           pantas-ai.vercel.app
Label kolom kiri pakai eyebrow --label; nilainya body warna --ink.

DIREKTIF VISUAL
- Latar lantai TINT sama seperti S01, lengkap dengan tekstur bedengan halus, supaya
  tiga slide hook terbaca sebagai satu babak.
- PITA LADANG: pasang bilah hijau --field-base (#1a4d26) setinggi 140px yang
  membentang penuh di kaki kanvas, menempel ke tepi bawah. Di dalamnya, rata kiri,
  empat ikon komoditas outline (cabai, tomat, timun, wortel) ukuran 44 warna
  --field-muted (#a7d3b2) dengan jarak 28px; rata kanan, teks mono --field-ink:
  "pantas-ai.vercel.app". Pita ini mengutip chrome aplikasi yang asli dan memberi
  sampul satu jangkar pekat — sekitar 13% luas kanvas, jauh di bawah batas 35%.
- Furnitur kaki (nama deck + nomor slide) pindah ke DALAM pita, warna --field-muted.

LARANGAN SLIDE INI
Jangan pakai kartu bershadow di slide ini. Jangan menaruh tangkapan layar aplikasi.
Jangan menaikkan tinggi pita melebihi 180px — begitu ia melewati seperempat kanvas,
sampulnya berhenti terbaca sebagai slide terang.

SPEAKER: "Nama tim kami Inilah 4 trio. Produk kami PANTAS."
```

## S04 — Lima retakan

```text
=== BRIEF SLIDE 04 dari 23 ===
BABAK: MASALAH  ·  TEMA: OAT (canvas #f2ede3)  ·  ARKETIPE: kisi 5 kartu asimetris

TUJUAN
Memecah "food loss" jadi lima kegagalan konkret yang bisa ditunjuk satu per satu.
Kartu pertama paling besar karena itulah yang diserang langsung oleh PANTAS.

TATA LETAK
Judul slide (heading): "Lima retakan yang berulang di rantai pasok hortikultura"
Eyebrow: "TEMUAN LAPANGAN"
Di bawahnya, kisi CSS 12 kolom:
  - Kartu 1 membentang kolom 1–5 dan DUA baris (tinggi penuh area isi). Varian
    surface-brand + shadow e3. Ini kartu pahlawan.
  - Kartu 2 & 3 di kolom 6–12, baris 1 (masing-masing lebar setara 3,5 kolom).
  - Kartu 4 & 5 di kolom 6–12, baris 2.
  Semua kartu selain kartu 1 memakai Card raised biasa (shadow e2).

ISI KARTU (judul subheading + isi body, plus nomor besar mono 01–05 di pojok
kanan-atas kartu warna --line-strong, ukuran 40):
01  Mutu dinilai dengan mata, bukan ukuran
    Tengkulak menaksir grade sekilas pandang, dan petani tidak punya alat bantah.
    Selisih satu tingkat grade pada cabai berarti selisih signifikan pada harga
    jual per kilogram.
02  Asimetri informasi harga
    Petani tahu harga di tingkat petani, tapi tidak tahu harga acuan pasar hari itu —
    dan tidak punya cara menghubungkan mutu panennya ke harga itu secara kuantitatif.
03  Grade rendah dibuang, bukan dialihkan
    Panen yang tak lolos standar pasar segar dibiarkan membusuk, padahal industri
    olahan (saus, keripik, pakan) menerimanya dengan harga yang tetap positif.
04  Logistik terfragmentasi
    Petani kecil mengirim sendiri-sendiri dalam volume kecil; biaya angkut per
    kilogram membengkak dan sebagian panen rusak di jalan tanpa rantai dingin.
05  Klaim mutu tak bisa diverifikasi
    Tanpa bukti yang dapat diaudit, pembeli mendiskon harga sebagai asuransi risiko —
    dan diskon itu ditanggung petani.

DIREKTIF VISUAL
- Tiap kartu diberi satu ikon outline 32px di kiri judulnya: 01 mata, 02 grafik
  harga, 03 keranjang dibuang, 04 truk, 05 dokumen bercentang. Warna --brand.
- Kartu 1 mendapat perlakuan tambahan: di bawah teksnya, satu baris GradeBadge
  ukuran kecil berisi A dan B bersebelahan dengan tanda panah dan teks mono
  "selisih 1 tingkat = selisih harga" warna --muted.
- Jarak antar kartu 28px. Padding kartu 36px. Kartu 1 padding 44px.

LARANGAN SLIDE INI
Jangan menyeragamkan lima kartu jadi lima kotak identik — asimetri adalah intinya.

SPEAKER: "Kelima ini bukan hipotesis kami. Ini yang kami dengar berulang."
```

## S05 — Anatomi satu tawar-menawar

```text
=== BRIEF SLIDE 05 dari 23 ===
BABAK: MASALAH  ·  TEMA: OAT  ·  ARKETIPE: alur horizontal + kebocoran nilai

TUJUAN
Menunjukkan retakan #1 dan #5 sebagai satu peristiwa yang bisa dibayangkan: satu
karung cabai, dari panen sampai dibayar, dan di titik mana nilainya bocor.

TATA LETAK
Judul (heading): "Satu karung cabai, empat titik nilai bocor"
Eyebrow: "HARI INI, TANPA PANTAS"

Bagian utama: rel horizontal setinggi 4px warna --line membentang dari kolom 1
sampai 12 di ketinggian tengah kanvas. Di atas rel, EMPAT simpul (lingkaran 24px,
isi --surface, border 3px --line-strong) berjarak sama, masing-masing dengan
label di ATAS rel dan konsekuensi di BAWAH rel.

  Simpul 1  ATAS: "Panen"        BAWAH: —
  Simpul 2  ATAS: "Ditaksir mata" BAWAH: kartu flat kecil, nada danger:
            "Grade diturunkan sepihak. Tidak ada alat bantah."
  Simpul 3  ATAS: "Harga ditawar" BAWAH: kartu flat kecil, nada danger:
            "Acuan pasar tidak diketahui petani."
  Simpul 4  ATAS: "Grade rendah dipisah" BAWAH: kartu flat kecil, nada danger:
            "Dibuang, karena tidak ada kanal pembeli."
  Simpul 5  ATAS: "Dibayar"      BAWAH: kartu flat kecil, nada danger:
            "Didiskon sebagai asuransi risiko mutu."
  (jadikan LIMA simpul; sesuaikan judul menjadi "lima titik" bila lebih pas —
   tapi pertahankan judul yang menyatakan jumlahnya dengan benar.)

Simpul 2, 3, 4, 5 diberi cincin luar 8px --danger-tint agar terbaca sebagai titik
bocor. Simpul 1 netral.

Di bawah rel, sebuah "meteran nilai" horizontal: batang tinggi 20, radius full,
background --brand-tint-strong, dengan empat potongan berarsir (--danger-tint dengan
arsir diagonal rgba(154,28,28,.35)) yang secara visual memakan batang itu dari kiri ke kanan sejajar dengan
simpul 2–5. Beri label di ujung kanan: "yang sampai ke petani" mono --muted.

DIREKTIF VISUAL
- Palet slide ini harus terasa lebih redup dari S04: dominan oat + clay + danger-tint,
  hijau hanya muncul di ujung kiri meteran. Slide berikutnya baru menghijau kembali.
- Animasi opsional: kebocoran muncul berurutan, delay 120ms per simpul.

LARANGAN SLIDE INI
Jangan menampilkan solusi apa pun. Slide ini murni diagnosis.

SPEAKER: "Perhatikan: tidak satu pun dari empat kebocoran ini soal produktivitas
tanam. Semuanya soal informasi."
```

## S06 — Empat pertanyaan

```text
=== BRIEF SLIDE 06 dari 23 ===
BABAK: MASALAH  ·  LANTAI: SUNKEN (#eae3d7)  ·  ARKETIPE: kartu bernomor besar,
jawaban ditahan

TUJUAN
Mengunci rumusan masalah sebagai empat pertanyaan yang akan dijawab satu per satu
di babak solusi. Slide ini adalah kontrak dengan juri. Lantai SUNKEN dipilih karena
ini satu-satunya slide yang isinya menggantung — latar yang lebih pekat dari OAT
membuat kartunya terbaca mengambang lebih jauh, dan ruangan ikut menahan napas.

TATA LETAK
Judul (heading, warna --ink): "Empat pertanyaan yang kami pilih untuk dijawab"
Eyebrow: "RUMUSAN PERMASALAHAN"
Empat kartu berjajar horizontal (masing-masing 3 kolom, gap 28), tinggi seragam
480px, background --surface (#fcfbf8), radius lg, shadow e3, padding 40, TANPA
border. Kontras kartu-ke-latar di lantai SUNKEN adalah yang tertinggi di seluruh
deck — manfaatkan, jangan tambahi garis.

Tiap kartu:
  - Angka besar "01"–"04" display 800 ukuran 96, warna --line (#d8cebb),
    diposisikan di atas, seolah watermark yang menempel di sudut kiri-atas.
  - Teks pertanyaan body-lg warna --ink, diletakkan di BAWAH kartu (align-self:end),
    sehingga ada ruang kosong besar di tengah kartu. Ruang kosong itu disengaja:
    jawabannya belum ada.
  - Tanda tanya besar "?" display 800 ukuran 64 warna --brand (#246634), diletakkan
    tepat di atas teks pertanyaan.

ISI:
01 Bagaimana mengubah penilaian mutu dari taksiran visual yang subjektif menjadi
   pengukuran yang objektif, murah, dan dapat diaudit?
02 Bagaimana menjembatani asimetri informasi harga antara petani dan pembeli
   industri secara transparan, berdasarkan mutu yang telah diukur?
03 Bagaimana membuka kanal pasar bagi panen bermutu rendah agar tidak sekadar
   dibuang atau membusuk?
04 Bagaimana menjaga efisiensi logistik dan ketertelusuran produk dalam proses
   tersebut, sesuai sasaran subtema?

Kaki: satu baris caption --muted di bawah kartu:
  "Empat pertanyaan ini kami jawab berturut-turut di slide 08 sampai 12."

DIREKTIF VISUAL
- Latar SUNKEN rata, TANPA tekstur bedengan dan tanpa gradien. Ketiadaan tekstur
  inilah yang memisahkan babak masalah dari babak hook.
- Kaki: satu baris caption --muted di bawah kartu.

LARANGAN SLIDE INI
Jangan menuliskan jawaban, walau sebagian. Jangan menaruh ikon.

SPEAKER: "Empat pertanyaan. Sisa presentasi ini adalah empat jawaban."
```

## S07 — Tesis produk

```text
=== BRIEF SLIDE 07 dari 23 ===
BABAK: SOLUSI  ·  LANTAI: KERTAS dengan panel surface-brand  ·  ARKETIPE: pernyataan
tunggal

TUJUAN
Titik balik deck. Satu kalimat yang, kalau juri hanya mengingat satu slide, inilah
slide itu. Tidak ada fitur, tidak ada arsitektur, tidak ada angka.

TATA LETAK
Lantai kanvas KERTAS (#fcfbf8) rata. Di atasnya, satu panel besar surface-brand
(linear-gradient(140deg, #d2ead8 0%, #eaf6ed 55%, #fcfbf8 100%)) dengan margin luar
64px dan radius xl, mengambang dengan shadow e4. Panel ini adalah "kartu" tunggal
seukuran hampir seluruh layar — hijau mudanya yang memisahkannya dari lantai kertas,
bukan bayangannya.

Di dalam panel, rata kiri, blok teks di kolom 2–10:
  eyebrow --brand-deep: "IDE DASAR"
  Kalimat utama, display-md (ukuran ~82px), warna --ink, maksimal empat baris:
    "PANTAS mengubah penilaian mutu panen dari negosiasi subjektif menjadi
     pengukuran objektif berbasis computer vision yang dapat diaudit."
  Kata "negosiasi subjektif" diberi coretan tipis (text-decoration: line-through,
  ketebalan 3px, warna --line-strong).
  Kata "pengukuran objektif" dan "dapat diaudit" diberi latar sorot
  --brand-tint-strong dengan padding 0 10px dan radius sm — sorot, bukan warna teks.

Di bawah kalimat, satu baris pendukung body-lg --muted:
  "Petani memotret panennya dengan koin Rp500 sebagai referensi skala. Sisanya
   dikerjakan mesin, dan setiap keputusannya bisa ditelusuri."

Di pojok kanan-bawah panel: rangkaian GradeBadge lengkap (A PREMIUM, B STANDAR,
C OLAHAN, REJECT TOLAK) disusun menurun bertingkat (staircase, tiap badge digeser
32px ke kiri dari yang di atasnya), ukuran sedang, opacity 100%. Ini satu-satunya
elemen grafis.

DIREKTIF VISUAL
- Rasio ruang kosong di panel minimal 40%.
- Jangan menaruh garis kaki/nomor slide di dalam panel — letakkan di kanvas di
  bawah panel.

LARANGAN SLIDE INI
Jangan menambahkan daftar fitur, ikon, atau diagram apa pun.

SPEAKER: "Kata kuncinya bukan 'AI'. Kata kuncinya 'dapat diaudit'."
```

## S08 — Dari foto ke serah terima

```text
=== BRIEF SLIDE 08 dari 23 ===
BABAK: SOLUSI  ·  TEMA: OAT  ·  ARKETIPE: rel stepper enam simpul

TUJUAN
Menunjukkan bahwa PANTAS adalah alur ujung-ke-ujung, bukan demo grading yang berdiri
sendiri. Jawaban atas pertanyaan 02, 03, dan 04 sekaligus.

TATA LETAK
Judul (heading): "Satu alur, dari rana kamera sampai serah terima"
Eyebrow: "ALUR UJUNG-KE-UJUNG"

Rel stepper horizontal setinggi 3px warna --line di tengah kanvas, dengan bagian
kiri sampai simpul 3 diwarnai --brand (menandakan bagian yang berjalan otomatis).
ENAM simpul lingkaran 56px: isi --surface, border 3px --brand, di dalamnya ikon
outline 26px warna --brand.

Label di ATAS simpul: subheading (nama langkah). Keterangan di BAWAH simpul:
caption --muted maksimal 2 baris, lebar maksimal 220px.

  1  PINDAI          ikon kamera
     Foto panen + koin Rp500 sebagai acuan skala.
  2  GRADING         ikon kisi/scan
     Komposisi A/B/C/REJECT per objek, dengan alasan yang bisa dibaca manusia.
  3  HARGA WAJAR     ikon label harga
     Rentang harga diturunkan dari komposisi grade; rumusnya terbuka.
  4  LISTING         ikon etalase
     Auto-listing ke marketplace pembeli industri, termasuk kanal grade B/C.
  5  LOGISTIK        ikon truk
     Penjemputan terkonsolidasi multi-petani + checklist rantai dingin.
  6  SERAH TERIMA    ikon centang-perisai
     Verifikasi kode saat transaksi ditutup, tercatat di riwayat.

Di bawah rel (sepertiga bawah kanvas), tiga chip mendatar rata tengah menandai
siapa yang bekerja di tiap rentang:
  chip brand   "1–2 · Mesin"
  chip neutral "3–4 · Petani memutuskan"
  chip warn    "5–6 · Petani & pembeli"
Ketiganya diberi garis penghubung tipis ke rentang simpul yang sesuai.

DIREKTIF VISUAL
- Simpul 1 diberi cincin luar 10px --brand-tint sebagai penanda titik mulai.
- Animasi opsional: rel tumbuh dari kiri (keyframe grow, 380ms), simpul muncul
  berurutan delay 80ms.

LARANGAN SLIDE INI
Jangan menampilkan tangkapan layar. Jangan lebih dari 2 baris keterangan per simpul.

SPEAKER: "Perhatikan langkah 4. Di situlah grade C berhenti jadi sampah."
```

## S09 — Mesin dua tahap

```text
=== BRIEF SLIDE 09 dari 23 ===
BABAK: SOLUSI  ·  TEMA: OAT  ·  ARKETIPE: diagram kotak-dan-panah

TUJUAN
Slide paling teknis di babak solusi. Menjelaskan arsitektur dual-stage dan mengapa
rule engine berada di tengah — bukan di ujung.

TATA LETAK
Judul (heading): "Dua model YOLOv11, satu rule engine di antaranya"
Eyebrow: "AI GRADING ENGINE"

Diagram mengalir kiri ke kanan, satu baris, lima blok, dihubungkan panah 2px
--line-strong dengan kepala panah segitiga kecil:

  [FOTO]  →  [YOLO-1 · SEGMENTASI]  →  [RULE ENGINE · GEOMETRI]  →  [GRADE]
                                              ↑
                                   [YOLO-2 · KLASIFIKASI]  (veto)

  Blok FOTO: kartu flat kecil berisi placeholder foto 160x160 + label mono
    "input: foto batch + koin Rp500".
  Blok YOLO-1: Card raised, judul subheading "YOLO-1 · Segmentasi",
    isi body: "Memotong tiap objek dari latar belakang (auto-masking)."
    chip brand di bawahnya: "Ultralytics YOLOv11".
  Blok RULE ENGINE: Card raised varian surface-brand, PALING BESAR (lebar 1,4x
    blok lain), judul "Rule Engine · Geometri (OpenCV)",
    isi body: "Menghitung panjang, rasio, kebulatan (circularity), dan solidity
    dari kontur terkalibrasi." Di bawahnya, empat chip neutral berjajar:
    "panjang" "rasio" "circularity" "solidity".
    Ditambah satu baris mono --muted: "aturan disimpan sebagai JSON per komoditas —
    bisa disetel ulang tanpa melatih ulang model."
  Blok YOLO-2: Card raised, diletakkan DI BAWAH rule engine, dengan panah ke ATAS
    menuju rule engine, diberi label pada panah: "VETO" (chip nada danger).
    Judul "YOLO-2 · Klasifikasi", isi: "Memeriksa kesehatan permukaan (busuk/sehat).
    Objek sakit tidak bisa diselamatkan oleh geometri sebagus apa pun."
  Blok GRADE: kolom vertikal berisi empat GradeBadge (A, B, C, REJECT) lengkap,
    ditumpuk dengan gap 12px, plus satu baris mono di bawahnya:
    "+ alasan yang bisa dibaca manusia  + hash SHA-256".

Kaki slide: satu baris caption --label:
  "Dilatih terpisah per komoditas: empat model spesialis, bukan satu model umum.
   Alasannya di slide 22."

DIREKTIF VISUAL
- Panah horizontal berwarna --line-strong; panah VETO berwarna --grade-reject dan
  bergaya putus-putus (dasharray 8 6) supaya terbaca sebagai jalur kendali,
  bukan jalur data.
- Semua blok sejajar secara vertikal di tengah kecuali YOLO-2 yang sengaja turun.

LARANGAN SLIDE INI
Jangan menggambar arsitektur jaringan saraf (layer, neuron). Jangan menaruh kode.

SPEAKER: "Model kedua tidak menilai bagus atau jelek. Tugasnya cuma satu:
membatalkan. Itu yang membuat grade A kami bisa dipertanggungjawabkan."
```

## S10 — Koin Rp500

```text
=== BRIEF SLIDE 10 dari 23 ===
BABAK: SOLUSI  ·  LANTAI: KERTAS  ·  ARKETIPE: detail hero + garis ukur teknis

TUJUAN
Satu slide untuk satu ide kecil yang menyelamatkan seluruh sistem: alat kalibrasi
yang sudah ada di saku setiap petani. Ini slide "aha" — perlakukan sebagai lembar
gambar kerja, bukan poster produk.

TATA LETAK
Lantai KERTAS (#fcfbf8) rata — putih kertas kalkir, tempat anotasi teknis memang
hidup. Tambahkan kisi milimeter sangat samar di seluruh kanvas: garis 1px warna
rgba(36,102,52,.05) tiap 40px pada dua sumbu, plus garis tiap 200px sedikit lebih
pekat rgba(36,102,52,.09). Ini yang membuat slide terbaca sebagai lembar ukur.

Di tengah-kiri, objek hero: lingkaran koin diameter 420px digambar sebagai SVG —
cincin luar 8px --clay-500, isi gradien radial dari #ddae78 ke #b57c3b, teks "Rp500"
display 800 di tengah warna #3c2810, dan gerigi tepi (48 garis pendek radial) untuk
memberi kesan koin. Bukan foto. Beri shadow e2 agar koin duduk di atas kertas.

Di sekeliling koin, anotasi teknis gaya gambar kerja (blueprint):
  - Garis ukur horizontal melintasi diameter koin, dengan ujung panah di kedua sisi,
    warna --brand (#246634), 1,5px, dan label mono di atasnya:
    "Ø 27,0 mm · acuan skala".
  - Garis penunjuk (leader line) 1px putus-putus --line-strong dari tepi koin ke
    kanan menuju tiga kartu keterangan bertumpuk (Card flat: bg --surface, border
    1px --line, radius md, padding 28 — flat karena lantai kertas tidak menopang
    bayangan bertumpuk):

    "Skala dunia nyata tanpa alat tambahan"
      Satu objek berdiameter tetap di dalam frame sudah cukup untuk mengubah piksel
      menjadi milimeter. Tidak perlu penggaris, tidak perlu kotak foto khusus.
    "Ukuran nyata membuka geometri"
      Panjang, rasio, dan luas jadi angka absolut — bukan relatif terhadap resolusi
      kamera. Dari situ grade bisa punya ambang yang sama untuk semua orang.
    "Berat diestimasi dari luas terkalibrasi"
      Luas terkalibrasi dikalikan faktor densitas per komoditas menghasilkan estimasi
      berat batch — dasar perhitungan ongkos angkut dan harga.

Judul slide diletakkan di ATAS, rata kiri, heading warna --ink:
  "Alat kalibrasi termurah di Indonesia sudah ada di saku petani"
Eyebrow: "AUTOCALIBRATOR"

Kaki kanan-bawah: chip nada warn berisi teks:
  "Batas jujur: uji kelayakan koin belum ada. Dibahas di slide 22."

DIREKTIF VISUAL
- Gaya anotasi harus konsisten: semua garis ukur 1,5px --brand, semua leader line
  1px putus-putus --line-strong (dasharray 6 5), semua label mono 18px warna --muted.
- Kisi milimeter tidak boleh terbaca sebagai pola. Kalau ia menarik perhatian,
  turunkan opasitasnya sampai nyaris hilang.

LARANGAN SLIDE INI
Jangan pakai foto koin asli. Jangan menaruh ikon lain. Jangan menggelapkan latar
untuk "menyorot" koin — sorotan datang dari kepadatan anotasi, bukan dari kontras.

SPEAKER: "Ini bukan kecerdikan teknis. Ini keputusan agar sistemnya bisa dipakai
tanpa membeli apa pun."
```

## S11 — Harga yang bisa dibantah

```text
=== BRIEF SLIDE 11 dari 23 ===
BABAK: SOLUSI  ·  TEMA: OAT  ·  ARKETIPE: kartu rumus + mock antarmuka

TUJUAN
Menjawab pertanyaan 02 dan 03: harga wajar yang rumusnya terbuka, plus kanal untuk
grade B/C. Slide ini harus terasa seperti melihat produknya, bukan membaca konsep.

TATA LETAK — dua kolom, 7 : 5

KIRI (kolom 1–7) — "rumusnya terbuka":
  Judul (heading): "Harga yang rumusnya bisa dibantah petani"
  Eyebrow: "REKOMENDASI HARGA WAJAR"
  Card raised besar berisi papan rumus:
    Baris rumus ditulis besar dengan campuran mono + display:
      harga acuan pasar  ×  bobot komposisi grade  ×  faktor berat batch
      = rentang harga wajar
    Tiap suku rumus diberi latar chip: suku 1 neutral, suku 2 brand, suku 3 warn.
    Di bawahnya, panel Card FLAT berisi contoh perhitungan, tabel dua kolom
    (label kiri --muted, nilai kanan mono tabular rata kanan):
      Komposisi batch      A 62% · B 26% · C 12%
      Berat terestimasi    48,5 kg
      Rentang wajar        Rp31.400 – Rp36.900 / kg
    Angka contoh ini diberi keterangan caption --label:
      "Ilustrasi antarmuka; angka aktual dihitung dari data acuan hari berjalan."
  Di bawah kartu: satu baris body --muted:
    "Ditambah simulasi 'bagaimana jika': petani bisa menguji sensitivitas harga
     terhadap perubahan komposisi grade sebelum menerima tawaran."

KANAN (kolom 8–12) — "grade rendah punya pembeli":
  Bingkai ponsel (resep komponen 13) berisi mock layar listing:
    - Bilah atas chrome ladang (--field-base) dengan judul "Listing saya".
    - GradeBar horizontal komposisi 62/26/12 lengkap dengan legenda.
    - Dua baris kartu flat: "Pasar segar · Grade A" dan "Industri olahan · Grade B/C"
      masing-masing dengan GradeBadge kecil dan harga mono.
    - Slider harga bergaya .pantas-slider: rel 8px radius full, bagian kiri --brand,
      kanan --brand-tint-strong, thumb lingkaran 20px --brand dengan cincin 3px
      --surface.
    - Tombol utama fill-brand di bawah: "Tayangkan ke pembeli".
  Di bawah bingkai, satu chip nada brand: "Kanal grade B/C = food loss yang dibatalkan".

DIREKTIF VISUAL
- Kolom kiri tenang dan tipografis; kolom kanan padat dan berwarna. Kontras kepadatan
  inilah komposisinya.
- Bingkai ponsel dimiringkan 0 derajat (tegak lurus). Jangan diberi perspektif 3D.

LARANGAN SLIDE INI
Jangan mengarang angka acuan pasar riil. Tandai jelas bahwa angka adalah ilustrasi.

SPEAKER: "Petani tidak perlu percaya harga kami. Dia bisa membaca rumusnya."
```

## S12 — Bukti yang tidak bisa diubah

```text
=== BRIEF SLIDE 12 dari 23 ===
BABAK: SOLUSI  ·  TEMA: OAT  ·  ARKETIPE: hash monospace raksasa + kartu lacak

TUJUAN
Menjawab pertanyaan 04 bagian ketertelusuran. Membuat "SHA-256" terasa seperti
janji, bukan jargon.

TATA LETAK
Bagian atas (40% tinggi): hash sebagai objek tipografi.
  Eyebrow: "KETERTELUSURAN PUBLIK"
  Satu baris mono berukuran besar (56–64px), warna --ink, tabular, memenuhi lebar
  dari margin ke margin, dengan pemenggalan visual tiap 8 karakter memakai spasi
  tipis dan tiap blok berlatar --sunken radius xs padding 6px 10px:
    a3f1 9c2e  7b84 05dd  e61a 4470  9f3c 12ab  ...
  (gunakan hash contoh 64 heksadesimal yang konsisten; boleh dipotong dengan elipsis
  di ujung kanan bila tidak muat, tapi minimal 40 karakter terlihat.)
  Tepat di bawahnya, caption --label: "SHA-256 atas hasil grading — dihitung sekali,
  tidak bisa diubah diam-diam."

Bagian bawah (60% tinggi): tiga kartu berjajar (4 kolom masing-masing), tapi kartu
tengah DINAIKKAN 40px dan memakai shadow e3 supaya barisnya tidak datar.

  Kartu 1 — "Halaman publik"
    Ikon tautan. Isi: "Setiap hasil grading punya alamat tetap:"
    Baris mono berlatar --sunken: "/lacak/[hash]"
    Isi lanjutan: "Bisa dibuka siapa pun, tanpa akun, sebelum maupun sesudah membeli."
  Kartu 2 (menonjol, varian surface-brand) — "Yang bisa dilihat"
    Daftar 4 baris pendek dengan ikon centang kecil:
      Foto beranotasi hasil segmentasi
      Komposisi grade per objek
      Alasan grade dalam bahasa manusia
      Versi model & waktu pemindaian
  Kartu 3 — "Kenapa ini penting"
    Isi: "Tanpa bukti yang bisa diaudit, pembeli mendiskon harga sebagai asuransi
    risiko. Diskon itu ditanggung petani. Ketertelusuran memindahkan beban
    pembuktian dari kepercayaan ke data."

DIREKTIF VISUAL
- Warna hash: sebagian besar --ink, tapi 8 karakter pertama diberi warna --brand
  untuk menandai bagian yang biasa disebut orang saat verifikasi lisan.
- Tambahkan grafis kecil di kanan-atas kartu 1: kotak QR sederhana bergaya (grid
  9x9 kotak --ink dengan tiga penanda sudut). Digambar SVG, bukan QR asli — beri
  atribut data-ganti="qr-lacak".

LARANGAN SLIDE INI
Jangan menyebut blockchain. Ini hash audit, bukan ledger.

SPEAKER: "Hash ini bukan untuk kami. Ini untuk pembeli yang tidak mengenal petaninya."
```

## S13 — Jalan pulang muatan

```text
=== BRIEF SLIDE 13 dari 23 ===
BABAK: SOLUSI  ·  LANTAI: OAT  ·  ARKETIPE: peta rute sebelum/sesudah dalam satu bidang + kunci serah terima

TUJUAN
Menutup babak solusi dengan bagian yang paling sering dilupakan platform pertanian:
setelah mutu diketahui dan harga disepakati, barangnya masih harus BERPINDAH. Slide
ini menjawab sasaran "efisiensi rantai pasok" dan "keamanan produk" pada subtema
Ketahanan Pangan dan Pertanian Cerdas — dua hal yang belum disentuh slide mana pun
sebelumnya.

Satu gagasan slide ini: pengiriman kecil-kecil digabung jadi satu rute, dan transaksi
baru dianggap selesai kalau serah terimanya bisa dibuktikan.

TATA LETAK — dua kolom, 7 : 5

Judul (heading-lg, --ink): "Enam pengiriman kecil jadi satu rute, ditutup satu kode"
Eyebrow: "LOGISTIK & SERAH TERIMA"

KIRI (kolom 1–7): DIAGRAM RUTE — satu bidang, dua keadaan bertumpuk.
  Bidang peta: background --sunken, radius lg, tinggi ~520, padding 32, TANPA border.
  Di dalamnya, garis jalan stilisasi: 5–7 kurva bezier sangat tipis 1px warna --line,
  melintang acak, hanya sebagai tekstur latar — bukan peta wilayah sungguhan.

  Simpul petani: enam lingkaran 18px, isi --surface, border 3px --brand, tersebar
  tidak beraturan (jangan di grid rapi). Label mono 13px --label di sampingnya:
  P1 … P6. Satu simpul tujuan: persegi 26px radius xs isi --ink, label mono
  --ink "PEMBELI".

  LAPIS 1 — keadaan lama (digambar di bawah): enam garis lurus terpisah dari tiap
  simpul petani langsung ke simpul tujuan, 1px dashed --line-strong, opacity .55.
  Enam kendaraan, enam ongkos.

  LAPIS 2 — keadaan PANTAS (digambar di atas): SATU polyline tunggal yang menyambangi
  P1→P2→…→P6 lalu ke PEMBELI, tebal 4px warna --brand, stroke-linecap dan
  stroke-linejoin round, sedikit melengkung. Beri animasi `grow` sekali jalan
  (stroke-dasharray + stroke-dashoffset), durasi 900ms, ease-out, TIDAK berulang.

  Legenda dua baris di kaki bidang, caption --muted, memakai contoh garisnya sendiri
  sebagai penanda (bukan kotak warna):
    "— — —  tiap petani mengirim sendiri"
    "———    satu rute penjemputan, dihitung nearest-neighbour"

  Di pojok kanan-atas bidang, chip nada brand: "6 titik jemput · 1 rute".
  Tepat di bawah bidang, caption --label:
    "Diagram mekanisme, bukan hasil pengukuran lapangan."

KANAN (kolom 8–12): tiga blok bertumpuk, jarak antar-blok 28.

  Blok 1 — Card raised, "Ongkos yang bisa dihitung sendiri"
    Body --ink: "Estimasi ongkos angkut dihitung transparan dari jarak dan berat,
    dan penjemputan dijadwalkan dari dashboard petani."
    Di bawahnya, satu baris mono kecil berlatar --sunken radius xs padding 6px 10px:
      "ongkos ≈ f(jarak, berat)"
    Caption --muted: "Petani melihat angkanya sebelum menyetujui, bukan setelah
    dipotong."

  Blok 2 — Card raised varian surface-brand, "Serah terima terverifikasi"
    Kode verifikasi sebagai objek: enam karakter mono ukuran 52 bold tracking .18em,
    warna --brand-deep, tiap karakter di dalam kotak 56x68 background --surface
    radius sm dengan garis 1px --line — barisnya rata tengah:
      7  K  4  M  2  9
    Caption --ink di bawahnya: "Kode ditunjukkan saat muatan berpindah tangan.
    Pesanan baru tertutup setelah kode cocok."
    Kaki blok, caption --label: "Status tiap tahap terekam di timeline pesanan."

  Blok 3 — Card flat, "Checklist rantai dingin"
    Empat baris; tiap baris: kotak 22px radius xs border 2px --line-strong (tiga
    terisi --brand dengan ikon centang --on-brand, satu masih kosong), lalu teks
    body-sm --ink. Beri atribut data-ganti="butir-rantai-dingin" pada daftarnya —
    butirnya diisi tim sesuai SOP yang dipakai:
      Suhu muatan dicatat sebelum berangkat
      Wadah tertutup dan bersih
      Jeda muat ke berangkat dalam ambang
      Foto muatan terlampir di pesanan
    Caption --muted: "Muatan tidak boleh berangkat sebelum semua tercentang."

DIREKTIF VISUAL
- Bidang peta adalah elemen dominan slide. Kolom kanan menempel tenang: tidak ada
  bayangan lebih tinggi dari e2 di sana kecuali blok 2 (boleh e3).
- Warna --brand hanya untuk rute, simpul, dan kode verifikasi. Sisa slide netral,
  supaya mata langsung membaca "satu garis hijau menggantikan enam garis putus".
- Simpul petani sengaja tidak beraturan letaknya. Kalau digambar rapi berbaris,
  gagasan "titik-titik tersebar yang harus disatukan" hilang.
- Ikon: truk kecil boleh diletakkan satu saja, di pangkal polyline, ukuran 28,
  stroke 1.75, warna --brand. Jangan menaruh ikon truk di tiap simpul.

LARANGAN SLIDE INI
Jangan memakai peta geografis sungguhan, tile Leaflet/OSM, atau tangkapan layar peta.
  Ini diagram mekanisme; peta aslinya ada di aplikasi, bukan di deck.
Jangan menulis angka penghematan bahan bakar, persen efisiensi, atau CO2e di slide
  ini — proposal tidak memuat angkanya, dan sisi dampak sudah punya slide sendiri
  (S19). Di sini cukup mekanismenya.
Jangan mengulang narasi "logistik terfragmentasi" sebagai masalah; itu sudah dibuka
  di S04. Slide ini hanya menunjukkan jawabannya.
Jangan menyebut nama vendor logistik, kurir, atau mitra angkutan mana pun.

SPEAKER: "Grading dan harga tidak ada gunanya kalau barangnya tetap berangkat
sendiri-sendiri. Satu rute, satu ongkos, dan satu kode yang menutup transaksinya."
```

## S14 — Rapor YOLO-1

```text
=== BRIEF SLIDE 14 dari 23 ===
BABAK: BUKTI  ·  TEMA: OAT  ·  ARKETIPE: tabel + batang mAP50

TUJUAN
Menyerahkan angka. Slide ini harus terbaca sebagai rapor, bukan sebagai klaim
pemasaran — termasuk memperlihatkan komoditas yang paling lemah.

TATA LETAK
Judul (heading): "Rapor segmentasi: empat komoditas, empat model spesialis"
Eyebrow: "YOLO-1 · SEGMENTASI"
Chip di kanan judul, nada neutral, mono: "metrik validasi per komoditas"

Tabel (resep komponen 11) selebar kolom 1–8, empat baris data:
  KOLOM: Komoditas | Precision | Recall | mAP50 (Mask) | Status
  Cabai (Chili)      97,8%  94,5%  97,4%  Sangat Tajam (Epoch 40)
  Timun (Cucumber)   95,9%  89,8%  96,0%  Sangat Tajam (Epoch 100)
  Tomat (Tomato)     94,5%  84,5%  90,3%  Sangat Baik (Epoch 100)
  Wortel (Carrot)    91,1%  78,1%  87,4%  Sangat Bagus (Epoch 100)
- Kolom Komoditas diawali ikon outline komoditas 24px warna --brand.
- Kolom angka rata kanan, tabular-nums, warna --ink, weight 600.
- Kolom Status memakai chip: tiga teratas nada brand, baris Wortel nada warn.

Di kolom 9–12, panel batang mAP50 vertikal — empat batang lebar 64, tinggi
proporsional terhadap 100%, radius sm di ujung atas, warna --brand, KECUALI wortel
yang memakai --clay-500 untuk menandai yang terlemah. Nilai dicetak mono di atas
tiap batang. Garis putus-putus horizontal 1px --line-strong di ketinggian 90%
dengan label mono --muted "ambang layak 90%".

Kaki slide, satu baris body --muted di dalam kartu flat selebar tabel:
  "Recall wortel paling rendah karena datasetnya paling kecil — sekitar 788 gambar,
   dibanding tomat sekitar 9.790. Penambahan data wortel adalah prioritas berikutnya."

DIREKTIF VISUAL
- Jangan menyorot baris terbaik. Sorot justru baris WORTEL dengan bg --brand-tint
  tipis, karena itulah baris yang akan ditanya juri.
- Sitasi kaki kiri: "Sumber: dokumentasi teknis proyek PANTAS".

LARANGAN SLIDE INI
Jangan membulatkan angka. Jangan menyembunyikan baris wortel.

SPEAKER: "Kami tampilkan yang paling lemah lebih dulu supaya Bapak/Ibu tidak perlu
mencarinya."
```

## S15 — Rapor YOLO-2

```text
=== BRIEF SLIDE 15 dari 23 ===
BABAK: BUKTI  ·  TEMA: OAT  ·  ARKETIPE: empat cincin akurasi + catatan jujur

TUJUAN
Rapor model kedua, dengan bentuk visual yang SENGAJA berbeda dari S14 supaya dua
slide data berurutan tidak terasa kembar.

TATA LETAK
Judul (heading): "Rapor klasifikasi kesehatan: tiga stabil, satu belum"
Eyebrow: "YOLO-2 · KLASIFIKASI BUSUK/SEHAT"

Empat cincin progres (donut) berjajar, masing-masing diameter 300px, digambar SVG:
  - Trek cincin: stroke 22px warna --sunken.
  - Isi cincin: stroke 22px, linecap round, mulai dari jam 12 searah jarum jam.
  - Di tengah cincin: angka akurasi display-md tabular-nums, di bawahnya nama
    komoditas subheading, di bawahnya lagi mono --muted "F1 xx,x%".
  - Di bawah tiap cincin: chip status.

  Wortel (Carrot)     100,0%  F1 100,0%  isi --grade-a      chip brand "Sempurna"
  Timun (Cucumber)     98,2%  F1 98,2%   isi --grade-a      chip brand "Sangat Stabil"
  Tomat (Tomato)       97,5%  F1 97,5%   isi --grade-a      chip brand "Sangat Stabil"
  Cabai (Chili)        81,3%  F1 81,2%   isi --clay-500     chip warn "Dataset masih terbatas"

Urutkan dari tertinggi ke terendah (wortel → cabai), sehingga mata berjalan menurun
dan berhenti di kartu kejujuran.

Di bawah baris cincin, satu kartu flat selebar penuh dengan garis kiri 4px
--clay-500 (accent bar), berisi:
  Judul subheading: "Kondisi pengujian, apa adanya"
  Body: "Keempat model diuji pada kondisi latar putih bersih hasil auto-masking.
  Model cabai masih dalam proses pelatihan saat proposal ini disusun, dan itu kami
  catat sebagai pekerjaan jangka pendek — bukan sebagai angka yang dipoles."

Kaki: perhatikan hubungan silang, tulis caption --label:
  "Menarik: cabai punya segmentasi terbaik (mAP50 97,4%) tapi klasifikasi terlemah.
   Dua tugas berbeda, dua dataset berbeda."

DIREKTIF VISUAL
- Cincin boleh dianimasikan dengan stroke-dashoffset, durasi 380ms, delay bertingkat.
- Jangan memakai batang di slide ini — batang sudah dipakai di S14.

LARANGAN SLIDE INI
Jangan menulis "akurasi rata-rata". Tampilkan per komoditas.

SPEAKER: "Tiga dari empat sudah stabil. Yang satu ini kami tahu persis kenapa."
```

## S16 — Peta subtema & teknologi

```text
=== BRIEF SLIDE 16 dari 23 ===
BABAK: BUKTI  ·  TEMA: OAT  ·  ARKETIPE: matriks pemetaan + strip stack

TUJUAN
Membuktikan kesesuaian dengan subtema kompetisi secara harfiah — sasaran Guidebook
di kiri, realisasi di PANTAS di kanan — lalu menutup dengan tumpukan teknologi.

TATA LETAK — dua bagian bertumpuk

BAGIAN ATAS (65% tinggi): matriks dua kolom, empat baris.
  Judul (heading): "Empat sasaran subtema, empat realisasi yang bisa ditunjuk"
  Eyebrow: "KETAHANAN PANGAN DAN PERTANIAN CERDAS (HOLOGY 9.0)"
  Kolom kiri (4 kolom grid): sasaran Guidebook — subheading warna --muted,
  latar --sunken, radius md, padding 24, rata kanan.
  Kolom kanan (8 kolom grid): realisasi — Card raised, padding 28, judul body bold
  warna --ink + keterangan caption --muted.
  Keduanya dihubungkan panah kecil 20px warna --brand di tengah.

  Efisiensi rantai pasok →
    Konsolidasi rute penjemputan multi-petani; pencocokan pembeli terdekat
    berbasis geolokasi.
  Transparansi distribusi →
    Timeline status pesanan; halaman pelacakan publik /lacak/[hash] dengan hash
    audit SHA-256.
  Kualitas produk →
    Grading objektif dua tahap dengan kalibrasi ukuran nyata memakai koin Rp500.
  Keamanan produk →
    Deteksi busuk/penyakit sebagai mekanisme veto pada tahap klasifikasi, ditambah
    checklist rantai dingin saat logistik.

BAGIAN BAWAH (35% tinggi): strip teknologi, dipisah dari bagian atas oleh garis
rambut 1px --line dan eyebrow "TUMPUKAN TEKNOLOGI".
  Empat kolom setara, masing-masing: label eyebrow --label + daftar chip neutral
  yang dibungkus (flex-wrap):
  FRONTEND    Next.js 16.2.10 · React 19.2.4 · Tailwind CSS v4 · Leaflet ·
              lucide-react · PWA
  BACKEND     Supabase · Postgres · Auth email+password · Storage ·
              Row Level Security · Realtime
  AI ENGINE   FastAPI · YOLOv11 (Ultralytics) · OpenCV · Docker
  INFRA       Vercel · cron harga acuan · server lokal (AI Engine) · Git/GitHub

DIREKTIF VISUAL
- Chip teknologi memakai font mono 16px agar strip bawah terbaca berbeda dari
  matriks di atas.
- Jangan pakai logo vendor.

LARANGAN SLIDE INI
Jangan menambah sasaran subtema yang tidak ada di Guidebook.

SPEAKER: "Kolom kiri bukan kalimat kami. Itu kalimat Guidebook."
```

## S17 — SESI DEMO (satu-satunya slide demo)

> Demo dijalankan **di web, bukan di dalam deck**. Karena itu babak DEMO hanya punya
> satu slide: slide ini. Ia tampil sebelum penyaji pindah ke browser, dan tampil lagi
> setiap kali penyaji kembali ke deck. Ia harus tahan dipandang lama.

```text
=== BRIEF SLIDE 17 dari 23 ===
BABAK: DEMO  ·  LANTAI: TINT + pita ladang  ·  ARKETIPE: pembatas babak + papan kendali demo

TUJUAN
Slide ini satu-satunya slide untuk seluruh sesi demo, karena demo dijalankan langsung
di aplikasi web — bukan lewat tangkapan layar di deck. Tugasnya tiga: (a) menandai
peralihan dari presentasi ke aplikasi hidup, (b) menyodorkan kredensial supaya juri
bisa ikut mencoba dari ponselnya saat itu juga, (c) menjadi papan agenda yang tetap
terbaca setiap kali penyaji berpindah kembali dari browser ke deck.

Karena slide ini akan tampil berkali-kali dan berdurasi paling lama di seluruh deck,
ia harus tenang, tidak berkedip, dan tidak memuat animasi berulang.

CATATAN LANTAI
Ini pembatas babak paling penting di deck, dan ia harus "menyentak" tanpa jadi gelap.
Caranya: gradien TINT dibalik arahnya dibanding S01 — di sini paling pekat di
KANAN-BAWAH — plus satu pita ladang tegak di sisi kiri. Perubahan arah gradien plus
munculnya bidang hijau pekat itulah sentakannya.

TATA LETAK — tiga zona: pita (1–2) | agenda (3–7) | kredensial (8–12)
Latar: linear-gradient(315deg, #d2ead8 0%, #eaf6ed 50%, #fcfbf8 100%).

PITA LADANG (kolom 1–2, tegak): bidang --field-base (#1a4d26) membentang dari tepi
atas ke tepi bawah kanvas, lebar ~15% kanvas. Isinya, diputar vertikal
(writing-mode: vertical-rl, rotate 180deg): teks display 800 ukuran 64 warna
--field-ink "SESI DEMO", plus di bawahnya mono --field-muted "BABAK 4". Pita ini
sekitar 15% luas kanvas — di bawah batas 35%.

AGENDA (kolom 3–7):
  display-lg ukuran ~104px, dua baris, warna --ink:
    "Aplikasinya"
    "hidup."
  Kata "hidup." diberi warna --brand-deep (#1a4d26).
  Body-lg --muted satu baris:
    "Tiga alur, dijalankan langsung di browser. Bukan rekaman."

  Di bawahnya, rel langkah VERTIKAL: rel 3px --line-strong dengan tiga simpul 22px
  (isi --surface, border 3px --brand, nomor mono di dalamnya). Tiap simpul punya
  judul body bold --ink, keterangan caption --muted satu baris, dan satu baris
  "yang diperhatikan" berukuran caption warna --brand-deep dengan garis kiri 2px
  --brand-tint-strong:
    1  Petani memindai batch
       Foto panen + koin Rp500 di frame, laporan grading terbit, listing tayang.
       ▸ Alasan grade ditulis sebagai kalimat, bukan sekadar skor.
    2  Pembeli industri memverifikasi
       Telusuri katalog, buka /lacak/[hash] tanpa akun, ajukan inquiry.
       ▸ Mutu bisa dicek SEBELUM membayar, bukan setelah barang datang.
    3  Koperasi mengangkut
       Konsolidasi rute multi-petani, dashboard GMV, pemantauan AI Engine.
       ▸ Penghematan bahan bakar dan CO2e dihitung, bukan diklaim.

KREDENSIAL (kolom 8–12): Card raised (bg --surface, radius lg, shadow e4, padding 40)
  Judul subheading --ink: "Coba langsung"
  Baris tautan mono ukuran 28 warna --brand-deep: "pantas-ai.vercel.app"
  Garis rambut pemisah --line.
  Tabel tiga baris (peran | surel | kata sandi), semua nilai mono:
    Petani           petani@demo.pantas.id     demo1234
    Pembeli Industri pembeli@demo.pantas.id    demo1234
    Admin/Koperasi   admin@demo.pantas.id      demo1234
  Kaki kartu, caption --muted:
    "Data demo di-reset otomatis secara berkala agar konsisten dicoba siapa pun."
  Di pojok kanan-bawah kartu: kotak QR bergaya (SVG, grid 9x9, tiga penanda sudut),
  ukuran 140px, warna --ink di atas kotak --surface radius sm, dibingkai 1px --line,
  data-ganti="qr-demo-vercel".

  Di bawah kartu kredensial, satu kartu flat kecil nada warn (bg --clay-100, border
  1px --clay-300, radius sm, padding 20), berisi jaring pengaman:
    Label mono kecil warna --clay-700: "BILA JARINGAN GAGAL"
    Caption --ink: "Rekaman layar ketiga alur tersedia di
    github.com/astrorehan/pantas — penyaji beralih ke rekaman, urutan agenda di
    sebelah kiri tetap dipakai."

DIREKTIF VISUAL
- Tanpa tekstur bedengan: bidang tint rata. Yang membedakan slide ini dari babak hook
  adalah pita tegak dan arah gradien, bukan tekstur.
- Kartu kredensial adalah objek paling terangkat di seluruh deck — pakai e4 dan
  biarkan ia sedikit melewati margin kanan (bleed 24px) supaya terasa disodorkan
  ke arah juri.
- Ketiga simpul agenda diberi bobot visual SAMA. Tidak ada simpul "aktif": penyaji
  bisa kembali ke slide ini di titik mana pun dalam demo, dan penanda aktif yang
  salah lebih buruk daripada tidak ada penanda sama sekali.
- Nomor slide tetap ada di kaki kanan.

LARANGAN SLIDE INI
Jangan menaruh tangkapan layar, mockup jendela browser, atau bingkai panggung kosong.
  Demo terjadi di aplikasi sungguhan; deck tidak boleh berpura-pura menampungnya.
Jangan membuat slide demo kedua, ketiga, atau slide storyboard per peran. Seluruh
  sesi demo diwakili slide ini saja.
Jangan memberi animasi berulang atau transisi otomatis — slide ini akan tampil lama
  dan berkali-kali.
Jangan melebarkan pita ladang melewati 3 kolom.

SPEAKER: "Silakan buka di ponsel masing-masing sambil kami jalan. Tiga akun, kata
sandinya sama. Saya mulai dari sisi petani."
```

## S18 — Siapa yang diuntungkan

```text
=== BRIEF SLIDE 18 dari 23 ===
BABAK: DAMPAK  ·  TEMA: OAT  ·  ARKETIPE: empat kolom pemangku kepentingan

TUJUAN
Menerjemahkan fitur jadi manfaat, per pihak. Empat kolom sejajar, tidak ada yang
lebih penting — komposisinya harus terasa setara, karena itulah argumennya.

TATA LETAK
Judul (heading): "Manfaat yang bisa ditagih oleh masing-masing pihak"
Eyebrow: "MANFAAT & DAMPAK"

Empat kolom setara (3 kolom grid masing-masing), TANPA kartu bershadow. Sebagai
gantinya, tiap kolom dipisah garis rambut vertikal 1px --line, dan tiap kolom
diawali:
  - ikon outline 40px warna --brand di atas,
  - judul subheading --ink,
  - lalu 2–3 kalimat body --muted,
  - lalu satu "kunci" di bawah: chip berlatar --brand-tint berisi ringkasan
    3–4 kata.

  PETANI (ikon: orang + keranjang)
    Alat penilaian mutu yang objektif, cepat, dan konsisten — tidak lagi bergantung
    penuh pada taksiran tengkulak. Rekomendasi harga yang rumusnya transparan
    memberi dasar tawar-menawar berbasis data. Kanal grade B/C membuka pendapatan
    dari panen yang sebelumnya berisiko dibuang.
    chip: "Punya alat bantah"

  PEMBELI INDUSTRI (ikon: pabrik)
    Kepastian mutu yang bisa diverifikasi lewat halaman pelacakan publik dan hash
    audit, sehingga tidak perlu mendiskon harga sebagai asuransi risiko. Checklist
    rantai dingin dan konsolidasi logistik menjaga keamanan produk selama distribusi.
    chip: "Berhenti membayar risiko"

  LINGKUNGAN (ikon: daun/tunas)
    PANTAS bekerja tepat pada kategori dengan food loss tertinggi. Membuka kanal
    grade rendah dan mempercepat sortasi-ke-transaksi menurunkan porsi panen yang
    dibuang. Dashboard dampak menghitung estimasi CO2e yang dicegah.
    chip: "Food loss yang dibatalkan"

  EKOSISTEM DIGITAL (ikon: simpul jaringan)
    Sebagai proof of concept, arsitektur dual-stage + rule engine geometri terbukti
    bisa menilai mutu komoditas segar dengan mAP50 87,4%–97,4% pada empat komoditas,
    dan berpotensi direplikasi ke komoditas hortikultura lain.
    chip: "Pola yang bisa direplikasi"

DIREKTIF VISUAL
- Semua kolom harus setinggi sama; chip kunci rata bawah (align-self: end).
- Empat ikon harus dari keluarga yang sama (stroke 1.75, sudut round).

LARANGAN SLIDE INI
Jangan membesarkan salah satu kolom. Kesetaraan adalah pesannya.

SPEAKER: "Kalau salah satu kolom ini kosong, model bisnisnya tidak jalan."
```

## S19 — Dampak keberlanjutan

```text
=== BRIEF SLIDE 19 dari 23 ===
BABAK: DAMPAK  ·  LANTAI: SUNKEN (#eae3d7)  ·  ARKETIPE: rantai sebab-akibat +
angka CO2e

TUJUAN
Menunjukkan bahwa klaim lingkungan PANTAS punya mekanisme, bukan slogan: setiap
kilogram yang tidak jadi sampah adalah emisi yang tidak jadi keluar, dan angkanya
memakai faktor emisi dari literatur.

TATA LETAK
Judul (heading, --ink): "Dampaknya dihitung, bukan diklaim"
Eyebrow: "KEBERLANJUTAN"

Bagian tengah: RANTAI SEBAB-AKIBAT horizontal — empat kotak dihubungkan panah
--brand, masing-masing kotak background --surface, radius md, shadow e2, padding 28,
lebar setara:
  "Grade rendah punya pembeli"  →  "Panen tidak dibuang"  →
  "Kilogram terselamatkan"      →  "Emisi CO2e yang dicegah"
Kotak terakhir diberi perlakuan berbeda: background --brand-tint-strong (#d2ead8),
teks --brand-dark (#12361b), shadow e3 — ia titik akhir rantai, jadi ia yang paling
terangkat dan paling hijau.

Di bawah rantai, dua panel berdampingan:

  PANEL KIRI (kolom 1–7) — "Dari mana angkanya":
    Card raised (bg --surface, shadow e2, padding 36) berisi:
      Baris rumus mono ukuran 22:
        kg terselamatkan  ×  faktor emisi per komoditas  =  CO2e dicegah
      Di bawahnya body --muted:
        "Faktor emisi spesifik per komoditas diambil dari Poore & Nemecek (2018),
         dipublikasikan di jurnal Science. Perhitungan hanya dijalankan atas
         transaksi yang benar-benar diselesaikan."
      Sitasi caption --label: "Sumber: Poore & Nemecek (2018), Science 360(6392), 987–992"

  PANEL KANAN (kolom 8–12) — dua Stat tile bertumpuk, dipisah garis rambut:
    "10–20%"  keterangan: "potensi pengurangan kehilangan pangan pada rantai pasok
              berbasis data (World Resources Institute, 2023)"
    "62,8%"   keterangan: "porsi kehilangan pada pasokan sayuran domestik — kategori
              tempat PANTAS bekerja"

Kaki slide: satu baris caption --muted, rata kiri:
  "Preseden platform seperti TaniHub dan RegoPantes membuktikan digitalisasi membuka
   akses pasar. PANTAS menambahkan lapisan yang belum ada di sana: penilaian mutu
   otomatis berbasis computer vision."

DIREKTIF VISUAL
- Ini satu-satunya slide babak dampak yang turun ke lantai SUNKEN. Perpindahan
  lantai dipakai untuk menandai bahwa argumennya berpindah dari ekonomi ke
  lingkungan — penonton merasakannya tanpa perlu diberi tahu.
- Angka pada Stat tile memakai display-md, satuan lebih kecil, tabular-nums.
- Di lantai SUNKEN, semua kartu wajib --surface + bayangan. Kartu flat akan hilang
  di sini karena border --line hanya sedikit lebih pekat dari latarnya.

LARANGAN SLIDE INI
Jangan mengarang total CO2e yang sudah dicegah. Yang ditampilkan adalah mekanisme
dan faktor, bukan capaian.

SPEAKER: "Kami tidak mengklaim angka penghematan. Kami menunjukkan cara menghitungnya."
```

## S20 — Kendala yang kami buka

```text
=== BRIEF SLIDE 20 dari 23 ===
BABAK: DAMPAK  ·  TEMA: OAT  ·  ARKETIPE: tiga kartu masalah → bukti → tindakan

TUJUAN
Slide kejujuran teknis. Di kompetisi, tim yang menunjukkan batas sistemnya sendiri
lebih dipercaya daripada tim yang mengaku sempurna. Nada slide: tenang, faktual,
tanpa minta maaf.

TATA LETAK
Judul (heading): "Tiga kendala yang kami buka sendiri"
Eyebrow: "KENDALA PENGEMBANGAN"
Kalimat pengantar body --muted satu baris di bawah judul:
  "Bukan kendala generik. Masing-masing punya bukti dan penanganan yang bisa dicek."

Tiga kartu berjajar (4 kolom masing-masing), tinggi seragam. Tiap kartu memiliki
tiga zona bertingkat yang dipisah garis rambut 1px --line — struktur ini WAJIB sama
di ketiga kartu:
  ZONA 1 "MASALAH"   : eyebrow --label + judul subheading --ink
  ZONA 2 "BUKTI"     : eyebrow --label + angka/fakta, memakai mono dan tabular
  ZONA 3 "TINDAKAN"  : eyebrow --label + kalimat body, dengan latar --brand-tint,
                       radius sm, padding 20 (zona ini menonjol)
Garis aksen kiri 4px --clay-500 di seluruh tinggi kartu.

  KARTU 1
    MASALAH: Ketimpangan ukuran dataset antar-komoditas
    BUKTI: tabel mini mono dua kolom —
      cabai   ~6.675 gambar
      tomat   ~9.790 gambar
      timun   ~1.250 gambar
      wortel  ~788 gambar
      recall wortel 78,1% · recall cabai 94,5%
    TINDAKAN: Penambahan data latih wortel jadi prioritas pengembangan berikutnya.

  KARTU 2
    MASALAH: Pendekatan model tunggal gagal di awal pengembangan
    BUKTI: dua baris, masing-masing dengan ikon peringatan kecil —
      "halusinasi antar-kelas: tomat kadang ditebak sebagai cabai"
      "CUDA out of memory saat data latih melewati 50.000 gambar"
    TINDAKAN: Beralih ke empat model spesialis single-class per komoditas —
      kedua masalah hilang sekaligus, dan tiap model jadi lebih ringan dilatih.

  KARTU 3
    MASALAH: Validasi kalibrasi ukuran belum lengkap
    BUKTI: "AutoCalibrator belum punya uji kelayakan koin. Pada foto tanpa koin,
      sistem berpotensi memilih objek bulat lain — ujung cabai, tepi piring —
      sebagai acuan skala."
    TINDAKAN: Diungkap terbuka lewat pengujian regresi otomatis yang menandainya
      sebagai kegagalan terduga (xfail) dengan alasan tercatat, agar perbaikannya
      bisa diverifikasi objektif.

DIREKTIF VISUAL
- Nada warna slide ini condong clay/oat; hijau hanya muncul di zona TINDAKAN.
  Itu memberi pesan: masalahnya nyata, jalan keluarnya juga.
- Jangan pakai ikon silang merah besar. Kendala bukan kegagalan.

LARANGAN SLIDE INI
Jangan menambah kendala keempat yang bersifat generik ("waktu terbatas", "dana").

SPEAKER: "Yang ketiga ini bahkan kami tulis sebagai tes yang sengaja gagal, supaya
tidak bisa kami lupakan."
```

## S21 — Peta jalan

```text
=== BRIEF SLIDE 21 dari 23 ===
BABAK: MASA DEPAN  ·  TEMA: OAT  ·  ARKETIPE: tiga horizon sebagai lajur miring

TUJUAN
Menunjukkan bahwa PANTAS punya arah setelah kompetisi, dan bahwa arah itu bertingkat
— dari yang paling dekat (menyelesaikan model) sampai yang paling jauh (kontrak
forward & skor kredit).

TATA LETAK
Judul (heading): "Setelah kompetisi: tiga horizon"
Eyebrow: "PETA JALAN"

Bagian atas — status sekarang, sebagai satu baris Stat tile berjajar dipisah garis
rambut vertikal:
  "92–95%"  kesiapan kodebase terhadap spesifikasi produk
  "62 / 69" fitur selesai menurut BACKLOG (90%)
  "11"      berkas migrasi basis data Supabase
  "12"      epic fitur (EP-A hingga EP-L)
Sitasi caption --label: "Sumber: audit kesenjangan fitur proyek"

Bagian utama — TIGA LAJUR MIRING. Tiga panel memanjang horizontal, masing-masing
diberi transform: skewX(-8deg) pada wadahnya dan skewX(8deg) pada isinya (agar teks
tetap tegak). Tiap lajur bertingkat: lajur pertama paling tinggi dan paling pekat,
menurun ke lajur ketiga.

  LAJUR 1 — "JANGKA PENDEK" (background surface-brand, shadow e3, paling tebal)
    Chip mono "sekarang → 3 bulan"
    Tiga butir pendek, dipisah titik tengah:
      Menyelesaikan pelatihan model klasifikasi kesehatan (YOLO-2) untuk cabai ·
      Menambah data latih wortel (dataset terkecil, recall 78,1%) ·
      Menambah uji kelayakan koin pada AutoCalibrator

  LAJUR 2 — "v2.0" (Card raised biasa)
    Payment gateway dengan escrow · APK lewat Trusted Web Activity ·
    Integrasi otomatis feed harga PIHPS · Dukungan multi-tenant koperasi

  LAJUR 3a — "v2.5" (Card flat)
    Perluasan model ke bawang, kentang, kubis · Estimasi berat terkalibrasi dari
    data lapangan · Prediksi umur simpan hasil panen

  LAJUR 3b — "v3.0" (Card flat, opacity 0,85 — paling jauh, paling samar)
    Kontrak forward (pembeli memesan sebelum musim tanam) · Skor kredit petani
    berbasis riwayat mutu · API terbuka untuk pembeli industri skala besar

  (Total empat lajur; label horizon tetap tiga: jangka pendek, lalu v2.0, v2.5, v3.0.)

DIREKTIF VISUAL
- Ketebalan, elevasi, dan opacity menurun dari lajur pertama ke terakhir — itu yang
  menyampaikan "makin jauh, makin belum pasti", tanpa perlu ditulis.
- Label horizon ditulis vertikal di sisi kiri tiap lajur (writing-mode: vertical-rl),
  eyebrow --label.

LARANGAN SLIDE INI
Jangan memberi tanggal spesifik pada v2.0/v2.5/v3.0.

SPEAKER: "Tiga butir jangka pendek itu sudah punya penanggung jawab dan cabang git."
```

## S22 — Penutup

```text
=== BRIEF SLIDE 22 dari 23 ===
BABAK: PENUTUP  ·  LANTAI: TINT  ·  ARKETIPE: pernyataan + tautan

TUJUAN
Menutup lingkaran yang dibuka slide 01. Angka besar di awal, kalimat besar di akhir.
Ini kalimat yang harus terbawa keluar ruangan.

TATA LETAK
Lantai TINT dengan gradien PERSIS seperti S01
(linear-gradient(140deg, #d2ead8 0%, #eaf6ed 46%, #fcfbf8 100%)), lengkap dengan
tekstur bedengan halus rgba(36,102,52,.07) di sepertiga bawah. Kesamaan yang persis
inilah yang menutup rangka: penonton mengenali ruangan tempat deck ini dimulai.

Blok utama rata kiri, diposisikan di tengah vertikal, kolom 1–9:
  eyebrow "PENUTUP"
  Kalimat penutup, display-md ukuran ~88px, warna --ink, tiga baris:
    "Selisih satu tingkat grade
     menentukan penghasilan satu keluarga petani.
     Sekarang selisih itu bisa dihitung, dan bisa dibantah."
  Baris ketiga diberi warna --brand-deep (#1a4d26).

Di bawahnya, satu baris pendukung body-lg --muted:
  "PANTAS · Platform Sistem Sortasi Sayur Cerdas & Marketplace Hortikultura"

Kolom 10–12: blok tautan vertikal, tiap baris dengan ikon outline 22px --brand +
teks mono 20px --ink, dipisah garis rambut:
  Web       pantas-ai.vercel.app
  Repo      github.com/astrorehan/pantas
  Tim       Inilah 4 trio · Universitas Gadjah Mada
Di bawah blok tautan: kotak QR bergaya 140px (SVG, grid 9x9, tiga penanda sudut)
warna --ink di atas kotak --surface radius sm berbingkai 1px --line,
data-ganti="qr-penutup".

Di sepanjang bawah kanvas, tepat di atas garis kaki: deretan empat GradeBadge
(A, B, C, REJECT) ukuran kecil dengan opacity 0,45, berjajar rata kiri — gema dari
slide 07.

DIREKTIF VISUAL
- Tidak ada elemen lain. Slide ini ditahan lama di layar selama tanya jawab
  pembuka, jadi harus enak dipandang berlama-lama — dan itu alasan lain kenapa ia
  terang: layar gelap selama sepuluh menit tanya jawab membuat ruangan ikut redup.

LARANGAN SLIDE INI
Jangan menulis "Terima kasih" di sini — itu slide berikutnya.

SPEAKER: "Itu saja. Satu tingkat grade. Itu yang kami kerjakan."
```

## S23 — Terima kasih & tanya jawab

```text
=== BRIEF SLIDE 23 dari 23 ===
BABAK: PENUTUP  ·  LANTAI: KERTAS  ·  ARKETIPE: kartu QnA + pustaka kecil

TUJUAN
Slide yang menyala paling lama di ruangan. Harus tetap berguna saat penyaji sedang
menjawab: memuat kredensial demo (agar juri bisa mencoba sambil bertanya) dan daftar
pustaka (agar klaim data bisa dicek saat itu juga).

TATA LETAK
Lantai KERTAS (#fcfbf8) rata, tanpa gradien dan tanpa tekstur. Ini slide paling
sunyi di deck — dan slide paling terang, supaya wajah penyaji tetap terlihat saat
menjawab.

Kiri (kolom 1–6):
  display-lg ~120px warna --ink: "Terima kasih"
  Di bawahnya, subheading --brand-deep: "Kami siap menerima pertanyaan."
  Lalu Card flat (bg --surface, border 1px --line, radius md, padding 32) ringkas
  berisi kredensial demo dalam bentuk padat:
    baris mono: "pantas-ai.vercel.app"
    tiga baris mono kecil:
      petani@demo.pantas.id · pembeli@demo.pantas.id · admin@demo.pantas.id
      kata sandi: demo1234
  Di bawah kartu, tiga nama anggota tim dalam satu baris caption --muted:
    "Muhammad Choirudin Ammar · Muhammad Raihan Surya · Ahmad Rafi Firdaus"

Kanan (kolom 7–12): kolofon pustaka — daftar rapi, TANPA kartu, dipisah garis
rambut 1px --line antar entri, teks caption --muted dengan nama penulis/lembaga
diberi warna --ink:
  eyebrow "DAFTAR PUSTAKA"
  Bappenas & World Resources Institute (WRI) Indonesia. (2021). Kajian Food Loss
    and Waste di Indonesia.
  Direktorat Jenderal Hortikultura, Kementerian Pertanian Republik Indonesia. (t.t.).
    Seberapa Pentingkah Kerugian akibat Penyakit Pasca Panen pada Komoditas
    Hortikultura. hortikultura.pertanian.go.id.
  Poore, J., & Nemecek, T. (2018). Reducing food's environmental impacts through
    producers and consumers. Science, 360(6392), 987–992.
  FAO. (2023). Data food loss Indonesia.
  World Resources Institute. (2023). Riset rantai pasok berbasis data.

DIREKTIF VISUAL
- Ukuran teks pustaka boleh 17px (batas terkecil), karena fungsinya rujukan, bukan
  bacaan jauh.
- Sisakan ruang kosong lega di antara dua kolom — minimal 80px.

LARANGAN SLIDE INI
Jangan memakai animasi. Slide ini statis dan tenang.

SPEAKER: (diam. biarkan slide bekerja.)
```

---

# LAMPIRAN (slide cadangan untuk sesi tanya jawab)

Tiga slide ini tidak ditampilkan berurutan — dipanggil hanya bila juri bertanya.

## A01 — Tim Inilah 4 trio

```text
=== BRIEF SLIDE LAMPIRAN A01 ===
TEMA: OAT  ·  ARKETIPE: tiga kartu profil  ·  Nomor slide: "A01"

TUJUAN
Dipanggil bila juri bertanya soal pembagian kerja. Harus menunjukkan bahwa tiga
peran ini saling mengunci, bukan sekadar tiga nama.

TATA LETAK
Judul (heading): "Tiga peran, satu jalur dari model ke pengguna"
Eyebrow: "TIM PENGEMBANG · INILAH 4 TRIO · UNIVERSITAS GADJAH MADA"
Chip neutral di kanan judul: "Teknologi Informasi, Fakultas Teknik · 3 anggota"

Tiga kartu berjajar (4 kolom masing-masing), Card raised, padding 40. Tiap kartu:
  - Inisial dalam lingkaran 88px: background --brand-tint, teks display 800 ukuran
    34 warna --brand-deep (MCA / MRS / ARF). Bukan foto.
  - Nama subheading --ink; NIM mono --muted di bawahnya.
  - Chip brand berisi peran.
  - Body --muted berisi kontribusi.

  Muhammad Choirudin Ammar · 25/556251/TK/62735 · AI Engineer
    Merancang dan melatih pipeline AI dua tahap (YOLOv11 segmentasi & klasifikasi),
    menyusun grading rule engine berbasis geometri, kalibrasi ukuran, serta evaluasi
    akurasi model per komoditas.
  Muhammad Raihan Surya · 25/560713/TK/63338 · Fullstack Developer
    Mengembangkan aplikasi web end-to-end (frontend Next.js dan integrasi backend
    Supabase), menghubungkan AI Engine ke antarmuka pengguna, serta memastikan alur
    petani–pembeli berjalan menyeluruh.
  Ahmad Rafi Firdaus · 25/560526/TK/63314 · Konseptor / Product Ideation
    Merumuskan ide dasar produk, memastikan keselarasan solusi dengan permasalahan
    riil petani dan subtema lomba, serta menyusun alur pengalaman pengguna petani
    dan pembeli industri.

Di bawah tiga kartu: satu rel horizontal tipis dengan tiga label yang menghubungkan
peran ke tahap kerja — "masalah & alur" → "model & aturan" → "aplikasi & integrasi"
— dengan panah --brand, menunjukkan urutan serah-terima kerja di dalam tim.

LARANGAN: jangan menaruh foto orang, jangan menaruh akun media sosial.
```

## A02 — Tahapan pengembangan

```text
=== BRIEF SLIDE LAMPIRAN A02 ===
TEMA: OAT  ·  ARKETIPE: enam fase menurun + angka rekayasa  ·  Nomor slide: "A02"

TUJUAN
Dipanggil bila juri bertanya "bagaimana kalian mengerjakannya". Bukti proses, bukan
bukti hasil.

TATA LETAK
Judul (heading): "Enam tahap, satu sumber kebenaran"
Eyebrow: "TAHAPAN PENGEMBANGAN"

Kolom kiri (kolom 1–8): enam baris fase, disusun sebagai daftar bernomor dengan
garis rambut pemisah. Tiap baris: nomor mono besar (01–06) warna --line-strong di
kiri, judul body bold --ink, keterangan caption --muted di bawahnya.

  01 Riset & perumusan masalah
     Lima persoalan rantai pasok dirumuskan jadi tesis produk, lalu dipecah menjadi
     12 epic fitur (EP-A hingga EP-L).
  02 Perancangan data & arsitektur
     11 berkas migrasi Supabase (0001_init.sql hingga 0011_ulasan_pihak_pesanan.sql):
     skema inti, pengerasan keamanan, lalu fitur P0 dan P1 bertahap.
  03 Pengembangan AI Engine dua tahap
     Dataset dikumpulkan lewat scraping dan dikurasi manual, dipisah jadi himpunan
     segmentasi dan klasifikasi (auto-masking latar putih), dilatih per komoditas,
     digabung lewat rule engine geometri.
  04 Pengembangan aplikasi web
     Dua seam arsitektur yang konsisten: src/lib/data.ts untuk seluruh pembacaan data
     dan src/lib/store.tsx untuk seluruh penulisan state — sehingga aplikasi tetap
     berjalan penuh dalam mode demo tanpa satu pun environment variable.
  05 Pengujian & audit menyeluruh
     Audit kesenjangan terhadap PRD dengan status ADA/SEBAGIAN/MISSING per fitur,
     ditambah pytest (AI Engine), vitest (frontend), pemeriksaan tipe TypeScript,
     lint, dan Lighthouse CI.
  06 Peluncuran & demo
     Web dipublikasikan di Vercel; AI Engine dikemas Docker agar siap dijalankan di
     platform kontainer seperti Hugging Face Spaces. Tiga akun demo disediakan dan
     data-nya di-reset berkala.

Kolom kanan (kolom 9–12): panel "angka rekayasa" — Card raised berisi daftar
Stat tile ringkas bertumpuk, dipisah garis rambut horizontal:
  ±1.897 baris   PRD sebagai satu sumber kebenaran
  69 fitur       berkode F-ID, dilacak di BACKLOG
  62 selesai     90% dari total fitur
  12 epic        EP-A hingga EP-L
  11 migrasi     0001 sampai 0011
  4 komoditas    cabai, tomat, timun, wortel
  8 model        4 segmentasi + 4 klasifikasi
Di bawah panel, satu baris mono --muted:
  "set regresi otomatis: ai_engine/test_regresi_grading.py"

LARANGAN: jangan menaruh diagram Gantt. Jangan menyebut durasi dalam minggu.
```

## A03 — Pustaka, lampiran & pertanyaan yang mungkin muncul

```text
=== BRIEF SLIDE LAMPIRAN A03 ===
TEMA: OAT  ·  ARKETIPE: daftar dua kolom  ·  Nomor slide: "A03"

TUJUAN
Kartu contekan penyaji, ditampilkan hanya bila perlu. Berisi tautan lampiran dan
jawaban singkat atas pertanyaan yang paling mungkin ditanyakan.

TATA LETAK
Judul (heading): "Lampiran & pertanyaan yang mungkin muncul"

KOLOM KIRI (kolom 1–5) — "Lampiran", daftar mono dengan ikon kecil:
  Repositori GitHub    github.com/astrorehan/pantas.git
  Web App (demo)       pantas-ai.vercel.app
  Akun Petani          petani@demo.pantas.id / demo1234
  Akun Pembeli         pembeli@demo.pantas.id / demo1234
  Akun Admin           admin@demo.pantas.id / demo1234
  Pelacakan publik     /lacak/[hash]
  Konfigurasi audit    web/lighthouserc.cjs
  Regresi grading      ai_engine/test_regresi_grading.py

KOLOM KANAN (kolom 6–12) — "Pertanyaan yang kami siapkan", empat pasang T/J dalam
kartu flat bertumpuk. Pertanyaan body bold --ink diawali "T:", jawaban body --muted
diawali "J:".

  T: Bagaimana kalau petani tidak punya koin Rp500 di foto?
  J: Kalibrasi gagal dan estimasi ukuran tidak dapat dipercaya. Uji kelayakan koin
     belum ada — kami catat terbuka sebagai xfail dan jadikan prioritas jangka pendek.

  T: Apa bedanya dengan TaniHub atau RegoPantes?
  J: Keduanya membuka akses pasar. PANTAS menambahkan lapisan yang belum ada di
     sana: penilaian mutu otomatis berbasis computer vision yang hasilnya dapat
     diaudit publik.

  T: Kenapa empat model, bukan satu?
  J: Satu model untuk empat komoditas menimbulkan halusinasi antar-kelas dan CUDA
     out of memory di atas 50.000 gambar. Empat model spesialis menghilangkan
     keduanya dan lebih ringan dilatih.

  T: Apakah aplikasi butuh AI Engine menyala untuk bisa dicoba?
  J: Tidak untuk seluruh alur non-pindai. Aplikasi punya mode demo penuh lewat
     src/lib/data.ts, jadi katalog, pesanan, logistik, dan pelacakan tetap jalan.

LARANGAN: jangan menambah pertanyaan yang jawabannya belum pasti.
```

---

# Checklist sebelum tampil

- [ ] Semua angka di deck dicocokkan ulang dengan proposal (terutama 97,4% / 78,1% / 62,8% / 62 dari 69).
- [ ] Tidak ada dua slide berurutan dengan arketipe tata letak yang sama.
- [ ] Tiap slide diuji dibaca dari jarak 6 meter, atau diperkecil ke 25% lalu dilihat: hierarkinya masih terbaca?
- [ ] Lantai (KERTAS / OAT / TINT / SUNKEN) sesuai peta deck — babak terasa berpindah tanpa satu pun slide gelap.
- [ ] Tidak ada latar gelap yang menyelinap masuk; pita ladang di S03 dan S17 tidak melebihi batasnya.
- [ ] Deck dicoba di proyektor terang ruangan lomba: teks --muted (#544d40) masih terbaca, bukan kelabu pudar.
- [ ] Semua placeholder `data-ganti="..."` sudah diisi aset asli (termasuk QR demo di S17).
- [ ] S17 diuji berdiri sendiri: bila jaringan mati, bisakah sesi demo dijelaskan hanya dengan slide itu plus rekaman layar?
- [ ] Aplikasi di pantas-ai.vercel.app sudah dicoba dari jaringan tempat acara, bukan hanya dari laptop penyaji.
- [ ] Deck diekspor ke PDF dan dibuka di laptop panitia, bukan hanya di laptop tim.
- [ ] Kredensial demo di S17 dan S23 masih berlaku dan datanya sudah di-reset.

---

## Catatan konsistensi data

Proposal menyebut **69 fitur F-ID** (BAB V & VI), sedangkan
`docs/BACKLOG.md` di repositori dapat menunjukkan jumlah yang lebih baru. Untuk deck ini,
**pakai angka proposal** agar konsisten dengan dokumen yang sudah diserahkan ke panitia.
Jika ingin memakai angka terbaru, perbarui S21 dan A02 sekaligus — jangan sebagian.
