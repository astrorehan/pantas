# 📚 Dokumentasi Teknis PANTAS

Selamat datang di pusat dokumentasi resmi **PANTAS** (*Platform Sistem Sortasi Mutu Cerdas & Marketplace Hortikultura*).

> **Ajang Kompetisi:** HOLOGY 9.0 (House of Technology) — Cabang Lomba **HoloDev** (*Software Development Competition*)  
> **Penyelenggara:** Fakultas Ilmu Komputer, Universitas Brawijaya (FILKOM UB)  
> **Tema Besar:** *"Bloom Beyond: Where Ideas Take Root and Reach Further"*  
> **Subtema:** **Ketahanan Pangan dan Pertanian Cerdas** (*Smart Agriculture and Food Security*)  
> **Tim Pengembang:** **Inilah 4 trio** (Universitas Gadjah Mada)  
> **Tagline:** *Setiap Panen Pantas Dihargai*  
> **Live Demo:** [https://pantas-ai.vercel.app](https://pantas-ai.vercel.app)  

---

## 🗺️ Peta Navigasi Dokumentasi

| Dokumen | Deskripsi & Cakupan | Tautan |
| :--- | :--- | :--- |
| 📋 **PRD (Product Requirements Document)** | Kontrak build lengkap: 72 fitur terindeks (F-ID), 12 Epic (EP-A s.d. EP-L), model data, NFR, roadmap, dan matriks rubrik lomba. | [`docs/PRD.md`](PRD.md) |
| 📑 **Modular PRD Slices** | 30 potongan modular PRD yang terverifikasi *byte-for-byte* untuk navigasi cepat per bab dan per epic. | [`docs/prd/00-INDEX.md`](prd/00-INDEX.md) |
| 🧠 **Spesifikasi AI Engine** | Penjelasan mendalam pipeline Dual-Stage YOLOv11, OpenCV Rule Engine, kalibrasi koin Rp500, gerbang plausibilitas, dan kartu rapor model. | [`docs/AI.md`](AI.md) & [`docs/AI_ENGINE.md`](AI_ENGINE.md) |
| 🗄️ **Arsitektur Backend & Database** | Dokumentasi skema PostgreSQL Supabase, aturan Row-Level Security (RLS), seam arsitektur data, dan migrasi SQL. | [`docs/BACKEND.md`](BACKEND.md) |
| 📊 **Pelacak Progres Fitur (Backlog)** | Pelacak status eksekusi 72 F-ID yang digenerate otomatis dari master PRD (93% selesai, 67/72 fitur). | [`docs/BACKLOG.md`](BACKLOG.md) |
| 🔍 **Analisis Kesenjangan (Gap Analysis)** | Evaluasi menyeluruh terhadap kelengkapan fitur dan kepatuhan PRD. | [`docs/GAP_ANALYSIS.md`](GAP_ANALYSIS.md) |
| 🎤 **Materi & Slide Pitch Deck** | Bank narasi presentasi 10 menit, bank tanya-jawab dewan juri, dan prompt pembuatan slide 16:9 berbasis HTML. | [`docs/MATERI_PRESENTASI.md`](MATERI_PRESENTASI.md) & [`docs/SLIDE_PRESENTASI.md`](SLIDE_PRESENTASI.md) |

---

## 🏗️ Ringkasan Arsitektur Sistem

PANTAS dibangun dengan arsitektur modern berkinerja tinggi, memisahkan *presentation layer*, *data persistence layer*, dan *specialized AI inference service*.

```mermaid
flowchart TB
    subgraph ClientLayer ["1. Client & Presentation Layer (Next.js 16 + Tailwind v4)"]
        UI_Petani["👨‍🌾 Alur Petani\n(PWA, Offline Queue, Voice Guide)"]
        UI_Pembeli["🏭 Alur Pembeli\n(Desktop Catalog, Inquiry, Compare)"]
        UI_Admin["🛠️ Alur Koperasi/Admin\n(Consolidated Logistics, AI Health)"]
        UI_Public["🌐 Halaman Publik\n(Landing, /lacak/[hash], /tentang)"]
    end

    subgraph SeamLayer ["2. Data Access & State Seam (Strict Isolation)"]
        ReadSeam["`src/lib/data.ts`\n(Single Read Seam + Demo Fallback)"]
        WriteSeam["`src/lib/store.tsx`\n(Single Write Seam + Local Cache)"]
    end

    subgraph BackendLayer ["3. Backend & Storage (Supabase)"]
        S_Auth["Supabase Auth\n(Email/Password, Demo Accounts)"]
        S_DB["PostgreSQL Database\n(18 Migrations, Strict RLS Policies)"]
        S_Storage["Supabase Storage\n(Batch Images & Annotated Outputs)"]
    end

    subgraph AILayer ["4. AI Computer Vision Service (FastAPI + YOLOv11)"]
        YOLO1["YOLOv11 Instance Segmentation\n(Masking & Background Clean)"]
        Calibration["Metric Calibration\n(Rp500 Coin Ø27mm Detection)"]
        RuleEngine["OpenCV Geometry Rule Engine\n(Solidity, Circularity, Size)"]
        YOLO2["YOLOv11 Pathology Classifier\n(Rot & Disease Veto)"]
        HashAudit["SHA-256 Canonical Audit Hash\n(Tamper-Proof Verification)"]
    end

    ClientLayer --> SeamLayer
    SeamLayer --> BackendLayer
    ClientLayer -.->|"Direct /api/scan (Multiparts)"| AILayer
    AILayer --> YOLO1 --> Calibration --> RuleEngine --> YOLO2 --> HashAudit
```

---

## 👥 Tim Pengembang — **Inilah 4 trio**

Semua anggota merupakan mahasiswa aktif **Universitas Gadjah Mada (UGM)**:

| Nama Anggota | NIM | Peran Utama | Fokus Kontribusi |
| :--- | :--- | :--- | :--- |
| **Muhammad Choirudin Ammar** | `25/556251/TK/62735` | **AI Engineer** | Arsitektur Dual-Stage YOLOv11, kurasi dataset & auto-masking, rule engine OpenCV geometri, kalibrasi koin Rp500, gerbang plausibilitas, dan set regresi otomatis. |
| **Muhammad Raihan Surya** | `25/560713/TK/63338` | **Fullstack Developer (Lead)** | Aplikasi web Next.js 16 end-to-end, Supabase RLS & skema database, seam arsitektur data (`data.ts`/`store.tsx`), design system Panen v2, dan integrasi AI API. |
| **Ahmad Rafi Firdaus** | `25/560526/TK/63314` | **Product Ideation & Strategist** | Perumusan konsep produk, riset Food Loss & Waste (FLW), pemetaan keselarasan subtema HOLOGY 9.0, user journey petani & pembeli, formulasi harga adil. |

---

## 🚀 Panduan Menjalankan Proyek Secara Lokal

### 1. Prasyarat Lingkungan
- **Node.js**: `v20.x` atau lebih baru
- **Python**: `3.10` – `3.12`
- **Git**
- Akun **Supabase** (opsional untuk pengembangan lokal; mode demo berjalan 100% tanpa env)

### 2. Menjalankan Frontend (Web App)
```bash
# Masuk ke direktori web
cd web

# Install dependensi
npm install

# Sinkronkan daftar komoditas dengan engine AI
npm run gen:komoditas

# Jalankan server pengembangan
npm run dev
```
Buka browser di `http://localhost:3000`.

### 3. Menjalankan AI Engine (FastAPI Service)
```bash
# Masuk ke direktori ai_engine
cd ai_engine

# Buat virtual environment
python -m venv .venv
source .venv/bin/activate  # Di Windows: .venv\Scripts\activate

# Install dependensi
pip install -r requirements.txt

# Jalankan FastAPI server
uvicorn api:app --reload --port 8000
```
Dokumentasi interaktif Swagger API akan tersedia di `http://localhost:8000/docs`.

### 4. Kredensial Akun Uji Coba (Demo Mode)
Tersedia 3 akun bawaan yang terisi data simulasi nyata wilayah D.I. Yogyakarta:
- **Petani**: `petani@demo.pantas.id` (Kata sandi: `demo1234`)
- **Pembeli Industri**: `pembeli@demo.pantas.id` (Kata sandi: `demo1234`)
- **Admin / Koperasi**: `admin@demo.pantas.id` (Kata sandi: `demo1234`)
- Atau cukup kunjungi halaman `/demo` untuk masuk dengan 1-ketukan tanpa mengetik.
