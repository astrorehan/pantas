<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 861–883.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — EP-E — Pesanan & Serah Terima  
> Sumber: `docs/PRD.md` §baris 861–883  ·  Epic: `EP-E` Pesanan & Serah Terima
>
> [← EP-D — Marketplace](./EP-D-marketplace.md) · [Indeks](../00-INDEX.md) · [Backlog](../../BACKLOG.md) · [EP-F — Logistik & Rantai Pasok (pilar tema) →](./EP-F-logistik.md)

<!-- PRD-SLICE-BEGIN -->
### EP-E — Pesanan & Serah Terima

#### F-40 · Siklus hidup pesanan · [FUNGSI] · P0 · ADA
Status: `dipesan` → `dikonfirmasi` → `serah_terima` → `selesai`. Tambahkan `dibatalkan` dan `sengketa`.

- [ ] `Timeline` visual di detail pesanan dengan stempel waktu per transisi (butuh tabel `pesanan_riwayat`).
- [ ] Alasan pembatalan wajib diisi.
- [ ] Aturan pembatalan: pembeli bebas membatalkan sebelum `dikonfirmasi`; setelah itu perlu persetujuan dua pihak.

#### F-41 · Serah terima terverifikasi kode · [FUNGSI][INOVASI] · P0 · ADA
Sudah ada: pembeli memegang kode `PNT-XXXX-NN`, petani memasukkannya, dicocokkan di server lewat RPC `security definer`.

Perbaikan:
- [ ] Pembeli melihat **QR** kode (paket `qrcode` sudah terpasang), petani memindai dengan kamera alih-alih mengetik. Mengetik tetap tersedia sebagai cadangan.
- [ ] Setelah verifikasi: tangkap **berat aktual** dan **catatan mutu** — data ini memberi umpan balik untuk penyetelan model.
- [ ] Tanda terima digital (PDF) untuk kedua pihak.
- [ ] **Utang teknis v1 yang harus ditutup:** `orders.kode` saat ini terbaca petani lewat `select`. Pindahkan `kode` ke tabel `order_kode` terpisah dengan RLS hanya-pembeli, dan sediakan RPC untuk verifikasi. Dicatat sebagai lubang keamanan yang disengaja di v1; ditutup di v1.0 ini.

#### F-42 · Rating & ulasan · [FUNGSI] · P1 · BARU
Setelah `selesai`, kedua pihak saling menilai (1–5 bintang + komentar opsional). Rating agregat muncul di kartu listing & profil. `profiles.rating` diperbarui lewat trigger, bukan dihitung di klien.

---

