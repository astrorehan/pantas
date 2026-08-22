"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { IconButton, Sheet } from "@/components/ui";
import { useTranslations } from "@/lib/i18n";
import { SITE_NAV } from "./site-nav";

export function SiteNavMobile() {
  const [buka, setBuka] = useState(false);
  const t = useTranslations("site_nav");

  return (
    <>
      <IconButton
        label={t("menu")}
        size="sm"
        className="sm:hidden"
        aria-expanded={buka}
        onClick={() => setBuka(true)}
      >
        <Menu className="size-5" />
      </IconButton>

      <Sheet open={buka} onClose={() => setBuka(false)} title={t("menu")}>
        <nav aria-label={t("nav_label")}>
          <ul className="flex flex-col gap-1">
            {SITE_NAV.map(({ href, labelKey }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setBuka(false)}
                  className="tap focus-ring type-body-lg flex min-h-12 items-center rounded-md px-3 font-bold text-ink hover:bg-sunken"
                >
                  {t(labelKey as Parameters<typeof t>[0])}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Sheet>
    </>
  );
}
