<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 919–950.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — EP-G — Ketelusuran (Traceability)  
> Sumber: `docs/PRD.md` §baris 919–950  ·  Epic: `EP-G` Ketelusuran
>
> [← EP-F — Logistik & Rantai Pasok (pilar tema)](./EP-F-logistik.md) · [Indeks](../00-INDEX.md) · [Backlog](../../BACKLOG.md) · [EP-H — Dampak & Keberlanjutan →](./EP-H-dampak.md)

<!-- PRD-SLICE-BEGIN -->
### EP-G — Ketelusuran (Traceability)

#### F-60 · Halaman lacak publik · [INOVASI][TEMA] · P0 · BARU
*Sebagai pembeli — atau siapa pun yang memegang peti — saya ingin memindai QR dan melihat laporan mutu asli batch ini.*

Route publik `/lacak/[hash]`, tanpa autentikasi, dapat di-cache CDN.

Menampilkan:
- Komoditas, tanggal grading, nama & lokasi petani (kabupaten saja — bukan alamat presisi).
- Foto beranotasi.
- Komposisi grade + skor keseragaman.
- Status kalibrasi.
- Ringkasan kondisi patologi YOLO-2.
- `hash_audit` lengkap + penjelasan cara verifikasinya.
- Bila tertaut pesanan: rantai kustodi (kapan dijemput, rute mana, kapan tiba) — dari EP-F.
- Checklist rantai dingin bila ada.

**Acceptance criteria**
- [ ] Berfungsi tanpa sesi, dan tetap berfungsi bila listing sudah tidak tayang.
- [ ] Tidak membocorkan: email, nomor telepon, alamat presisi, harga jual.
- [ ] Gambar OG dinamis per hash supaya tautan tampil kaya di WhatsApp.
- [ ] `hash_audit` dapat diverifikasi ulang: halaman menampilkan payload kanonik yang di-hash, sehingga pihak ketiga bisa menghitung SHA-256-nya sendiri dan mencocokkan.

#### F-61 · QR pada listing & tanda terima · [INOVASI][TEMA] · P1 · BARU
- [ ] QR ke `/lacak/[hash]` dicetak di PDF laporan grading, PDF tanda terima, dan tampil di detail listing.
- [ ] Lembar label peti yang dapat dicetak (A4, 6 label per lembar) berisi QR + komoditas + grade + tanggal.

#### F-62 · Log audit · [FUNGSI] · P2 · BARU
Tabel `audit_log` mencatat peristiwa penting (grading tersimpan, listing terbit, status pesanan berubah, harga acuan berubah, verifikasi serah terima). Terlihat di `/admin/audit`. Menunjukkan kematangan sistem kepada juri.

---

