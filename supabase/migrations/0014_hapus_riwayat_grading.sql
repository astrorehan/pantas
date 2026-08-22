-- Petani boleh menghapus riwayat grading miliknya sendiri (F-13).
--
-- Batasnya bukan soal kepemilikan saja: satu grading yang sudah diterbitkan
-- sebagai listing adalah sertifikat mutu yang sedang dibaca pembeli lewat
-- halaman lacak publik (0009). Menghapusnya akan menyetel `listings.grading_id`
-- menjadi null (`on delete set null` di 0001) dan lot yang tayang kehilangan
-- dasar klaim mutunya tanpa satu pun jejak. Karena itu kebijakan ini hanya
-- meloloskan grading yang belum terikat listing mana pun.
--
-- Subkueri `listings` di bawah ikut tunduk pada RLS, dan kebijakan select
-- listing (0001) sudah membuat petani melihat seluruh listing miliknya apa pun
-- statusnya — jadi lot yang dijeda atau terjual tetap menahan penghapusan.
--
-- DELETE yang ditahan kebijakan ini pulang tanpa galat dan tanpa baris, bukan
-- sebagai error; `hapusRiwayatGrading` di web memeriksa jumlah baris terhapus
-- untuk membedakannya dari sukses.
drop policy if exists "petani_hapus_grading_mandiri" on public.gradings;
create policy "petani_hapus_grading_mandiri"
  on public.gradings for delete
  using (
    auth.uid() = petani_id
    and not exists (
      select 1 from public.listings
      where grading_id = gradings.id
    )
  );
