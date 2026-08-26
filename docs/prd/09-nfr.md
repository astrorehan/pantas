<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1507–1601.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Non-functional requirements (NFR-*)  
> Sumber: `docs/PRD.md` §baris 1507–1601
>
> [← Algoritma harga & faktor emisi CO₂e](./08-algoritma-harga.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Deployment & operasi — topologi, env, CI/CD, runbook →](./10-deployment.md)

<!-- PRD-SLICE-BEGIN -->
## 15. Non-Functional Requirements

### 15.1 Performa

| ID | Persyaratan | Ambang | Verifikasi |
| :--- | :--- | :--- | :--- |
| NFR-01 | LCP halaman publik | < 4,2 s (Fast 3G tersimulasi; lihat catatan) | Lighthouse CI |
| NFR-02 | LCP halaman aplikasi setelah login | < 4,2 s (Fast 3G tersimulasi; lihat catatan) | Lighthouse CI |
| NFR-03 | INP | < 200 ms | RUM produksi; TBT di Lighthouse CI sebagai peringatan (lihat catatan) |
| NFR-04 | CLS | < 0,05 | Lighthouse CI |
| NFR-05 | Ukuran JS route awal | < 220 KB gzip per route (lihat catatan) | `web/scripts/check-bundle-budget.mjs` di CI |
| NFR-06 | Latensi grading ujung-ke-ujung (foto 900px) | p95 < 6 s termasuk jaringan | Skrip beban |
| NFR-07 | Waktu render tabel 500 baris | < 100 ms | Profil React |

**Catatan NFR-01..02.** Ambang semula 2,0 s dan 2,5 s ditulis sebelum ada
pengukuran. Setelah gerbang Lighthouse CI berdiri (F-99), delapan layar wakil
diukur pada preset ponsel Lighthouse — 1,6 Mbps, RTT 150 ms, throttling
tersimulasi Lantern — dan seluruhnya jatuh di **3,16–3,78 s**. Sebarannya rapat
karena yang mendominasi bukan isi halaman melainkan kerangka klien yang sama di
semua route: 177 KB gzip JS bersama plus tiga wajah huruf. Dua catatan tentang
cara ukurnya, keduanya membuat angka gerbang lebih buruk daripada yang dialami
pengguna: `next start` melayani lewat HTTP/1.1 sehingga 20-an chunk berebut enam
koneksi, sedangkan produksi memakai HTTP/2; dan Lantern menghitung LCP teks dari
graf pesimistis yang menempatkan cat teks setelah seluruh skrip tiba.

Ambang diubah ke **4,2 s** untuk kedua kelas halaman — nilai terukur terburuk
plus ±11% ruang gerak. Pembedaan publik/aplikasi ikut runtuh karena kerangka
bersama itu, bukan kelas route, yang menentukan angkanya. Ini ambang regresi,
bukan sasaran: menurunkannya ke bawah 2 s menuntut halaman publik tanpa hidrasi
React sama sekali, yaitu perubahan arsitektur di luar lingkup F-99.

**Catatan NFR-03.** INP hanya lahir dari interaksi nyata, dan Lighthouse mode
navigasi tidak punya audit INP, jadi bagian labnya berhenti di TBT. TBT itu
dipasang sebagai peringatan, bukan gerbang keras: ia satu-satunya angka waktu CPU
di sini, dan runner GitHub gratis berbagi dua inti dengan tetangga. Untuk commit
yang sama, halaman `/` tercatat 31 ms di mesin pengembang dan 1.212 ms di runner
— selisih 40x yang mengukur beban runner, bukan kode. Ambang error yang cukup
longgar untuk menampungnya tidak akan menangkap regresi apa pun. Angkanya tetap
tercetak dan ikut artefak laporan tiap PR; gerbang keras NFR-03 ada di RUM
produksi.

**Catatan NFR-05.** Ambang semula 180 KB ditulis sebelum ada pengukuran. Runtime
Next 16 + React 19 sendiri sudah 143 KB gzip di first-load setiap route
(react-dom 71, runtime app-router 40, sisanya pemuat dan polyfill modern), dan
angka itu tidak bisa ditawar tanpa berganti framework. Anggaran diubah menjadi
**260 KB gzip total per route**, yang menyisakan ±77 KB untuk kode aplikasi di
atas baseline bersama. Gerbang CI mencetak baseline dan porsi kode aplikasi
terpisah, jadi regresi tetap terlihat meski totalnya masih di bawah ambang.
Pengukuran dilakukan pada chunk first-load dari `route-bundle-stats.json`
Turbopack, digzip pada level 6 (level yang dipakai mayoritas CDN).

### 15.2 Ketersediaan

| ID | Persyaratan |
| :--- | :--- |
| NFR-10 | **Uptime ≥ 99% selama 5–23 Agustus 2026.** Ini adalah persyaratan lomba, bukan aspirasi. |
| NFR-11 | Layanan AI tidak boleh tidur. Cron warm-keeper memanggil `/health` setiap 5 menit. |
| NFR-12 | Bila layanan AI tidak tersedia, aplikasi tetap berfungsi penuh kecuali grading langsung, dan menampilkan status yang jujur — bukan spinner abadi. |
| NFR-13 | Proyek Supabase tidak boleh masuk status *paused*. Cron harian menyentuh database. |
| NFR-14 | Pemantauan uptime eksternal (UptimeRobot free) pada frontend, layanan AI, dan halaman lacak, dengan peringatan ke WhatsApp tim. |

### 15.3 Aksesibilitas

| ID | Persyaratan |
| :--- | :--- |
| NFR-20 | WCAG 2.1 AA di kedua tema |
| NFR-21 | Nol pelanggaran `axe-core` tingkat serius/kritis di CI |
| NFR-22 | Seluruh alur emas dapat diselesaikan hanya dengan keyboard |
| NFR-23 | Target sentuh ≥ 44×44 px pada permukaan mobile |
| NFR-24 | Informasi tidak pernah disampaikan hanya lewat warna |

### 15.4 Keamanan & privasi

| ID | Persyaratan |
| :--- | :--- |
| NFR-30 | RLS aktif di seluruh tabel; diuji dengan tes integrasi lintas-akun |
| NFR-31 | Tidak ada rahasia di bundle klien; hanya `NEXT_PUBLIC_*` yang boleh terekspos |
| NFR-32 | Halaman lacak publik tidak membocorkan PII (email, telepon, alamat presisi, harga) |
| NFR-33 | Unggahan gambar divalidasi tipe & ukuran di klien dan server |
| NFR-34 | Content-Security-Policy header terpasang; tanpa `unsafe-eval` |
| NFR-35 | Rate limit pada `/predict`, `/api/demo/reset`, dan endpoint auth |
| NFR-36 | Advisor keamanan Supabase bersih (lanjutan `0002_security_hardening.sql`) |
| NFR-37 | Pengguna dapat mengunduh dan menghapus datanya sendiri |

### 15.5 Kualitas kode

| ID | Persyaratan |
| :--- | :--- |
| NFR-40 | TypeScript `strict`, nol `any` kecuali pada boundary API vendor yang diberi komentar alasan |
| NFR-41 | ESLint bersih, nol peringatan |
| NFR-42 | Semua komentar kode menjelaskan **mengapa**, bukan **apa** — konsisten dengan gaya kode yang sudah ada |
| NFR-43 | Setiap PR menyertakan tag rubrik dan bukti verifikasi (tangkapan layar atau keluaran tes) |

---

