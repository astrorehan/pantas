import { Container } from "@/components/container";
import {
  KOMODITAS_DEFAULT,
  URUT_GRADE,
  getRekomendasiHarga,
  paramKeKomposisi,
} from "@/lib/data";
import type { Grade } from "@/lib/types";
import HargaForm, {
  HargaBackBar,
  type RekomendasiLot,
} from "./harga-form";

export const metadata = { title: "Rekomendasi Harga Wajar" };

export default async function HargaPage({
  searchParams,
}: {
  searchParams: Promise<{
    komoditas?: string;
    grade?: string;
    skor?: string;
    komposisi?: string;
    /** Ke mana tombol kembali menuju — layar hasil, atau arsip riwayat. */
    dari?: string;
    /** Baris `gradings` batch ini, bila dibuka dari arsip riwayat. */
    grading?: string;
    /** URL foto batch, bila dibuka dari arsip riwayat. */
    gambar?: string;
    /** Butir yang dinilai engine — ukuran sampel di balik komposisi. */
    objek?: string;
    /** Perkiraan berat isi foto dalam kg, bila laporannya punya. */
    sampel?: string;
  }>;
}) {
  // Layar hasil meneruskan konteks batch lewat query string; tanpa itu
  // (buka langsung) rekomendasi memakai batch demo.
  const p = await searchParams;
  const skor = Number(p.skor);
  const komposisiBatch = paramKeKomposisi(p.komposisi);
  const rec = await getRekomendasiHarga({
    komoditas: p.komoditas,
    // Komposisi lebih dipilih daripada pasangan grade+skor: bobot grade batch
    // ditimbang seluruh komposisinya, dan dua angka itu tidak cukup untuk
    // menghitungnya.
    komposisi: komposisiBatch ?? undefined,
    grade: URUT_GRADE.includes(p.grade as Grade)
      ? (p.grade as Grade)
      : undefined,
    skor: Number.isFinite(skor) ? skor : undefined,
  });

  /**
   * Harga per grade untuk petani yang memilah panennya.
   *
   * Skornya dihitung dari komposisi lot itu sendiri — satu lot berisi grade A
   * saja bernilai skor 1,0, bukan skor batch campurnya. Memakai skor campur di
   * sini akan menghukum lot A hanya karena batch asalnya juga berisi C.
   */
  const komposisi = komposisiBatch;
  const perGrade: RekomendasiLot[] = komposisi
    ? await Promise.all(
        URUT_GRADE.filter((g) => (komposisi[g] ?? 0) > 0).map(async (grade) => {
          const r = await getRekomendasiHarga({
            komoditas: p.komoditas,
            komposisi: { [grade]: 1 },
          });
          return {
            grade,
            porsi: komposisi[grade] ?? 0,
            label: r.grade_dominan_label,
            min: r.min,
            max: r.max,
            pengali: r.pengali,
          };
        }),
      )
    : [];

  /* Hanya jalur internal yang diterima. `dari` datang dari query string, dan
     query string bisa ditulis siapa saja — sebuah URL absolut di sana mengubah
     tombol "kembali" jadi tautan keluar yang menyamar sebagai navigasi dalam
     aplikasi. */
  const dari =
    p.dari && p.dari.startsWith("/") && !p.dari.startsWith("//")
      ? p.dari
      : "/petani/hasil";

  /* Foto yang akan menempel di listing ikut datang lewat query string, jadi ia
     diperlakukan sama waspadanya: hanya http/https yang diterima, supaya
     `javascript:` atau `data:` tidak pernah sampai ke atribut `src`. */
  const gambarBatch =
    p.gambar && /^https?:\/\//i.test(p.gambar) ? p.gambar : undefined;

  /* Ukuran sampel di balik komposisi. Layar ini menanyakan berat sekarung
     panen, sementara mutunya dinilai dari butir yang muat di dalam satu foto;
     tanpa kedua angka ini layar tidak bisa menyebutkan jarak di antaranya —
     dan selama ini memang tidak pernah menyebutkannya. */
  const objekSampel = Math.max(0, Math.trunc(Number(p.objek)) || 0);
  const sampelKg = Number(p.sampel);

  return (
    <>
      <HargaBackBar href={dari} />

      <main className="flex-1 py-4">
        <Container>
          <HargaForm
            rec={rec}
            komoditas={p.komoditas ?? KOMODITAS_DEFAULT}
            komposisi={komposisi}
            perGrade={perGrade}
            gradingId={p.grading}
            gambarBatch={gambarBatch}
            objekSampel={objekSampel}
            sampelKg={
              Number.isFinite(sampelKg) && sampelKg > 0 ? sampelKg : undefined
            }
          />
        </Container>
      </main>
    </>
  );
}
