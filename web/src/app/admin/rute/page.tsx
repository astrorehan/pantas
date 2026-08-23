import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui";
import { getPengirimanList, pengirimanKonsolidasi } from "@/lib/data";
import RoutePlannerDynamic from "@/components/route-planner-dynamic";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Perencana Rute Konsolidasi Logistik",
  description: "Penggabungan penjemputan multi-petani dalam satu rute hemat energi dan emisi CO₂e.",
};

export default async function PerencanaRutePage() {
  const t = await getTranslations("admin_rute");
  const pengiriman = pengirimanKonsolidasi(await getPengirimanList());

  return (
    <>
      <BackBar title={t("back_title")} href="/admin" />

      <Container className="flex flex-col gap-8 py-6 lg:py-10">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <Badge tone="brand" icon={<Truck className="size-4" />}>
            {t("badge")}
          </Badge>
          <h1 className="type-display-md text-ink">{t("title")}</h1>
          <p className="type-body-lg text-muted max-w-3xl">
            {t("description")}
          </p>
        </div>

        {/* Interactive Client Component */}
        <RoutePlannerDynamic pengirimanList={pengiriman} />
      </Container>
    </>
  );
}

