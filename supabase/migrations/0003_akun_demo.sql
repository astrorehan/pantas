-- PANTAS — dukungan akun demo (F-03) & peran admin/koperasi (persona C).
--
-- Dua hal yang dibutuhkan sebelum seed DIY bisa dipasang:
--   1. Penanda `is_demo`, supaya angka dampak platform bisa mengecualikan data
--      demo. Tanpa ini, agregat yang dikutip di pitch deck ikut menghitung
--      pesanan karangan dan seluruh klaim dampak jadi tidak bisa dipertahankan
--      (R-12, NFR §11.4).
--   2. Peran `admin` pada constraint `profiles.peran`. Koperasi adalah persona
--      ketiga di PRD §4.3 dan sekaligus panggung demo juri.

alter table public.profiles
  add column if not exists is_demo    boolean not null default false,
  -- Tur berpandu sekali jalan (F-04) menyimpan statusnya di sini, bukan di
  -- localStorage: juri yang membuka dari dua perangkat tidak perlu melihatnya
  -- dua kali.
  add column if not exists tur_selesai boolean not null default false;

create index if not exists profiles_is_demo_idx on public.profiles (is_demo);

alter table public.profiles drop constraint if exists profiles_peran_check;
alter table public.profiles
  add constraint profiles_peran_check
  check (peran in ('petani', 'pembeli', 'admin'));
