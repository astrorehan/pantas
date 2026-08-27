-- PANTAS — Migrasi 0019: Pencegahan Penghapusan Kritis & Pengerasan Integritas Basis Data
--
-- Ringkasan:
--   1. Pencegahan Penghapusan Kaskade Kritis (Critical Cascade Prevention):
--      - Mengubah FK `orders(petani_id)` dan `orders(pembeli_id)` menjadi RESTRICT
--        sehingga penghapusan profil tidak menghapus riwayat transaksi/keuangan.
--      - Mengubah FK `penawaran(listing_id)` menjadi RESTRICT sehingga penghapusan
--        listing tidak memusnahkan riwayat penawaran dan negosiasi pembeli.
--      - Mengubah FK `gradings(petani_id)`, `ulasan(order_id)`, `pesanan_riwayat(order_id)`
--        menjadi RESTRICT untuk menjaga jejak audit kualitas dan ulasan.
--   2. Pencegahan Penghapusan Destruktif pada Listing:
--      - Trigger `trg_cegah_hapus_listing_bertransaksi`: menolak hard-delete listing
--        yang memiliki pesanan atau penawaran aktif. Listing harus ditutup/diarsipkan.
--   3. Kekekalan Jejak Audit & Tabel Referensi:
--      - Trigger `trg_cegah_hapus_audit_log`: mencegah DELETE/TRUNCATE pada `audit_log`.
--      - Trigger `trg_cegah_hapus_referensi`: mencegah DELETE/TRUNCATE pada `harga_acuan`
--        dan `emisi_faktor`.
--   4. Keamanan & Performa (Advisor Remediation):
--      - Mengubah `dampak_agregat` menjadi `security_invoker = true`.
--      - Mencabut izin `execute` peran `anon` pada fungsi security definer internal.
--      - Menambahkan covering index pada seluruh FK yang belum terindeks.
--      - Mengoptimalkan policy RLS dengan `(select auth.uid())` agar tidak re-evaluasi per baris.
--   5. Realtime Publication:
--      - Menambahkan `listings`, `pengiriman`, dan `rute` ke `supabase_realtime` dengan
--        `replica identity full` agar sinkronisasi petani & pembeli instan.

-- ---------------------------------------------------------------------------
-- 1. Penyesuaian Foreign Keys: Mencegah Penghapusan Kaskade Merusak Transaksi
-- ---------------------------------------------------------------------------

-- orders -> profiles (jangan kaskade hapus pesanan bila profil terhapus)
alter table public.orders drop constraint if exists orders_petani_id_fkey;
alter table public.orders add constraint orders_petani_id_fkey
  foreign key (petani_id) references public.profiles(id) on delete restrict;

alter table public.orders drop constraint if exists orders_pembeli_id_fkey;
alter table public.orders add constraint orders_pembeli_id_fkey
  foreign key (pembeli_id) references public.profiles(id) on delete restrict;

-- orders -> listings (RESTRICT jika ada pesanan)
alter table public.orders drop constraint if exists orders_listing_id_fkey;
alter table public.orders add constraint orders_listing_id_fkey
  foreign key (listing_id) references public.listings(id) on delete restrict;

-- gradings -> profiles
alter table public.gradings drop constraint if exists gradings_petani_id_fkey;
alter table public.gradings add constraint gradings_petani_id_fkey
  foreign key (petani_id) references public.profiles(id) on delete restrict;

-- penawaran -> listings & profiles
alter table public.penawaran drop constraint if exists penawaran_listing_id_fkey;
alter table public.penawaran add constraint penawaran_listing_id_fkey
  foreign key (listing_id) references public.listings(id) on delete restrict;

alter table public.penawaran drop constraint if exists penawaran_pembeli_id_fkey;
alter table public.penawaran add constraint penawaran_pembeli_id_fkey
  foreign key (pembeli_id) references public.profiles(id) on delete restrict;

alter table public.penawaran drop constraint if exists penawaran_petani_id_fkey;
alter table public.penawaran add constraint penawaran_petani_id_fkey
  foreign key (petani_id) references public.profiles(id) on delete restrict;

-- ulasan -> orders & profiles
alter table public.ulasan drop constraint if exists ulasan_order_id_fkey;
alter table public.ulasan add constraint ulasan_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete restrict;

alter table public.ulasan drop constraint if exists ulasan_penilai_id_fkey;
alter table public.ulasan add constraint ulasan_penilai_id_fkey
  foreign key (penilai_id) references public.profiles(id) on delete restrict;

alter table public.ulasan drop constraint if exists ulasan_dinilai_id_fkey;
alter table public.ulasan add constraint ulasan_dinilai_id_fkey
  foreign key (dinilai_id) references public.profiles(id) on delete restrict;

-- pesanan_riwayat -> orders
alter table public.pesanan_riwayat drop constraint if exists pesanan_riwayat_order_id_fkey;
alter table public.pesanan_riwayat add constraint pesanan_riwayat_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete restrict;

-- ---------------------------------------------------------------------------
-- 2. Trigger Perlindungan Listing Bertransaksi & Pencatatan Audit Hapus
-- ---------------------------------------------------------------------------

create or replace function public.cegah_hapus_listing_bertransaksi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Pengecualian resmi hanya untuk seed/reset demo otomatis
  if coalesce(current_setting('pantas.demo_reset', true), '') = 'on' then
    return old;
  end if;

  if exists (select 1 from public.orders where listing_id = old.id) then
    raise exception 'Listing % memiliki riwayat pesanan dan tidak boleh dihapus dari basis data. Silakan tutup atau arsipkan listing.', old.id
      using errcode = '23503';
  end if;

  if exists (
    select 1 from public.penawaran
    where listing_id = old.id and status in ('terkirim', 'ditawar_balik', 'diterima')
  ) then
    raise exception 'Listing % memiliki penawaran aktif dan tidak boleh dihapus.', old.id
      using errcode = '23503';
  end if;

  -- Catat penghapusan draf/listing tanpa transaksi ke audit_log
  insert into public.audit_log (aktor_id, aksi, entitas, entitas_id, meta)
  values (
    auth.uid(),
    'listing.hapus',
    'listing',
    old.id,
    jsonb_build_object(
      'nama', old.nama,
      'komoditas', old.komoditas,
      'grade', old.grade,
      'berat_kg', old.berat_kg,
      'harga_per_kg', old.harga_per_kg
    )
  );

  return old;
end;
$$;

drop trigger if exists trg_cegah_hapus_listing_bertransaksi on public.listings;
create trigger trg_cegah_hapus_listing_bertransaksi
  before delete on public.listings
  for each row execute function public.cegah_hapus_listing_bertransaksi();

-- ---------------------------------------------------------------------------
-- 3. Kekekalan Audit Log & Perlindungan Tabel Referensi
-- ---------------------------------------------------------------------------

create or replace function public.cegah_hapus_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Tabel audit_log bersifat permanen (immutable) dan tidak boleh dihapus atau dipotong.'
    using errcode = '42501';
end;
$$;

drop trigger if exists trg_cegah_hapus_audit_log on public.audit_log;
create trigger trg_cegah_hapus_audit_log
  before delete or truncate on public.audit_log
  for each statement execute function public.cegah_hapus_audit_log();

create or replace function public.cegah_hapus_tabel_referensi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Tabel referensi sistem tidak boleh dihapus.'
    using errcode = '42501';
end;
$$;

drop trigger if exists trg_cegah_hapus_harga_acuan on public.harga_acuan;
create trigger trg_cegah_hapus_harga_acuan
  before delete or truncate on public.harga_acuan
  for each statement execute function public.cegah_hapus_tabel_referensi();

drop trigger if exists trg_cegah_hapus_emisi_faktor on public.emisi_faktor;
create trigger trg_cegah_hapus_emisi_faktor
  before delete or truncate on public.emisi_faktor
  for each statement execute function public.cegah_hapus_tabel_referensi();

-- ---------------------------------------------------------------------------
-- 4. Pengerasan Keamanan (Security Definer View & RPC Revoke)
-- ---------------------------------------------------------------------------

drop view if exists public.dampak_agregat;
create view public.dampak_agregat with (security_invoker = true) as
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

-- Cabut izin publik/anon/authenticated HANYA dari fungsi internal dan trigger (bukan helper RLS)
revoke execute on function public.cek_kapasitas_rute() from public, anon, authenticated;
revoke execute on function public.update_profile_rating() from public, anon, authenticated;
revoke execute on function public.verifikasi_serah_terima(text, text, numeric) from public, anon;
revoke execute on function public.cegah_hapus_audit_log() from public, anon, authenticated;
revoke execute on function public.cegah_hapus_listing_bertransaksi() from public, anon, authenticated;
revoke execute on function public.cegah_hapus_tabel_referensi() from public, anon, authenticated;

-- Helper RLS wajib dapat dieksekusi oleh authenticated dan anon agar evaluasi policy SELECT tidak error
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.boleh_menilai_pesanan(text, uuid, uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- 5. Indeks Penutup FK yang Belum Terindeks (Performance)
-- ---------------------------------------------------------------------------

create index if not exists idx_gradings_petani_id on public.gradings (petani_id);
create index if not exists idx_listings_grading_id on public.listings (grading_id);
create index if not exists idx_orders_listing_id on public.orders (listing_id);
create index if not exists idx_penawaran_induk_id on public.penawaran (induk_id);
create index if not exists idx_pesanan_riwayat_oleh_id on public.pesanan_riwayat (oleh);
create index if not exists idx_rute_dibuat_oleh_id on public.rute (dibuat_oleh);
create index if not exists idx_ulasan_dinilai_id on public.ulasan (dinilai_id);
create index if not exists idx_ulasan_penilai_id on public.ulasan (penilai_id);

-- ---------------------------------------------------------------------------
-- 6. Optimasi RLS dengan (select auth.uid()) untuk InitPlan Caching
-- ---------------------------------------------------------------------------

-- profiles
drop policy if exists "profil milik sendiri: insert" on public.profiles;
create policy "profil milik sendiri: insert"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

drop policy if exists "profil milik sendiri: update" on public.profiles;
create policy "profil milik sendiri: update"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- gradings
drop policy if exists "grading milik sendiri: select" on public.gradings;
create policy "grading milik sendiri: select"
  on public.gradings for select
  using ((select auth.uid()) = petani_id);

drop policy if exists "grading milik sendiri: insert" on public.gradings;
create policy "grading milik sendiri: insert"
  on public.gradings for insert
  with check ((select auth.uid()) = petani_id);

drop policy if exists "petani_hapus_grading_mandiri" on public.gradings;
create policy "petani_hapus_grading_mandiri"
  on public.gradings for delete
  using (
    (select auth.uid()) = petani_id
    and not exists (
      select 1 from public.listings
      where grading_id = gradings.id
    )
  );

-- listings
drop policy if exists "listing tayang terbuka" on public.listings;
create policy "listing tayang terbuka"
  on public.listings for select
  using (status = 'tayang' or (select auth.uid()) = petani_id or public.is_admin());

drop policy if exists "petani menulis listing miliknya: insert" on public.listings;
create policy "petani menulis listing miliknya: insert"
  on public.listings for insert
  with check ((select auth.uid()) = petani_id);

drop policy if exists "petani menulis listing miliknya: update" on public.listings;
create policy "petani menulis listing miliknya: update"
  on public.listings for update
  using ((select auth.uid()) = petani_id);

drop policy if exists "petani menulis listing miliknya: delete" on public.listings;
create policy "petani menulis listing miliknya: delete"
  on public.listings for delete
  using ((select auth.uid()) = petani_id);

-- orders
drop policy if exists "pesanan pihak terkait: select" on public.orders;
create policy "pesanan pihak terkait: select"
  on public.orders for select
  using ((select auth.uid()) = pembeli_id or (select auth.uid()) = petani_id);

drop policy if exists "pembeli membuat pesanan" on public.orders;
create policy "pembeli membuat pesanan"
  on public.orders for insert
  with check ((select auth.uid()) = pembeli_id);

drop policy if exists "petani memperbarui status pesanan" on public.orders;
create policy "petani memperbarui status pesanan"
  on public.orders for update
  to authenticated
  using ((select auth.uid()) = petani_id)
  with check ((select auth.uid()) = petani_id);

-- penawaran
drop policy if exists "Penawaran dibaca oleh pembeli atau petani bersangkutan" on public.penawaran;
create policy "Penawaran dibaca oleh pembeli atau petani bersangkutan"
  on public.penawaran for select
  using ((select auth.uid()) = pembeli_id or (select auth.uid()) = petani_id);

drop policy if exists "Pembeli membuat penawaran" on public.penawaran;
create policy "Pembeli membuat penawaran"
  on public.penawaran for insert
  with check ((select auth.uid()) = pembeli_id);

drop policy if exists "Pembeli/petani update penawaran bersangkutan" on public.penawaran;
create policy "Pembeli/petani update penawaran bersangkutan"
  on public.penawaran for update
  using ((select auth.uid()) = pembeli_id or (select auth.uid()) = petani_id);

-- order_kode
drop policy if exists "Order kode hanya dibaca oleh pembeli pemilik pesanan" on public.order_kode;
create policy "Order kode hanya dibaca oleh pembeli pemilik pesanan"
  on public.order_kode for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_kode.order_id and o.pembeli_id = (select auth.uid())
    )
  );

-- pengiriman
drop policy if exists "Pengiriman diupdate oleh pihak bersangkutan" on public.pengiriman;
create policy "Pengiriman diupdate oleh pihak bersangkutan"
  on public.pengiriman for update
  using (
    exists (
      select 1 from public.orders o
      where o.id = pengiriman.order_id
        and (o.petani_id = (select auth.uid()) or o.pembeli_id = (select auth.uid()))
    )
  );

-- pesanan_riwayat
drop policy if exists "Riwayat dibaca pihak transaksi" on public.pesanan_riwayat;
create policy "Riwayat dibaca pihak transaksi"
  on public.pesanan_riwayat for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = pesanan_riwayat.order_id
        and (o.petani_id = (select auth.uid()) or o.pembeli_id = (select auth.uid()))
    )
  );

drop policy if exists "Riwayat ditambah pihak transaksi" on public.pesanan_riwayat;
create policy "Riwayat ditambah pihak transaksi"
  on public.pesanan_riwayat for insert
  with check (
    (select auth.uid()) = oleh
    and exists (
      select 1 from public.orders o
      where o.id = pesanan_riwayat.order_id
        and (o.petani_id = (select auth.uid()) or o.pembeli_id = (select auth.uid()))
    )
  );

-- ulasan
drop policy if exists "Pihak pesanan selesai dapat membuat ulasan" on public.ulasan;
create policy "Pihak pesanan selesai dapat membuat ulasan"
  on public.ulasan for insert
  with check (
    (select auth.uid()) = penilai_id
    and public.boleh_menilai_pesanan(order_id, penilai_id, dinilai_id)
  );

drop policy if exists "Penilai dapat memperbarui ulasan sendiri" on public.ulasan;
create policy "Penilai dapat memperbarui ulasan sendiri"
  on public.ulasan for update
  using ((select auth.uid()) = penilai_id)
  with check ((select auth.uid()) = penilai_id);

-- pesan
drop policy if exists "Pesan dibaca oleh pengirim atau penerima" on public.pesan;
create policy "Pesan dibaca oleh pengirim atau penerima"
  on public.pesan for select
  using ((select auth.uid()) = pengirim_id or (select auth.uid()) = penerima_id);

drop policy if exists "Pengguna mengirim pesan" on public.pesan;
drop policy if exists "Pengirim dapat mengirim pesan" on public.pesan;
create policy "Pengirim dapat mengirim pesan"
  on public.pesan for insert
  with check ((select auth.uid()) = pengirim_id);

drop policy if exists "Penerima menandai pesan sudah dibaca" on public.pesan;
create policy "Penerima menandai pesan sudah dibaca"
  on public.pesan for update
  using ((select auth.uid()) = penerima_id)
  with check ((select auth.uid()) = penerima_id);

-- audit_log
drop policy if exists "Audit log dibaca oleh admin" on public.audit_log;
create policy "Audit log dibaca oleh admin"
  on public.audit_log for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Realtime Publication & Replica Identity
-- ---------------------------------------------------------------------------

alter table public.listings replica identity full;
alter table public.pengiriman replica identity full;
alter table public.rute replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'listings'
  ) then
    alter publication supabase_realtime add table public.listings;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pengiriman'
  ) then
    alter publication supabase_realtime add table public.pengiriman;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rute'
  ) then
    alter publication supabase_realtime add table public.rute;
  end if;
end $$;
