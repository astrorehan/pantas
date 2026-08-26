<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 812–860.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — EP-D — Marketplace  
> Sumber: `docs/PRD.md` §baris 812–860  ·  Epic: `EP-D` Marketplace
>
> [← EP-C — Rekomendasi Harga](./EP-C-harga.md) · [Indeks](../00-INDEX.md) · [Backlog](../../BACKLOG.md) · [EP-E — Pesanan & Serah Terima →](./EP-E-pesanan.md)

<!-- PRD-SLICE-BEGIN -->
### EP-D — Marketplace

#### F-30 · Katalog & pencarian · [FUNGSI][UIUX] · P0 · REVAMP
Ada: pencarian teks, pencarian suara (Web Speech API, `id-ID`), 3 chip filter, jarak haversine dari geolokasi.

Perbaikan:
- [ ] Sidebar filter desktop (§8.3) dengan filter multi-nilai.
- [ ] Pengurutan eksplisit (relevansi, harga naik/turun, jarak, terbaru, rating).
- [ ] `EmptyState` bermakna dengan saran pelonggaran filter (sebagian sudah ada, jadikan komponen).
- [ ] Skeleton yang sesuai bentuk kartu saat memuat.
- [ ] Pemuatan bertahap / infinite scroll di atas 24 item.
- [ ] Pertahankan pencarian suara — ini pembeda aksesibilitas yang layak disorot ke juri.

#### F-31 · Detail listing · [FUNGSI] · P0 · ADA
Perbaikan:
- [ ] Galeri foto (bukan satu foto).
- [ ] **Panel laporan mutu** — komposisi grade dari grading terkait, dengan tautan ke `/lacak/[hash]`. Inilah yang membuat listing dapat dipercaya.
- [ ] Kartu profil petani: nama, lokasi, rating, jumlah transaksi, bergabung sejak.
- [ ] Peta mini lokasi + estimasi jarak & waktu tempuh.
- [ ] Listing serupa di bawah.

#### F-32 · Inquiry → Penawaran → Pesanan · [FUNGSI] · P0 · REVAMP
Saat ini inquiry langsung menjadi pesanan. Sisipkan tahap penawaran supaya marketplace terasa nyata:

1. Pembeli menambahkan item ke inquiry (ADA).
2. Pembeli mengirim **Penawaran** — kuantitas, harga yang diajukan, tanggal ambil yang diinginkan, catatan. → tabel `penawaran` status `terkirim`.
3. Petani melihat di `/petani/penawaran`: **Terima**, **Tolak**, atau **Tawar Balik** (harga/kuantitas baru).
4. Penerimaan oleh pihak lawan → membuat baris `orders` status `dipesan`.
5. Alur pesanan lanjut seperti sekarang.

**Acceptance criteria**
- [ ] Transisi status ditegakkan di database (constraint + trigger), bukan hanya di UI.
- [ ] Notifikasi terkirim ke pihak lawan di setiap transisi.
- [ ] Penawaran kedaluwarsa otomatis setelah 48 jam (`status = 'kedaluwarsa'`) lewat cron.
- [ ] Riwayat tawar-menawar terlihat sebagai `Timeline` di detail penawaran.

#### F-33 · Chat dalam aplikasi · [FUNGSI] · P1 · BARU
Menggantikan deep-link WhatsApp.
- [ ] Tabel `pesan` dengan RLS (hanya dua pihak transaksi).
- [ ] Supabase Realtime untuk pengiriman langsung.
- [ ] Terlampir ke penawaran atau pesanan (bukan chat bebas — mengurangi ruang penyalahgunaan).
- [ ] Indikator belum dibaca di navigasi.
- [ ] Tombol WhatsApp tetap ada sebagai jalur cadangan.

#### F-34 · Bandingkan listing · [UIUX][FUNGSI] · P1 · BARU
Lihat F-77.

---

