-- PANTAS — Migrasi 0004: Fitur P0 Tambahan (Penawaran, Logistik, OrderKode, EmisiFaktor, AuditLog, DampakAgregat)

-- 1. Tabel Penawaran / Negosiasi (F-32)
create table if not exists public.penawaran (
  id            uuid primary key default gen_random_uuid(),
  listing_id    text not null references public.listings(id) on delete cascade,
  pembeli_id    uuid not null references public.profiles(id),
  petani_id     uuid not null references public.profiles(id),
  kuantitas_kg  numeric(10,2) not null check (kuantitas_kg > 0),
  harga_per_kg  integer not null check (harga_per_kg > 0),
  tanggal_ambil date,
  catatan       text,
  status        text not null default 'terkirim'
                check (status in ('terkirim','ditawar_balik','diterima','ditolak','kedaluwarsa')),
  induk_id      uuid references public.penawaran(id),
  kedaluwarsa_pada timestamptz not null default now() + interval '48 hours',
  created_at    timestamptz not null default now()
);

-- 2. Isolasi Kode Serah Terima (F-41 / NFR-SEC-03)
create table if not exists public.order_kode (
  order_id     text primary key references public.orders(id) on delete cascade,
  kode         text not null,
  dipakai_pada timestamptz
);

-- 3. Riwayat Status Pesanan (F-40)
create table if not exists public.pesanan_riwayat (
  id         bigserial primary key,
  order_id   text not null references public.orders(id) on delete cascade,
  status     text not null,
  oleh       uuid references public.profiles(id),
  catatan    text,
  created_at timestamptz not null default now()
);

-- 4. Pengiriman & Logistik (F-50)
create table if not exists public.pengiriman (
  id              uuid primary key default gen_random_uuid(),
  order_id        text not null references public.orders(id) on delete cascade,
  metode          text not null default 'konsolidasi' check (metode in ('jemput_mandiri','konsolidasi','kurir_mitra')),
  jendela_mulai   timestamptz,
  jendela_selesai timestamptz,
  alamat_jemput   text,
  lat             double precision,
  lng             double precision,
  status          text not null default 'dijadwalkan'
                  check (status in ('dijadwalkan','dijemput','dalam_perjalanan','tiba','diterima','batal')),
  checklist       jsonb default '{}'::jsonb,
  ongkos_estimasi integer,
  catatan         text,
  created_at      timestamptz not null default now()
);

-- 5. Konsolidasi Rute (F-51)
create table if not exists public.rute (
  id                  uuid primary key default gen_random_uuid(),
  tanggal             date not null default current_date,
  kendaraan           text default 'Pickup L300 (1.5 Ton)',
  kapasitas_kg        numeric(10,2) default 1500.00,
  status              text not null default 'draf'
                      check (status in ('draf','terkunci','berjalan','selesai')),
  jarak_km            numeric(10,2) default 0,
  jarak_individual_km numeric(10,2) default 0,
  dibuat_oleh         uuid references public.profiles(id),
  created_at          timestamptz not null default now()
);

create table if not exists public.rute_item (
  rute_id       uuid not null references public.rute(id) on delete cascade,
  pengiriman_id uuid not null references public.pengiriman(id) on delete cascade,
  urutan        integer not null,
  primary key (rute_id, pengiriman_id)
);

-- 6. Emisi Faktor Terkonfigurasi (F-106 - Poore & Nemecek 2018)
create table if not exists public.emisi_faktor (
  komoditas  text primary key,
  faktor     numeric(4,2) not null, -- kg CO2e per kg panen
  sumber     text not null,
  catatan    text
);

insert into public.emisi_faktor (komoditas, faktor, sumber, catatan)
values
  ('carrot', 0.43, 'Poore & Nemecek (2018), Science', 'Root Vegetables baseline'),
  ('cucumber', 0.53, 'Poore & Nemecek (2018), Science', 'Other Vegetables baseline'),
  ('chili', 0.53, 'Poore & Nemecek (2018), Science', 'Other Vegetables baseline'),
  ('tomato', 0.53, 'Poore & Nemecek (2018), Science', 'Tomat lapangan terbuka (konservatif)')
on conflict (komoditas) do update set
  faktor = excluded.faktor,
  sumber = excluded.sumber,
  catatan = excluded.catatan;

-- 7. Audit Log (F-62)
create table if not exists public.audit_log (
  id         bigserial primary key,
  aktor_id   uuid references public.profiles(id),
  aksi       text not null,
  entitas    text not null,
  entitas_id text,
  meta       jsonb,
  created_at timestamptz not null default now()
);

-- 8. View Dampak Agregat Platform (F-66)
create or replace view public.dampak_agregat as
select
  count(distinct o.id)                                  as transaksi_selesai,
  coalesce(sum(o.berat_kg), 0)                         as kg_tersalurkan,
  coalesce(sum(o.total), 0)                            as nilai_transaksi,
  coalesce(sum(r.jarak_individual_km - r.jarak_km), 0) as km_dihemat
from public.orders o
left join public.profiles p on p.id = o.petani_id
left join public.pengiriman s on s.order_id = o.id
left join public.rute_item ri on ri.pengiriman_id = s.id
left join public.rute r on r.id = ri.rute_id and r.status = 'selesai'
where o.status = 'selesai' and (p.is_demo is null or p.is_demo = false);

-- Enable RLS on all new tables
alter table public.penawaran enable row level security;
alter table public.order_kode enable row level security;
alter table public.pesanan_riwayat enable row level security;
alter table public.pengiriman enable row level security;
alter table public.rute enable row level security;
alter table public.rute_item enable row level security;
alter table public.emisi_faktor enable row level security;
alter table public.audit_log enable row level security;

-- Policies: penawaran
create policy "Penawaran dibaca oleh pembeli atau petani bersangkutan"
  on public.penawaran for select
  using (auth.uid() = pembeli_id or auth.uid() = petani_id);

create policy "Pembeli membuat penawaran"
  on public.penawaran for insert
  with check (auth.uid() = pembeli_id);

create policy "Pembeli/petani update penawaran bersangkutan"
  on public.penawaran for update
  using (auth.uid() = pembeli_id or auth.uid() = petani_id);

-- Policies: order_kode (NFR-SEC-03: Hanya pembeli yang bisa select kode miliknya)
create policy "Order kode hanya dibaca oleh pembeli pemilik pesanan"
  on public.order_kode for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_kode.order_id and o.pembeli_id = auth.uid()
    )
  );

-- Policies: pengiriman
create policy "Pengiriman dibaca publik atau pihak transaksi"
  on public.pengiriman for select using (true);

create policy "Pengiriman diupdate oleh pihak bersangkutan"
  on public.pengiriman for update using (
    exists (
      select 1 from public.orders o
      where o.id = pengiriman.order_id
        and (o.petani_id = auth.uid() or o.pembeli_id = auth.uid())
    )
  );

-- Policies: rute & rute_item
create policy "Rute dibaca oleh semua pengguna terautentikasi"
  on public.rute for select using (true);

create policy "Rute item dibaca oleh semua pengguna terautentikasi"
  on public.rute_item for select using (true);

-- Policies: emisi_faktor
create policy "Emisi faktor dibaca publik"
  on public.emisi_faktor for select using (true);

-- Policies: pesanan_riwayat (pihak transaksi boleh baca dan insert)
create policy "Riwayat dibaca pihak transaksi"
  on public.pesanan_riwayat for select using (
    exists (
      select 1 from public.orders o
      where o.id = pesanan_riwayat.order_id
        and (o.petani_id = auth.uid() or o.pembeli_id = auth.uid())
    )
  );

create policy "Riwayat ditambah pihak transaksi"
  on public.pesanan_riwayat for insert with check (
    auth.uid() = oleh
    and exists (
      select 1 from public.orders o
      where o.id = pesanan_riwayat.order_id
        and (o.petani_id = auth.uid() or o.pembeli_id = auth.uid())
    )
  );

-- Policies: audit_log (admin boleh baca, semua user bisa insert via service-role)
create policy "Audit log dibaca oleh admin"
  on public.audit_log for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.peran = 'admin'
    )
  );

-- Indexes for performance
create index if not exists idx_penawaran_listing on public.penawaran(listing_id);
create index if not exists idx_penawaran_pembeli on public.penawaran(pembeli_id);
create index if not exists idx_pengiriman_order  on public.pengiriman(order_id);
create index if not exists idx_rute_item_rute    on public.rute_item(rute_id);
create index if not exists idx_pesanan_riwayat_order on public.pesanan_riwayat(order_id);
create index if not exists idx_audit_log_entitas on public.audit_log(entitas, entitas_id);
create index if not exists idx_audit_log_aktor   on public.audit_log(aktor_id);
