"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranch } from "lucide-react";
import { Logo } from "@/components/chrome";
import { Container } from "@/components/container";
import { ButtonLink, LocaleToggle, ThemeToggle, cx } from "@/components/ui";
import { useTranslations } from "@/lib/i18n";
import { SITE_NAV } from "./site-nav";
import { SiteNavMobile } from "./site-nav-mobile";

export const REPO_URL = "https://github.com/ammarcho/PANTAS";

/**
 * Header for the public surface (`/`, `/demo`, `/tentang`, `/lacak/*`). The
 * signed-in app has its own AppShell; these pages are read by someone who has
 * no session and no reason to want one yet, so the only CTA is "Masuk".
 *
 * Destinations come from `SITE_NAV` and are rendered twice — inline from `sm`
 * up, inside `SiteNavMobile`'s sheet below it — so a phone reaches the same
 * pages a desktop does.
 */
export function SiteHeader() {
  const t = useTranslations("site_nav");
  const pathname = usePathname();

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.includes("#")) {
      const targetId = href.split("#")[1];
      if (pathname === "/" && targetId) {
        const elem = document.getElementById(targetId);
        if (elem) {
          e.preventDefault();
          elem.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.pushState({}, "", `#${targetId}`);
        }
      }
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-surface/80 backdrop-blur-md shadow-xs">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="group focus-ring flex shrink-0 items-center gap-2.5 rounded-md text-brand"
        >
          <Logo className="size-8 transition-transform duration-300 group-hover:scale-110" />
          <span className="type-heading-md font-display tracking-tight bg-gradient-to-r from-brand via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            PANTAS
          </span>
        </Link>

        <nav aria-label={t("nav_label")} className="flex items-center gap-1">
          {SITE_NAV.map(({ href, labelKey }) => {
            // Tautan berjangkar (`/#fitur`) tidak pernah jadi halaman aktif —
            // ia sudah bagian dari landing, dan menandainya aktif di landing
            // membuat dua entri menyala sekaligus.
            const aktif = !href.includes("#") && pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={aktif ? "page" : undefined}
                onClick={(e) => handleNavClick(e, href)}
                className={cx(
                  "focus-ring type-body-md hidden min-h-11 items-center rounded-md px-3 font-bold transition-colors sm:flex",
                  aktif ? "bg-brand-tint text-brand-deep" : "text-muted hover:text-ink",
                )}
              >
                {t(labelKey as Parameters<typeof t>[0])}
              </Link>
            );
          })}
          <LocaleToggle compact className="mr-2" />
          <ButtonLink href="/masuk" size="md" className="px-6">
            {t("login")}
          </ButtonLink>
          <SiteNavMobile />
        </nav>
      </Container>
    </header>
  );
}

export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-line bg-sunken">
      <Container className="flex flex-col gap-8 py-10 lg:flex-row lg:justify-between">
        <div className="max-w-sm">
          <span className="flex items-center gap-2 text-brand">
            <Logo className="size-7" />
            <span className="type-heading-md font-display tracking-tight">
              PANTAS
            </span>
          </span>
          <p className="type-body-md pt-3 text-muted">
            {t("desc")}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-12 gap-y-8">
          <nav aria-label={t("explore")}>
            <h2 className="type-label pb-3 text-label">{t("explore")}</h2>
            <ul className="flex flex-col gap-2">
              {[
                { href: "/#fitur", labelKey: "features_pantas" },
                { href: "/tentang", labelKey: "how_it_works_pillars" },
                { href: "/tentang/model", labelKey: "model_transparency" },
                { href: "/demo", labelKey: "try_without_register" },
                { href: "/masuk", labelKey: "login_register" },
              ].map(({ href, labelKey }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="focus-ring type-body-md rounded-xs text-muted hover:text-brand hover:underline"
                  >
                    {t(labelKey as Parameters<typeof t>[0])}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="type-label pb-3 text-label">{t("sources")}</h2>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href={REPO_URL}
                  className="focus-ring type-body-md inline-flex items-center gap-1.5 rounded-xs text-muted hover:text-brand hover:underline"
                >
                  <GitBranch aria-hidden className="size-4" />
                  {t("repo")}
                </a>
              </li>
              <li>
                <a
                  href="https://ourworldindata.org/grapher/ghg-per-kg-poore"
                  className="focus-ring type-body-md rounded-xs text-muted hover:text-brand hover:underline"
                >
                  {t("emission_factor")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="type-label pb-3 text-label">{t("language_selector")}</h2>
            <LocaleToggle />
          </div>
        </div>
      </Container>

      <Container className="border-t border-line py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="type-body-sm text-label">
          {t("copyright")}
        </p>
        <ThemeToggle compact />
      </Container>
    </footer>
  );
}
