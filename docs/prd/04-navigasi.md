<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 596–664.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Information architecture & navigasi  
> Sumber: `docs/PRD.md` §baris 596–664  ·  Epic: `EP-N` Navigasi & Desktop
>
> [← Design System v2 "Panen" & strategi responsif](./03-design-system.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Spesifikasi fitur — pengantar & format →](./epics/README.md)

<!-- PRD-SLICE-BEGIN -->
## 9. Information Architecture & Navigasi

### 9.1 Peta route

```
/                              Landing publik (BARU — sebelumnya form login)
/masuk                         Autentikasi (dipindah dari /)
/tentang                       Cerita produk, tim, teknologi        [BARU]
/lacak/[hash]                  Verifikasi laporan grading, PUBLIK   [BARU]
/demo                          Pendaratan juri: kredensial + tur    [BARU]

/petani
  /                            Dashboard
  /pindai                      Kamera / unggah + pemilih komoditas
  /hasil                       Laporan grading
  /harga                       Rekomendasi harga + terbitkan
  /listing                     Kelola listing                       [REVAMP]
  /listing/[id]                Detail & edit listing                [BARU]
  /listing-tayang              Konfirmasi terbit
  /riwayat                     Riwayat pindai
  /riwayat/[id]                Detail pindai lama                   [BARU]
  /penawaran                   Penawaran masuk dari pembeli         [BARU]
  /pesanan                     Daftar pesanan
  /pesanan/[id]                Detail + verifikasi serah terima
  /logistik                    Jadwal penjemputan & rute            [BARU]
  /dampak                      Dashboard dampak
  /akun                        Profil & preferensi
  /akun/pengaturan             Tema, bahasa, notifikasi             [BARU]

/pembeli
  /                            Katalog
  /produk/[id]                 Detail listing
  /bandingkan                  Perbandingan berdampingan            [BARU]
  /peta                        Peta pemasok
  /inquiry                     Keranjang penawaran
  /penawaran                   Penawaran terkirim & statusnya       [BARU]
  /pesanan                     Daftar pesanan
  /pesanan/[id]                Detail + kode serah terima (QR)
  /pengiriman/[id]             Pelacakan pengiriman                 [BARU]
  /akun                        Profil
  /akun/pengaturan             Tema, bahasa, notifikasi             [BARU]

/admin                                                              [BARU]
  /                            Ringkasan platform
  /harga-acuan                 Kelola tabel harga acuan
  /listing                     Moderasi listing
  /rute                        Perencana konsolidasi rute
  /pengguna                    Daftar pengguna
  /dampak                      Dampak agregat platform
  /audit                       Log audit grading

/api
  /lacak/[hash]                JSON publik laporan grading
  /og/[type]/[id]              Gambar Open Graph dinamis
  /cron/harga                  Segarkan harga_acuan (Vercel Cron)
  /cron/warm                   Ping /health AI (anti cold-start)
  /demo/reset                  Reset data akun demo (dilindungi token)
```

### 9.2 Aturan navigasi

**F-82 [UIUX] P0** — Setiap layar bukan-root punya jalur kembali yang jelas: `BackBar` di mobile, `Breadcrumb` di desktop. Tidak ada halaman buntu.

**F-83 [UIUX] P0** — Judul dokumen (`<title>`) unik per route dan deskriptif; penting untuk juri yang membuka banyak tab.

**F-84 [UIUX] P1** — Palet perintah (`Ctrl/⌘+K`) mengindeks: seluruh route peran aktif, komoditas, listing sendiri, kode pesanan. Aksi cepat: "Pindai baru", "Ganti tema", "Ganti bahasa", "Keluar".

---

