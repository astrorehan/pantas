-- PANTAS — Migrasi 0007: Faktor emisi sebagai konfigurasi tunggal (F-106)
--
-- Tabel `emisi_faktor` sudah dibuat dan diisi di 0004, tetapi tidak ada satu
-- pun pembaca di aplikasi: `lib/emisi.ts` masih menuliskan 0,53 sebagai
-- konstanta dan `route-planner.tsx` menuliskan 2,68 kg CO₂e/liter solar.
-- Migrasi ini melengkapi tabel supaya benar-benar bisa menjadi satu-satunya
-- sumber angka: satuan yang eksplisit, baris cadangan untuk komoditas di luar
-- daftar, faktor transportasi, dan hak tulis admin.

-- 1. Satuan eksplisit ------------------------------------------------------
-- Tanpa kolom ini tabel hanya jujur selama semua barisnya kg CO₂e/kg panen.
-- Faktor solar di langkah 3 memakai satuan berbeda, jadi satuan harus ikut
-- disimpan dan ikut ditampilkan, bukan diasumsikan pembaca.
alter table public.emisi_faktor
  add column if not exists satuan text not null default 'kg CO₂e/kg';

-- 2. Baris cadangan --------------------------------------------------------
-- Komoditas yang belum punya barisnya sendiri tidak boleh jatuh ke angka
-- ajaib di kode. `lainnya` adalah nilai yang dipakai saat pencarian gagal.
insert into public.emisi_faktor (komoditas, faktor, satuan, sumber, catatan)
values
  (
    'lainnya',
    0.53,
    'kg CO₂e/kg',
    'Poore & Nemecek (2018), Science 360(6392), 987–992',
    'Kategori Other Vegetables. Dipakai untuk komoditas yang belum punya '
    || 'faktor sendiri, sekaligus batas bawah yang aman untuk diklaim.'
  )
on conflict (komoditas) do update set
  faktor  = excluded.faktor,
  satuan  = excluded.satuan,
  sumber  = excluded.sumber,
  catatan = excluded.catatan;

-- 3. Faktor transportasi ---------------------------------------------------
-- Kartu penghematan rute mengubah liter solar menjadi kg CO₂e. Angkanya
-- sebelumnya hard-coded di komponen perencana, persis cacat yang diperbaiki
-- F-106 untuk komoditas.
insert into public.emisi_faktor (komoditas, faktor, satuan, sumber, catatan)
values
  (
    'transport_solar',
    2.68,
    'kg CO₂e/liter',
    'UK DEFRA/BEIS Greenhouse Gas Conversion Factors 2024 — diesel (average biofuel blend)',
    'Dipakai kartu penghematan rute konsolidasi, bukan perhitungan panen.'
  )
on conflict (komoditas) do update set
  faktor  = excluded.faktor,
  satuan  = excluded.satuan,
  sumber  = excluded.sumber,
  catatan = excluded.catatan;

-- 4. Sitasi penuh untuk baris komoditas -----------------------------------
-- 0004 menyingkat sumbernya menjadi 'Poore & Nemecek (2018), Science', terlalu
-- pendek untuk ditampilkan sebagai sitasi di UI dampak.
update public.emisi_faktor
set sumber = 'Poore & Nemecek (2018), Science 360(6392), 987–992'
where komoditas in ('carrot', 'cucumber', 'chili', 'tomato');

update public.emisi_faktor
set catatan =
  'Rata-rata global Poore & Nemecek untuk tomat adalah 2,09 kg CO₂e/kg, '
  || 'terangkat produksi rumah kaca berpemanas di Eropa. Tomat Indonesia '
  || 'ditanam di lapangan terbuka tanpa pemanas, sehingga PANTAS memakai '
  || 'angka Other Vegetables 0,53 agar klaim dampaknya tidak berlebih.'
where komoditas = 'tomato';

-- 5. Hak tulis admin -------------------------------------------------------
-- 0004 hanya memberi SELECT publik. Mengganti sumber lewat UI admin mustahil
-- tanpa policy tulis, dan F-106 menuntut penggantian sumber tidak menyentuh
-- kode. `public.is_admin()` didefinisikan di 0006.
drop policy if exists "Admin mengubah faktor emisi" on public.emisi_faktor;
create policy "Admin mengubah faktor emisi"
  on public.emisi_faktor for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin menambah faktor emisi" on public.emisi_faktor;
create policy "Admin menambah faktor emisi"
  on public.emisi_faktor for insert
  with check (public.is_admin());
