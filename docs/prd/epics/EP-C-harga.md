<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 785–811.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — EP-C — Rekomendasi Harga  
> Sumber: `docs/PRD.md` §baris 785–811  ·  Epic: `EP-C` Rekomendasi Harga
>
> [← EP-B — Grading AI](./EP-B-grading.md) · [Indeks](../00-INDEX.md) · [Backlog](../../BACKLOG.md) · [EP-D — Marketplace →](./EP-D-marketplace.md)

<!-- PRD-SLICE-BEGIN -->
### EP-C — Rekomendasi Harga

#### F-20 · Rentang harga wajar transparan · [FUNGSI][TEMA] · P0 · ADA
Rumus sudah berjalan dan transparan:
`pengali = bobot_grade × (0,9 + 0,16 × skor)`, rentang = 93%–108% dari `harga_acuan × pengali`.

Perbaikan:
- [ ] **Kartu rincian rumus** yang menampilkan setiap suku dengan nilainya, bukan hasil akhir saja. Sudah sebagian ada; jadikan komponen `FormulaBreakdown` yang bisa dipakai ulang.
- [ ] **Provenance harga acuan** — sumber + tanggal pembaruan terlihat jelas ("PIHPS, 24 Jul 2026"), dengan tooltip menjelaskan apa itu harga acuan.
- [ ] **Sensitivitas** — penggeser kecil "bagaimana jika komposisi grade A naik 10%?" yang memperbarui rentang secara langsung. Mengajarkan petani apa yang menggerakkan harganya.

#### F-21 · Terbitkan listing dari hasil grading · [FUNGSI] · P0 · ADA
Sudah berjalan (`harga-form.tsx` → `publishListing`). Perbaikan:
- [ ] Berat batch harus dapat diisi dari estimasi AI bila kalibrasi valid (jumlah luas × densitas rata-rata komoditas), dengan pengguna tetap dapat menimpanya.
- [ ] Pilih foto sampul dari foto batch (bila multi-foto).
- [ ] Judul & catatan listing dapat diedit.
- [ ] Satuan (kg/ton/ikat) dapat dipilih.
- [ ] Pratinjau listing sebelum terbit.

#### F-22 · Segarkan harga acuan terjadwal · [FUNGSI][TEMA] · P1 · BARU
- [ ] Vercel Cron harian `06:00 WIB` → `/api/cron/harga` → tulis ke `harga_acuan` memakai service role (di server saja, tidak pernah di browser).
- [ ] Sumber: PIHPS bila dapat dijangkau; bila gagal, pertahankan nilai lama dan catat kegagalan ke `audit_log` — jangan pernah menulis nilai palsu.
- [ ] Halaman admin `/admin/harga-acuan` untuk koreksi manual dengan jejak audit.
- [ ] Grafik riwayat harga acuan 30 hari per komoditas.

---

