<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.
     Sumber: docs/PRD.md baris 1063–1261.
     Untuk mengubah isi: edit docs/PRD.md, lalu jalankan `node scripts/split-prd.mjs`. -->

> **Potongan PRD** — Model data — tabel, view, aturan RLS  
> Sumber: `docs/PRD.md` §baris 1063–1261
>
> [← EP-L — Platform (PWA, a11y, i18n, performa)](./epics/EP-L-platform.md) · [Indeks](./00-INDEX.md) · [Backlog](../BACKLOG.md) · [Kontrak API — FastAPI, route handler, aturan seam →](./06-kontrak-api.md)

<!-- PRD-SLICE-BEGIN -->
## 11. Model Data

### 11.1 Tabel terpasang (dipertahankan)

| Tabel | Peran | Catatan RLS |
| :--- | :--- | :--- |
| `profiles` | Identitas, peran, lokasi, rating | Baca sendiri + profil publik terbatas lewat `listings_view` |
| `listings` | Penawaran jual | Baca publik bila `status = 'tayang'`; tulis hanya pemilik dengan `peran = 'petani'` |
| `orders` | Transaksi | Hanya dua pihak transaksi |
| `gradings` | Laporan AI + `hasil` jsonb + `hash_audit` | Privat per petani |
| `harga_acuan` | Harga pasar acuan | Baca publik; tulis hanya service role |
| `listings_view` | Listing + profil petani | View baca |

### 11.2 Tabel baru

```sql
-- Penawaran / negosiasi (F-32)
create table penawaran (
  id            uuid primary key default gen_random_uuid(),
  listing_id    text not null references listings(id) on delete cascade,
  pembeli_id    uuid not null references profiles(id),
  petani_id     uuid not null references profiles(id),
  kuantitas_kg  numeric(10,2) not null check (kuantitas_kg > 0),
  harga_per_kg  integer not null check (harga_per_kg > 0),
  tanggal_ambil date,
  catatan       text,
  status        text not null default 'terkirim'
                check (status in ('terkirim','ditawar_balik','diterima','ditolak','kedaluwarsa')),
  induk_id      uuid references penawaran(id),   -- rantai tawar-menawar
  kedaluwarsa_pada timestamptz not null default now() + interval '48 hours',
  created_at    timestamptz not null default now()
);

-- Kode serah terima dipisah dari orders (F-41, menutup utang keamanan v1)
create table order_kode (
  order_id  text primary key references orders(id) on delete cascade,
  kode      text not null,
  dipakai_pada timestamptz
);
-- RLS: hanya pembeli pemilik pesanan yang boleh select. Petani TIDAK PERNAH select;
-- pencocokan hanya lewat RPC verifikasi_serah_terima (security definer).

-- Riwayat status pesanan (F-40)
create table pesanan_riwayat (
  id         bigserial primary key,
  order_id   text not null references orders(id) on delete cascade,
  status     text not null,
  oleh       uuid references profiles(id),
  catatan    text,
  created_at timestamptz not null default now()
);

-- Logistik (F-50)
create table pengiriman (
  id             uuid primary key default gen_random_uuid(),
  order_id       text not null references orders(id) on delete cascade,
  metode         text not null check (metode in ('jemput_mandiri','konsolidasi','kurir_mitra')),
  jendela_mulai  timestamptz,
  jendela_selesai timestamptz,
  alamat_jemput  text,
  lat            double precision,
  lng            double precision,
  status         text not null default 'dijadwalkan'
                 check (status in ('dijadwalkan','dijemput','dalam_perjalanan','tiba','diterima','batal')),
  checklist      jsonb default '{}'::jsonb,       -- rantai dingin (F-52)
  ongkos_estimasi integer,
  catatan        text,
  created_at     timestamptz not null default now()
);

-- Konsolidasi rute (F-51)
create table rute (
  id           uuid primary key default gen_random_uuid(),
  tanggal      date not null,
  kendaraan    text,
  kapasitas_kg numeric(10,2),
  status       text not null default 'draf'
               check (status in ('draf','terkunci','berjalan','selesai')),
  jarak_km     numeric(10,2),
  jarak_individual_km numeric(10,2),   -- pembanding untuk kartu penghematan
  dibuat_oleh  uuid references profiles(id),
  created_at   timestamptz not null default now()
);

create table rute_item (
  rute_id       uuid not null references rute(id) on delete cascade,
  pengiriman_id uuid not null references pengiriman(id) on delete cascade,
  urutan        integer not null,
  primary key (rute_id, pengiriman_id)
);

-- Chat (F-33)
create table pesan (
  id         bigserial primary key,
  konteks    text not null check (konteks in ('penawaran','pesanan')),
  konteks_id text not null,
  pengirim_id uuid not null references profiles(id),
  isi        text not null,
  dibaca_pada timestamptz,
  created_at timestamptz not null default now()
);

-- Notifikasi (F-32, F-40, F-50)
create table notifikasi (
  id         bigserial primary key,
  user_id    uuid not null references profiles(id) on delete cascade,
  jenis      text not null,
  judul      text not null,
  isi        text,
  tautan     text,
  dibaca_pada timestamptz,
  created_at timestamptz not null default now()
);

-- Rating (F-42)
create table ulasan (
  id         uuid primary key default gen_random_uuid(),
  order_id   text not null references orders(id) on delete cascade,
  penilai_id uuid not null references profiles(id),
  dinilai_id uuid not null references profiles(id),
  bintang    smallint not null check (bintang between 1 and 5),
  komentar   text,
  created_at timestamptz not null default now(),
  unique (order_id, penilai_id)
);

-- Log audit (F-62)
create table audit_log (
  id         bigserial primary key,
  aktor_id   uuid references profiles(id),
  aksi       text not null,
  entitas    text not null,
  entitas_id text,
  meta       jsonb,
  created_at timestamptz not null default now()
);
```

### 11.3 Perubahan tabel terpasang

```sql
alter table profiles
  add column is_demo boolean not null default false,
  add column tur_selesai boolean not null default false,
  add column telepon text,
  add column deskripsi text,
  add column foto_url text,
  add column rating numeric(3,2) default 0,
  add column bahasa text default 'id',
  add column tema text default 'system';

alter table orders
  add column berat_aktual_kg numeric(10,2),
  add column catatan_mutu text,
  add column alasan_batal text;

alter table listings
  add column grading_id uuid references gradings(id),   -- tautan ke laporan mutu (F-31)
  add column satuan text default 'kg',
  add column catatan text,
  add column dilihat integer not null default 0;

alter table gradings
  add column publik boolean not null default true;      -- kendali halaman lacak (F-60)

create index on penawaran (petani_id, status);
create index on penawaran (pembeli_id, status);
create index on pengiriman (order_id);
create index on gradings (hash_audit);
create index on notifikasi (user_id, dibaca_pada);
```

### 11.4 View baru

```sql
-- Dampak agregat platform (F-66) — mengecualikan data demo
create view dampak_agregat as
select
  count(distinct o.id)                          as transaksi_selesai,
  coalesce(sum(o.berat_aktual_kg), sum(o.berat_kg), 0) as kg_tersalurkan,
  coalesce(sum(o.total), 0)                     as nilai_transaksi,
  coalesce(sum(r.jarak_individual_km - r.jarak_km), 0) as km_dihemat
from orders o
join profiles p on p.id = o.petani_id and p.is_demo = false
left join pengiriman s on s.order_id = o.id
left join rute_item ri on ri.pengiriman_id = s.id
left join rute r on r.id = ri.rute_id and r.status = 'selesai'
where o.status = 'selesai';
```

### 11.5 Aturan RLS yang mengikat

**NFR-SEC-01 [P0]** — RLS aktif di **setiap** tabel baru sebelum tabel tersebut dipakai kode aplikasi. Tabel tanpa policy = tabel yang tidak boleh dirilis.
**NFR-SEC-02 [P0]** — Service role key tidak pernah muncul di bundle klien. Hanya dipakai di Route Handler `/api/cron/*` dan `/api/demo/reset`.
**NFR-SEC-03 [P0]** — `order_kode` tidak pernah dapat di-`select` oleh petani. Diverifikasi dengan tes integrasi yang mencoba `select` sebagai petani dan mengharapkan nol baris.
**NFR-SEC-04 [P0]** — Halaman lacak publik hanya membaca lewat view/`RPC` yang sudah memfilter kolom sensitif; tidak pernah `select *` dari `gradings`.

---

