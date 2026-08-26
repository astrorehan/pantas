<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 951–969.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — EP-H — Dampak & Keberlanjutan  
> Sumber: `docs/PRD.md` §baris 951–969  ·  Epic: `EP-H` Dampak & Keberlanjutan
>
> [← EP-G — Ketelusuran (Traceability)](./EP-G-traceability.md) · [Indeks](../00-INDEX.md) · [Backlog](../../BACKLOG.md) · [EP-I — Akun & Preferensi →](./EP-I-akun.md)

<!-- PRD-SLICE-BEGIN -->
### EP-H — Dampak & Keberlanjutan

#### F-65 · Dashboard dampak pribadi · [TEMA][FUNGSI] · P0 · REVAMP
Ada, dihitung dari pesanan selesai. Perbaikan:
- [ ] **Ganti konstanta 1,7 kg CO₂e/kg yang tidak bersumber** dengan faktor emisi per komoditas bersitasi — lihat §14.3.
- [ ] Setiap metrik memperlihatkan **asal-usulnya** lewat tooltip: "kg terselamatkan = jumlah berat pesanan berstatus selesai" dan "CO₂e = Σ(kg × faktor komoditas), sumber: Poore & Nemecek (2018), *Science*". Faktor emisi harus disitasi, bukan angka ajaib.
- [ ] Tambah metrik dari logistik: km perjalanan yang dihindari lewat konsolidasi, dan CO₂e turunannya.
- [ ] Tambah metrik ekonomi: selisih antara harga yang diperoleh dan estimasi harga tengkulak (dari `harga_acuan × 0,7` sebagai baseline yang dinyatakan).
- [ ] Rentang waktu dapat dipilih (7/30/90 hari/semua).
- [ ] Chart: area tren + donat komposisi grade + bar per komoditas — semuanya SVG tulis tangan, aksesibel.

#### F-66 · Dampak agregat platform · [TEMA][PRESENTASI] · P0 · BARU
View `dampak_agregat` di Postgres yang menjumlahkan lintas seluruh pengguna non-demo. Ditampilkan di landing publik dan `/admin/dampak`. Inilah angka yang dikutip di pitch deck.

#### F-67 · Laporan dampak yang dapat dibagikan · [TEMA][PRESENTASI] · P2 · BARU
PDF/gambar sekali klik berisi ringkasan dampak petani untuk sebulan — dapat dibagikan ke grup WhatsApp kelompok tani. Mekanisme pertumbuhan sekaligus bahan demo yang bagus.

---

