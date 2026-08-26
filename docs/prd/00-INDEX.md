<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI. -->

# Indeks PRD PANTAS v1.0

Muat berkas ini lebih dulu, lalu buka **hanya potongan yang relevan**.
PRD utuh (`docs/PRD.md`, 2.034 baris) adalah sumber kebenaran dan berkas yang diedit manusia —
potongan di direktori ini digenerate ulang dari sana, jadi tidak mungkin melenceng.

- **Butuh daftar kerja + status?** → [`docs/BACKLOG.md`](../BACKLOG.md)
- **Butuh detail satu fitur?** → cari F-ID di kolom **Fitur** tabel bawah, buka satu berkas itu saja.

---

## Peta potongan

| Berkas | Isi | Baris di PRD.md | Fitur |
| :--- | :--- | ---: | :--- |
| [`01-konteks.md`](01-konteks.md) | Konteks — cara baca, ringkasan, lomba, masalah, persona, cakupan | 1–251 | — |
| [`02-arsitektur.md`](02-arsitektur.md) | Arsitektur sistem (as-built & target) | 252–347 | — |
| [`03-design-system.md`](03-design-system.md) | Design System v2 "Panen" & strategi responsif | 348–595 | F-70, F-71, F-72, F-73, F-74, F-75, F-76, F-77, F-78, F-79, F-80, F-81 |
| [`04-navigasi.md`](04-navigasi.md) | Information architecture & navigasi | 596–664 | F-82, F-83, F-84 |
| [`epics/README.md`](epics/README.md) | Spesifikasi fitur — pengantar & format | 665–670 | — |
| [`epics/EP-A-onboarding.md`](epics/EP-A-onboarding.md) | EP-A — Onboarding & Autentikasi | 671–729 | F-01, F-02, F-03, F-04, F-05 |
| [`epics/EP-B-grading.md`](epics/EP-B-grading.md) | EP-B — Grading AI | 730–784 | F-10, F-11, F-12, F-13, F-14, F-15 |
| [`epics/EP-C-harga.md`](epics/EP-C-harga.md) | EP-C — Rekomendasi Harga | 785–811 | F-20, F-21, F-22 |
| [`epics/EP-D-marketplace.md`](epics/EP-D-marketplace.md) | EP-D — Marketplace | 812–860 | F-30, F-31, F-32, F-33, F-34 |
| [`epics/EP-E-pesanan.md`](epics/EP-E-pesanan.md) | EP-E — Pesanan & Serah Terima | 861–883 | F-40, F-41, F-42 |
| [`epics/EP-F-logistik.md`](epics/EP-F-logistik.md) | EP-F — Logistik & Rantai Pasok (pilar tema) | 884–918 | F-50, F-51, F-52, F-53 |
| [`epics/EP-G-traceability.md`](epics/EP-G-traceability.md) | EP-G — Ketelusuran (Traceability) | 919–950 | F-60, F-61, F-62 |
| [`epics/EP-H-dampak.md`](epics/EP-H-dampak.md) | EP-H — Dampak & Keberlanjutan | 951–969 | F-65, F-66, F-67 |
| [`epics/EP-I-akun.md`](epics/EP-I-akun.md) | EP-I — Akun & Preferensi | 970–986 | F-68, F-69 |
| [`epics/EP-J-publik.md`](epics/EP-J-publik.md) | EP-J — Publik & Konten | 987–998 | F-85, F-86 |
| [`epics/EP-K-admin.md`](epics/EP-K-admin.md) | EP-K — Admin & Operasi | 999–1020 | F-90, F-91, F-92, F-109 |
| [`epics/EP-L-platform.md`](epics/EP-L-platform.md) | EP-L — Platform (PWA, a11y, i18n, performa) | 1021–1062 | F-95, F-96, F-97, F-98, F-99, F-112 |
| [`05-model-data.md`](05-model-data.md) | Model data — tabel, view, aturan RLS | 1063–1261 | — |
| [`06-kontrak-api.md`](06-kontrak-api.md) | Kontrak API — FastAPI, route handler, aturan seam | 1262–1319 | — |
| [`07-ai-engine.md`](07-ai-engine.md) | Spesifikasi AI Engine — pipeline, cakupan model, pekerjaan v1.0 | 1320–1426 | F-100, F-101, F-102, F-103, F-107, F-108 |
| [`08-algoritma-harga.md`](08-algoritma-harga.md) | Algoritma harga & faktor emisi CO₂e | 1427–1506 | F-104, F-105, F-106 |
| [`09-nfr.md`](09-nfr.md) | Non-functional requirements (NFR-*) | 1507–1601 | — |
| [`10-deployment.md`](10-deployment.md) | Deployment & operasi — topologi, env, CI/CD, runbook | 1602–1661 | — |
| [`11-qa.md`](11-qa.md) | QA & rencana uji — 5 alur emas, matriks perangkat | 1662–1709 | — |
| [`12-judge-demo.md`](12-judge-demo.md) | Judge experience & demo kit | 1710–1768 | F-110, F-111 |
| [`13-deliverable.md`](13-deliverable.md) | Deliverable lomba — checklist, peta proposal, pitch deck | 1769–1816 | — |
| [`14-risk.md`](14-risk.md) | Risk register (R-*) | 1817–1838 | — |
| [`15-roadmap.md`](15-roadmap.md) | Roadmap & milestone per fase | 1839–1919 | — |
| [`16-dod-metrik.md`](16-dod-metrik.md) | Definition of Done & metrik | 1920–1959 | — |
| [`17-lampiran.md`](17-lampiran.md) | Lampiran — glosarium, keputusan, pertanyaan terbuka, referensi | 1960–2034 | — |

---

## Mencari satu F-ID

Kolom **Fitur** di tabel atas sudah menunjukkan berkas pemilik tiap F-ID.
Judul, prioritas, tag rubrik, status kerja, dan nomor baris persis di `PRD.md`
ada di [`docs/BACKLOG.md`](../BACKLOG.md) — sengaja tidak diduplikat di sini
supaya tidak ada dua daftar yang bisa berbeda.

Total 72 F-ID terdefinisi di PRD.
