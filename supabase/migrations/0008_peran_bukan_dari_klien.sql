-- PANTAS — Migrasi 0008: peran akun tidak boleh datang dari klien
--
-- `handle_new_user` (0001) menyalin `raw_user_meta_data ->> 'peran'` apa adanya,
-- dan 0003 melebarkan constraint `profiles.peran` sampai 'admin'. Masing-masing
-- benar sendiri; bersama-sama keduanya berarti siapa pun bisa memanggil
--
--     supabase.auth.signUp({ options: { data: { peran: 'admin' } } })
--
-- dan mendapat profil admin. `public.is_admin()` (0006) langsung bernilai true
-- untuk akun itu, sehingga policy tulis rute konsolidasi (0006) dan tabel
-- `emisi_faktor` (0007) ikut terbuka. Formulir /masuk memang hanya menawarkan
-- petani & pembeli, tetapi formulir bukan batas keamanan: permintaannya bisa
-- disusun tanpa pernah membuka halamannya.
--
-- Sesudah migrasi ini pendaftaran mandiri hanya bisa menghasilkan 'petani' atau
-- 'pembeli'. Akun operator koperasi diberikan lewat SQL/service role — jalur
-- yang memang sudah dipakai `supabase/seed_demo.sql`.
--
-- Catatan operasional: migrasi ini tidak menurunkan baris `peran = 'admin'` yang
-- sudah ada, karena akun koperasi yang sah tidak bisa dibedakan dari akun yang
-- menaikkan haknya sendiri. Periksa manual sekali setelah menerapkan:
--   select id, peran, created_at from public.profiles where peran = 'admin';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_peran text := coalesce(new.raw_user_meta_data ->> 'peran', 'pembeli');
begin
  -- Nilai di luar dua peran swalayan diperlakukan sebagai upaya menaikkan hak,
  -- lalu diturunkan ke default. Bukan raise exception: melempar di sini akan
  -- menggagalkan insert ke auth.users, dan GoTrue meninggalkan pengguna dengan
  -- pesan galat generik alih-alih akun pembeli biasa.
  if v_peran not in ('petani', 'pembeli') then
    v_peran := 'pembeli';
  end if;

  insert into public.profiles (id, peran, nama, phone)
  values (
    new.id,
    v_peran,
    coalesce(new.raw_user_meta_data ->> 'nama', 'Pengguna PANTAS'),
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- `create or replace` mempertahankan ACL, tetapi 0002 mencabut hak eksekusi ini
-- justru karena fungsinya security definer — diulang supaya tidak bergantung
-- pada perilaku yang tidak terlihat di berkas ini.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
