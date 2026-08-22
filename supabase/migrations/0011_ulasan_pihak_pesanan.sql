-- PANTAS — Migrasi 0011: Ulasan hanya dari pihak pesanan yang sudah selesai (F-42)
--
-- Kebijakan lama hanya memeriksa `auth.uid() = penilai_id`, yang berarti akun
-- mana pun boleh menilai akun mana pun atas pesanan mana pun — termasuk pesanan
-- yang belum selesai dan pesanan milik orang lain. Karena `profiles.rating`
-- diperbarui trigger dari tabel ini, celah itu bukan sekadar baris sampah:
-- reputasi petani bisa dijatuhkan oleh siapa saja.
--
-- F-42 menuntut "setelah `selesai`, kedua pihak saling menilai". Aturan itu
-- ditegakkan di sini, dan digandakan sebagai fungsi murni `bolehMenilai()` di
-- web/src/lib/ulasan.ts supaya tombolnya tidak pernah tampil untuk ulasan yang
-- akan ditolak.

create or replace function public.boleh_menilai_pesanan(
  p_order_id text,
  p_penilai_id uuid,
  p_dinilai_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and o.status = 'selesai'
      -- Penilai adalah salah satu pihak, dan yang dinilai adalah pihak
      -- seberangnya. Menilai diri sendiri ikut tertutup oleh pasangan ini.
      and (
        (o.petani_id = p_penilai_id and o.pembeli_id = p_dinilai_id)
        or (o.pembeli_id = p_penilai_id and o.petani_id = p_dinilai_id)
      )
  );
$$;

drop policy if exists "Penilai dapat membuat ulasan" on public.ulasan;
create policy "Pihak pesanan selesai dapat membuat ulasan"
  on public.ulasan for insert
  with check (
    auth.uid() = penilai_id
    and public.boleh_menilai_pesanan(order_id, penilai_id, dinilai_id)
  );

-- Memperbarui ulasan sendiri tetap boleh (mengganti bintang atau memperbaiki
-- komentar), tapi tidak boleh dipindahkan ke pesanan atau orang lain.
drop policy if exists "Penilai dapat memperbarui ulasan sendiri" on public.ulasan;
create policy "Penilai dapat memperbarui ulasan sendiri"
  on public.ulasan for update
  using (auth.uid() = penilai_id)
  with check (
    auth.uid() = penilai_id
    and public.boleh_menilai_pesanan(order_id, penilai_id, dinilai_id)
  );
