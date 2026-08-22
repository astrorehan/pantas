-- PANTAS — Migrasi 0012: Isi pesan tidak bisa ditulis ulang sesudah terkirim (F-33)
--
-- Policy update pada tabel `pesan` bernama "Penerima dapat memperbarui status
-- dibaca", tetapi isinya jauh lebih longgar daripada namanya:
--
--   using (auth.uid() = penerima_id or auth.uid() = pengirim_id)
--
-- Tanpa `with check`, Postgres memakai ekspresi `using` sebagai pemeriksa baris
-- baru, dan RLS memang tidak pernah membatasi kolom. Akibatnya pengirim boleh
-- menjalankan `update pesan set isi = ...` atas pesannya sendiri — termasuk
-- pesan yang sudah dibaca lawan bicara. Pada percakapan yang isinya tawar-menawar
-- harga, riwayat yang bisa ditulis ulang sepihak tidak bisa dijadikan rujukan
-- oleh siapa pun. Keduanya juga bisa memindahkan pesan ke order atau penawaran
-- lain lewat `order_id`/`penawaran_id`.
--
-- Perbaikannya dua lapis, karena RLS sendirian tidak cukup:
--
--   1. Hak kolom — satu-satunya cara Postgres membatasi kolom mana yang boleh
--      ditulis. Sesudah ini `update` yang menyentuh kolom selain `dibaca`
--      ditolak sebelum RLS sempat dievaluasi.
--   2. Policy dipersempit ke penerima saja, agar pengirim tidak bisa menandai
--      pesannya sendiri "sudah dibaca" oleh lawan.

-- 1. Hak kolom: hanya `dibaca` yang boleh ditulis peran klien.
revoke update on public.pesan from anon, authenticated;
grant update (dibaca) on public.pesan to authenticated;

-- 2. Policy update: penerima saja, dan barisnya harus tetap miliknya sesudah
--    perubahan (`with check` eksplisit, tidak mewarisi diam-diam dari `using`).
drop policy if exists "Penerima dapat memperbarui status dibaca" on public.pesan;

create policy "Penerima menandai pesan sudah dibaca"
  on public.pesan for update
  to authenticated
  using (auth.uid() = penerima_id)
  with check (auth.uid() = penerima_id);

-- Catatan: `delete` tidak pernah diberi policy, jadi tabel ini memang
-- append-only untuk klien — dan sesudah migrasi ini, benar-benar append-only.
