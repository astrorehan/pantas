<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 671–729.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — EP-A — Onboarding & Autentikasi  
> Sumber: `docs/PRD.md` §baris 671–729  ·  Epic: `EP-A` Onboarding & Autentikasi
>
> [← Spesifikasi fitur — pengantar & format](./README.md) · [Indeks](../00-INDEX.md) · [Backlog](../../BACKLOG.md) · [EP-B — Grading AI →](./EP-B-grading.md)

<!-- PRD-SLICE-BEGIN -->
### EP-A — Onboarding & Autentikasi

#### F-01 · Landing publik · [TEMA][UIUX][PRESENTASI] · P0 · BARU
*Sebagai juri atau pengunjung, saya ingin memahami PANTAS dalam 60 detik tanpa harus login.*

Route `/` menjadi halaman publik. Login pindah ke `/masuk`.

Struktur halaman:
1. **Hero** — pernyataan masalah dalam satu kalimat, tagline, dua CTA: "Coba Demo Juri" (→ `/demo`) dan "Masuk" (→ `/masuk`). Latar: foto panen asli dengan overlay anotasi grade yang beranimasi masuk.
2. **Masalah dalam angka** — 3 statistik susut pascapanen dengan sitasi sumber yang terlihat.
3. **Cara kerja** — 4 langkah beranimasi saat scroll: Foto dengan koin → AI menilai → Harga wajar muncul → Pembeli industri memesan.
4. **Demo grading langsung** — komponen interaktif: pilih salah satu dari 4 foto contoh, tekan Analisis, tampilkan hasil nyata dari API. **Tanpa login.**
5. **Kedalaman teknis** — diagram pipeline 2-tahap + tabel akurasi model per komoditas.
6. **Dampak & keberlanjutan** — hubungkan ke tema lomba secara eksplisit.
7. **Footer** — tim, tautan repositori, kontak.

**Acceptance criteria**
- [ ] LCP < 2,0 s pada Fast 3G tersimulasi.
- [ ] Demo grading langsung mengembalikan hasil nyata dari `/predict` dalam < 6 s; ada fallback hasil ter-cache bila API tidak merespons dalam 8 s.
- [ ] Skor Lighthouse ≥ 95 di Performance, Accessibility, Best Practices, SEO.
- [ ] Kartu Open Graph terisi (gambar, judul, deskripsi) — penting saat tautan dibagikan ke grup WhatsApp panitia.
- [ ] Berfungsi penuh di 360px dan 1920px.

#### F-02 · Autentikasi email + password · [FUNGSI] · P0 · ADA
Dipertahankan. Perbaikan:
- [ ] Pisahkan mode "Masuk" dan "Daftar" secara eksplisit alih-alih auto-signup diam-diam (auto-signup membingungkan saat password salah).
- [ ] Toggle lihat/sembunyi password.
- [ ] Indikator kekuatan password saat mendaftar.
- [ ] Tautan "Lupa password" → alur reset Supabase.
- [ ] Pesan galat tetap berbahasa Indonesia manusiawi (fungsi `pesanAuth` sudah ada, dipertahankan & diperluas).

#### F-03 · Akun demo pra-isi · [FUNGSI][PRESENTASI] · P0 · BARU
*Sebagai juri, saya ingin masuk dengan satu klik dan langsung melihat produk yang berisi data.*

Route `/demo` menampilkan tiga kartu kredensial dengan tombol "Masuk sebagai ini" (mengisi form otomatis dan submit):

| Akun | Email | Isi data |
| :--- | :--- | :--- |
| Petani | `petani@demo.pantas.id` | 6 listing, 12 riwayat pindai dengan foto & hasil nyata, 8 pesanan lintas status, 3 penawaran masuk, 2 penjemputan terjadwal |
| Pembeli | `pembeli@demo.pantas.id` | 5 pesanan, 3 penawaran terkirim, 4 item di inquiry, 1 pengiriman berjalan |
| Admin | `admin@demo.pantas.id` | Dashboard agregat penuh, 3 rute konsolidasi, log audit |

**Geografi data demo:** seluruh petani, listing, dan titik penjemputan demo berlokasi di **Daerah Istimewa Yogyakarta** — sentra hortikultura Sleman (Pakem, Cangkringan, Turi), Kulon Progo, dan Bantul; pembeli industri di kota Yogyakarta. Seed lama (Bandung/Lembang) diganti. Alasan: rute konsolidasi (F-51) hanya terlihat masuk akal bila titik-titiknya berdekatan secara geografis dan nyata sebagai sentra sayuran; lereng Merapi memberi klaster alami untuk mendemokan penggabungan rute.

**Acceptance criteria**
- [ ] Seed dijalankan lewat migrasi Supabase yang dapat diulang (`supabase/seed_demo.sql`), bukan penyisipan manual.
- [ ] Koordinat lat/lng demo benar-benar berada di DIY dan terlihat wajar saat dibuka di `/pembeli/peta`.
- [ ] Endpoint `POST /api/demo/reset` (dilindungi header token) mengembalikan ketiga akun ke keadaan awal. Dijalankan otomatis via Vercel Cron setiap 6 jam selama 5–23 Agustus.
- [ ] Data demo ditandai `is_demo = true`; tidak pernah tercampur ke agregat dampak platform nyata.
- [ ] Kredensial demo juga dicantumkan di README repositori dan di halaman terakhir pitch deck.

#### F-04 · Tur berpandu sekali jalan · [UIUX][PRESENTASI] · P1 · BARU
Setelah login pertama pada akun demo, tampilkan 5 langkah *coach mark* yang menyorot: tombol Pindai, kartu hasil terakhir, tab Dampak, tombol tema, dan palet perintah. Dapat dilewati, tidak pernah muncul dua kali (disimpan di `profiles.tur_selesai`).

#### F-05 · Pemilihan & pergantian peran · [FUNGSI] · P0 · REVAMP
Peran saat ini terkunci di `profiles.peran`. Tambahkan: pada akun demo, tombol "Lihat sebagai Pembeli/Petani/Admin" di menu akun untuk berpindah tanpa logout. Hanya aktif bila `is_demo = true` — bukan lubang keamanan pada akun nyata.

---

