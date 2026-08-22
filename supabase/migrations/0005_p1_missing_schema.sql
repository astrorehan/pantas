-- PANTAS — Migrasi 0005: Skema P1 Tambahan (Ulasan & Rating, Chat Realtime Pesan, Tur Selesai, Moderasi Status)

-- 1. Tabel Ulasan & Rating Pasca Transaksi (F-42)
create table if not exists public.ulasan (
  id          uuid primary key default gen_random_uuid(),
  order_id    text not null references public.orders(id) on delete cascade,
  penilai_id  uuid not null references public.profiles(id) on delete cascade,
  dinilai_id  uuid not null references public.profiles(id) on delete cascade,
  bintang     integer not null check (bintang between 1 and 5),
  komentar    text,
  created_at  timestamptz not null default now(),
  constraint ulasan_order_penilai_unique unique (order_id, penilai_id)
);

-- Trigger untuk memperbarui rating rata-rata & jumlah transaksi di tabel profiles
create or replace function public.update_profile_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_avg_rating numeric(2,1);
  v_total_transaksi integer;
begin
  -- Hitung rata-rata bintang untuk dinilai_id
  select coalesce(round(avg(bintang)::numeric, 1), 5.0)
  into v_avg_rating
  from public.ulasan
  where dinilai_id = new.dinilai_id;

  -- Hitung total transaksi selesai
  select count(distinct id)
  into v_total_transaksi
  from public.orders
  where (petani_id = new.dinilai_id or pembeli_id = new.dinilai_id)
    and status = 'selesai';

  update public.profiles
  set rating = v_avg_rating,
      transaksi = v_total_transaksi
  where id = new.dinilai_id;

  return new;
end;
$$;

drop trigger if exists on_ulasan_created on public.ulasan;
create trigger on_ulasan_created
  after insert or update on public.ulasan
  for each row execute function public.update_profile_rating();

-- 2. Tabel Pesan / Chat Dalam Aplikasi (F-33)
create table if not exists public.pesan (
  id            uuid primary key default gen_random_uuid(),
  order_id      text references public.orders(id) on delete cascade,
  penawaran_id  uuid references public.penawaran(id) on delete cascade,
  pengirim_id   uuid not null references public.profiles(id) on delete cascade,
  penerima_id   uuid not null references public.profiles(id) on delete cascade,
  isi           text not null check (length(trim(isi)) > 0),
  dibaca        boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Indexing untuk performa kueri chat
create index if not exists idx_pesan_order on public.pesan(order_id);
create index if not exists idx_pesan_penawaran on public.pesan(penawaran_id);
create index if not exists idx_pesan_pengirim on public.pesan(pengirim_id);
create index if not exists idx_pesan_penerima on public.pesan(penerima_id);

-- 3. Tambah Kolom tur_selesai pada Profiles (F-04)
alter table public.profiles
  add column if not exists tur_selesai boolean not null default false;

-- 4. Perbarui Constraint Status Listings untuk Moderasi (F-91)
alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings add constraint listings_status_check
  check (status in ('tayang', 'habis', 'ditutup', 'dimoderasi'));

-- 5. Enable RLS pada Tabel Baru
alter table public.ulasan enable row level security;
alter table public.pesan enable row level security;

-- Policies: ulasan
create policy "Ulasan dibaca oleh semua pengguna"
  on public.ulasan for select using (true);

create policy "Penilai dapat membuat ulasan"
  on public.ulasan for insert
  with check (auth.uid() = penilai_id);

create policy "Penilai dapat memperbarui ulasan sendiri"
  on public.ulasan for update
  using (auth.uid() = penilai_id);

-- Policies: pesan (RLS ketat: hanya pengirim atau penerima yang bisa baca dan kirim)
create policy "Pesan dibaca oleh pengirim atau penerima"
  on public.pesan for select
  using (auth.uid() = pengirim_id or auth.uid() = penerima_id);

create policy "Pengirim dapat mengirim pesan"
  on public.pesan for insert
  with check (auth.uid() = pengirim_id);

create policy "Penerima dapat memperbarui status dibaca"
  on public.pesan for update
  using (auth.uid() = penerima_id or auth.uid() = pengirim_id);

-- Publikasikan ke Supabase Realtime untuk tabel pesan
alter publication supabase_realtime add table public.pesan;
