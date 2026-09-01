-- PANTAS — Migrasi 0020: lifecycle pembatalan, sengketa, dan pembayaran v1
--
-- `orders.status` tetap menyatakan progres fisik komoditas. Pembatalan dan
-- sengketa adalah keadaan ortogonal: menjejalkannya ke rel progres membuat
-- status tidak lagi punya urutan dan merusak penjaga alur migrasi 0013.
-- Pembayaran masih berlangsung di luar aplikasi, tetapi dua pihak kini bisa
-- mencatat dan menyepakati statusnya tanpa PANTAS mengaku memindahkan uang.

alter table public.orders
  add column status_kasus text not null default 'normal',
  add column alasan_kasus text,
  add column diminta_oleh uuid references public.profiles (id) on delete set null,
  add column diminta_pada timestamptz,
  add column ditanggapi_oleh uuid references public.profiles (id) on delete set null,
  add column ditanggapi_pada timestamptz,
  add column status_pembayaran text not null default 'belum_dibayar',
  add column pembayaran_ditandai_pada timestamptz,
  add column pembayaran_dikonfirmasi_pada timestamptz;

alter table public.orders
  add constraint orders_status_kasus_check
    check (status_kasus in ('normal', 'pembatalan_diajukan', 'dibatalkan', 'sengketa')),
  add constraint orders_status_pembayaran_check
    check (status_pembayaran in ('belum_dibayar', 'ditandai_dibayar', 'dikonfirmasi')),
  add constraint orders_alasan_kasus_check
    check (alasan_kasus is null or char_length(btrim(alasan_kasus)) between 10 and 500);

create index orders_status_kasus_idx on public.orders (status_kasus)
  where status_kasus <> 'normal';
create index orders_diminta_oleh_idx on public.orders (diminta_oleh)
  where diminta_oleh is not null;
create index orders_ditanggapi_oleh_idx on public.orders (ditanggapi_oleh)
  where ditanggapi_oleh is not null;

drop policy if exists "Admin membaca semua pesanan" on public.orders;
create policy "Admin membaca semua pesanan"
  on public.orders for select
  to authenticated
  using (public.is_admin());

-- Kolom lifecycle tidak mendapat grant UPDATE. Seluruh penulisannya hanya
-- melalui RPC di bawah agar identitas pihak, tahap, dan transisinya atomik.

create or replace function public.ajukan_pembatalan_order(
  p_order_id text,
  p_alasan text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_aktor uuid := auth.uid();
  v_alasan text := btrim(coalesce(p_alasan, ''));
  v_status_kasus text;
begin
  if v_aktor is null then
    raise exception 'Sesi diperlukan untuk membatalkan pesanan'
      using errcode = 'insufficient_privilege';
  end if;
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 500 then
    raise exception 'Alasan pembatalan harus 10–500 karakter'
      using errcode = 'invalid_parameter_value';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_aktor not in (v_order.pembeli_id, v_order.petani_id) then
    raise exception 'Pesanan tidak ditemukan atau bukan milik Anda'
      using errcode = 'insufficient_privilege';
  end if;
  if v_order.status = 'selesai' then
    raise exception 'Pesanan yang selesai tidak bisa dibatalkan; buka sengketa bila ada masalah'
      using errcode = 'check_violation';
  end if;
  if v_order.status_kasus <> 'normal' then
    raise exception 'Pesanan sedang memiliki pembatalan atau sengketa aktif'
      using errcode = 'check_violation';
  end if;

  -- Sebelum petani mengonfirmasi belum ada komitmen logistik, jadi salah satu
  -- pihak dapat berhenti langsung. Sesudahnya pihak lawan wajib menyetujui.
  v_status_kasus := case
    when v_order.status = 'dipesan' then 'dibatalkan'
    else 'pembatalan_diajukan'
  end;

  update public.orders
  set status_kasus = v_status_kasus,
      alasan_kasus = v_alasan,
      diminta_oleh = v_aktor,
      diminta_pada = now(),
      ditanggapi_oleh = case when v_status_kasus = 'dibatalkan' then v_aktor else null end,
      ditanggapi_pada = case when v_status_kasus = 'dibatalkan' then now() else null end
  where id = p_order_id
  returning * into v_order;

  return to_jsonb(v_order);
end;
$$;

create or replace function public.tanggapi_pembatalan_order(
  p_order_id text,
  p_setuju boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_aktor uuid := auth.uid();
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_aktor is null or not found
     or v_aktor not in (v_order.pembeli_id, v_order.petani_id) then
    raise exception 'Pesanan tidak ditemukan atau bukan milik Anda'
      using errcode = 'insufficient_privilege';
  end if;
  if v_order.status_kasus <> 'pembatalan_diajukan' then
    raise exception 'Tidak ada permintaan pembatalan yang menunggu jawaban'
      using errcode = 'check_violation';
  end if;
  if v_order.diminta_oleh = v_aktor then
    raise exception 'Permintaan harus dijawab oleh pihak lawan'
      using errcode = 'insufficient_privilege';
  end if;

  update public.orders
  set status_kasus = case when p_setuju then 'dibatalkan' else 'normal' end,
      ditanggapi_oleh = v_aktor,
      ditanggapi_pada = now(),
      alasan_kasus = case when p_setuju then alasan_kasus else null end,
      diminta_oleh = case when p_setuju then diminta_oleh else null end,
      diminta_pada = case when p_setuju then diminta_pada else null end
  where id = p_order_id
  returning * into v_order;

  return to_jsonb(v_order);
end;
$$;

create or replace function public.buka_sengketa_order(
  p_order_id text,
  p_alasan text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_aktor uuid := auth.uid();
  v_alasan text := btrim(coalesce(p_alasan, ''));
begin
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 500 then
    raise exception 'Alasan sengketa harus 10–500 karakter'
      using errcode = 'invalid_parameter_value';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_aktor is null or not found
     or v_aktor not in (v_order.pembeli_id, v_order.petani_id) then
    raise exception 'Pesanan tidak ditemukan atau bukan milik Anda'
      using errcode = 'insufficient_privilege';
  end if;
  if v_order.status = 'dipesan' then
    raise exception 'Gunakan pembatalan sebelum pesanan dikonfirmasi'
      using errcode = 'check_violation';
  end if;
  if v_order.status_kasus <> 'normal' then
    raise exception 'Pesanan sedang memiliki pembatalan atau sengketa aktif'
      using errcode = 'check_violation';
  end if;

  update public.orders
  set status_kasus = 'sengketa',
      alasan_kasus = v_alasan,
      diminta_oleh = v_aktor,
      diminta_pada = now(),
      ditanggapi_oleh = null,
      ditanggapi_pada = null
  where id = p_order_id
  returning * into v_order;

  return to_jsonb(v_order);
end;
$$;

create or replace function public.selesaikan_sengketa_order(
  p_order_id text,
  p_batalkan boolean,
  p_catatan text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_aktor uuid := auth.uid();
  v_catatan text := btrim(coalesce(p_catatan, ''));
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat menyelesaikan sengketa'
      using errcode = 'insufficient_privilege';
  end if;
  if char_length(v_catatan) < 10 or char_length(v_catatan) > 500 then
    raise exception 'Catatan resolusi harus 10–500 karakter'
      using errcode = 'invalid_parameter_value';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.status_kasus <> 'sengketa' then
    raise exception 'Sengketa aktif tidak ditemukan'
      using errcode = 'P0002';
  end if;

  -- Catatan resolusi dicatat oleh trigger audit melalui perubahan state. Isi
  -- lengkapnya ditulis eksplisit di sini karena alasan kasus milik pelapor.
  insert into public.audit_log (aktor_id, aksi, entitas, entitas_id, meta)
  values (
    v_aktor,
    'pesanan.sengketa_resolusi',
    'pesanan',
    p_order_id,
    jsonb_build_object('dibatalkan', p_batalkan, 'catatan', v_catatan)
  );

  update public.orders
  set status_kasus = case when p_batalkan then 'dibatalkan' else 'normal' end,
      ditanggapi_oleh = v_aktor,
      ditanggapi_pada = now(),
      alasan_kasus = case when p_batalkan then alasan_kasus else null end,
      diminta_oleh = case when p_batalkan then diminta_oleh else null end,
      diminta_pada = case when p_batalkan then diminta_pada else null end
  where id = p_order_id
  returning * into v_order;

  return to_jsonb(v_order);
end;
$$;

create or replace function public.tandai_pembayaran_order(p_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if auth.uid() is null or not found or auth.uid() <> v_order.pembeli_id then
    raise exception 'Hanya pembeli pesanan ini yang dapat menandai pembayaran'
      using errcode = 'insufficient_privilege';
  end if;
  if v_order.status = 'dipesan' or v_order.status_kasus <> 'normal' then
    raise exception 'Pembayaran belum dapat ditandai pada keadaan pesanan ini'
      using errcode = 'check_violation';
  end if;
  if v_order.status_pembayaran <> 'belum_dibayar' then
    raise exception 'Pembayaran sudah pernah ditandai'
      using errcode = 'check_violation';
  end if;

  update public.orders
  set status_pembayaran = 'ditandai_dibayar',
      pembayaran_ditandai_pada = now()
  where id = p_order_id
  returning * into v_order;
  return to_jsonb(v_order);
end;
$$;

create or replace function public.konfirmasi_pembayaran_order(p_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if auth.uid() is null or not found or auth.uid() <> v_order.petani_id then
    raise exception 'Hanya petani pesanan ini yang dapat mengonfirmasi penerimaan pembayaran'
      using errcode = 'insufficient_privilege';
  end if;
  if v_order.status_kasus <> 'normal'
     or v_order.status_pembayaran <> 'ditandai_dibayar' then
    raise exception 'Pembayaran belum ditandai oleh pembeli atau transaksi sedang terkunci'
      using errcode = 'check_violation';
  end if;

  update public.orders
  set status_pembayaran = 'dikonfirmasi',
      pembayaran_dikonfirmasi_pada = now()
  where id = p_order_id
  returning * into v_order;
  return to_jsonb(v_order);
end;
$$;

-- Pesanan yang sudah dibatalkan/disengketakan tidak boleh terus maju lewat
-- grant UPDATE(status) yang memang dimiliki petani.
create or replace function public.jaga_alur_pesanan()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status_kasus <> 'normal' or new.status_kasus <> 'normal' then
    raise exception 'Status pesanan tidak dapat maju saat transaksi dibatalkan atau disengketakan'
      using errcode = 'check_violation';
  end if;

  if public.urutan_status_pesanan(new.status)
     < public.urutan_status_pesanan(old.status) then
    raise exception 'Status pesanan hanya bisa maju: % tidak bisa kembali ke %',
      old.status, new.status
      using errcode = 'check_violation';
  end if;

  if new.status = 'selesai'
     and coalesce(current_setting('pantas.serah_terima', true), '') <> 'on' then
    raise exception 'Pesanan hanya bisa diselesaikan lewat verifikasi kode serah terima'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

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
    and o.status_kasus = 'normal'
    and upper(regexp_replace(p_kode, '[\s-]', '', 'g'))
      = upper(regexp_replace(o.kode, '[\s-]', '', 'g'))
  returning true into v_ok;
  perform set_config('pantas.serah_terima', 'off', true);

  return coalesce(v_ok, false);
end;
$$;

-- Peristiwa lifecycle masuk jejak audit yang sama dengan progres pesanan.
create or replace function public.catat_audit_pesanan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.audit_log (aktor_id, aksi, entitas, entitas_id, meta)
    values (
      auth.uid(),
      case when new.status = 'selesai' then 'pesanan.serah_terima' else 'pesanan.status' end,
      'pesanan', new.id,
      jsonb_build_object('dari', old.status, 'ke', new.status, 'nama', new.nama, 'total', new.total)
    );
  end if;

  if new.status_kasus is distinct from old.status_kasus then
    insert into public.audit_log (aktor_id, aksi, entitas, entitas_id, meta)
    values (
      auth.uid(), 'pesanan.kasus', 'pesanan', new.id,
      jsonb_build_object(
        'dari', old.status_kasus,
        'ke', new.status_kasus,
        'alasan', coalesce(new.alasan_kasus, old.alasan_kasus),
        'peminta', coalesce(new.diminta_oleh, old.diminta_oleh)
      )
    );
  end if;

  if new.status_pembayaran is distinct from old.status_pembayaran then
    insert into public.audit_log (aktor_id, aksi, entitas, entitas_id, meta)
    values (
      auth.uid(), 'pesanan.pembayaran', 'pesanan', new.id,
      jsonb_build_object('dari', old.status_pembayaran, 'ke', new.status_pembayaran)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_pesanan on public.orders;
create trigger trg_audit_pesanan
  after update of status, status_kasus, status_pembayaran on public.orders
  for each row execute function public.catat_audit_pesanan();

-- Klaim dampak dan GMV tidak boleh memasukkan transaksi yang dibatalkan atau
-- sedang disengketakan walaupun progres fisiknya sempat mencapai selesai.
create or replace view public.dampak_agregat with (security_invoker = true) as
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
where o.status = 'selesai'
  and o.status_kasus = 'normal'
  and (p.is_demo is null or p.is_demo = false);

revoke all on function public.ajukan_pembatalan_order(text, text) from public, anon, authenticated;
revoke all on function public.tanggapi_pembatalan_order(text, boolean) from public, anon, authenticated;
revoke all on function public.buka_sengketa_order(text, text) from public, anon, authenticated;
revoke all on function public.selesaikan_sengketa_order(text, boolean, text) from public, anon, authenticated;
revoke all on function public.tandai_pembayaran_order(text) from public, anon, authenticated;
revoke all on function public.konfirmasi_pembayaran_order(text) from public, anon, authenticated;

grant execute on function public.ajukan_pembatalan_order(text, text) to authenticated;
grant execute on function public.tanggapi_pembatalan_order(text, boolean) to authenticated;
grant execute on function public.buka_sengketa_order(text, text) to authenticated;
grant execute on function public.selesaikan_sengketa_order(text, boolean, text) to authenticated;
grant execute on function public.tandai_pembayaran_order(text) to authenticated;
grant execute on function public.konfirmasi_pembayaran_order(text) to authenticated;

revoke execute on function public.catat_audit_pesanan() from public, anon, authenticated;
revoke execute on function public.jaga_alur_pesanan() from public, anon, authenticated;
revoke execute on function public.verifikasi_serah_terima(text, text, numeric) from public, anon;
grant execute on function public.verifikasi_serah_terima(text, text, numeric) to authenticated;
