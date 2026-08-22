"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw, WifiOff } from "lucide-react";
import { Button, ButtonLink } from "./ui";
import { useTranslations } from "@/lib/i18n";

/** Network trouble and application faults deserve different words (F-98). */
function isNetworkFault(error: Error) {
  const m = `${error.name} ${error.message}`.toLowerCase();
  return (
    m.includes("fetch") ||
    m.includes("network") ||
    m.includes("load failed") ||
    m.includes("offline")
  );
}

/**
 * Shared body for every `error.tsx`. Always offers two ways out — retry the
 * segment, or leave for a page known to work — because a boundary with only a
 * stack trace is a dead end.
 */
export function ErrorScreen({
  error,
  retry,
  homeHref = "/",
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  homeHref?: string;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error("[pantas] batas galat:", error);
  }, [error]);

  const network = isNetworkFault(error);
  const Icon = network ? WifiOff : AlertTriangle;

  return (
    <main
      id="konten"
      className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-1 px-6 py-16 text-center"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-danger-tint text-danger">
        <Icon aria-hidden className="size-8" />
      </span>

      <h1 className="type-heading-lg pt-5 text-ink">
        {network ? t("network_title") : t("generic_title")}
      </h1>
      <p className="type-body-md max-w-sm pt-2 text-muted">
        {network ? t("network_desc") : t("generic_desc")}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
        {retry && (
          <Button onClick={retry} size="lg">
            <RotateCcw aria-hidden className="size-4" />
            {t("retry")}
          </Button>
        )}
        <ButtonLink href={homeHref} variant="ghost" size="lg">
          {t("back_home")}
        </ButtonLink>
      </div>

      {error.digest && (
        <p className="type-mono-sm pt-8 text-label">
          {t("error_code")}: {error.digest}
        </p>
      )}
    </main>
  );
}

/** Shared body for every `not-found.tsx`. */
export function NotFoundScreen({
  homeHref = "/",
}: {
  homeHref?: string;
}) {
  const t = useTranslations("error");

  return (
    <main
      id="konten"
      className="flex min-h-dvh flex-1 flex-col items-center justify-center px-6 py-16 text-center"
    >
      <p className="type-display-lg font-display text-brand-tint-strong">404</p>
      <h1 className="type-heading-lg pt-2 text-ink">{t("not_found_title")}</h1>
      <p className="type-body-md max-w-sm pt-2 text-muted">
        {t("not_found_desc")}
      </p>
      <div className="pt-6">
        <ButtonLink href={homeHref} size="lg">
          {t("back_home")}
        </ButtonLink>
      </div>
      <p className="type-body-sm pt-8 text-label">
        {t("need_help")}{" "}
        <Link href="/" className="focus-ring rounded-xs text-brand underline">
          {t("start_over")}
        </Link>
      </p>
    </main>
  );
}
