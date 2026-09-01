import type { Metadata } from "next";
import { Handshake } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui";
import { SengketaClient } from "./sengketa-client";

export const metadata: Metadata = {
  title: "Sengketa Transaksi: Konsol Operator",
  description: "Meninjau dan menyelesaikan sengketa transaksi PANTAS dengan catatan audit.",
};

export default async function SengketaPage() {
  const t = await getTranslations("admin_sengketa");

  return (
    <>
      <BackBar title={t("back_title")} href="/admin" />
      <Container className="flex flex-col gap-6 py-6 lg:py-10">
        <div className="flex flex-col gap-2">
          <Badge tone="warn" icon={<Handshake className="size-4" />}>
            {t("badge")}
          </Badge>
          <h1 className="type-display-md text-ink">{t("title")}</h1>
          <p className="type-body-lg max-w-3xl text-muted">{t("description")}</p>
        </div>
        <SengketaClient />
      </Container>
    </>
  );
}
