<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 348–595.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Design System v2 "Panen" & strategi responsif  
> Sumber: `docs/PRD.md` §baris 348–595  ·  Epic: `EP-M` Design System v2 & Responsif
>
> [← Arsitektur sistem (as-built & target)](./02-arsitektur.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Information architecture & navigasi →](./04-navigasi.md)

<!-- PRD-SLICE-BEGIN -->
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

