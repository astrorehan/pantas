"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/chrome";
import { Button, Card, Input, LocaleToggle, ThemeToggle } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

const MIN_PASSWORD = 6;

/**
 * Landing target of the Supabase recovery email.
 *
 * The client's `detectSessionInUrl` trades the token in the URL fragment for a
 * real session before the store finishes booting, so "did the link work?" is
 * simply "does the store have a session once it is ready" — no second auth call
 * from this component, and no state written from an effect.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const store = useStore();
  const t = useTranslations("reset_password");
  const [password, setPassword] = useState("");
  const [lihat, setLihat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [selesai, setSelesai] = useState(false);

  const siap = !store.ready ? "cek" : store.sesi ? "ok" : "tanpa-token";

  async function simpan() {
    if (password.length < MIN_PASSWORD || sending) return;
    setSending(true);
    setError(null);
    const { error: gagal } = await store.gantiPassword(password);
    if (gagal) {
      setError(gagal);
      setSending(false);
      return;
    }
    setSelesai(true);
    setSending(false);
  }

  return (
    <main
      id="konten"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-10 sm:px-6"
    >
      {/* Sama seperti /masuk: cahaya latar dan barisan kontrol yang identik,
          supaya dua layar autentikasi tidak terasa datang dari dua produk. */}
      <div className="pulse-glow pointer-events-none absolute -top-24 end-1/4 size-96 rounded-full bg-brand/10 blur-3xl" />
      <div className="pulse-glow pointer-events-none absolute -bottom-24 start-10 size-80 rounded-full bg-teal-500/5 blur-3xl" />

      <div className="absolute inset-x-4 top-4 z-30 flex items-center justify-between gap-2">
        <Link
          href="/masuk"
          className="focus-ring type-body-md flex min-h-11 items-center gap-1.5 rounded-md px-2 font-bold text-muted hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {t("back_to_login")}
        </Link>
        <div className="flex items-center gap-1">
          <LocaleToggle compact />
          <ThemeToggle compact />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <section className="rise flex flex-col items-center pb-8 text-center">
          <Logo className="size-14" />
          <h1 className="type-display-md font-display tracking-tight pt-2 text-ink">
            {t("title")}
          </h1>
        </section>

        <Card variant="raised" className="flex flex-col gap-6 p-6 sm:p-8">
          {siap === "cek" && (
            <p className="type-body-md text-muted">{t("checking_link")}</p>
          )}

          {siap === "tanpa-token" && (
            <>
              <p className="type-body-md text-muted">
                {t("link_expired")}
              </p>
              <Button size="lg" block onClick={() => router.replace("/masuk")}>
                {t("to_login")}
              </Button>
            </>
          )}

          {siap === "ok" &&
            (selesai ? (
              <>
                <div className="flex flex-col items-center gap-3 text-center">
                  <ShieldCheck aria-hidden className="size-10 text-brand" />
                  <p className="type-body-lg text-ink">
                    {t("success_msg")}
                  </p>
                </div>
                <Button
                  size="lg"
                  block
                  onClick={() =>
                    router.replace(
                      store.sesi?.role === "pembeli" ? "/pembeli" : "/petani",
                    )
                  }
                >
                  {t("to_app")}
                </Button>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void simpan();
                }}
                className="flex flex-col gap-6"
              >
                <Input
                  id="password-baru"
                  type={lihat ? "text" : "password"}
                  label={t("new_password_label")}
                  autoComplete="new-password"
                  placeholder={t("min_chars", { min: MIN_PASSWORD })}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setLihat((v) => !v)}
                      aria-label={
                        lihat ? t("hide_password") : t("show_password")
                      }
                      className="focus-ring -me-2 flex size-11 items-center justify-center rounded-sm text-muted hover:text-ink sm:size-9"
                    >
                      {lihat ? (
                        <EyeOff aria-hidden className="size-5" />
                      ) : (
                        <Eye aria-hidden className="size-5" />
                      )}
                    </button>
                  }
                />

                {error && (
                  <p role="alert" className="type-body-sm font-bold text-danger">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  size="xl"
                  block
                  loading={sending}
                  disabled={password.length < MIN_PASSWORD}
                >
                  {t("save_password")}
                </Button>
              </form>
            ))}
        </Card>

        {/* Tautan "Kembali ke Masuk" yang dulu ada di sini sudah pindah ke
            barisan kontrol di atas. Dengan tombol "Ke Halaman Masuk" pada
            keadaan tautan kedaluwarsa, kartu sekecil ini sempat menawarkan tiga
            jalan ke satu tujuan yang sama. */}
      </div>
    </main>
  );
}
