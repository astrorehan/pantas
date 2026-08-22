import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Package, Truck, Wallet } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { Badge, Card, SectionLabel } from "@/components/ui";
import { Timeline } from "@/components/ui/timeline";
import type { TimelineEvent } from "@/components/ui/timeline";
import { RutePenjemputan } from "@/components/rute-penjemputan";
import { ChecklistRantaiDingin } from "@/components/checklist-rantai-dingin";
import { getPengirimanById } from "@/lib/data";
import { formatAngka, formatRupiah } from "@/lib/format";
import {
  kunciMetode,
  kunciStatus,
  langkahPengiriman,
  nadaStatus,
} from "@/lib/pengiriman-tampilan";
import { getTranslations } from "next-intl/server";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const pengiriman = await getPengirimanById(id);
  const t = await getTranslations("logistik");
  if (!pengiriman) {
    return { title: t("detail_not_found_title"), robots: { index: false } };
  }
  return {
    title: `${pengiriman.komoditas ?? t("back_title")} · ${t("back_title")}`,
    description: t("desc"),
    // Muatan satu petani bukan halaman publik; hanya `/lacak/[hash]` yang
    // memang diterbitkan.
    robots: { index: false },
  };
}

/**
 * Satu penjemputan, satu layar.
 *
 * Layar ini dulu tidak ada: `/petani/logistik` selalu merender
 * `pengirimanList[0]`, jadi petani dengan dua muatan berjalan mencentang
 * checklist rantai dingin milik muatan yang salah — dan bukti penanganan yang
 * muncul di halaman lacak ikut menempel ke batch yang salah.
 */
export default async function DetailPengirimanPage({ params }: Params) {
  const { id } = await params;
  const pengiriman = await getPengirimanById(id);
  if (!pengiriman) notFound();

  const t = await getTranslations("logistik");
  const dibatalkan = pengiriman.status === "batal";

  const langkah: TimelineEvent[] = langkahPengiriman(pengiriman.status).map(
    (l) => ({
      id: l.status,
      label: t(l.labelKey as Parameters<typeof t>[0]),
      state: l.keadaan,
    }),
  );

  const fakta = [
    {
      id: "alamat",
      label: t("pickup_address"),
      nilai: pengiriman.alamat_jemput,
      Icon: MapPin,
    },
    {
      id: "volume",
      label: t("batch_volume"),
      nilai: t("kg_unit", { val: formatAngka(pengiriman.berat_kg ?? 0) }),
      Icon: Package,
    },
    {
      id: "ongkos",
      label: t("est_cost"),
      nilai: formatRupiah(pengiriman.ongkos_estimasi ?? 0),
      Icon: Wallet,
    },
    {
      id: "metode",
      label: t("method_label"),
      nilai: t(kunciMetode(pengiriman.metode) as Parameters<typeof t>[0]),
      Icon: Truck,
    },
  ];

  return (
    <>
      <BackBar
        title={t("back_title")}
        href="/petani/logistik"
        parentLabel={t("list_heading")}
      />

      <Container className="flex flex-col gap-6 py-6 lg:py-10">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={nadaStatus(pengiriman.status)}>
              {t(kunciStatus(pengiriman.status) as Parameters<typeof t>[0])}
            </Badge>
            <Badge tone="neutral">
              {t(kunciMetode(pengiriman.metode) as Parameters<typeof t>[0])}
            </Badge>
          </div>

          <h1 className="type-display-md text-ink">
            {pengiriman.komoditas ?? t("heading")}
          </h1>

          <Link
            href={`/petani/pesanan/${pengiriman.order_id}`}
            className="type-body-md focus-ring hit-44 inline-flex w-fit items-center gap-1.5 rounded-xs font-bold text-brand hover:underline"
          >
            {t("order_link", { id: pengiriman.order_id })}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </header>

        <Card variant="raised" className="grid gap-5 p-6 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
          {fakta.map(({ id: key, label, nilai, Icon }) => (
            <div key={key} className="flex flex-col gap-1">
              <SectionLabel>{label}</SectionLabel>
              <span className="type-body-md flex items-start gap-1.5 pt-0.5 font-bold text-ink">
                <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                {nilai}
              </span>
            </div>
          ))}
        </Card>

        <Card variant="raised" className="flex flex-col gap-5 p-6 sm:p-7">
          <h2 className="type-heading-md text-ink">{t("journey_title")}</h2>

          {dibatalkan ? (
            <p className="type-body-md rounded-md bg-danger-tint p-4 text-danger">
              {t("journey_cancelled")}
            </p>
          ) : (
            <Timeline events={langkah} />
          )}

          <RutePenjemputan
            pengirimanId={pengiriman.id}
            metode={pengiriman.metode}
          />
        </Card>

        <ChecklistRantaiDingin
          pengirimanId={pengiriman.id}
          komoditas={pengiriman.komoditas ?? ""}
          awal={pengiriman.checklist}
        />
      </Container>
    </>
  );
}
