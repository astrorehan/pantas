<!-- Daftar & statistik DIGENERATE oleh scripts/build-backlog.mjs.
     Yang boleh diedit tangan: kotak centang `[ ]` / `[x]` dan penanda 🔍.
     Keduanya dibaca ulang saat regenerasi, jadi progres tidak pernah hilang.
     Judul & tautan berubah hanya lewat docs/PRD.md. -->

# BACKLOG — PANTAS v1.0 "Competition Build"

```
██████████████████████░░  67/72  (93%)
```

| Prioritas | Selesai | Sisa |
| :--- | ---: | ---: |
| **P0** | 37/38 | 1 |
| **P1** | 26/26 | 0 |
| **P2** | 4/8 | 4 |

> 🔍 **5 fitur belum diaudit** — belum pernah muncul di `docs/instruction.md`, jadi status sebenarnya belum diketahui. Cek kode, lalu centang atau hapus penanda 🔍.

---

## Cara pakai (untuk agen AI)

1. **Jangan pernah membaca `docs/PRD.md` utuh** (2.015 baris, ±35k token). Berkas itu sumber kebenaran untuk manusia, bukan bahan bacaan tiap sesi.
2. Ambil item `[ ]` dengan prioritas tertinggi dari daftar di bawah. **Aturan gerbang PRD: tidak ada P1 dimulai sebelum seluruh P0 lulus acceptance.**
3. Buka **satu** berkas spek yang ditautkan item itu (±1–3k token). Acceptance criteria ada di sana.
4. Kerjakan sampai 100% (DB → RLS → API → `lib/data.ts` / `lib/store.tsx` → UI → error state → a11y) sesuai [`AGENTS.md`](../AGENTS.md).
5. Verifikasi (`npm run build`, `npx tsc --noEmit`, lint), lalu centang `[x]` item itu di berkas ini.
6. Kalau isi PRD berubah: edit `docs/PRD.md` (pakai nomor baris `PRD.md:NNN` di bawah untuk lompat langsung), lalu `node scripts/split-prd.mjs && node scripts/build-backlog.mjs`.

Indeks lengkap potongan PRD: [`docs/prd/00-INDEX.md`](prd/00-INDEX.md)

---

## Sisa P0 — gerbang rilis

- `F-111` Latihan demo minimal 5 kali penuh dengan stopwatch, termasuk satu latihan dengan… — [spek](prd/12-judge-demo.md)

---

## EP-M — Design System v2 & Responsif  `11/12`

- [x] **F-70** · `P0` · `[UIUX]` · Ukuran teks tubuh minimum di seluruh permukaan petani adalah `body-md` (14px) · [spek](prd/03-design-system.md) `PRD.md:464`
- [x] **F-71** · `P0` · `[UIUX]` · Setiap komponen interaktif punya state · [spek](prd/03-design-system.md) `PRD.md:504`
- [x] **F-72** · `P1` · `[UIUX]` · Halaman internal `/dev/ds` (hanya development) yang merender seluruh komponen dalam… · [spek](prd/03-design-system.md) `PRD.md:506`
- [x] **F-73** · `P1` · `[UIUX][INOVASI]` · Set ikon PANTAS kustom (SVG 24px, stroke 1.75, grid 24) · [spek](prd/03-design-system.md) `PRD.md:512`
- [ ] 🔍 **F-74** · `P2` · `[UIUX]` · 5 ilustrasi *empty state* bergaya garis, satu palet, tema pertanian · [spek](prd/03-design-system.md) `PRD.md:517`
- [x] **F-75** · `P0` · `[UIUX]` · Hapus `app-frame` dari `layout.tsx` · [spek](prd/03-design-system.md) `PRD.md:540`
- [x] **F-76** · `P0` · `[UIUX]` · Tidak boleh ada `max-w-[430px]` tersisa di `src/` · [spek](prd/03-design-system.md) `PRD.md:542`
- [x] **F-77** · `P1` · `[UIUX][FUNGSI]` · Mode Bandingkan · [spek](prd/03-design-system.md) `PRD.md:571`
- [x] **F-78** · `P0` · `[UIUX]` · Tidak ada scroll horizontal pada `body` di lebar mana pun antara 320px dan 2560px · [spek](prd/03-design-system.md) `PRD.md:586`
- [x] **F-79** · `P0` · `[UIUX]` · Semua gambar `max-width: 100%`; rasio aspek dikunci untuk mencegah CLS · [spek](prd/03-design-system.md) `PRD.md:588`
- [x] **F-80** · `P1` · `[UIUX]` · Dukungan orientasi lanskap pada ponsel untuk layar pindai (petani sering memotret… · [spek](prd/03-design-system.md) `PRD.md:590`
- [x] **F-81** · `P2` · `[UIUX]` · Pintasan keyboard desktop · [spek](prd/03-design-system.md) `PRD.md:592`

## EP-N — Navigasi & Desktop  `3/3`

- [x] **F-82** · `P0` · `[UIUX]` · Setiap layar bukan-root punya jalur kembali yang jelas · [spek](prd/04-navigasi.md) `PRD.md:657`
- [x] **F-83** · `P0` · `[UIUX]` · Judul dokumen (`<title>`) unik per route dan deskriptif; penting untuk juri yang… · [spek](prd/04-navigasi.md) `PRD.md:659`
- [x] **F-84** · `P1` · `[UIUX]` · Palet perintah (`Ctrl/⌘+K`) mengindeks · [spek](prd/04-navigasi.md) `PRD.md:661`

## EP-A — Onboarding & Autentikasi  `5/5`

- [x] **F-01** · `P0` · `[TEMA][UIUX][PRESENTASI]` · Landing publik · [spek](prd/epics/EP-A-onboarding.md) `PRD.md:673`
- [x] **F-02** · `P0` · `[FUNGSI]` · Autentikasi email + password · [spek](prd/epics/EP-A-onboarding.md) `PRD.md:694`
- [x] **F-03** · `P0` · `[FUNGSI][PRESENTASI]` · Akun demo pra-isi · [spek](prd/epics/EP-A-onboarding.md) `PRD.md:702`
- [x] **F-04** · `P1` · `[UIUX][PRESENTASI]` · Tur berpandu sekali jalan · [spek](prd/epics/EP-A-onboarding.md) `PRD.md:722`
- [x] **F-05** · `P0` · `[FUNGSI]` · Pemilihan & pergantian peran · [spek](prd/epics/EP-A-onboarding.md) `PRD.md:725`

## EP-B — Grading AI  `11/12`

- [x] **F-10** · `P0` · `[FUNGSI][INOVASI]` · Pindai batch dengan kalibrasi koin · [spek](prd/epics/EP-B-grading.md) `PRD.md:732`
- [x] **F-11** · `P0` · `[FUNGSI][UIUX][INOVASI]` · Laporan hasil grading · [spek](prd/epics/EP-B-grading.md) `PRD.md:747`
- [x] **F-12** · `P1` · `[FUNGSI][INOVASI]` · Pindai batch multi-foto · [spek](prd/epics/EP-B-grading.md) `PRD.md:757`
- [x] **F-13** · `P1` · `[FUNGSI]` · Riwayat pindai & perbandingan · [spek](prd/epics/EP-B-grading.md) `PRD.md:765`
- [x] **F-14** · `P1` · `[FUNGSI][INOVASI]` · Antrean pindai offline · [spek](prd/epics/EP-B-grading.md) `PRD.md:772`
- [x] **F-15** · `P2` · `[INOVASI][PRESENTASI]` · Kartu penjelasan model · [spek](prd/epics/EP-B-grading.md) `PRD.md:780`
- [x] **F-100** · `P1` · `[INOVASI]` · Set regresi grading · [spek](prd/07-ai-engine.md) `PRD.md:1407`
- [x] **F-101** · `P1` · `[INOVASI]` · Estimasi berat dari luas terkalibrasi · [spek](prd/07-ai-engine.md) `PRD.md:1409`
- [x] **F-102** · `P1` · `[FUNGSI]` · Ambang blur saat ini `< 10` sangat longgar · [spek](prd/07-ai-engine.md) `PRD.md:1411`
- [ ] 🔍 **F-103** · `P2` · `[FUNGSI]` · Umpan balik koreksi · [spek](prd/07-ai-engine.md) `PRD.md:1423`
- [x] **F-107** · `P0` · `[INOVASI]` · Akurasi validasi wortel 100,0% harus diselidiki sebelum diklaim di manapun · [spek](prd/07-ai-engine.md) `PRD.md:1390`
- [x] **F-108** · `P0` · `[INOVASI]` · Gerbang plausibilitas kalibrasi · [spek](prd/07-ai-engine.md) `PRD.md:1413`

## EP-C — Rekomendasi Harga  `5/6`

- [x] **F-20** · `P0` · `[FUNGSI][TEMA]` · Rentang harga wajar transparan · [spek](prd/epics/EP-C-harga.md) `PRD.md:787`
- [x] **F-21** · `P0` · `[FUNGSI]` · Terbitkan listing dari hasil grading · [spek](prd/epics/EP-C-harga.md) `PRD.md:796`
- [x] **F-22** · `P1` · `[FUNGSI][TEMA]` · Segarkan harga acuan terjadwal · [spek](prd/epics/EP-C-harga.md) `PRD.md:804`
- [x] **F-104** · `P1` · `[FUNGSI]` · Tes properti (`fast-check`) yang memverifikasi sifat 1 dan 2 pada 1.000 komposisi acak · [spek](prd/08-algoritma-harga.md) `PRD.md:1458`
- [ ] 🔍 **F-105** · `P2` · `[TEMA]` · Perbandingan harga tengkulak · [spek](prd/08-algoritma-harga.md) `PRD.md:1465`
- [x] **F-106** · `P0` · `[TEMA]` · Faktor emisi disimpan di satu tabel konfigurasi (`emisi_faktor`, kolom: `komoditas`,… · [spek](prd/08-algoritma-harga.md) `PRD.md:1493`

## EP-D — Marketplace  `5/5`

- [x] **F-30** · `P0` · `[FUNGSI][UIUX]` · Katalog & pencarian · [spek](prd/epics/EP-D-marketplace.md) `PRD.md:814`
- [x] **F-31** · `P0` · `[FUNGSI]` · Detail listing · [spek](prd/epics/EP-D-marketplace.md) `PRD.md:825`
- [x] **F-32** · `P0` · `[FUNGSI]` · Inquiry → Penawaran → Pesanan · [spek](prd/epics/EP-D-marketplace.md) `PRD.md:833`
- [x] **F-33** · `P1` · `[FUNGSI]` · Chat dalam aplikasi · [spek](prd/epics/EP-D-marketplace.md) `PRD.md:848`
- [x] **F-34** · `P1` · `[UIUX][FUNGSI]` · Bandingkan listing · [spek](prd/epics/EP-D-marketplace.md) `PRD.md:856`

## EP-E — Pesanan & Serah Terima  `3/3`

- [x] **F-40** · `P0` · `[FUNGSI]` · Siklus hidup pesanan · [spek](prd/epics/EP-E-pesanan.md) `PRD.md:863`
- [x] **F-41** · `P0` · `[FUNGSI][INOVASI]` · Serah terima terverifikasi kode · [spek](prd/epics/EP-E-pesanan.md) `PRD.md:870`
- [x] **F-42** · `P1` · `[FUNGSI]` · Rating & ulasan · [spek](prd/epics/EP-E-pesanan.md) `PRD.md:879`

## EP-F — Logistik & Rantai Pasok  `4/4`

- [x] **F-50** · `P0` · `[FUNGSI][TEMA]` · Penjadwalan penjemputan · [spek](prd/epics/EP-F-logistik.md) `PRD.md:886`
- [x] **F-51** · `P0` · `[TEMA][INOVASI]` · Konsolidasi rute multi-petani · [spek](prd/epics/EP-F-logistik.md) `PRD.md:894`
- [x] **F-52** · `P1` · `[TEMA]` · Checklist rantai dingin · [spek](prd/epics/EP-F-logistik.md) `PRD.md:911`
- [x] **F-53** · `P1` · `[FUNGSI][TEMA]` · Estimasi ongkos angkut · [spek](prd/epics/EP-F-logistik.md) `PRD.md:914`

## EP-G — Ketelusuran  `3/3`

- [x] **F-60** · `P0` · `[INOVASI][TEMA]` · Halaman lacak publik · [spek](prd/epics/EP-G-traceability.md) `PRD.md:921`
- [x] **F-61** · `P1` · `[INOVASI][TEMA]` · QR pada listing & tanda terima · [spek](prd/epics/EP-G-traceability.md) `PRD.md:942`
- [x] **F-62** · `P2` · `[FUNGSI]` · Log audit · [spek](prd/epics/EP-G-traceability.md) `PRD.md:946`

## EP-H — Dampak & Keberlanjutan  `2/3`

- [x] **F-65** · `P0` · `[TEMA][FUNGSI]` · Dashboard dampak pribadi · [spek](prd/epics/EP-H-dampak.md) `PRD.md:953`
- [x] **F-66** · `P0` · `[TEMA][PRESENTASI]` · Dampak agregat platform · [spek](prd/epics/EP-H-dampak.md) `PRD.md:962`
- [ ] 🔍 **F-67** · `P2` · `[TEMA][PRESENTASI]` · Laporan dampak yang dapat dibagikan · [spek](prd/epics/EP-H-dampak.md) `PRD.md:965`

## EP-I — Akun & Preferensi  `2/2`

- [x] **F-68** · `P0` · `[FUNGSI]` · Profil · [spek](prd/epics/EP-I-akun.md) `PRD.md:972`
- [x] **F-69** · `P0` · `[UIUX]` · Pengaturan · [spek](prd/epics/EP-I-akun.md) `PRD.md:977`

## EP-J — Publik & Konten  `2/2`

- [x] **F-85** · `P1` · `[PRESENTASI][TEMA]` · Halaman Tentang · [spek](prd/epics/EP-J-publik.md) `PRD.md:989`
- [x] **F-86** · `P0` · `[PRESENTASI]` · Metadata & berbagi · [spek](prd/epics/EP-J-publik.md) `PRD.md:992`

## EP-K — Admin & Operasi  `4/4`

- [x] **F-90** · `P1` · `[FUNGSI][PRESENTASI]` · Dashboard admin · [spek](prd/epics/EP-K-admin.md) `PRD.md:1001`
- [x] **F-91** · `P2` · `[FUNGSI]` · Moderasi listing · [spek](prd/epics/EP-K-admin.md) `PRD.md:1004`
- [x] **F-92** · `P1` · `[FUNGSI]` · Kesehatan layanan AI · [spek](prd/epics/EP-K-admin.md) `PRD.md:1007`
- [x] **F-109** · `P1` · `[FUNGSI]` · Siklus hidup rute & jejak audit · [spek](prd/epics/EP-K-admin.md) `PRD.md:1012`

## EP-L — Platform  `6/6`

- [x] **F-95** · `P0` · `[INOVASI][FUNGSI]` · PWA installable & offline · [spek](prd/epics/EP-L-platform.md) `PRD.md:1023`
- [x] **F-96** · `P0` · `[UIUX]` · Aksesibilitas WCAG 2.1 AA · [spek](prd/epics/EP-L-platform.md) `PRD.md:1030`
- [x] **F-97** · `P1` · `[UIUX][PRESENTASI]` · Internasionalisasi id/en · [spek](prd/epics/EP-L-platform.md) `PRD.md:1039`
- [x] **F-98** · `P0` · `[FUNGSI]` · Batas galat & pelaporan · [spek](prd/epics/EP-L-platform.md) `PRD.md:1051`
- [x] **F-99** · `P0` · `[UIUX]` · Performa · [spek](prd/epics/EP-L-platform.md) `PRD.md:1056`
- [x] **F-112** · `P1` · `[UIUX][PRESENTASI]` · Bilingual sampai render server · [spek](prd/epics/EP-L-platform.md) `PRD.md:1042`

## EP-O — Demo Kit & Judge Experience  `1/2`

- [x] **F-110** · `P0` · `[PRESENTASI]` · Halaman `/demo` juga memuat · [spek](prd/12-judge-demo.md) `PRD.md:1730`
- [ ] 🔍 **F-111** · `P0` · `[PRESENTASI]` · Latihan demo minimal 5 kali penuh dengan stopwatch, termasuk satu latihan dengan… · [spek](prd/12-judge-demo.md) `PRD.md:1744`

---

## Kerja non-fitur

Item runbook, deploy, dan kit demo tidak punya F-ID sehingga tidak muncul di atas.
Sumbernya tetap [`docs/instruction.md`](instruction.md) §Fase 4 dan [`docs/prd/12-judge-demo.md`](prd/12-judge-demo.md).
