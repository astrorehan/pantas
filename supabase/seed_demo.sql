-- PANTAS — seed akun & data demo (F-03).
--
-- Jalankan sekali per proyek: Supabase SQL Editor, atau `psql -f` dengan
-- kredensial postgres. Idempoten — aman dijalankan ulang.
--
-- Geografi: seluruh titik berada di Daerah Istimewa Yogyakarta (keputusan Q-6).
-- Sentra hortikultura lereng Merapi (Pakem, Cangkringan, Turi), Kulon Progo,
-- dan Bantul, dengan pembeli industri di kota Yogyakarta. Seed Bandung/Lembang
-- yang lama diganti: konsolidasi rute (F-51) hanya terlihat masuk akal bila
-- titik jemputnya benar-benar berdekatan dan klasternya nyata sebagai sentra
-- sayuran.
--
-- Kredensial (sengaja publik — dicantumkan di README & pitch deck):
--   petani@demo.pantas.id  / demo1234
--   pembeli@demo.pantas.id / demo1234
--   admin@demo.pantas.id   / demo1234
--
-- Akun admin/koperasi hanya bisa lahir dari berkas ini: sejak migrasi 0008
-- pendaftaran mandiri lewat /masuk tidak pernah menghasilkan peran admin.

-- ---------------------------------------------------------------------------
-- 1. Pengguna auth
--
-- Lima petani dan satu pembeli. Hanya dua yang punya password: petani &
-- pembeli demo. Sisanya adalah pemasok lain di katalog — mereka butuh baris
-- auth.users karena profiles.id ber-FK ke sana, tapi tidak perlu bisa masuk.
-- ---------------------------------------------------------------------------
do $$
declare
  v_akun record;
begin
  for v_akun in
    select * from (values
      ('a0000000-0000-4000-a000-000000000001'::uuid, 'petani@demo.pantas.id',  'Pak Warsono',            'petani',  true),
      ('a0000000-0000-4000-a000-000000000002'::uuid, 'karsih@demo.pantas.id',  'Bu Karsih',              'petani',  false),
      ('a0000000-0000-4000-a000-000000000003'::uuid, 'rahman@demo.pantas.id',  'Pak Rahman',             'petani',  false),
      ('a0000000-0000-4000-a000-000000000004'::uuid, 'budi@demo.pantas.id',    'Pak Budi Santosa',       'petani',  false),
      ('a0000000-0000-4000-a000-000000000005'::uuid, 'sedayu@demo.pantas.id',  'Kelompok Tani Sedayu',   'petani',  false),
      ('b0000000-0000-4000-b000-000000000001'::uuid, 'pembeli@demo.pantas.id', 'Rina Pradita',           'pembeli', true),
      ('c0000000-0000-4000-c000-000000000001'::uuid, 'admin@demo.pantas.id',   'Admin Koperasi PANTAS',  'admin',   true)
    ) as t(id, email, nama, peran, bisa_masuk)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, email_confirmed_at,
      encrypted_password, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_akun.id,
      'authenticated', 'authenticated', v_akun.email, now(),
      -- Tanpa password, signInWithPassword tidak akan pernah berhasil untuk
      -- pemasok latar — itu memang yang diinginkan.
      case when v_akun.bisa_masuk
        then extensions.crypt('demo1234', extensions.gen_salt('bf'))
        else null end,
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('peran', v_akun.peran, 'nama', v_akun.nama),
      now() - interval '60 days', now(), '', '', '', ''
    )
    on conflict (id) do nothing;

    -- GoTrue mencari identitas provider saat masuk; tanpa baris ini akun
    -- yang disisipkan lewat SQL bisa ditolak sebagai "invalid credentials".
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at,
      created_at, updated_at
    ) values (
      v_akun.id::text, v_akun.id,
      jsonb_build_object('sub', v_akun.id::text, 'email', v_akun.email,
                         'email_verified', true),
      'email', now(), now() - interval '60 days', now()
    )
    on conflict (provider, provider_id) do nothing;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Profil — trigger handle_new_user sudah membuat barisnya; di sini kita
--    lengkapi lokasi, koordinat, dan penanda demo.
--
--    `do update` pada peran, bukan `do nothing`: sejak 0008 trigger menurunkan
--    peran apa pun di luar petani/pembeli, jadi baris admin yang dibuatnya
--    berisi 'pembeli'. Peran koperasi memang hanya boleh diberikan dari jalur
--    SQL/service role seperti berkas ini, dan di sinilah pemberiannya.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, peran, nama, is_demo)
select id,
       coalesce(raw_user_meta_data ->> 'peran', 'petani'),
       coalesce(raw_user_meta_data ->> 'nama', 'Pengguna PANTAS'),
       true
from auth.users
where email like '%@demo.pantas.id'
on conflict (id) do update set
  peran   = excluded.peran,
  nama    = excluded.nama,
  is_demo = true;

update public.profiles p set
  is_demo = true,
  lokasi  = d.lokasi,
  alamat  = d.alamat,
  lat     = d.lat,
  lng     = d.lng,
  rating  = d.rating,
  transaksi = d.transaksi
from (values
  ('a0000000-0000-4000-a000-000000000001'::uuid, 'Pakem, Sleman',
   'Kebun Warsono, Jl. Kaliurang KM 17, Hargobinangun, Pakem', -7.6497, 110.4210, 4.8, 96),
  ('a0000000-0000-4000-a000-000000000002'::uuid, 'Turi, Sleman',
   'Greenhouse Karsih Tani, Donokerto, Turi', -7.6180, 110.3520, 4.6, 61),
  ('a0000000-0000-4000-a000-000000000003'::uuid, 'Cangkringan, Sleman',
   'Kebun Organik Merapi Asri, Wukirsari, Cangkringan', -7.6350, 110.4530, 4.9, 120),
  ('a0000000-0000-4000-a000-000000000004'::uuid, 'Kalibawang, Kulon Progo',
   'Kelompok Tani Budi Makmur, Banjararum, Kalibawang', -7.7350, 110.2200, 4.7, 88),
  ('a0000000-0000-4000-a000-000000000005'::uuid, 'Sedayu, Bantul',
   'Kelompok Tani Sedayu Sejahtera, Argomulyo, Sedayu', -7.8280, 110.2760, 4.4, 55),
  ('b0000000-0000-4000-b000-000000000001'::uuid, 'Umbulharjo, Yogyakarta',
   'CV Saus Nusantara, Jl. Veteran No. 88, Umbulharjo, Yogyakarta', -7.7956, 110.3695, 4.9, 34),
  ('c0000000-0000-4000-c000-000000000001'::uuid, 'Kota Yogyakarta, DIY',
   'Kantor Koperasi PANTAS, Jl. Kenari, Muja Muju, Umbulharjo, Yogyakarta', -7.7995, 110.3920, 5.0, 0)
) as d(id, lokasi, alamat, lat, lng, rating, transaksi)
where p.id = d.id;

-- ---------------------------------------------------------------------------
-- 3. Harga acuan — HARGA DI TINGKAT PETANI (farm gate), bukan harga eceran.
--
--    Versi sebelumnya mengisi kolom ini dengan harga konsumen dan menandainya
--    'PIHPS DIY'. Dua cacat sekaligus: (a) pengali kualitas tertinggi di
--    §14.1 hanya 1,06, jadi petani grade A disarankan menjual seharga ~106%
--    harga konsumen — kira-kira dua kali lipat yang bisa ia dapat; (b) angkanya
--    tidak pernah ditarik dari PIHPS, jadi labelnya klaim yang tidak benar dan
--    tampil begitu saja di layar harga petani.
--
--    Rumus §14.1 tidak diubah. Yang keliru bukan pengalinya, melainkan level
--    pasar acuannya.
--
--    Kolom `sumber` sengaja berbeda antar baris karena bukti pendukungnya
--    memang berbeda:
--      - Cabai merah besar/keriting/rawit — rata-rata harga produsen nasional
--        2025 dari Open Data Badan Pangan Nasional, dataset "Rata-rata Harga
--        Pangan Bulanan Tingkat Produsen Nasional". Tersitasi.
--      - Tomat, timun, wortel, cabai hijau — bukan pangan pokok strategis
--        nasional, jadi tidak ada angka produsen resmi yang bisa dikutip.
--        Nilainya estimasi, dan kolom `sumber` menyatakannya demikian.
--    Q-8 masih terbuka: begitu ada feed harga produsen tingkat DIY, ganti
--    baris estimasi beserta sumbernya.
-- ---------------------------------------------------------------------------
insert into public.harga_acuan (komoditas, label, harga, sumber) values
  ('tomato',               'Tomat',                  5000, 'Estimasi kalibrasi PANTAS, tingkat petani'),
  ('tomato_sayur',         'Tomat Sayur',            5000, 'Estimasi kalibrasi PANTAS, tingkat petani'),
  ('tomato_beef',          'Tomat Beef',             4800, 'Estimasi kalibrasi PANTAS, tingkat petani'),
  ('tomato_ceri',          'Tomat Ceri',            11000, 'Estimasi kalibrasi PANTAS, tingkat petani'),
  ('tomato_merah',         'Tomat Merah',            5200, 'Estimasi kalibrasi PANTAS, tingkat petani'),
  ('chili',                'Cabai',                 34000, 'Bapanas, harga produsen nasional 2025'),
  ('chili_rawit',          'Cabai Rawit Merah',     52000, 'Bapanas, harga produsen nasional 2025'),
  ('chili_merah_besar',    'Cabai Merah Besar',     34000, 'Bapanas, harga produsen nasional 2025'),
  ('chili_merah_keriting', 'Cabai Merah Keriting',  30000, 'Bapanas, harga produsen nasional 2025'),
  ('chili_hijau_besar',    'Cabai Hijau Besar',     18000, 'Estimasi kalibrasi PANTAS, tingkat petani'),
  ('cucumber',             'Timun',                  3500, 'Estimasi kalibrasi PANTAS, tingkat petani'),
  ('cucumber_lokal',       'Timun Lokal',            3500, 'Estimasi kalibrasi PANTAS, tingkat petani'),
  ('cucumber_baby',        'Timun Baby',             6500, 'Estimasi kalibrasi PANTAS, tingkat petani'),
  ('carrot',               'Wortel',                 6000, 'Estimasi kalibrasi PANTAS, tingkat petani')
on conflict (komoditas) do update
  set label = excluded.label,
      harga = excluded.harga,
      sumber = excluded.sumber,
      updated_at = now();

-- ---------------------------------------------------------------------------
-- 4. reset_demo() — memulihkan data transaksional demo ke keadaan awal.
--
-- Dipanggil oleh POST /api/demo/reset (service role) tiap 6 jam selama jendela
-- penjurian, supaya juri berikutnya melihat dashboard yang sama dengan juri
-- pertama. Pengguna auth & profil tidak disentuh — hanya listing, grading, dan
-- pesanan.
-- ---------------------------------------------------------------------------
create or replace function public.reset_demo()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_warsono uuid := 'a0000000-0000-4000-a000-000000000001';
  v_karsih  uuid := 'a0000000-0000-4000-a000-000000000002';
  v_rahman  uuid := 'a0000000-0000-4000-a000-000000000003';
  v_budi    uuid := 'a0000000-0000-4000-a000-000000000004';
  v_sedayu  uuid := 'a0000000-0000-4000-a000-000000000005';
  v_rina    uuid := 'b0000000-0000-4000-b000-000000000001';
  v_demo    uuid[];
  v_i       integer;
  v_hari    integer;
  v_a       numeric;
  v_b       numeric;
  v_c       numeric;
  v_r       numeric;
  v_grade   text;
  v_kom     text;
  v_label   text;
  v_gambar  text;
  v_objek   integer;
begin
  v_demo := array[v_warsono, v_karsih, v_rahman, v_budi, v_sedayu, v_rina];

  -- Urutan penting: orders ber-FK ke listings, dan penawaran ber-FK ke
  -- keduanya. `penawaran` dihapus lebih dulu dan secara eksplisit: FK-nya ke
  -- orders adalah `on delete set null`, jadi menghapus pesanan lebih dulu
  -- meninggalkan penawaran berstatus 'diterima' tanpa pesanan — persis keadaan
  -- cacat yang diperbaiki migrasi 0017, dibangkitkan ulang oleh reset sendiri.
  delete from public.penawaran where petani_id = any(v_demo) or pembeli_id = any(v_demo);
  delete from public.orders   where petani_id = any(v_demo) or pembeli_id = any(v_demo);
  delete from public.gradings where petani_id = any(v_demo);
  delete from public.listings where petani_id = any(v_demo);

  -- ---- Listing katalog -----------------------------------------------------
  -- Hanya tomat & cabai: itu satu-satunya komoditas yang punya foto asli di
  -- public/img. Menempelkan foto kentang pada listing wortel akan membuat
  -- katalog yang dinilai juri berisi klaim visual yang salah — timun & wortel
  -- masuk setelah fotonya ada.
  --
  -- ⚠ `harga_per_kg` tiap listing wajib jatuh di dalam rentang wajarnya
  -- sendiri: `harga_acuan[komoditas] × pengali(komposisi)`, lalu −7% / +8%
  -- (`web/src/lib/harga.ts`). Angka di bawah dipilih di sekitar tengah rentang,
  -- jadi ada ruang bila acuan bergeser sedikit.
  --
  -- Versi sebelumnya memakai harga eceran pasar (11.200 untuk tomat sayur
  -- grade B) sementara `harga_acuan` sudah tingkat petani (5.000): 10 dari 12
  -- listing terbaca "Di atas rentang", yaitu seluruh katalog yang dinilai juri
  -- menuduh petaninya sendiri memasang harga tidak wajar. Sesudah mengubah
  -- baris `harga_acuan` di atas, hitung ulang blok ini — keduanya satu paket.
  insert into public.listings
    (id, petani_id, nama, komoditas, grade, berat_kg, harga_per_kg, gambar,
     satuan, stok_kg, panen_terakhir, komposisi, catatan_ai, created_at)
  values
    -- Milik petani demo (Pak Warsono) — 6 listing, dashboardnya terisi.
    ('PNT-L-0401', v_warsono, 'Tomat Sayur Pakem', 'tomato_sayur', 'B', 320, 4100,
     '/img/tomat.jpg', 'kg', 320, 'Hari ini, 06.00 WIB',
     '{"A":0.14,"B":0.57,"C":0.29}',
     'Kematangan merata dan kulit tebal — tahan pengiriman 3–5 hari. Dua butir undersize masuk kelas ekonomis, bukan dibuang.',
     now() - interval '6 hours'),
    ('PNT-L-0402', v_warsono, 'Tomat Beef Rumah Kaca', 'tomato_beef', 'A', 180, 4600,
     '/img/tomat-rumahkaca.jpg', 'kg', 180, 'Kemarin, 15.30 WIB',
     '{"A":0.40,"B":0.60}',
     'Ukuran besar dan seragam, solidity tinggi. Cocok untuk pasta dan saus industri.',
     now() - interval '1 day'),
    ('PNT-L-0403', v_warsono, 'Cabai Rawit Merah', 'chili_rawit', 'A', 140, 48000,
     '/img/cabai-rawit.jpg', 'kg', 140, 'Hari ini, 05.30 WIB',
     '{"A":0.50,"B":0.33,"C":0.17}',
     'Warna merata, tingkat kepedasan konsisten. Set validasi klasifikasi cabai masih kecil (16 gambar), jadi baca verdict patologinya sebagai indikasi awal.',
     now() - interval '10 hours'),
    ('PNT-L-0404', v_warsono, 'Cabai Merah Keriting', 'chili_merah_keriting', 'B', 260, 26000,
     '/img/cabai-pasar.jpg', 'kg', 260, '2 hari lalu',
     '{"A":0.22,"B":0.61,"C":0.17}',
     'Sebagian bengkok di atas ambang A. Cocok untuk sambal dan bumbu giling.',
     now() - interval '2 days'),
    ('PNT-L-0405', v_warsono, 'Tomat Ceri Grade C', 'tomato_ceri', 'C', 48, 7000,
     '/img/tomat-cherry.jpg', 'kg', 48, '3 hari lalu',
     '{"B":0.18,"C":0.71,"REJECT":0.11}',
     'Ukuran di bawah standar pasar segar. Diarahkan ke industri saus — tetap bernilai, bukan food loss.',
     now() - interval '3 days'),
    ('PNT-L-0406', v_warsono, 'Tomat Merah Hargobinangun', 'tomato_merah', 'B', 400, 4500,
     '/img/tomat.jpg', 'kg', 400, '4 hari lalu',
     '{"A":0.18,"B":0.64,"C":0.18}',
     'Panen bedengan bawah. Keseragaman menengah, cocok untuk pasar segar lokal.',
     now() - interval '4 days'),

    -- Pemasok lain — katalog pembeli harus terasa seperti pasar, bukan satu
    -- penjual, dan konsolidasi rute butuh titik jemput yang berbeda-beda.
    ('PNT-L-0421', v_karsih, 'Tomat Merah Turi', 'tomato_merah', 'A', 240, 5100,
     '/img/tomat.jpg', 'kg', 240, 'Hari ini, 07.00 WIB',
     '{"A":0.58,"B":0.34,"C":0.08}',
     'Panen pagi, langsung dinaungi. Keseragaman tinggi.',
     now() - interval '8 hours'),
    ('PNT-L-0422', v_rahman, 'Tomat Ceri Organik', 'tomato_ceri', 'A', 620, 11200,
     '/img/tomat-cherry.jpg', 'kg', 620, 'Hari ini, 06.00 WIB',
     '{"A":0.67,"B":0.33}',
     'Sertifikasi organik dalam proses. Ambang ukuran memakai config varian ceri.',
     now() - interval '9 hours'),
    ('PNT-L-0423', v_rahman, 'Cabai Rawit Cangkringan', 'chili_rawit', 'B', 190, 45500,
     '/img/cabai-rawit.jpg', 'kg', 190, 'Kemarin',
     '{"A":0.31,"B":0.52,"C":0.17}',
     'Ukuran campur dari dua bedengan. Sortasi ulang tidak diperlukan.',
     now() - interval '1 day 4 hours'),
    ('PNT-L-0424', v_budi, 'Cabai Merah Besar', 'chili_merah_besar', 'B', 300, 29500,
     '/img/cabai-pasar.jpg', 'kg', 300, '2 hari lalu',
     '{"A":0.24,"B":0.59,"C":0.17}',
     'Volume besar dari kelompok tani Kalibawang. Siap konsolidasi satu rute.',
     now() - interval '2 days 3 hours'),
    ('PNT-L-0425', v_budi, 'Tomat Beef Kalibawang', 'tomato_beef', 'A', 120, 4900,
     '/img/tomat-rumahkaca.jpg', 'kg', 120, 'Hari ini',
     '{"A":0.71,"B":0.29}',
     'Ukuran besar seragam untuk olahan pasta.',
     now() - interval '5 hours'),
    ('PNT-L-0426', v_sedayu, 'Tomat Sayur Sedayu', 'tomato_sayur', 'C', 540, 3100,
     '/img/tomat.jpg', 'kg', 540, '3 hari lalu',
     '{"B":0.21,"C":0.66,"REJECT":0.13}',
     'Batch akhir musim. Grade rendah tetap terserap industri olahan.',
     now() - interval '3 days 6 hours');

  -- ---- Riwayat pindai petani demo -----------------------------------------
  -- 12 entri, dibangkitkan berpola supaya berkasnya tetap terbaca. Komposisi
  -- bergerak turun lalu naik lagi, jadi grafik tren di /dampak punya bentuk
  -- yang bisa dibicarakan, bukan garis datar.
  for v_i in 0..11 loop
    v_hari := v_i * 3 + 1;
    v_a := round((0.12 + 0.035 * ((v_i * 5) % 9))::numeric, 3);
    v_b := round((0.62 - 0.02 * ((v_i * 3) % 7))::numeric, 3);
    v_c := round((1.0 - v_a - v_b) * 0.72, 3);
    v_r := round(1.0 - v_a - v_b - v_c, 3);
    v_grade := case when v_a > v_b then 'A' when v_c > v_b then 'C' else 'B' end;

    select k.kom, k.label, k.gambar into v_kom, v_label, v_gambar
    from (values
      ('tomato_sayur', 'Tomat Sayur',        '/img/tomat.jpg'),
      ('tomato_beef',  'Tomat Beef',         '/img/tomat-rumahkaca.jpg'),
      ('chili_rawit',  'Cabai Rawit Merah',  '/img/cabai-rawit.jpg'),
      ('tomato_ceri',  'Tomat Ceri',         '/img/tomat-cherry.jpg')
    ) as k(kom, label, gambar)
    offset (v_i % 4) limit 1;

    v_objek := 5 + (v_i % 6);

    insert into public.gradings
      (petani_id, komoditas, komoditas_label, grade_dominan, objek_terdeteksi,
       hasil, hash_audit, gambar_url, created_at)
    values (
      v_warsono, v_kom, v_label, v_grade, v_objek,
      jsonb_build_object(
        'status', 'success',
        'komoditas', v_kom,
        'objek_terdeteksi', v_objek,
        'kalibrasi', jsonb_build_object(
          'referensi', 'koin_500',
          -- Satu dari empat pindaian gagal kalibrasi, mendekati angka nyata di
          -- lapangan (target §22.2: >70% berhasil). Layar hasil harus jujur
          -- soal ini, jadi datanya harus mengandung kasusnya.
          'px_per_mm2', case when v_i % 4 = 3 then 0 else round((7.2 + 0.4 * v_i)::numeric, 2) end,
          'valid', v_i % 4 <> 3
        ),
        'ringkasan_batch', jsonb_build_object(
          'komposisi', jsonb_strip_nulls(jsonb_build_object(
            'A', v_a, 'B', v_b, 'C', v_c,
            'REJECT', case when v_r > 0.005 then v_r else null end
          )),
          'skor_keseragaman', round((0.68 + 0.02 * ((v_i * 4) % 8))::numeric, 2)
        ),
        'objek', '[]'::jsonb,
        -- Payload demo tidak menerbitkan hash: hash audit adalah janji bahwa
        -- satu payload berasal dari satu eksekusi pipeline nyata.
        'hash_audit', ''
      ),
      null, v_gambar, now() - (v_hari || ' days')::interval
    );
  end loop;

  -- ---- Pesanan -------------------------------------------------------------
  -- Delapan pesanan menyentuh petani demo; pembeli demo memegang tujuh
  -- demo, jadi kedua dashboard terisi dari satu himpunan yang konsisten.
  --
  -- `harga_per_kg` tiap baris wajib sama dengan listing yang ditunjuk
  -- `listing_id`, dan `total` = `berat_kg × harga_per_kg`. Pesanan adalah
  -- rekaman harga saat transaksi: begitu keduanya berbeda, layar pesanan dan
  -- layar katalog menyebut angka berbeda untuk lot yang sama.
  insert into public.orders
    (id, kode, listing_id, pembeli_id, petani_id, status, nama, grade,
     berat_kg, harga_per_kg, total, created_at)
  values
    ('PNT-0501', 'PNT-KX7M-42', 'PNT-L-0401', v_rina, v_warsono, 'selesai',
     'Tomat Sayur Pakem', 'B', 180, 4100, 738000, now() - interval '21 days'),
    ('PNT-0502', 'PNT-QW3T-18', 'PNT-L-0402', v_rina, v_warsono, 'selesai',
     'Tomat Beef Rumah Kaca', 'A', 120, 4600, 552000, now() - interval '14 days'),
    ('PNT-0503', 'PNT-HN9B-63', 'PNT-L-0405', v_rina, v_warsono, 'selesai',
     'Tomat Ceri Grade C', 'C', 44, 7000, 308000, now() - interval '9 days'),
    ('PNT-0504', 'PNT-RD5K-27', 'PNT-L-0403', v_rina, v_warsono, 'serah_terima',
     'Cabai Rawit Merah', 'A', 60, 48000, 2880000, now() - interval '2 days'),
    ('PNT-0505', 'PNT-TM8P-51', 'PNT-L-0404', v_rina, v_warsono, 'dikonfirmasi',
     'Cabai Merah Keriting', 'B', 150, 26000, 3900000, now() - interval '1 day'),
    ('PNT-0506', 'PNT-VC2N-39', 'PNT-L-0406', v_rahman, v_warsono, 'dipesan',
     'Tomat Merah Hargobinangun', 'B', 200, 4500, 900000, now() - interval '5 hours'),
    ('PNT-0507', 'PNT-JF6Y-74', 'PNT-L-0401', v_karsih, v_warsono, 'selesai',
     'Tomat Sayur Pakem', 'B', 90, 4100, 369000, now() - interval '30 days'),
    ('PNT-0508', 'PNT-LB4Q-85', 'PNT-L-0402', v_budi, v_warsono, 'dikonfirmasi',
     'Tomat Beef Rumah Kaca', 'A', 55, 4600, 253000, now() - interval '3 days'),
    -- Pesanan pembeli demo ke pemasok lain, supaya katalognya tidak terasa
    -- seperti hubungan satu-lawan-satu.
    ('PNT-0509', 'PNT-ZP7C-16', 'PNT-L-0422', v_rina, v_rahman, 'selesai',
     'Tomat Ceri Organik', 'A', 300, 11200, 3360000, now() - interval '17 days'),
    ('PNT-0510', 'PNT-GS3W-58', 'PNT-L-0424', v_rina, v_budi, 'dipesan',
     'Cabai Merah Besar', 'B', 120, 29500, 3540000, now() - interval '7 hours');

  -- ---- Penawaran berjalan ---------------------------------------------------
  -- Tanpa baris ini tab Penawaran petani demo kosong sesudah tiap reset, dan
  -- alur inti produk — pembeli menawar, petani menerima, pesanannya lahir —
  -- tidak punya satu pun contoh untuk ditekan. Keduanya sengaja masih terbuka:
  -- yang sudah diterima tidak ditulis di sini karena `status = 'diterima'`
  -- hanya boleh lahir dari `terima_penawaran()`, yang sekaligus menerbitkan
  -- pesanannya.
  insert into public.penawaran
    (listing_id, pembeli_id, petani_id, kuantitas_kg, harga_per_kg,
     tanggal_ambil, catatan, status, kedaluwarsa_pada, created_at)
  values
    ('PNT-L-0401', v_rina, v_warsono, 150, 10900,
     (now() + interval '2 days')::date,
     'Mohon dikemas dalam peti kayu, truk kami ambil jam 09.00.',
     'terkirim', now() + interval '46 hours', now() - interval '2 hours'),
    ('PNT-L-0404', v_rina, v_warsono, 80, 39000,
     (now() + interval '1 day')::date,
     'Minta kurang sedikit harganya Pak, volume lumayan.',
     'ditawar_balik', now() + interval '24 hours', now() - interval '1 day');

  return jsonb_build_object(
    'ok', true,
    'listings', (select count(*) from public.listings where petani_id = any(v_demo)),
    'gradings', (select count(*) from public.gradings where petani_id = any(v_demo)),
    'orders',   (select count(*) from public.orders where petani_id = any(v_demo)
                                                      or pembeli_id = any(v_demo)),
    'penawaran', (select count(*) from public.penawaran where petani_id = any(v_demo)
                                                          or pembeli_id = any(v_demo)),
    'direset_pada', now()
  );
end $$;

-- Hanya service role (route handler /api/demo/reset) yang boleh memanggil ini.
revoke execute on function public.reset_demo() from public, anon, authenticated;
grant  execute on function public.reset_demo() to service_role;

select public.reset_demo();
