"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, Factory, ShieldCheck, Sprout } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { AKUN_DEMO, DEMO_PASSWORD, type AkunDemo } from "@/lib/demo";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

const IKON = { petani: Sprout, pembeli: Factory, admin: ShieldCheck } as const;

/** Kunci pesan per peran, dieja lengkap supaya `t()` tetap terperiksa tipe. */
const KUNCI = {
  petani: {
    peran: "petani_peran",
    lokasi: "petani_lokasi",
    isi: ["petani_isi_1", "petani_isi_2", "petani_isi_3"],
    nama: "role_petani",
  },
  pembeli: {
    peran: "pembeli_peran",
    lokasi: "pembeli_lokasi",
    isi: ["pembeli_isi_1", "pembeli_isi_2", "pembeli_isi_3"],
    nama: "role_pembeli",
  },
  admin: {
    peran: "admin_peran",
    lokasi: "admin_lokasi",
    isi: ["admin_isi_1", "admin_isi_2", "admin_isi_3"],
    nama: "role_admin",
  },
} as const;

/**
 * One-tap sign-in for the judge accounts (F-03).
 *
 * It goes through the same `store.masuk` as the real form rather than a special
 * back door, so what a judge exercises is the production auth path. If the seed
 * has not been applied the sign-in fails visibly — better than a bypass that
 * makes a broken deployment look healthy.
 */
export function KartuAkunDemo() {
  const router = useRouter();
  const store = useStore();
  const t = useTranslations("demo");
  const [jalan, setJalan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function masuk(akun: AkunDemo) {
    if (jalan) return;
    setJalan(akun.email);
    setError(null);
    const { sesi, error: gagal } = await store.masuk(akun.email, DEMO_PASSWORD);
    if (!sesi) {
      setError(t("login_error", { error: gagal ?? t("login_failed_fallback") }));
      setJalan(null);
      return;
    }
    router.replace(akun.tujuan);
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AKUN_DEMO.map((akun) => {
          const Ikon = IKON[akun.role];
          const kunci = KUNCI[akun.role];
          return (
            <li key={akun.email}>
              <Card variant="raised" className="flex h-full flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-tint">
                    <Ikon aria-hidden className="size-6 text-brand" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="type-heading-md text-ink">{akun.nama}</h3>
                    <p className="type-body-md text-muted">{t(kunci.peran)}</p>
                    <p className="type-body-sm text-label">{t(kunci.lokasi)}</p>
                  </div>
                </div>

                <ul className="flex flex-col gap-1.5">
                  {kunci.isi.map((k) => (
                    <li
                      key={k}
                      className="type-body-md flex items-start gap-2 text-muted"
                    >
                      <Check
                        aria-hidden
                        className="mt-1 size-3.5 shrink-0 text-brand"
                      />
                      {t(k)}
                    </li>
                  ))}
                </ul>

                <dl className="rounded-md border border-line bg-sunken p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="type-label text-label">{t("email")}</dt>
                    <dd className="type-mono-sm break-all text-ink">{akun.email}</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1">
                    <dt className="type-label text-label">{t("password")}</dt>
                    <dd className="type-mono-sm text-ink">{DEMO_PASSWORD}</dd>
                  </div>
                </dl>

                <Button
                  size="xl"
                  block
                  className="mt-auto"
                  loading={jalan === akun.email}
                  onClick={() => void masuk(akun)}
                >
                  {t("sign_in_as")} {t(kunci.nama)}
                  <ArrowRight aria-hidden className="size-5" />
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>

      {error && (
        <p
          role="alert"
          className="type-body-md rounded-md border border-danger bg-danger-tint p-4 font-bold text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
