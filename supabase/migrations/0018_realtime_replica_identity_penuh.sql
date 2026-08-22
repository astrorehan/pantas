-- PANTAS — Migrasi 0018: Realtime yang benar-benar sampai ke layar seberang
--
-- Migrasi 0013 memasukkan `orders` ke publikasi `supabase_realtime` dan
-- menyimpulkan: "Identitas replika bawaan (kunci primer) sudah cukup: klien
-- hanya memerlukan baris `new`". Kesimpulan itu benar tentang klien dan salah
-- tentang servernya.
--
-- Untuk tabel ber-RLS, Realtime tidak hanya meneruskan baris. Ia mengevaluasi
-- policy select tabel itu terhadap rekaman WAL sebelum memutuskan pelanggan
-- mana yang boleh menerimanya — dan pada UPDATE, evaluasi itu menyentuh
-- rekaman *lama* juga. Dengan `replica identity default`, rekaman lama di WAL
-- hanya berisi kunci primer: `pembeli_id` dan `petani_id` datang sebagai NULL,
-- `auth.uid() = NULL` bernilai false, dan peristiwanya dibuang diam-diam.
--
-- Gejalanya persis yang membuat ini sulit dilacak: kanal melapor `SUBSCRIBED`,
-- soketnya hidup, binding-nya dapat id dari server, slot replikasinya aktif
-- dengan lag beberapa byte — dan tidak satu pun perubahan pernah tiba. Kedua
-- layar tetap butuh muat ulang manual, persis yang hendak dihapus 0013.
--
-- `full` membuat seluruh tuple lama ikut ditulis ke WAL, jadi policy-nya bisa
-- dievaluasi utuh. Ongkosnya volume WAL per UPDATE, dan pada tabel sekecil ini
-- — puluhan baris, beberapa tulisan per menit — itu tidak berarti apa-apa
-- dibanding dua orang yang berdiri berhadapan sambil membaca dua kenyataan
-- berbeda tentang transaksi yang sama.
alter table public.orders    replica identity full;
alter table public.penawaran replica identity full;

-- `pesan` ikut: badge "belum dibaca" dan gelembung chat punya masalah yang
-- sama begitu sebuah pesan ditandai terbaca lewat UPDATE.
alter table public.pesan     replica identity full;
