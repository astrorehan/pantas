-- PANTAS — Migrasi 0016: peristiwa inti benar-benar masuk audit_log (F-62)
--
-- 0015 memberi konsol admin dua tindakan yang menulis jejak. Tapi F-62 menyebut
-- lima peristiwa yang harus tercatat — grading tersimpan, listing terbit, status
-- pesanan berubah, harga acuan berubah, serah terima terverifikasi — dan tidak
-- satu pun dari lima itu pernah menulis satu baris. Layar /admin/audit yang baru
-- dibuat karena itu hanya bisa menampilkan pekerjaan admin sendiri: benar, tapi
-- bukan jejak audit platform.
--
-- Dikerjakan sebagai trigger, bukan panggilan dari aplikasi. Alasannya bukan
-- selera: jalur tulis pesanan ada di tiga tempat (klien pembeli, klien petani,
-- dan fungsi `verifikasi_serah_terima`), dan pencatatan yang dititipkan ke
-- pemanggil akan terlewat persis di jalur yang paling jarang dibaca ulang.
-- Di trigger, peristiwanya tercatat karena barisnya berubah — tidak ada cabang
-- kode yang bisa lupa memanggilnya.
--
-- Semuanya SECURITY DEFINER: `audit_log` menyalakan RLS dan hanya punya policy
-- SELECT (0004), jadi trigger yang berjalan sebagai pengguna biasa akan ditolak
-- menulis ke tabelnya sendiri.

/*
 * Serah terima ikut lewat sini. `verifikasi_serah_terima` (0001) tidak
 * mengubah apa pun selain `orders.status` menjadi 'selesai', jadi peristiwa
 * kelima di daftar F-62 adalah kasus khusus dari peristiwa ketiga — dan
 * mencatatnya dua kali hanya membuat jejaknya lebih sulit dibaca.
 */
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
      'pesanan',
      new.id,
      jsonb_build_object(
        'dari', old.status,
        'ke', new.status,
        'nama', new.nama,
        'total', new.total
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_pesanan on public.orders;
create trigger trg_audit_pesanan
  after update of status on public.orders
  for each row execute function public.catat_audit_pesanan();

create or replace function public.catat_audit_grading()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (aktor_id, aksi, entitas, entitas_id, meta)
  values (
    auth.uid(),
    'grading.simpan',
    'grading',
    new.id::text,
    jsonb_build_object(
      'komoditas', new.komoditas_label,
      'grade', new.grade_dominan,
      'objek', new.objek_terdeteksi,
      -- Hash-nya, bukan payload-nya: baris audit menunjuk ke bukti yang sudah
      -- tersimpan di `gradings.hasil`, ia tidak menyalinnya.
      'hash', new.hash_audit
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_audit_grading on public.gradings;
create trigger trg_audit_grading
  after insert on public.gradings
  for each row execute function public.catat_audit_grading();

/*
 * Hanya penerbitan. Perubahan status listing sengaja tidak ikut: satu-satunya
 * yang mengubahnya hari ini adalah `moderasi_listing` (0015), yang sudah
 * menulis barisnya sendiri lengkap dengan alasan — dan trigger di sini akan
 * menduplikasi setiap tindakan moderasi tanpa menambah satu pun informasi.
 */
create or replace function public.catat_audit_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (aktor_id, aksi, entitas, entitas_id, meta)
  values (
    auth.uid(),
    'listing.terbit',
    'listing',
    new.id,
    jsonb_build_object(
      'nama', new.nama,
      'grade', new.grade,
      'berat_kg', new.berat_kg,
      'harga_per_kg', new.harga_per_kg
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_audit_listing on public.listings;
create trigger trg_audit_listing
  after insert on public.listings
  for each row execute function public.catat_audit_listing();

/*
 * Harga acuan diperbarui cron, bukan manusia, jadi `auth.uid()` di sini
 * biasanya null — dan layar audit memang menampilkannya sebagai "Sistem".
 * Itu bukan kekurangan: yang ingin dijawab jejak ini adalah "kapan angka
 * acuannya berubah, dari berapa ke berapa", bukan siapa yang menekan tombol.
 */
create or replace function public.catat_audit_harga()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.harga is distinct from old.harga then
    insert into public.audit_log (aktor_id, aksi, entitas, entitas_id, meta)
    values (
      auth.uid(),
      'harga_acuan.ubah',
      'harga_acuan',
      new.komoditas,
      jsonb_build_object('dari', old.harga, 'ke', new.harga, 'sumber', new.sumber)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_harga on public.harga_acuan;
create trigger trg_audit_harga
  after update on public.harga_acuan
  for each row execute function public.catat_audit_harga();

revoke execute on function public.catat_audit_pesanan()  from public, anon, authenticated;
revoke execute on function public.catat_audit_grading()  from public, anon, authenticated;
revoke execute on function public.catat_audit_listing()  from public, anon, authenticated;
revoke execute on function public.catat_audit_harga()    from public, anon, authenticated;
