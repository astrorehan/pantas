-- PANTAS — Migrasi 0015: konsol admin punya kewenangan, bukan hanya halaman
--
-- Sampai migrasi ini, peran admin bisa membaca satu-satunya hal yang policy-nya
-- terbuka untuk semua orang. `orders` dibatasi ke pihak terkait (0001),
-- `gradings` ke pemiliknya sendiri (0001), dan `listings` ke baris berstatus
-- 'tayang'. Akibatnya konsol operator hanya mampu menampilkan view agregat dan
-- daftar penjemputan — F-90 meminta pesanan per status, GMV, dan grading 24 jam
-- terakhir, dan tidak satu pun angka itu bisa dibaca oleh peran yang seharusnya
-- mengawasinya. F-91 (moderasi listing) bahkan tidak punya jalan tulis sama
-- sekali: `audit_log` menerima policy SELECT di 0004, tidak pernah INSERT.
--
-- Tiga hal yang dikerjakan berkas ini:
--   1. Hak baca lintas-pengguna untuk peran admin, lewat `public.is_admin()`
--      yang sudah ada sejak 0006.
--   2. Status 'disembunyikan' pada listings, terpisah dari 'ditutup'. Petani
--      yang menutup lapaknya sendiri dan moderator yang menurunkannya adalah
--      dua peristiwa berbeda; menumpuknya di satu nilai membuat layar moderasi
--      tidak bisa menjawab "siapa yang menurunkan ini".
--   3. Dua fungsi security definer sebagai satu-satunya jalan tulis admin.
--      Bukan policy UPDATE lebar: RLS tidak bisa membatasi kolom, jadi policy
--      "admin boleh update listings" berarti admin boleh menulis ulang harga
--      dan berat milik petani. Fungsi ini mengubah persis satu kolom dan
--      menuliskan alasannya ke audit_log dalam transaksi yang sama — alasan
--      yang diminta F-91 tidak bisa terlewat karena ia bukan langkah kedua.

-- 1. Baca lintas-pengguna untuk operator koperasi -------------------------

drop policy if exists "Admin membaca semua pesanan" on public.orders;
create policy "Admin membaca semua pesanan"
  on public.orders for select
  using (public.is_admin());

drop policy if exists "Admin membaca semua grading" on public.gradings;
create policy "Admin membaca semua grading"
  on public.gradings for select
  using (public.is_admin());

-- Termasuk yang tidak tayang: layar moderasi harus bisa memunculkan kembali
-- listing yang ia sendiri sembunyikan, dan itu mustahil bila baris itu hilang
-- dari hasil kueri begitu statusnya berubah.
drop policy if exists "Admin membaca semua listing" on public.listings;
create policy "Admin membaca semua listing"
  on public.listings for select
  using (public.is_admin());

-- 2. Status moderasi ------------------------------------------------------

alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings
  add constraint listings_status_check
  check (status in ('tayang', 'habis', 'ditutup', 'disembunyikan'));

-- 3. Jalan tulis admin ----------------------------------------------------

/*
 * Moderasi satu listing (F-91).
 *
 * `p_alasan` wajib berisi teks: tanpa itu audit_log hanya mencatat bahwa
 * sesuatu terjadi, bukan mengapa — dan pertanyaan yang selalu datang belakangan
 * adalah yang kedua. Pemanggil non-admin mendapat exception, bukan false, agar
 * kegagalan wewenang tidak bisa disalahartikan sebagai "listing tidak ada".
 */
create or replace function public.moderasi_listing(
  p_listing_id text,
  p_status     text,
  p_alasan     text
)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_lama text;
begin
  if not public.is_admin() then
    raise exception 'Hanya operator koperasi yang boleh memoderasi listing.'
      using errcode = '42501';
  end if;

  if p_status not in ('tayang', 'disembunyikan') then
    raise exception 'Status moderasi hanya boleh tayang atau disembunyikan, bukan %', p_status
      using errcode = '22023';
  end if;

  if coalesce(btrim(p_alasan), '') = '' then
    raise exception 'Alasan moderasi wajib diisi.'
      using errcode = '22023';
  end if;

  select status into v_lama from public.listings where id = p_listing_id;
  if v_lama is null then
    raise exception 'Listing % tidak ditemukan.', p_listing_id using errcode = 'P0002';
  end if;

  update public.listings set status = p_status where id = p_listing_id;

  insert into public.audit_log (aktor_id, aksi, entitas, entitas_id, meta)
  values (
    auth.uid(),
    case when p_status = 'disembunyikan' then 'listing.sembunyikan' else 'listing.pulihkan' end,
    'listing',
    p_listing_id,
    jsonb_build_object('dari', v_lama, 'ke', p_status, 'alasan', btrim(p_alasan))
  );

  return p_status;
end;
$$;

/*
 * Menaikkan status rute konsolidasi (F-51).
 *
 * Policy UPDATE milik 0006 sebenarnya sudah mengizinkan admin menulis ke
 * `rute`, tetapi tidak ada satu pun layar yang memakainya — jadi setiap rute
 * berhenti di 'draf' selamanya. Itu bukan sekadar label yang tertinggal: view
 * `dampak_agregat` (0004) menghitung `km_dihemat` hanya dari rute berstatus
 * 'selesai', sehingga angka penghematan di dashboard tidak pernah bisa tumbuh
 * dari data nyata, berapa pun rute yang direncanakan.
 *
 * Urutannya searah. Rute yang sudah berjalan tidak bisa kembali jadi draf,
 * karena petani sudah membaca jam kedatangan armadanya dari nomor rute itu.
 */
create or replace function public.ubah_status_rute(
  p_rute_id uuid,
  p_status  text
)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_lama    text;
  v_urutan  text[] := array['draf', 'terkunci', 'berjalan', 'selesai'];
  v_i_lama  int;
  v_i_baru  int;
begin
  if not public.is_admin() then
    raise exception 'Hanya operator koperasi yang boleh mengubah status rute.'
      using errcode = '42501';
  end if;

  select status into v_lama from public.rute where id = p_rute_id;
  if v_lama is null then
    raise exception 'Rute % tidak ditemukan.', p_rute_id using errcode = 'P0002';
  end if;

  v_i_lama := array_position(v_urutan, v_lama);
  v_i_baru := array_position(v_urutan, p_status);

  if v_i_baru is null then
    raise exception 'Status rute % tidak dikenal.', p_status using errcode = '22023';
  end if;
  if v_i_baru <> v_i_lama + 1 then
    raise exception 'Rute hanya bisa maju satu langkah: % lalu %.', v_lama, v_urutan[v_i_lama + 1]
      using errcode = '22023';
  end if;

  update public.rute set status = p_status where id = p_rute_id;

  insert into public.audit_log (aktor_id, aksi, entitas, entitas_id, meta)
  values (
    auth.uid(),
    'rute.status',
    'rute',
    p_rute_id::text,
    jsonb_build_object('dari', v_lama, 'ke', p_status)
  );

  return p_status;
end;
$$;

-- Keduanya security definer, jadi haknya dikunci ke peran yang benar-benar
-- memanggilnya lewat PostgREST. `anon` tidak termasuk: konsol ada di balik
-- login, dan fungsi yang bisa dipanggil tanpa sesi akan menuliskan audit_log
-- dengan aktor null.
revoke execute on function public.moderasi_listing(text, text, text) from public, anon;
revoke execute on function public.ubah_status_rute(uuid, text) from public, anon;
grant  execute on function public.moderasi_listing(text, text, text) to authenticated;
grant  execute on function public.ubah_status_rute(uuid, text) to authenticated;

-- Kueri layar audit selalu terurut waktu turun; tanpa indeks ini ia memindai
-- seluruh tabel untuk mengambil 50 baris teratas.
create index if not exists idx_audit_log_waktu on public.audit_log (created_at desc);
