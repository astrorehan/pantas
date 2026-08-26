<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1710–1768.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Judge experience & demo kit  
> Sumber: `docs/PRD.md` §baris 1710–1768  ·  Epic: `EP-O` Demo Kit & Judge Experience
>
> [← QA & rencana uji — 5 alur emas, matriks perangkat](./11-qa.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Deliverable lomba — checklist, peta proposal, pitch deck →](./13-deliverable.md)

<!-- PRD-SLICE-BEGIN -->
## 18. Judge Experience & Demo Kit

### 18.1 Jalur juri (dirancang eksplisit)

```
Juri membuka tautan
      ▼
/ (landing) — 20 detik memahami masalah + solusi
      ▼
Coba demo grading langsung di landing — tanpa login, hasil AI nyata
      ▼
Klik "Coba Demo Juri" → /demo
      ▼
Tiga kartu kredensial, satu klik masuk
      ▼
Dashboard terisi penuh + tur berpandu 5 langkah
      ▼
Jelajah bebas: pindai, harga, katalog, peta, logistik, dampak, lacak
```

**F-110 [PRESENTASI] P0** — Halaman `/demo` juga memuat: skrip demo 3 menit yang dapat diikuti juri sendiri, tautan langsung ke lima layar paling mengesankan, dan tautan ke repositori serta dokumen teknis.

### 18.2 Kit demo final offline (22 Agustus)

| Item | Alasan |
| :--- | :--- |
| Perangkat cadangan (2 ponsel + 1 laptop), semua sudah login | Kegagalan perangkat tidak boleh menghentikan demo |
| Hotspot seluler sendiri, 2 operator berbeda | Wi-Fi venue tidak dapat diandalkan |
| Tomat & cabai segar + koin Rp500 (3 buah) | Demo grading **langsung** di panggung jauh lebih kuat daripada rekaman |
| Lampu LED portabel kecil | Pencahayaan panggung sering buruk untuk kamera ponsel |
| Rekaman video 90 detik alur lengkap | Jaring pengaman bila jaringan mati total |
| Build offline PWA yang sudah ter-cache di perangkat | Lapisan pengaman kedua |
| Lembar cetak: arsitektur + metrik model + QR ke aplikasi | Dibagikan ke juri; QR mengarah ke `/demo` |

**F-111 [PRESENTASI] P0** — Latihan demo minimal 5 kali penuh dengan stopwatch, termasuk satu latihan dengan jaringan sengaja dimatikan.

### 18.3 Struktur presentasi 10 menit

| Menit | Isi |
| :--- | :--- |
| 0:00–1:00 | Masalah — angka susut pascapanen + cerita satu petani |
| 1:00–1:30 | Tesis produk dalam satu kalimat |
| 1:30–5:00 | **Demo langsung** — pindai tomat asli di panggung → grade → harga → listing → pembeli memesan → lacak QR |
| 5:00–7:00 | Kedalaman teknis — pipeline 2 tahap, kalibrasi koin, veto berkorroborasi, hash audit |
| 7:00–8:30 | Dampak & keselarasan tema — angka dampak agregat, konsolidasi logistik, penghematan CO₂e |
| 8:30–10:00 | Peta jalan + penutup |

### 18.4 Bank pertanyaan tanya jawab

Siapkan jawaban tertulis untuk minimal:
- "Bagaimana kalau petani tidak punya koin Rp500?" → referensi alternatif dapat dikonfigurasi; kalibrasi gagal tidak memblokir grading, hanya menonaktifkan ukuran metrik.
- "Bagaimana model Anda menangani komoditas yang belum dilatih?" → API menolak eksplisit; pipeline latih sudah siap; batasan dinyatakan di kartu model.
- "Apa yang mencegah petani memanipulasi foto?" → hash audit + kalibrasi koin + veto patologi + rating dua arah + berat aktual saat serah terima.
- "Kenapa tidak pakai payment gateway?" → keputusan sadar (§5.2), dengan rancangan escrow di peta jalan.
- "Berapa akurasinya di lapangan, bukan di dataset?" → hasil uji lapangan §17.4, jujur tentang keterbatasan.
- "Bagaimana ini menghasilkan uang?" → komisi transaksi + layanan logistik + data agregat untuk industri (anonim).

---

