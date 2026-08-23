<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1262–1319.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Kontrak API — FastAPI, route handler, aturan seam  
> Sumber: `docs/PRD.md` §baris 1262–1319
>
> [← Model data — tabel, view, aturan RLS](./05-model-data.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Spesifikasi AI Engine — pipeline, cakupan model, pekerjaan v1.0 →](./07-ai-engine.md)

<!-- PRD-SLICE-BEGIN -->
## 12. Kontrak API

### 12.1 Layanan AI (FastAPI, `ai_engine/api.py`)

#### `GET /health`
```json
{ "status": "ok", "models_loaded": ["tomato", "chili"], "uptime_s": 8421 }
```
Dipakai warm-keeper cron dan panel kesehatan admin.

#### `POST /predict` *(ADA)*
`multipart/form-data`: `image` (file), `commodity` (string, mis. `tomato_sayur`), `roi` (opsional, JSON `[x,y,w,h]`).

Sukses → `GradingSuccess` (persis `dict_results` dari `model.py`) + `annotated_img` (data URL JPEG).
Gagal → `{ "status": "error", "message": "…" }`.

Kondisi galat yang sudah ditangani dan **harus dipertahankan**: foto blur (`blur_score < 10`), komoditas tidak didukung, file bukan gambar, ROI bukan JSON valid, bobot model tidak ditemukan.

#### `POST /predict/batch` *(BARU, F-12)*
`images[]` (banyak file), `commodity`, `rois` (JSON array of `[x,y,w,h]|null`, sejajar indeks).
```json
{
  "status": "success",
  "komoditas": "tomato_sayur",
  "per_foto": [ /* GradingSuccess tanpa annotated_img */ ],
  "annotated_imgs": ["data:image/jpeg;base64,…"],
  "agregat": {
    "objek_terdeteksi": 84,
    "ringkasan_batch": { "komposisi": {...}, "skor_keseragaman": 0.78 }
  },
  "hash_audit": "sha256:…"
}
```

#### `GET /metrics` *(BARU, F-92)*
Latensi p50/p95, jumlah permintaan, tingkat galat, model yang termuat.

**NFR-AI-01 [P0]** — Rate limit `/predict` 30 permintaan/menit/IP. Endpoint ini terbuka dan mahal secara komputasi.
**NFR-AI-02 [P0]** — Ukuran gambar maksimum 8 MB; ditolak dengan pesan jelas di atas itu.
**NFR-AI-03 [P1]** — CORS dipersempit dari `*` ke daftar origin produksi + `localhost` sebelum submission.

### 12.2 Route Handler Next.js

| Endpoint | Metode | Auth | Fungsi |
| :--- | :--- | :--- | :--- |
| `/api/lacak/[hash]` | GET | publik | JSON laporan grading tersaring untuk halaman lacak; `Cache-Control: s-maxage=3600` |
| `/api/og/[type]/[id]` | GET | publik | Gambar Open Graph dinamis (listing, lacak) |
| `/api/cron/harga` | POST | header rahasia Vercel Cron | Segarkan `harga_acuan` |
| `/api/cron/warm` | POST | header rahasia Vercel Cron | Ping `/health` layanan AI tiap 5 menit |
| `/api/cron/kedaluwarsa` | POST | header rahasia Vercel Cron | Tandai penawaran > 48 jam sebagai kedaluwarsa |
| `/api/demo/reset` | POST | token bearer | Kembalikan akun demo ke keadaan awal |

### 12.3 Aturan seam frontend

**Tidak ada komponen yang memanggil `supabase` atau `fetch` secara langsung.** Semua baca lewat `src/lib/data.ts`; semua tulis lewat `src/lib/store.tsx`. Fitur baru menambah fungsi di dua berkas itu (atau modul yang mereka ekspor ulang), bukan memotong jalur. Aturan ini ditegakkan lewat lint rule `no-restricted-imports` yang melarang impor `@/lib/supabase` dari `src/app/**` dan `src/components/**`.

---

