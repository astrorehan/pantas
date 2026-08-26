<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1602–1661.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Deployment & operasi — topologi, env, CI/CD, runbook  
> Sumber: `docs/PRD.md` §baris 1602–1661
>
> [← Non-functional requirements (NFR-*)](./09-nfr.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [QA & rencana uji — 5 alur emas, matriks perangkat →](./11-qa.md)

<!-- PRD-SLICE-BEGIN -->
## 16. Deployment & Operasi

### 16.1 Topologi

| Komponen | Platform | Domain | Catatan |
| :--- | :--- | :--- | :--- |
| Frontend | Vercel | **`pantas-ai.vercel.app`** | Region `sin1` untuk kedekatan dengan Supabase ap-southeast-1. Subdomain Vercel, tanpa DNS eksternal — nol risiko propagasi menjelang tenggat |
| Layanan AI | Hugging Face Spaces (Docker, port 7860) | `…-pantas-grading.hf.space` | `Dockerfile` sudah ada. Free tier tidur setelah 48 jam idle ⇒ warm-keeper wajib |
| Database/Auth/Storage | Supabase | `saipqorcjeizxizjpfsp.supabase.co` | ap-southeast-1, sudah terpasang |
| Pemantauan | UptimeRobot + Sentry | — | Free tier keduanya |

### 16.2 Variabel lingkungan

```
# web/.env.local  (dan Vercel Project Settings)
NEXT_PUBLIC_SUPABASE_URL=            # sudah terisi
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # sudah terisi
NEXT_PUBLIC_PREDICT_URL=             # sudah terisi
NEXT_PUBLIC_SITE_URL=                # untuk OG & tautan absolut
SUPABASE_SERVICE_ROLE_KEY=           # SERVER SAJA — tidak pernah NEXT_PUBLIC_
CRON_SECRET=                         # header rahasia Vercel Cron
DEMO_RESET_TOKEN=
SENTRY_DSN=
```

**Pemeriksaan wajib sebelum submission:** jalankan `grep -r "SERVICE_ROLE" .next/static/` dan pastikan nol hasil.

### 16.3 CI/CD

`.github/workflows/ci.yml` pada setiap push & PR:

1. `npm ci`
2. `npm run gen:komoditas` — pastikan berkas generated sinkron; gagal bila ada diff
3. `tsc --noEmit`
4. `eslint`
5. `vitest run` — unit + komponen
6. `playwright test` — 5 alur emas
7. `lhci autorun` — anggaran performa
8. `axe` — pemindaian aksesibilitas
9. Analisis bundle — gagal bila melewati NFR-05

Deploy: merge ke `main` → Vercel production. Tag `v1.0.0` sebelum submission.

### 16.4 Runbook (dijalankan tanggal 4–5 Agustus)

- [ ] Semua migrasi diterapkan ke Supabase produksi
- [ ] `seed_demo.sql` dijalankan; ketiga akun demo diverifikasi manual
- [ ] Cron warm-keeper aktif dan terverifikasi (cek log 3 siklus)
- [ ] Cron reset demo aktif
- [ ] Pemantauan uptime aktif dengan peringatan ke WhatsApp
- [ ] URL produksi diakses dari jaringan seluler (bukan hanya Wi-Fi kantor)
- [ ] Diuji di Chrome, Firefox, Safari (macOS & iOS), Edge
- [ ] Diuji di lebar 360, 768, 1024, 1440, 1920
- [ ] Lighthouse ≥ 95 di empat kategori pada halaman publik
- [ ] README repositori berisi: ikhtisar, arsitektur, cara jalan lokal, kredensial demo, tautan produksi
- [ ] Repositori GitHub dijadikan publik; `.env.local` terkonfirmasi tidak pernah ter-commit
- [ ] Bobot model tersedia di repositori atau tautan unduhan yang dinyatakan di README

---

