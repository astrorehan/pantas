-- PANTAS — Migrasi 0010: Berat aktual serah terima & sumber kalibrasi densitas (F-101)
--
-- F-101 menghitung `berat_est = Σ area_mm² × faktor_densitas[komoditas]`, dan
-- menuntut faktornya "dikalibrasi dari data serah terima nyata
-- (orders.berat_aktual_kg)". Kolom itu belum pernah ada, sehingga faktor apa
-- pun yang dipakai engine tidak bisa dibuktikan terhadap timbangan siapa pun.
-- Migrasi ini menyediakan dua hal: tempat menyimpan berat timbangan saat serah
-- terima, dan satu view yang memasangkannya dengan luas terkalibrasi dari
-- laporan grading — bahan mentah untuk ai_engine/calibrate_density.py.

-- 1. Berat aktual saat serah terima ----------------------------------------
-- Nullable: pesanan lama tidak punya angkanya, dan petani yang tidak membawa
-- timbangan tetap harus bisa menyelesaikan serah terima.
alter table public.orders
  add column if not exists berat_aktual_kg numeric;

alter table public.orders drop constraint if exists orders_berat_aktual_kg_check;
alter table public.orders
  add constraint orders_berat_aktual_kg_check
  check (berat_aktual_kg is null or berat_aktual_kg > 0);

comment on column public.orders.berat_aktual_kg is
  'Berat timbangan saat serah terima, kg. Sumber kalibrasi faktor densitas F-101; '
  'dibandingkan dengan estimasi luas terkalibrasi, bukan menggantikannya.';

-- 2. RPC serah terima ikut mencatat berat ----------------------------------
-- Signature lama (2 argumen) dibuang lebih dulu: menambah parameter berdefault
-- lewat CREATE OR REPLACE akan membuat panggilan 2-argumen ambigu antara dua
-- overload, dan Postgres menolaknya saat runtime, bukan saat migrasi.
drop function if exists public.verifikasi_serah_terima(text, text);

create function public.verifikasi_serah_terima(
  p_order_id       text,
  p_kode           text,
  p_berat_aktual_kg numeric default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ok boolean := false;
begin
  -- Berat nol/negatif diabaikan, bukan ditolak: kode serah terima yang benar
  -- tidak boleh gagal hanya karena kolom timbangan salah isi.
  if p_berat_aktual_kg is not null and p_berat_aktual_kg <= 0 then
    p_berat_aktual_kg := null;
  end if;

  update public.orders o
  set status = 'selesai',
      berat_aktual_kg = coalesce(p_berat_aktual_kg, o.berat_aktual_kg)
  where o.id = p_order_id
    and o.petani_id = auth.uid()
    and o.status <> 'selesai'
    and upper(regexp_replace(p_kode, '[\s-]', '', 'g'))
      = upper(regexp_replace(o.kode, '[\s-]', '', 'g'))
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

-- 3. Bahan kalibrasi faktor densitas ---------------------------------------
-- Satu baris per serah terima yang punya keduanya: luas terkalibrasi dari
-- laporan grading dan berat timbangan. `security_invoker` dipertahankan supaya
-- RLS `orders` tetap berlaku — pengguna biasa hanya melihat transaksinya
-- sendiri, dan kalibrasi lintas-petani dijalankan dengan service role.
create or replace view public.densitas_kalibrasi_view
with (security_invoker = true) as
select
  o.id                                as order_id,
  g.komoditas                         as komoditas,
  split_part(g.komoditas, '_', 1)     as komoditas_dasar,
  luas.total_mm2                      as luas_mm2,
  o.berat_aktual_kg                   as berat_aktual_kg,
  -- gram per mm²: satuan faktor densitas yang dipakai engine.
  (o.berat_aktual_kg * 1000.0) / nullif(luas.total_mm2, 0) as gram_per_mm2,
  g.objek_terdeteksi                  as objek_terdeteksi,
  o.created_at                        as tanggal
from public.orders o
join public.listings l on l.id = o.listing_id
join public.gradings g on g.id = l.grading_id
cross join lateral (
  select coalesce(sum((obj ->> 'ukuran_mm2')::numeric), 0) as total_mm2
  from jsonb_array_elements(coalesce(g.hasil -> 'objek', '[]'::jsonb)) as obj
  where obj ->> 'ukuran_mm2' is not null
) as luas
where o.status = 'selesai'
  and o.berat_aktual_kg is not null
  -- Tanpa kalibrasi koin, `ukuran_mm2` tiap objek null dan luasnya nol; baris
  -- seperti itu tidak boleh ikut membentuk faktor.
  and coalesce((g.hasil -> 'kalibrasi' ->> 'valid')::boolean, false)
  and luas.total_mm2 > 0;

comment on view public.densitas_kalibrasi_view is
  'Pasangan (luas terkalibrasi, berat timbangan) per serah terima. Dibaca '
  'ai_engine/calibrate_density.py untuk menyetel ai_engine/densitas_faktor.json (F-101).';
