<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 999–1020.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — EP-K — Admin & Operasi  
> Sumber: `docs/PRD.md` §baris 999–1020  ·  Epic: `EP-K` Admin & Operasi
>
> [← EP-J — Publik & Konten](./EP-J-publik.md) · [Indeks](../00-INDEX.md) · [Backlog](../../BACKLOG.md) · [EP-L — Platform (PWA, a11y, i18n, performa) →](./EP-L-platform.md)

<!-- PRD-SLICE-BEGIN -->
### EP-K — Admin & Operasi

#### F-90 · Dashboard admin · [FUNGSI][PRESENTASI] · P1 · BARU
Ringkasan platform: pengguna per peran, listing per keadaan, pesanan per status sebagai satu bilah bertumpuk, GMV yang sudah settle versus yang masih berjalan, dan grading 24 jam terakhir. Akun demo dihitung terpisah dan header mengatakannya — angka platform tidak boleh dinaikkan oleh data seed.

#### F-91 · Moderasi listing · [FUNGSI] · P2 · BARU
Sembunyikan listing dengan alasan wajib minimal 8 karakter, tercatat di `audit_log`. Penyembunyian bisa dibatalkan: admin tetap melihat baris yang disembunyikan, anon tidak melihat apa pun. Tulisan lewat fungsi *security definer* (migrasi 0015), bukan policy UPDATE lebar — RLS tidak bisa membatasi kolom.

#### F-92 · Kesehatan layanan AI · [FUNGSI] · P1 · BARU
`/api/health` benar-benar mem-ping kedua layanan dan melaporkan waktu bolak-balik, dengan pita "lambat" dan keadaan eksplisit `tidak_dikonfigurasi`. Engine menyediakan telemetri nyata untuk menjawabnya: jendela bergulir 200 sampel, p50/p95/maks, rasio sukses, dan latensi `null` — bukan angka yang tampak masuk akal — selama belum melayani apa pun.

Yang diganti: panel lama menampilkan objek konstan di dalam kode (status "online", p50 42 ms, p95 118 ms, uptime 99,98%) dan tidak pernah menghubungi apa pun. Panel itu satu-satunya layar yang dimaksudkan membuktikan platform hidup, dan ia tidak akan bisa melaporkan gangguan sekalipun seluruh backend mati. Jalannya yang pertama secara live langsung berguna: engine terbaca "mati" karena URL tunelnya memang sudah tidak hidup.

#### F-109 · Siklus hidup rute & jejak audit · [FUNGSI] · P1 · BARU
Konsol punya kata kerja, bukan hanya ubin baca:
- **Rute**: perencana dulu bisa menyimpan rute tapi tidak pernah memajukannya. `draft → locked → running → done` kini maju satu arah, di basis data untuk rute nyata dan lewat peta override lokal untuk rute demo hasil seed.
- **Jejak audit**: `audit_log` sudah ada sejak migrasi 0004 dengan policy baca khusus admin dan tanpa satu layar pun yang membacanya. Migrasi 0016 membuat lima peristiwa inti menulis ke sana **sebagai trigger**, bukan sebagai panggilan dari aplikasi: pesanan ditulis dari tiga jalur berbeda, dan log sisi pemanggil pasti terlewat justru di jalur yang paling jarang dibaca.

Kode internal PRD (F-xx) tidak boleh muncul di string yang dilihat pengguna di layar ini.

---

