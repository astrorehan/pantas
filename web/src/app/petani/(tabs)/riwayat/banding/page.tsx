"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, GitCompareArrows, Minus } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { LaporanGradingView } from "@/components/laporan-grading";
import {
  ButtonLink,
  Card,
  EmptyState,
  GradeMark,
  SectionLabel,
  Skeleton,
  cx,
} from "@/components/ui";
import { URUT_GRADE, getGradingDetail } from "@/lib/data";
import type { RiwayatItem } from "@/lib/data";
import { persen } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Grade, LaporanGrading } from "@/lib/types";
import { useTranslations } from "@/lib/i18n";

interface Sisi {
  item: RiwayatItem;
  hasil: LaporanGrading;
}

function fmtTanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Delta({ nilai, grade }: { nilai: number; grade?: Grade }) {
  const t = useTranslations("riwayat");
  const poin = Math.round(nilai * 100);
  if (poin === 0) {
    return (
      <span className="type-body-sm tnum inline-flex items-center gap-1 text-muted">
        <Minus aria-hidden className="size-3" />
        <span className="sr-only">{t("no_change")}</span>0 {t("points", { val: 0 })}
      </span>
    );
  }
  const membaik =
    grade === "REJECT" || grade === "C" ? poin < 0 : grade ? poin > 0 : poin > 0;
  return (
    <span
      className={cx(
        "type-body-sm tnum font-bold",
        membaik ? "text-brand" : "text-danger",
      )}
    >
      {poin > 0 ? "+" : ""}
      {t("points", { val: poin })}
    </span>
  );
}

function MemuatBanding() {
  const t = useTranslations("riwayat");
  return (
    <>
      <BackBar
        title={t("banding_title")}
        href="/petani/riwayat"
        parentLabel={t("parent_riwayat")}
      />
      <main className="flex-1 py-4">
        <Container className="flex flex-col gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </Container>
      </main>
    </>
  );
}

export default function BandingPage() {
  return (
    <Suspense fallback={<MemuatBanding />}>
      <Banding />
    </Suspense>
  );
}

function Banding() {
  const params = useSearchParams();
  const store = useStore();
  const t = useTranslations("riwayat");
  const a = params.get("a") ?? "";
  const b = params.get("b") ?? "";
  const [kiri, setKiri] = useState<Sisi | null>(null);
  const [kanan, setKanan] = useState<Sisi | null>(null);
  const [selesai, setSelesai] = useState(false);

  useEffect(() => {
    let batal = false;
    void (async () => {
      const ambil = async (id: string): Promise<Sisi | null> => {
        if (!id) return null;
        const dariDb = await getGradingDetail(id);
        if (dariDb) return dariDb;
        const lokal = store.scans.find((s) => s.id === id);
        if (!lokal?.hasil) return null;
        return {
          item: {
            id: lokal.id,
            tanggal: lokal.tanggal,
            komoditas: lokal.komoditas ?? "",
            komoditas_label: lokal.komoditas_label,
            grade_dominan: lokal.grade_dominan,
            objek: lokal.objek,
            gambar: lokal.gambar,
            skor: lokal.skor,
            foto: lokal.foto,
            hash_audit: lokal.hash_audit,
          },
          hasil: lokal.hasil,
        };
      };
      const [x, y] = await Promise.all([ambil(a), ambil(b)]);
      if (batal) return;
      setKiri(x);
      setKanan(y);
      setSelesai(true);
    })();
    return () => {
      batal = true;
    };
  }, [a, b, store.scans]);

  if (!selesai) {
    return (
      <>
        <BackBar
          title={t("banding_title")}
          href="/petani/riwayat"
          parentLabel={t("parent_riwayat")}
        />
        <main className="flex-1 py-4">
          <Container className="flex flex-col gap-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </Container>
        </main>
      </>
    );
  }

  if (!kiri || !kanan) {
    return (
      <>
        <BackBar
          title={t("banding_title")}
          href="/petani/riwayat"
          parentLabel={t("parent_riwayat")}
        />
        <main className="flex-1 py-4">
          <Container>
            <EmptyState
              icon={<GitCompareArrows />}
              title={t("incomplete_title")}
              description={t("incomplete_desc")}
              action={
                <ButtonLink href="/petani/riwayat" size="lg">
                  {t("back_to_riwayat")}
                </ButtonLink>
              }
            />
          </Container>
        </main>
      </>
    );
  }

  const komposisiKiri = kiri.hasil.ringkasan_batch.komposisi;
  const komposisiKanan = kanan.hasil.ringkasan_batch.komposisi;
  const bedaKomoditas = kiri.item.komoditas !== kanan.item.komoditas;

  const deltaSkor =
    kanan.hasil.ringkasan_batch.skor_keseragaman -
    kiri.hasil.ringkasan_batch.skor_keseragaman;

  return (
    <>
      <BackBar
        title={t("banding_title")}
        href="/petani/riwayat"
        parentLabel={t("parent_riwayat")}
      />

      <main className="flex-1 py-4">
        <Container className="flex flex-col gap-4">
          <div>
            <h1 className="type-heading-lg text-ink">
              {kiri.item.komoditas_label}
              <ArrowRight aria-hidden className="mx-2 inline size-5 text-muted" />
              {kanan.item.komoditas_label}
            </h1>
            <p className="type-body-sm pt-1 text-muted">
              {fmtTanggal(kiri.item.tanggal)} {t("compared_with", { date: fmtTanggal(kanan.item.tanggal) })}
            </p>
            {bedaKomoditas && (
              <p className="type-body-sm pt-1 text-grade-b">
                {t("diff_commodities")}
              </p>
            )}
          </div>

          <Card className="p-4">
            <SectionLabel>{t("grade_diff_title")}</SectionLabel>
            <ul className="flex flex-col gap-2 pt-3">
              {URUT_GRADE.map((g) => {
                const kir = komposisiKiri[g] ?? 0;
                const kan = komposisiKanan[g] ?? 0;
                return (
                  <li
                    key={g}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3"
                  >
                    <GradeMark grade={g} className="size-2.5" />
                    <span className="type-body-md font-bold text-ink">
                      Grade {g}
                    </span>
                    <span className="type-body-sm tnum text-muted">
                      {Math.round(kir * 100)}%
                    </span>
                    <ArrowRight aria-hidden className="size-4 text-muted" />
                    <span className="type-body-sm tnum flex items-center gap-2 justify-self-end text-ink">
                      {Math.round(kan * 100)}%
                      <Delta nilai={kan - kir} grade={g} />
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 grid gap-2 border-t border-line pt-3 sm:grid-cols-2">
              <p className="type-body-sm tnum text-muted">
                {t("objects_diff", { a: kiri.item.objek, b: kanan.item.objek })}
              </p>
              <p className="type-body-sm tnum flex items-center gap-2 text-muted sm:justify-self-end">
                {t("uniformity_diff", {
                  a: persen(kiri.hasil.ringkasan_batch.skor_keseragaman),
                  b: persen(kanan.hasil.ringkasan_batch.skor_keseragaman),
                })}
                <Delta nilai={deltaSkor} />
              </p>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-2">
              <SectionLabel>
                {t("scan_a_title", { date: fmtTanggal(kiri.item.tanggal) })}
              </SectionLabel>
              <LaporanGradingView laporan={kiri.hasil} />
            </div>
            <div className="flex flex-col gap-2">
              <SectionLabel>
                {t("scan_b_title", { date: fmtTanggal(kanan.item.tanggal) })}
              </SectionLabel>
              <LaporanGradingView laporan={kanan.hasil} />
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
