<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 884–918.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — EP-F — Logistik & Rantai Pasok (pilar tema)  
> Sumber: `docs/PRD.md` §baris 884–918  ·  Epic: `EP-F` Logistik & Rantai Pasok
>
> [← EP-E — Pesanan & Serah Terima](./EP-E-pesanan.md) · [Indeks](../00-INDEX.md) · [Backlog](../../BACKLOG.md) · [EP-G — Ketelusuran (Traceability) →](./EP-G-traceability.md)

<!-- PRD-SLICE-BEGIN -->
### EP-F — Logistik & Rantai Pasok  *(pilar kesesuaian tema)*

#### F-50 · Penjadwalan penjemputan · [FUNGSI][TEMA] · P0 · BARU
*Sebagai petani, setelah pesanan dikonfirmasi saya ingin menjadwalkan kapan panen dijemput.*

- [ ] Tabel `pengiriman`: `pesanan_id`, `metode` (`jemput_mandiri` | `konsolidasi` | `kurir_mitra`), `jendela_mulai`, `jendela_selesai`, `alamat_jemput`, `lat`, `lng`, `status`, `catatan`.
- [ ] Petani memilih jendela waktu dari slot yang tersedia.
- [ ] Pembeli mengonfirmasi atau mengusulkan waktu lain.
- [ ] `Timeline` status: `dijadwalkan` → `dijemput` → `dalam_perjalanan` → `tiba` → `diterima`.

#### F-51 · Konsolidasi rute multi-petani · [TEMA][INOVASI] · P0 · BARU
**Ini adalah fitur yang paling langsung menjawab "Logistic System" di subtema.**

*Sebagai koperasi, saya ingin menggabungkan beberapa penjemputan yang berdekatan ke dalam satu rute supaya biaya angkut per kilogram turun.*

- [x] Tabel `rute` (`tanggal`, `kendaraan`, `kapasitas_kg`, `status`) dan `rute_item` (`rute_id`, `pengiriman_id`, `urutan`). Migrasi `0006` menambah `rute.nomor` (identitas terbaca manusia) dan `rute_item.perkiraan_tiba`.
- [x] Perencana di `/admin/rute`: peta menampilkan seluruh penjemputan tertunda; admin memilih beberapa, sistem mengurutkannya dengan heuristik *nearest-neighbour* dan menampilkan garis rute + total jarak. Hanya pengiriman bermetode `konsolidasi` yang masuk — `jemput_mandiri` dan `kurir_mitra` bukan beban armada koperasi.
- [x] **Kartu penghematan**: bandingkan jarak total rute terkonsolidasi vs jumlah perjalanan individual. Tampilkan penghematan dalam km, estimasi liter BBM, dan **kg CO₂e**. Angka ini masuk ke dashboard dampak — ini menghubungkan logistik langsung ke tema keberlanjutan.
- [x] Petani melihat "Penjemputan Anda tergabung dalam Rute #12 — perkiraan tiba 08.30" di layar logistiknya.
- [x] Rencana disimpan lewat tombol **Simpan Rute Konsolidasi**; tulis dikunci ke peran admin lewat RLS, dan baris `rute` dibatalkan bila penyimpanan perhentian gagal.
- [x] Muatan tidak boleh melewati `kapasitas_kg`: perencana memblokir simpan dan menyebut kelebihannya, ditegakkan ulang oleh trigger `trg_cek_kapasitas_rute` di basis data.

**Acceptance criteria**
- [x] Heuristik berjalan di klien untuk ≤ 25 titik dalam < 200 ms.
- [x] Jarak memakai haversine (fungsi `haversineKm` sudah ada di `format.ts`, dipakai ulang). Perencana memakai `haversineKmPresisi` — inti hitungan yang sama tanpa pembulatan per ruas, karena galat 0,1 km/ruas menumpuk saat dijumlahkan.
- [x] Penghematan CO₂e memakai faktor emisi yang dinyatakan sumbernya di UI, bukan angka ajaib.

#### F-52 · Checklist rantai dingin · [TEMA] · P1 · BARU
Untuk komoditas yang menuntutnya, tampilkan checklist penanganan sebelum penjemputan (naungan, wadah berventilasi, hindari tumpukan > N lapis, jendela waktu maksimum). Dicentang saat penjemputan, tersimpan di `pengiriman.checklist` jsonb, dan tampil di halaman lacak sebagai bukti penanganan.

#### F-53 · Estimasi ongkos angkut · [FUNGSI][TEMA] · P1 · BARU
Estimasi transparan: `ongkos = tarif_dasar + tarif_per_km × jarak + tarif_per_kg × berat`, dengan diskon konsolidasi. Rumus ditampilkan, tidak disembunyikan. Muncul di detail listing (perkiraan) dan final di penawaran.

---

