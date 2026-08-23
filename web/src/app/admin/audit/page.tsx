import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui";
import { getTranslations } from "next-intl/server";
import { AuditClient } from "./audit-client";

export const metadata: Metadata = {
  title: "Jejak Audit: Konsol Operator",
  description:
    "Catatan setiap tindakan operator koperasi: siapa, apa, kapan, dan alasannya.",
};

export default async function AuditPage() {
  const t = await getTranslations("admin_audit");

  return (
    <>
      <BackBar title={t("back_title")} href="/admin" />

      <Container className="flex flex-col gap-6 py-6 lg:py-10">
        <div className="flex flex-col gap-2">
          <Badge tone="brand" icon={<ScrollText className="size-4" />}>
            {t("badge")}
          </Badge>
          <h1 className="type-display-md text-ink">{t("title")}</h1>
          <p className="type-body-lg max-w-3xl text-muted">{t("description")}</p>
        </div>

        <AuditClient />
      </Container>
    </>
  );
}
