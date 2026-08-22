/**
 * Demo credentials (F-03).
 *
 * Deliberately public: the guidebook recommends supplying judge accounts, and
 * these same strings appear in the repository README and on the last slide of
 * the pitch deck. Single source of truth so `/demo`, the README, and
 * `supabase/seed_demo.sql` cannot drift apart.
 *
 * The account rows are created by `supabase/seed_demo.sql`; nothing here
 * creates them, so a project without that seed applied will show a failed
 * sign-in rather than a silent auto-signup.
 *
 * Only what a screen cannot translate lives here — role, e-mail, where the
 * sign-in lands. Every user-visible string (role label, location, the three
 * bullet points) comes from the `demo` message namespace instead; the copies
 * that used to sit in this file went dead the moment the cards started reading
 * `t()`, and dead copy is exactly the kind that keeps claiming counts the seed
 * no longer produces.
 */
import type { Role } from "./types";

export const DEMO_PASSWORD = "demo1234";

export interface AkunDemo {
  role: Role;
  email: string;
  /** Matches the `nama` written by `seed_demo.sql` for the same account. */
  nama: string;
  tujuan: string;
  userId: string;
  lokasi: string;
}

export const AKUN_DEMO: AkunDemo[] = [
  {
    role: "petani",
    email: "petani@demo.pantas.id",
    nama: "Pak Warsono",
    tujuan: "/petani",
    userId: "a0000000-0000-4000-a000-000000000001",
    lokasi: "Pakem, Sleman, DI Yogyakarta",
  },
  {
    role: "pembeli",
    email: "pembeli@demo.pantas.id",
    nama: "Rina Pradita",
    tujuan: "/pembeli",
    userId: "b0000000-0000-4000-b000-000000000001",
    lokasi: "Gondokusuman, Kota Yogyakarta",
  },
  {
    role: "admin",
    email: "admin@demo.pantas.id",
    // Sama persis dengan baris seed_demo.sql: kartu yang menyebut nama lain
    // dari nama akunnya sendiri membuat layar akun tampak salah data. "Budi"
    // juga sudah dipakai petani Pak Budi Santosa di seed yang sama.
    nama: "Admin Koperasi PANTAS",
    tujuan: "/admin",
    userId: "c0000000-0000-4000-c000-000000000001",
    lokasi: "Pusat Konsolidasi PANTAS, Sleman",
  },
];

export const DEMO_USERS = {
  petani: AKUN_DEMO[0],
  pembeli: AKUN_DEMO[1],
  admin: AKUN_DEMO[2],
};

/**
 * Nomor langkah skrip demo (F-110), dalam urutan tayang.
 *
 * Isinya — waktu, judul, penjelasan — ada di kunci `script_s1..s6`. Versi
 * sebelumnya memetakan indeks larik ke `script_m1..m5` sementara kamus
 * menyimpan dua skrip berbeda yang tertimbun di ruang kunci yang sama, jadi
 * stempel waktunya tayang berurutan 0:00 → 1:00 → 2:00 → 0:30 → 1:00.
 */
export const SKRIP_DEMO = [1, 2, 3, 4, 5, 6] as const;
