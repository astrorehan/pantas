"use client";

import { Sparkles } from "lucide-react";
import { DemoGrading } from "@/components/marketing/demo-grading";
import {
  AjakanPenutup,
  DampakTema,
  Fitur,
  Hero,
  MasalahAngka,
} from "@/components/marketing/sections";
import { PublicPage, Section } from "@/components/marketing/page-shell";
import { useTranslations } from "@/lib/i18n";

export function LandingContent() {
  const t = useTranslations("landing");

  return (
    <PublicPage>
      <Hero />
      <MasalahAngka />
      <Fitur />

      <Section
        id="bukti"
        eyebrow={t("bukti_eyebrow")}
        eyebrowIcon={<Sparkles aria-hidden className="size-3.5" />}
        title={t("bukti_title")}
        lead={t("bukti_desc")}
      >
        <DemoGrading />
      </Section>

      <DampakTema />
      <AjakanPenutup />
    </PublicPage>
  );
}
