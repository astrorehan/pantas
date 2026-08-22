"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Inbox } from "lucide-react";
import { BrandBar } from "@/components/chrome";
import { SubNav } from "@/components/sub-nav";
import { JUAL_TABS } from "@/components/nav-config";
import { Container } from "@/components/container";
import {
  STATUS_LABEL,
  useLangkahKartu,
  useOrderStatus,
  useTanggalRingkas,
} from "@/components/order-bits";
import { Badge, Card, EmptyState, GradeBadge, cx } from "@/components/ui";
import type { BadgeTone } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import type { StatusPesanan } from "@/lib/types";

function getStatusTone(status: StatusPesanan): BadgeTone {
  switch (status) {
    case "selesai":
      return "brand";
    case "serah_terima":
      return "info";
    case "dikonfirmasi":
      return "warn";
    case "dipesan":
    default:
      return "neutral";
  }
}

export default function PesananPetaniPage() {
  const t = useTranslations("pesanan");
  const tPembeli = useTranslations("pembeli_pesanan");
  const { getStatusLabel } = useOrderStatus();
  const tanggalRingkas = useTanggalRingkas();
  const langkahKartu = useLangkahKartu();
  const store = useStore();
  const orders = store.orders;

  const [filter, setFilter] = useState<"aktif" | "selesai">("aktif");

  const aktifOrders = orders.filter((o) => o.status !== "selesai");
  const selesaiOrders = orders.filter((o) => o.status === "selesai");
  const displayedOrders = filter === "aktif" ? aktifOrders : selesaiOrders;

  const SARINGAN = [
    { value: "aktif" as const, label: tPembeli("tab_active"), count: aktifOrders.length },
    { value: "selesai" as const, label: tPembeli("tab_done"), count: selesaiOrders.length },
  ];

  return (
    <>
      <BrandBar title={t("title")} />
      <SubNav items={JUAL_TABS} label="Bagian Jual" layout="inline" />
      <main className="flex-1 py-4">
        <Container className="flex flex-col gap-4">
          {/* Pil saringan, bukan baris tab kedua.
              `SubNav` di atas sudah satu baris tab, dan menumpuk `Tabs`
              bergaya segmented tepat di bawahnya memberi dua deret kotak
              berdampingan yang tampak setara — padahal yang satu berpindah
              halaman dan yang lain hanya menyaring isi halaman ini. Bentuk pil
              adalah bentuk yang sudah dipakai saringan status di tab Listing,
              satu ketukan di sebelahnya. */}
          <div
            role="group"
            aria-label={t("filter_label")}
            className="scroll-x flex gap-2"
          >
            {SARINGAN.map(({ value, label, count }) => {
              const aktif = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => setFilter(value)}
                  className={cx(
                    "tap focus-ring type-body-md flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 font-bold sm:min-h-9",
                    aktif
                      ? "border-brand bg-brand text-on-brand"
                      : "border-line bg-surface text-muted hover:text-ink",
                  )}
                >
                  {label}
                  <span className="tnum opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {displayedOrders.length === 0 ? (
            <EmptyState
              icon={<Inbox />}
              title={t("empty_title")}
              description={t("empty_desc")}
            />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {displayedOrders.map((o) => {
                const tanggal = tanggalRingkas(o.tanggal);
                const langkah = langkahKartu(o.status, "petani");
                return (
                  // Lihat catatan pada daftar pesanan pembeli: butir grid
                  // melebar mengikuti min-content, dan teks `truncate` tidak
                  // punya titik putus.
                  <li key={o.id} className="min-w-0">
                    <Link
                      href={`/petani/pesanan/${o.id}`}
                      className="tap tap-press focus-ring block h-full rounded-md"
                    >
                      <Card variant="interactive" className="h-full p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="type-body-md truncate font-bold text-ink">
                              {o.nama}
                            </p>
                            <p className="type-body-sm truncate pt-0.5 text-muted">
                              {o.pembeli}
                            </p>
                          </div>
                          <GradeBadge grade={o.grade} size="sm" />
                        </div>

                        <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
                          <div className="flex min-w-0 flex-col items-start gap-1.5">
                            {/* Tanggal ikut di baris nomor. Tanpanya dua
                                pesanan tomat 200 kg dari pembeli yang sama
                                hanya bisa dibedakan lewat nomor acaknya. */}
                            <p className="type-body-sm tnum text-muted">
                              #{o.id} • {o.berat_kg} kg
                              {tanggal && ` • ${tanggal}`}
                            </p>
                            <Badge tone={getStatusTone(o.status)}>
                              {getStatusLabel(o.status, STATUS_LABEL[o.status])}
                            </Badge>
                          </div>
                          <p className="type-heading-sm tnum flex items-center gap-1 text-ink">
                            {formatRupiah(o.total)}
                            <ChevronRight aria-hidden className="size-4 text-label" />
                          </p>
                        </div>

                        {/* Lencana di atas menyebut keadaan; baris ini
                            menyebut pekerjaannya. Bagi petani ketiga keadaan
                            yang belum selesai semuanya berarti ada yang harus
                            ia kerjakan, jadi kalimatnya ditulis tebal. */}
                        {langkah && (
                          <p className="type-body-sm flex items-center gap-1.5 pt-3 font-bold text-brand">
                            <ArrowRight aria-hidden className="size-3.5 shrink-0" />
                            {langkah.teks}
                          </p>
                        )}
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </main>
    </>
  );
}

