import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui";
import { getTranslations } from "next-intl/server";
import { ModerasiClient } from "./moderasi-client";

export const metadata: Metadata = {
  title: "Moderasi Listing: Konsol Operator",
  description:
    "Menurunkan lot yang bermasalah dari katalog dengan alasan yang tercatat permanen di jejak audit.",
};

export default async function ModerasiPage() {
  const t = await getTranslations("admin_moderasi");

  return (
    <>
      <BackBar title={t("back_title")} href="/admin" />

      <Container className="flex flex-col gap-6 py-6 lg:py-10">
        <div className="flex flex-col gap-2">
          <Badge tone="brand" icon={<ShieldAlert className="size-4" />}>
            {t("badge")}
          </Badge>
          <h1 className="type-display-md text-ink">{t("title")}</h1>
          <p className="type-body-lg max-w-3xl text-muted">{t("description")}</p>
        </div>

        <ModerasiClient />
      </Container>
    </>
  );
}
