<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1427–1506.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Algoritma harga & faktor emisi CO₂e  
> Sumber: `docs/PRD.md` §baris 1427–1506  ·  Epic: `EP-C` Rekomendasi Harga
>
> [← Spesifikasi AI Engine — pipeline, cakupan model, pekerjaan v1.0](./07-ai-engine.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Non-functional requirements (NFR-*) →](./09-nfr.md)

<!-- PRD-SLICE-BEGIN -->
## 14. Algoritma Harga

### 14.1 Rumus terpasang (dipertahankan, transparan di UI)

```
skor_kualitas = 1,00·komposisi_A + 0,70·komposisi_B + 0,40·komposisi_C
bobot_grade   = { A: 1,00 · B: 0,85 · C: 0,65 · REJECT: 0,35 }
bobot_efektif = Σ komposisi[g] × bobot_grade[g]
pengali       = bobot_efektif × (0,90 + 0,16 × skor_kualitas)
tengah        = harga_acuan × pengali
rentang_wajar = [ tengah × 0,93 , tengah × 1,08 ]   (dibulatkan ke Rp100)
```

⚠ **Koreksi rumus, ditemukan oleh F-104.** Baris pengali semula
`bobot_grade[grade_dominan] × (…)` — satu grade memutuskan seluruh bobot. Bentuk
itu melanggar sifat 1 di §14.2, dan tes properti menemukan contoh yang
menjatuhkannya: batch `A 0,4 / B 0,3 / C 0,3` berpengali **1,017**, sedangkan
batch yang jelas lebih baik `A 0,4 / B 0,6` berpengali **0,877**. Memindahkan 30%
panen dari C ke B menurunkan harga 14%, hanya karena grade dominannya bergeser
A → B dan bobotnya jatuh 1,00 → 0,85. Bentuk tertimbang menutup lubang itu tanpa
mengubah apa pun yang dijanjikan §14.2: batasnya tetap `[0,315 , 1,06]`, batch
murni satu grade menghasilkan pengali yang sama persis seperti sebelumnya, dan
`bobot_efektif` ikut tampil sebagai satu baris di layar harga.

### 14.2 Sifat yang harus dijaga

1. **Monoton** — komposisi grade yang lebih baik tidak boleh menghasilkan harga lebih rendah. "Lebih baik" berarti dominansi stokastik orde pertama pada urutan A → REJECT: untuk setiap `k`, massa gabungan `k` grade teratas tidak lebih kecil. Definisi itu tidak menuntut grade dominannya sama — justru pergeseran dominan itulah yang dulu melanggar sifat ini.
2. **Terbatas** — pengali berada di `[0,315 , 1,06]`; tidak pernah menyarankan harga di atas ~106% harga acuan. Kedua batas turunan langsung dari rumus: `0,35 × 0,90` untuk batch REJECT penuh dan `1,00 × 1,06` untuk batch A penuh.
3. **Dapat dijelaskan** — setiap suku ditampilkan dengan nilainya di UI. Petani harus bisa membaca alasannya, bukan hanya hasilnya.
4. **Tidak memaksa** — petani dapat menetapkan harga di luar rentang. Sistem hanya memberi label posisi ("Di bawah rentang" / "Dalam rentang wajar" / "Di atas rentang").

**F-104 [FUNGSI] P1** — Tes properti (`fast-check`) yang memverifikasi sifat 1 dan 2 pada 1.000 komposisi acak. Ini juga jawaban yang kuat bila juri menanyakan validitas algoritma.

- [x] `web/src/lib/harga.ts` memuat bagian murni algoritma, terpisah dari `getRekomendasiHarga` yang membaca tabel `harga_acuan` — sifat matematis tidak bisa diuji 1.000 kali sambil menyeret Supabase.
- [x] `web/src/lib/harga.properti.test.ts` (`npm test`): sifat 1 diuji pada pasangan komposisi yang dibangun dengan memindahkan massa ke grade lebih baik, sifat 2 pada komposisi acak berjumlah 1 dengan pembulatan 2 desimal seperti keluaran engine.
- [x] Rumus §14.1 dikoreksi ke `bobot_efektif`; contoh penjatuh rumus lama ikut tersimpan sebagai tes regresi, beserta satu tes yang membuktikan generatornya memang bergigi (rumus lama harus gagal pada properti yang sama).
- [x] `bobot_grade` masuk `RekomendasiHarga` dan tampil sebagai baris "Bobot grade batch" di layar harga — sifat 3 menuntut tiap suku terbaca.

**F-105 [TEMA] P2** — Perbandingan harga tengkulak: tampilkan estimasi `harga_acuan × 0,70` sebagai baseline yang dinyatakan sumbernya, sehingga selisih yang diperoleh petani terlihat. Angka baseline harus disitasi, bukan diklaim.

### 14.3 Faktor emisi CO₂e — sumber & nilai *(menutup Q-5)*

**Masalah pada kode saat ini.** `web/src/app/petani/(tabs)/dampak/page.tsx` memakai satu konstanta `1,7 kg CO₂e per kg` untuk semua komoditas, tanpa sitasi. Dua cacat: (a) tidak dapat dipertanggungjawabkan bila juri bertanya; (b) salah secara substansi — wortel dan tomat punya jejak karbon yang berbeda hampir 5×.

**Keputusan: pakai faktor per komoditas dari Poore & Nemecek (2018).** Ini adalah meta-analisis 570 studi atas 38.700 peternakan/kebun komersial, diterbitkan di *Science*, dan menjadi rujukan standar Our World in Data. Dapat dikutip di proposal, pitch deck, dan sesi tanya jawab.

> Poore, J., & Nemecek, T. (2018). *Reducing food's environmental impacts through producers and consumers.* **Science**, 360(6392), 987–992.

| Komoditas PANTAS | Kategori Poore & Nemecek | Faktor (kg CO₂e / kg) |
| :--- | :--- | ---: |
| Wortel (`carrot_*`) | Root Vegetables | **0,43** |
| Timun (`cucumber_*`) | Other Vegetables | **0,53** |
| Cabai (`chili_*`) | Other Vegetables | **0,53** |
| Tomat (`tomato_*`) | Tomatoes | **2,09** ⚠ lihat catatan |

⚠ **Catatan kejujuran yang wajib tampil di UI.** Angka tomat 2,09 adalah rata-rata global yang terangkat oleh produksi rumah kaca berpemanas di Eropa. Tomat lapangan terbuka di iklim tropis jauh lebih rendah. PANTAS **tidak boleh** memakai 2,09 diam-diam karena akan melebih-lebihkan klaim dampak untuk komoditas yang paling sering dipindai. Dua opsi yang dapat dipertanggungjawabkan — pilih salah satu dan nyatakan di UI:

1. **Konservatif (direkomendasikan):** pakai `0,53` (Other Vegetables) untuk tomat juga, dan tulis di tooltip bahwa PANTAS sengaja memakai batas bawah karena produksi Indonesia adalah lapangan terbuka tanpa pemanas. Klaim dampak menjadi *understated*, dan itu posisi yang aman saat dibantah.
2. **Rentang:** tampilkan `0,53 – 2,09` sebagai rentang dengan penjelasan sumber sebarannya.

**Konteks nasional untuk BAB I & BAB IV proposal** (bukan untuk perhitungan, tapi untuk pembingkaian masalah):

> Kajian *Food Loss and Waste di Indonesia* (Bappenas bersama WRI Indonesia, 2021): timbulan FLW Indonesia **115–184 kg per kapita per tahun**, dengan dampak emisi kumulatif **1.702,9 Mt CO₂e (2000–2019)** atau setara **~7,29% emisi GRK nasional** per tahun. **Sayuran adalah penyumbang kehilangan terbesar — mencapai 62,8% dari total pasokan sayuran domestik.**

Angka 62,8% itu adalah kalimat pembuka terkuat untuk slide masalah: PANTAS bekerja tepat di kategori komoditas dengan tingkat kehilangan tertinggi di Indonesia.

**F-106 [TEMA] P0** — Faktor emisi disimpan di satu tabel konfigurasi (`emisi_faktor`, kolom: `komoditas`, `faktor`, `sumber`, `catatan`), bukan hard-coded di komponen. UI membaca `sumber` dan menampilkannya. Mengganti sumber di kemudian hari tidak boleh menyentuh kode komponen.

- [x] Tabel `emisi_faktor` dibuat di migrasi `0004`; migrasi `0007` menambah kolom `satuan`, baris cadangan `lainnya`, dan baris `transport_solar` untuk konversi liter → kg CO₂e di kartu penghematan rute.
- [x] `lib/emisi.ts` tidak lagi mengekspor konstanta faktor. Isinya pembaca tabel: `kunciKomoditas` memetakan id komoditas aplikasi (`tomato_ceri`) ke kunci kelompok (`tomato`), `faktorUntuk` selalu mengembalikan baris, `tonCo2eDicegah` menghitung per partai.
- [x] `getFaktorEmisi()` di `lib/data.ts` membaca tabel sekali per proses dan menyimpannya di store; `FAKTOR_EMISI_BAWAAN` hanya dipakai bila Supabase tidak dikonfigurasi, dengan nilai yang sama dengan seed.
- [x] Layar dampak petani menghitung CO₂e per pesanan memakai `orders.listing_id → listings.komoditas`, bukan satu pengali untuk seluruh keranjang.

**Acceptance criteria**
- [x] Tidak ada faktor emisi tertulis di komponen: `0.53`, `0.43`, dan `2.68` hanya muncul di migrasi dan di salinan cadangan `lib/emisi.ts`.
- [x] Setiap angka CO₂e di layar menampilkan `sumber` dari barisnya — tooltip Stat di dampak petani, baris keterangan di kartu agregat admin, dan kartu penghematan perencana rute.
- [x] Mengganti `faktor` atau `sumber` lewat `update public.emisi_faktor` mengubah angka dan sitasi di seluruh permukaan tanpa rilis kode.

---

