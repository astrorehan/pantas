-- PANTAS — Migrasi 0017: Penawaran yang diterima benar-benar menjadi pesanan
--
-- Gejalanya: petani menekan "Terima" pada sebuah penawaran, layarnya berubah
-- jadi "Diterima", lalu di layar pembeli pesanan itu tidak pernah ada. Dua
-- orang membaca dua kenyataan yang berbeda tentang transaksi yang sama.
--
-- Akarnya ada tiga, dan ketiganya di lapisan ini:
--
--   1. `public.orders` hanya punya satu policy insert — "pembeli membuat
--      pesanan", `with check (auth.uid() = pembeli_id)`. Petani yang menerima
--      penawaran menyisipkan baris dengan `pembeli_id` milik orang lain, jadi
--      RLS menolaknya, selalu. Klien menelan penolakan itu sebagai
--      `console.warn` dan tetap menampilkan pesanannya dari state lokal —
--      karena itu petani melihat pesanan yang tidak pernah ada di basis data.
--
--   2. Tidak ada kolom yang menghubungkan penawaran ke pesanan yang lahir
--      darinya. Layar penawaran menebak pasangannya dengan mencocokkan nama
--      komoditas, berat, dan nama petani; tebakan itu meleset begitu ada dua
--      lot mirip, dan tidak punya jawaban sama sekali di sisi pembeli.
--
--   3. `public.penawaran` tidak ikut publikasi `supabase_realtime` — hanya
--      `orders` dan `pesan` yang ikut sejak 0013. Penawaran baru dan perubahan
--      statusnya baru terlihat setelah lawan bicaranya memuat ulang aplikasi.
--
-- Perbaikannya menyatukan penerimaan penawaran menjadi satu tindakan atomik di
-- basis data: `terima_penawaran()`. Ia yang berhak menulis pesanan, ia yang
-- menandai penawarannya diterima, dan keduanya terjadi dalam satu transaksi
-- atau tidak terjadi sama sekali.

-- 1. Tautan penawaran -> pesanan ---------------------------------------------
alter table public.penawaran
  add column if not exists order_id text references public.orders(id) on delete set null;

create index if not exists idx_penawaran_order on public.penawaran(order_id);
create index if not exists idx_penawaran_petani on public.penawaran(petani_id);

-- Kolom ini hanya boleh ditulis oleh RPC di bawah (security definer, jadi tidak
-- tunduk pada grant ini). Klien tidak pernah punya alasan mengarangnya sendiri:
-- penawaran yang menunjuk pesanan orang lain adalah persis kekacauan yang
-- migrasi ini tutup.
revoke update on public.penawaran from anon, authenticated;
grant update (status, harga_per_kg) on public.penawaran to authenticated;

-- 2. Hanya RPC yang boleh menyatakan sebuah penawaran "diterima" -------------
-- Tanpa penjaga ini, policy update yang ada ("Pembeli/petani update penawaran
-- bersangkutan") membiarkan pembeli menerima penawarannya sendiri — status
-- berubah, pesanannya tidak lahir, dan kita kembali ke gejala yang sama dari
-- arah sebaliknya. Polanya sama dengan `pantas.serah_terima` di 0013.
create or replace function public.jaga_alur_penawaran()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status in ('diterima', 'ditolak', 'kedaluwarsa') then
    raise exception 'Penawaran berstatus % sudah selesai dan tidak bisa diubah lagi', old.status
      using errcode = 'check_violation';
  end if;

  if new.status = 'diterima'
     and coalesce(current_setting('pantas.terima_penawaran', true), '') <> 'on' then
    raise exception 'Penawaran hanya bisa diterima lewat terima_penawaran(), supaya pesanannya ikut terbentuk'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists penawaran_alur on public.penawaran;
create trigger penawaran_alur
  before update of status on public.penawaran
  for each row execute function public.jaga_alur_penawaran();

-- 3. Penerimaan penawaran sebagai satu tindakan ------------------------------
-- Mengembalikan baris pesanannya supaya klien tidak perlu menebak id atau kode
-- serah terima yang dibuat basis data. `security definer` di sini bukan
-- kelonggaran: kepemilikan diperiksa eksplisit terhadap `auth.uid()` di baris
-- pertama, dan yang dilewati hanyalah policy insert `orders` yang memang hanya
-- mengenal pembeli sebagai pembuat pesanan.
create or replace function public.terima_penawaran(
  p_penawaran_id  uuid,
  p_harga_per_kg  integer default null
)
returns public.orders
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_pen    public.penawaran;
  v_lot    public.listings;
  v_harga  integer;
  v_order  public.orders;
begin
  select * into v_pen
  from public.penawaran
  where id = p_penawaran_id
  for update;

  if not found then
    raise exception 'Penawaran tidak ditemukan.' using errcode = 'no_data_found';
  end if;

  if v_pen.petani_id is distinct from auth.uid() then
    raise exception 'Hanya petani pemilik lot yang bisa menerima penawaran ini.'
      using errcode = 'insufficient_privilege';
  end if;

  -- Idempoten: tombol yang tertekan dua kali, atau percobaan ulang setelah
  -- jaringan putus, mengembalikan pesanan yang sama — bukan pesanan kedua atas
  -- panen yang sama.
  if v_pen.order_id is not null then
    select * into v_order from public.orders where id = v_pen.order_id;
    if found then
      return v_order;
    end if;
  end if;

  if v_pen.status not in ('terkirim', 'ditawar_balik') then
    raise exception 'Penawaran berstatus % tidak bisa diterima.', v_pen.status
      using errcode = 'check_violation';
  end if;

  if v_pen.kedaluwarsa_pada < now() then
    raise exception 'Penawaran ini sudah kedaluwarsa.' using errcode = 'check_violation';
  end if;

  select * into v_lot from public.listings where id = v_pen.listing_id;
  if not found then
    raise exception 'Lot yang ditawar sudah tidak ada.' using errcode = 'no_data_found';
  end if;

  v_harga := coalesce(p_harga_per_kg, v_pen.harga_per_kg);
  if v_harga <= 0 then
    raise exception 'Harga per kg harus lebih besar dari nol.' using errcode = 'check_violation';
  end if;

  insert into public.orders (
    listing_id, pembeli_id, petani_id, status,
    nama, grade, berat_kg, harga_per_kg, total
  )
  values (
    v_lot.id, v_pen.pembeli_id, v_pen.petani_id, 'dipesan',
    v_lot.nama, v_lot.grade, v_pen.kuantitas_kg, v_harga,
    round(v_pen.kuantitas_kg * v_harga)
  )
  returning * into v_order;

  perform set_config('pantas.terima_penawaran', 'on', true);
  update public.penawaran
     set status       = 'diterima',
         harga_per_kg = v_harga,
         order_id     = v_order.id
   where id = v_pen.id;
  perform set_config('pantas.terima_penawaran', 'off', true);

  insert into public.audit_log (aktor_id, aksi, entitas, entitas_id, meta)
  values (
    auth.uid(), 'penawaran.diterima', 'penawaran', v_pen.id::text,
    jsonb_build_object(
      'order_id', v_order.id,
      'listing_id', v_lot.id,
      'kuantitas_kg', v_pen.kuantitas_kg,
      'harga_per_kg', v_harga,
      'total', v_order.total
    )
  );

  return v_order;
end;
$$;

revoke all on function public.terima_penawaran(uuid, integer) from public, anon;
grant execute on function public.terima_penawaran(uuid, integer) to authenticated;

-- 4. Kedua sisi melihat perubahan tanpa memuat ulang -------------------------
-- Identitas replika bawaan cukup: klien hanya butuh baris `new`, dan otorisasi
-- barisnya tetap lewat policy select penawaran yang sudah ada.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'penawaran'
  ) then
    alter publication supabase_realtime add table public.penawaran;
  end if;
end
$$;

-- 5. Perbaikan data: penawaran yang sudah terlanjur "diterima" tanpa pesanan --
-- Baris-baris inilah gejala yang dilaporkan. Statusnya sudah diterima sejak
-- policy insert menolak pesanannya, jadi satu-satunya cara membuat kedua layar
-- sepakat adalah menerbitkan pesanan yang seharusnya lahir waktu itu — dengan
-- `created_at` penawarannya, bukan hari ini, supaya riwayatnya tidak berbohong.
do $$
declare
  r       record;
  v_order public.orders;
begin
  for r in
    select p.*, l.nama as lot_nama, l.grade as lot_grade
    from public.penawaran p
    join public.listings l on l.id = p.listing_id
    where p.status = 'diterima'
      and p.order_id is null
  loop
    insert into public.orders (
      listing_id, pembeli_id, petani_id, status,
      nama, grade, berat_kg, harga_per_kg, total, created_at
    )
    values (
      r.listing_id, r.pembeli_id, r.petani_id, 'dipesan',
      r.lot_nama, r.lot_grade, r.kuantitas_kg, r.harga_per_kg,
      round(r.kuantitas_kg * r.harga_per_kg), r.created_at
    )
    returning * into v_order;

    update public.penawaran set order_id = v_order.id where id = r.id;
  end loop;
end
$$;
