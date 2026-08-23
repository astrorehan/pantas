<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 252–347.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Arsitektur sistem (as-built & target)  
> Sumber: `docs/PRD.md` §baris 252–347
>
> [← Konteks — cara baca, ringkasan, lomba, masalah, persona, cakupan](./01-konteks.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Design System v2 "Panen" & strategi responsif →](./03-design-system.md)

<!-- PRD-SLICE-BEGIN -->
## 6. Arsitektur Sistem

### 6.1 Kondisi terbangun (as-built, 11 Agustus 2026)

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (PWA)                                               │
│  Next.js 16.2.10 · React 19.2.4 · Tailwind v4                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ src/lib/store.tsx  — state tulis, cache localStorage    │  │
│  │                      per-uid, optimistic + bg sync      │  │
│  │ src/lib/data.ts    — state baca, Supabase → fallback    │  │
│  │                      demo                               │  │
│  │ src/lib/data-admin.ts — seam konsol operator, dipisah   │  │
│  │                      agar tak ikut ke bundel petani     │  │
│  │ src/lib/types.ts   — kontrak tipe (nama field ID =      │  │
│  │                      wire format PantasModel.predict)   │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────┬──────────────────────────┬───────────────────┘
                │                          │
       supabase-js (anon key)      multipart POST /predict
                │                          │
┌───────────────▼──────────────┐  ┌────────▼─────────────────────┐
│ Supabase (ap-southeast-1)    │  │ FastAPI — ai_engine/api.py   │
│ · Auth (email + password)    │  │ Docker, port 7860            │
│ · Postgres + RLS semua tabel │  │ ┌──────────────────────────┐ │
│   profiles, listings, orders,│  │ │ PantasModel.predict()    │ │
│   gradings, harga_acuan,     │  │ │  0 gerbang blur          │ │
│   rute, emisi_faktor,        │  │ │  1 AutoCalibrator (koin) │ │
│   audit_log                  │  │ │  1b gerbang plausibilitas│ │
│ · View listings_view         │  │ │     kalibrasi (F-108)    │ │
│ · RPC verifikasi_serah_terima│  │ │  2 YOLO-1 seg            │ │
│   (security definer)         │  │ │  3 GradingEngine OpenCV  │ │
│ · RPC admin (security        │  │ │  4 YOLO-2 cls (veto)     │ │
│   definer): moderasi listing │  │ │  5 hash_audit SHA-256    │ │
│   & status rute              │  │ └──────────────────────────┘ │
│ · Storage bucket `panen`     │  │ GET /health: p50/p95/max,    │
│ · Trigger handle_new_user    │  │ rasio sukses, jendela 200    │
│ · Trigger audit 5 peristiwa  │  │ sampel bergulir              │
└──────────────────────────────┘  └──────────────────────────────┘
```

**Yang sudah benar dan tidak boleh dirusak saat revamp:**
- Dua *seam* tunggal antara UI dan backend (`data.ts` baca, `store.tsx` tulis). Semua fitur baru masuk lewat seam yang sama.
- Fallback demo di setiap fungsi `data.ts` — aplikasi tetap hidup tanpa env.
- Cache localStorage berkunci UID (`pantas-store-v1:{uid}`) — mencegah kebocoran data antar akun di perangkat yang sama.
- Nama field Indonesia sebagai wire format bersama Python. Tidak ada lapisan translasi di boundary.
- Konsol operator memakai seam ketiga, `data-admin.ts`, karena kodenya hanya boleh mendarat di chunk `/admin` (NFR-05).
- Setiap panel data admin adalah komponen klien. Klien Supabase sisi server berjalan tanpa sesi, sehingga `auth.uid()` bernilai null di sana dan halaman yang dirender di server justru kosong bagi operator yang berhak melihatnya.
- Tulisan operator lewat fungsi *security definer*, bukan policy UPDATE yang lebar. RLS tidak bisa membatasi kolom, jadi policy semacam itu membuat operator bisa menimpa harga milik petani.

### 6.2 Arsitektur target v1.0

Tambahan di atas as-built:

```
┌──────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  + Service Worker (Workbox)  — offline shell + antrean pindai │
│  + IndexedDB (idb-keyval)    — antrean unggah & cache berat   │
│  + View Transitions API      — transisi halaman               │
│  + next-intl                 — id / en                        │
└───────────────┬──────────────────────────┬───────────────────┘
                │                          │
   ┌────────────▼──────────────┐           │
   │ Next.js Route Handlers    │           │
   │ /api/lacak/[hash]  publik │           │
   │ /api/og/[id]  gambar OG   │           │
   │ /api/cron/harga  (Vercel) │           │
   │ /api/cron/warm   (Vercel) │───────────┤ ping /health tiap 5 mnt
   │ /api/demo/reset   admin   │           │  (anti cold-start)
   └────────────┬──────────────┘           │
                │                          │
┌───────────────▼──────────────┐  ┌────────▼─────────────────────┐
│ Supabase                     │  │ FastAPI + PantasModel        │
│ + tabel: penawaran, pengiriman│  │ + POST /predict/batch        │
│   rute, rute_item, pesan,     │  │ + rate limit per IP          │
│   notifikasi, audit_log       │  │ + /metrics (latensi, hit)    │
│ + Realtime channel (chat)     │  │                              │
│ + View: dampak_agregat        │  │                              │
└───────────────────────────────┘  └──────────────────────────────┘
```

**Keputusan arsitektural yang ditetapkan:**

| Keputusan | Pilihan | Alasan |
| :--- | :--- | :--- |
| Route handler vs Server Action | Route handler untuk endpoint publik & cron; Server Action untuk mutasi berautentikasi | Endpoint lacak publik harus bisa di-`GET` tanpa sesi dan di-cache CDN |
| State management | Tetap Context + `useState` di `store.tsx`; **tanpa** Redux/Zustand | Skala state ini kecil; menambah library = risiko regresi tanpa manfaat |
| Chart | SVG tulis tangan (pola `TrenMingguan` yang sudah ada) | Menghindari 40KB+ library; sekaligus bukti "bukan template" |
| Animasi | CSS + View Transitions API native; `motion` hanya bila benar-benar perlu orkestrasi | Bundle budget |
| Ikon | `lucide-react` (open source, tree-shakeable) + set ikon kustom PANTAS untuk grade & komoditas | Guidebook mewajibkan aset disediakan peserta — ikon domain dibuat sendiri |
| Font | Self-hosted via `next/font` — pasangan display + teks (lihat §7.3) | Tanpa request pihak ketiga saat runtime; mengunci CLS |

---

