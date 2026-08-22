-- PANTAS — Migrasi 0013: Pesanan hidup di dua layar sekaligus, dan hanya maju
--
-- Tiga hal yang diperbaiki di sini, ketiganya berakar pada satu asumsi lama
-- bahwa pesanan cukup dibaca sekali saat aplikasi dibuka.
--
--   1. `public.orders` belum pernah masuk publikasi `supabase_realtime` —
--      satu-satunya isinya selama ini `public.pesan`. Akibatnya perubahan status
--      di ponsel petani tidak pernah sampai ke layar pembeli: pembeli masih
--      membaca "Menunggu Konfirmasi" untuk pesanan yang di sisi seberang sudah
--      selesai, dan satu-satunya cara memperbaikinya adalah memuat ulang paksa.
--      Pada serah terima fisik di lapangan, kedua orang berdiri berhadapan
--      dengan dua layar yang tidak sepakat.
--
--   2. Hak kolom `orders` masih terbuka penuh, persis lubang yang ditutup
--      migrasi 0012 untuk `pesan` — tetapi di sini yang bisa ditulis ulang
--      adalah uang. Policy "petani memperbarui status pesanan" tidak punya
--      `with check`, dan RLS memang tidak pernah membatasi kolom, jadi petani
--      boleh menjalankan `update orders set harga_per_kg = ...` atau menulis
--      ulang `total` dan `kode` atas pesanan yang sudah dibuat pembeli.
--
--   3. Status pesanan tidak punya arah. Kolomnya menerima nilai apa pun dari
--      keempat yang sah, jadi pesanan yang sudah "selesai" bisa dikembalikan ke
--      "dipesan", dan "selesai" bisa ditulis langsung tanpa kode serah terima —
--      melewati RPC `verifikasi_serah_terima` yang seharusnya menjadi
--      satu-satunya pintunya.

-- 1. Realtime -----------------------------------------------------------------
-- Identitas replika bawaan (kunci primer) sudah cukup: klien hanya memerlukan
-- baris `new`, dan otorisasi barisnya tetap lewat policy select yang ada.
alter publication supabase_realtime add table public.orders;

-- 2. Hak kolom ----------------------------------------------------------------
-- Hanya `status` yang boleh ditulis peran klien. `berat_aktual_kg` sengaja
-- tidak ikut: ia ditulis lewat RPC serah terima, yang security definer dan
-- karenanya tidak tunduk pada grant ini — angka itu mengkalibrasi faktor
-- densitas estimasi berat (F-101), jadi ia tidak boleh bisa diubah tanpa kode
-- yang benar dari pembeli.
revoke update on public.orders from anon, authenticated;
grant update (status) on public.orders to authenticated;

-- Policy update dipersempit dengan `with check` eksplisit, tidak lagi mewarisi
-- diam-diam dari `using`.
drop policy if exists "petani memperbarui status pesanan" on public.orders;

create policy "petani memperbarui status pesanan"
  on public.orders for update
  to authenticated
  using (auth.uid() = petani_id)
  with check (auth.uid() = petani_id);

-- 3. Arah alur ----------------------------------------------------------------
create or replace function public.urutan_status_pesanan(s text)
returns int
language sql
immutable
set search_path to ''
as $$
  select case s
    when 'dipesan' then 0
    when 'dikonfirmasi' then 1
    when 'serah_terima' then 2
    when 'selesai' then 3
  end;
$$;

comment on function public.urutan_status_pesanan(text) is
  'Peringkat tahap pesanan. Dipakai trigger alur maju; nilai di luar keempatnya sudah ditolak orders_status_check.';

create or replace function public.jaga_alur_pesanan()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if public.urutan_status_pesanan(new.status)
     < public.urutan_status_pesanan(old.status) then
    raise exception 'Status pesanan hanya bisa maju: % tidak bisa kembali ke %',
      old.status, new.status
      using errcode = 'check_violation';
  end if;

  -- "selesai" adalah klaim bahwa komoditasnya sudah berpindah tangan, dan
  -- satu-satunya bukti untuk itu adalah kode transaksi pembeli. Karena itu ia
  -- hanya boleh ditulis dari dalam verifikasi_serah_terima(), yang menyalakan
  -- penanda di bawah ini sesudah kodenya cocok.
  if new.status = 'selesai'
     and coalesce(current_setting('pantas.serah_terima', true), '') <> 'on' then
    raise exception 'Pesanan hanya bisa diselesaikan lewat verifikasi kode serah terima'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_alur_maju on public.orders;

create trigger orders_alur_maju
  before update of status on public.orders
  for each row
  execute function public.jaga_alur_pesanan();

-- RPC serah terima: sama seperti sebelumnya, ditambah penanda sesi yang
-- membuktikan kepada trigger di atas bahwa kode pembeli sudah dicocokkan.
-- `set_config(..., true)` membuatnya hidup hanya sampai transaksi ini selesai.
create or replace function public.verifikasi_serah_terima(
  p_order_id text,
  p_kode text,
  p_berat_aktual_kg numeric default null
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_ok boolean := false;
begin
  if p_berat_aktual_kg is not null and p_berat_aktual_kg <= 0 then
    p_berat_aktual_kg := null;
  end if;

  perform set_config('pantas.serah_terima', 'on', true);

  update public.orders o
  set status = 'selesai',
      berat_aktual_kg = coalesce(p_berat_aktual_kg, o.berat_aktual_kg)
  where o.id = p_order_id
    and o.petani_id = auth.uid()
    and o.status <> 'selesai'
    and upper(regexp_replace(p_kode, '[\s-]', '', 'g'))
      = upper(regexp_replace(o.kode, '[\s-]', '', 'g'))
  returning true into v_ok;

  perform set_config('pantas.serah_terima', 'off', true);

  return coalesce(v_ok, false);
end;
$$;
