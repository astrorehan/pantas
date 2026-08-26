<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1920–1959.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Definition of Done & metrik  
> Sumber: `docs/PRD.md` §baris 1920–1959
>
> [← Roadmap & milestone per fase](./15-roadmap.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Lampiran — glosarium, keputusan, pertanyaan terbuka, referensi →](./17-lampiran.md)

<!-- PRD-SLICE-BEGIN -->
## 22. Definition of Done & Metrik

### 22.1 Definition of Done per fitur

Sebuah fitur selesai bila **seluruh** poin terpenuhi:

- [ ] Acceptance criteria di PRD ini terpenuhi dan diverifikasi
- [ ] Berfungsi di 360px dan 1440px
- [ ] Berfungsi di tema terang dan gelap
- [ ] Punya state: loading, kosong, galat, sukses
- [ ] Dapat dijangkau keyboard; nol pelanggaran axe serius
- [ ] Tidak ada teks keras — melalui kamus i18n (setelah F-97 mendarat)
- [ ] Tidak memanggil Supabase/fetch langsung dari komponen (§12.3)
- [ ] Tes: unit untuk logika, komponen untuk UI, e2e bila menyentuh alur emas
- [ ] `tsc` dan `eslint` bersih
- [ ] PR mencantumkan tag rubrik dan bukti verifikasi

### 22.2 Metrik keberhasilan produk (bukan metrik lomba)

| Metrik | Target v1.0 | Cara ukur |
| :--- | :--- | :--- |
| Waktu pindai → laporan | < 15 detik median | Instrumentasi klien |
| Tingkat penyelesaian alur pindai | > 80% (mulai → listing terbit) | Funnel analytics |
| Kalibrasi koin berhasil | > 70% pindaian | `gradings.hasil->kalibrasi->valid` |
| Penawaran → pesanan | > 30% | Rasio tabel |
| Pesanan → selesai | > 70% | Rasio tabel |
| Kg tersalurkan | Angka nyata, bukan target | View `dampak_agregat` |

### 22.3 Metrik keberhasilan lomba

| Metrik | Target |
| :--- | :--- |
| Semua deliverable terkumpul sebelum tenggat 7 Sept | 6 dari 6 |
| Uptime selama 8–21 September (Penjurian) | ≥ 99,5% |
| Lighthouse halaman publik | ≥ 95 di empat kategori |
| Lolos ke 10 besar finalis HoloDev | Ya |
| Demo langsung berjalan tanpa jaring pengaman di final | Ya |

---

