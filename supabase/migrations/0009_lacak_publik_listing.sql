-- PANTAS — Migrasi 0009: laporan mutu bisa dibaca lewat listing tayang (F-60)
--
-- Dua hal membuat janji "siapa pun yang memegang peti bisa memindai QR dan
-- melihat laporan mutu aslinya" tidak pernah bisa ditepati di backend nyata:
--
--   1. `gradings` hanya punya policy select `auth.uid() = petani_id`. RLS
--      menolak selain itu, jadi pengunjung anonim di `/lacak/[hash]` selalu
--      mendapat nol baris. Halaman itu hanya pernah bekerja di mode demo
--      offline, tempat datanya tidak berasal dari basis data.
--   2. `listings_view` tidak pernah memilih `hash_audit`, sementara
--      `rowToListing` di web/src/lib/data.ts membacanya. Nilainya selalu
--      undefined, sehingga tombol "Lacak Sertifikat Mutu" di layar pembeli
--      tidak pernah muncul untuk listing yang datang dari Supabase.
--
-- Yang dibuka hanyalah grading yang petaninya sendiri sudah menerbitkan listing
-- darinya. Pindaian yang tidak pernah ditayangkan tetap privat.

-- 1. Baca publik untuk grading yang tertaut listing tayang ------------------
drop policy if exists "grading terlacak lewat listing tayang" on public.gradings;
create policy "grading terlacak lewat listing tayang"
  on public.gradings for select
  using (
    exists (
      select 1
      from public.listings l
      where l.grading_id = gradings.id
        and l.status = 'tayang'
    )
  );

-- 2. `hash_audit` pada view katalog ----------------------------------------
-- Kolom baru wajib ditambahkan di akhir: `create or replace view` menolak
-- perubahan urutan atau nama kolom yang sudah ada. Join kiri, bukan dalam:
-- listing yang terbit tanpa pindaian (mis. dari mode demo) harus tetap tampil,
-- hanya tanpa hash.
create or replace view public.listings_view
with (security_invoker = true) as
select
  l.id, l.nama, l.komoditas, l.grade, l.berat_kg, l.harga_per_kg, l.gambar,
  l.satuan, l.stok_kg, l.panen_terakhir, l.komposisi, l.catatan_ai,
  l.status, l.created_at, l.petani_id, l.grading_id,
  p.nama   as petani,
  p.lokasi as lokasi,
  p.alamat as alamat,
  p.lat    as lat,
  p.lng    as lng,
  p.rating as rating,
  p.transaksi as transaksi,
  g.hash_audit as hash_audit
from public.listings l
join public.profiles p on p.id = l.petani_id
left join public.gradings g on g.id = l.grading_id;
