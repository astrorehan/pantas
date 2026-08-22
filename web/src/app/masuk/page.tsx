"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Factory,
  MailCheck,
  Sprout,
} from "lucide-react";
import { Logo } from "@/components/chrome";
import { BERANDA } from "@/components/nav-config";
import {
  Button,
  Card,
  Input,
  LocaleToggle,
  SectionLabel,
  ThemeToggle,
  cx,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { useTranslations } from "@/lib/i18n";

const ROLES = [
  { id: "petani" as const, icon: Sprout },
  { id: "pembeli" as const, icon: Factory },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 6;

type Mode = "masuk" | "daftar" | "lupa";

/* ------------------------------------------------------------- Kekuatan sandi */

/** Kunci label untuk skor 0–4, dieja lengkap agar `t()` tetap terperiksa tipe. */
const LABEL_KEKUATAN = [
  "pwd_too_short",
  "pwd_weak",
  "pwd_fair",
  "pwd_strong",
  "pwd_very_strong",
] as const;

/**
 * Skor 0–4 dari sifat yang bisa dijelaskan ke pengguna, bukan entropi abstrak.
 * Tidak memblokir apa pun di atas panjang minimum Supabase — ini penilaian,
 * bukan gerbang (§5.3 prinsip 1: sistem memberi tahu, tidak memutuskan).
 */
function skorPassword(pw: string): number {
  if (pw.length < MIN_PASSWORD) return 0;
  let skor = 1;
  if (pw.length >= 10) skor++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) skor++;
  if (/\d/.test(pw) && /[^\w\s]/.test(pw)) skor++;
  return skor;
}

function MeterPassword({ password }: { password: string }) {
  const t = useTranslations("masuk");
  const skor = skorPassword(password);
  // Warna ikut token grade: merah = reject, kuning-tanah = B, hijau = A. Label
  // teks selalu ada, jadi informasi tidak bergantung warna saja (NFR-24).
  const warna = ["bg-danger", "bg-danger", "bg-grade-b", "bg-grade-a", "bg-grade-a"][
    skor
  ];

  return (
    <div className="flex flex-col gap-1.5" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={cx(
              "h-1 flex-1 rounded-full transition-colors",
              n <= skor ? warna : "bg-sunken",
            )}
          />
        ))}
      </div>
      <p className="type-body-sm text-muted">
        {t("pwd_strength_label")}{" "}
        <span className="font-bold text-ink">{t(LABEL_KEKUATAN[skor])}</span>
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------- Halaman */

export default function MasukPage() {
  const router = useRouter();
  const store = useStore();
  const t = useTranslations("masuk");
  const tc = useTranslations("common");
  const [mode, setMode] = useState<Mode>("masuk");
  const [role, setRole] = useState<Role>("petani");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lihatPassword, setLihatPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terkirim, setTerkirim] = useState(false);
  const [sending, setSending] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const valid =
    mode === "lupa" ? emailValid : emailValid && password.length >= MIN_PASSWORD;

  function ganti(next: Mode) {
    setMode(next);
    setError(null);
    setTerkirim(false);
  }

  async function submit() {
    if (!valid || sending) return;
    setSending(true);
    setError(null);

    if (mode === "lupa") {
      const { error: gagal } = await store.kirimResetPassword(email);
      if (gagal) setError(gagal);
      else setTerkirim(true);
      setSending(false);
      return;
    }

    const { sesi, error: gagal } =
      mode === "masuk"
        ? await store.masuk(email, password)
        : await store.daftar(role, email, password);

    if (!sesi) {
      setError(gagal ?? t("login_failed"));
      setSending(false);
      return;
    }
    router.replace(BERANDA[sesi.role]);
  }

  return (
    <main
      id="konten"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-10 sm:px-6"
    >
      {/* Cahaya latar yang sama dengan hero halaman publik. Tanpa ini `/masuk`
          terbaca sebagai aplikasi lain: rangka situsnya memang tidak dipakai di
          sini — form autentikasi tidak boleh menawarkan jalan keluar sebanyak
          halaman pemasaran — tapi bahasa visualnya harus tetap satu. */}
      <div className="pulse-glow pointer-events-none absolute -top-24 end-1/4 size-96 rounded-full bg-brand/10 blur-3xl" />
      <div className="pulse-glow pointer-events-none absolute -bottom-24 start-10 size-80 rounded-full bg-teal-500/5 blur-3xl" />

      <div className="absolute inset-x-4 top-4 z-30 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="focus-ring type-body-md flex min-h-11 items-center gap-1.5 rounded-md px-2 font-bold text-muted hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" />
          {tc("home")}
        </Link>
        {/* Pemilih bahasa ikut ke sini: pengunjung yang menyetel Inggris di
            landing sebelumnya tiba di form yang seluruhnya berbahasa Indonesia
            tanpa satu pun cara untuk menggantinya kembali. */}
        <div className="flex items-center gap-1">
          <LocaleToggle compact />
          <ThemeToggle compact />
        </div>
      </div>

      {/* Kartu, bukan kolom penuh: di laptop 1920px form yang melebar penuh
          terbaca sebagai halaman yang belum selesai. */}
      <div className="relative z-10 w-full max-w-md">
        <section className="rise flex flex-col items-center pb-8 text-center">
          <Logo className="size-16" />
          <h1 className="type-display-md font-display tracking-tight pt-2 text-ink">
            PANTAS
          </h1>
          <p className="type-body-md pt-1 font-medium text-muted">{t("tagline")}</p>
        </section>

        <Card variant="raised" className="p-6 sm:p-8">
          {/* Masuk dan Daftar dipisah eksplisit (F-02): auto-signup diam-diam
              membuat password yang salah tampil sebagai "email sudah
              terdaftar", dan pengguna menyimpulkan akunnya rusak. */}
          {mode !== "lupa" && (
            <div className="flex gap-1 rounded-md border border-line bg-sunken p-1">
              {(["masuk", "daftar"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => ganti(m)}
                  className={cx(
                    "tap focus-ring type-body-md relative z-10 flex min-h-11 flex-1 cursor-pointer select-none items-center justify-center rounded-sm font-bold",
                    mode === m
                      ? "bg-surface text-ink shadow-e1"
                      : "text-muted hover:text-ink",
                  )}
                >
                  {m === "masuk" ? t("tab_login") : t("tab_register")}
                </button>
              ))}
            </div>
          )}

          {mode === "lupa" && terkirim ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <MailCheck aria-hidden className="size-10 text-brand" />
              <h2 className="type-heading-md text-ink">{t("link_sent_title")}</h2>
              <p className="type-body-md text-muted">{t("link_sent_desc")}</p>
              <Button variant="ghost" size="lg" block onClick={() => ganti("masuk")}>
                {t("back_to_login")}
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              className="flex flex-col gap-6 pt-6"
            >
              {mode === "lupa" && (
                <div>
                  <h2 className="type-heading-md text-ink">{t("forgot_pwd")}</h2>
                  <p className="type-body-md pt-1 text-muted">{t("forgot_pwd_desc")}</p>
                </div>
              )}

              {mode === "daftar" && (
                <fieldset className="flex flex-col gap-3">
                  <legend className="sr-only">{t("register_as")}</legend>
                  <SectionLabel>{t("register_as")}</SectionLabel>

                  <div
                    role="radiogroup"
                    aria-label={t("register_as")}
                    className="flex flex-col gap-3"
                  >
                    {ROLES.map(({ id, icon: Icon }) => {
                      const selected = role === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setRole(id)}
                          className={cx(
                            "tap tap-press focus-ring relative z-10 flex cursor-pointer select-none items-start gap-4 rounded-md text-start",
                            selected
                              ? "border-2 border-brand bg-brand-tint p-4"
                              : "border border-line bg-surface p-[17px] hover:border-line-strong",
                          )}
                        >
                          <Icon
                            aria-hidden
                            className={cx(
                              "mt-0.5 size-6 shrink-0",
                              selected ? "text-brand" : "text-muted",
                            )}
                            strokeWidth={2}
                          />
                          <span className="flex-1">
                            <span className="type-heading-sm block text-ink">
                              {t(`role_${id}_title`)}
                            </span>
                            <span className="type-body-sm block text-muted">
                              {t(`role_${id}_desc`)}
                            </span>
                          </span>
                          {selected && (
                            <Check
                              aria-hidden
                              className="mt-1 size-4 shrink-0 text-brand"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="type-body-sm text-muted">{t("register_note")}</p>
                </fieldset>
              )}

              <Input
                id="email"
                type="email"
                label={t("email")}
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={t("email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {mode !== "lupa" && (
                <div className="flex flex-col gap-2">
                  <Input
                    id="password"
                    type={lihatPassword ? "text" : "password"}
                    label={t("password")}
                    autoComplete={
                      mode === "masuk" ? "current-password" : "new-password"
                    }
                    placeholder={t("pwd_placeholder", { min: MIN_PASSWORD })}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setLihatPassword((v) => !v)}
                        aria-label={lihatPassword ? t("hide_pwd") : t("show_pwd")}
                        className="focus-ring -me-2 flex size-11 items-center justify-center rounded-sm text-muted hover:text-ink sm:size-9"
                      >
                        {lihatPassword ? (
                          <EyeOff aria-hidden className="size-5" />
                        ) : (
                          <Eye aria-hidden className="size-5" />
                        )}
                      </button>
                    }
                  />

                  {mode === "daftar" && password.length > 0 && (
                    <MeterPassword password={password} />
                  )}

                  {mode === "masuk" && (
                    <button
                      type="button"
                      onClick={() => ganti("lupa")}
                      className="focus-ring type-body-sm self-start rounded-xs font-bold text-brand hover:underline"
                    >
                      {t("forgot_pwd")}?
                    </button>
                  )}
                </div>
              )}

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
                disabled={!valid}
              >
                {sending
                  ? t("working")
                  : mode === "masuk"
                    ? t("btn_login")
                    : mode === "daftar"
                      ? t("btn_register")
                      : t("btn_send_reset")}
              </Button>

              {mode === "lupa" && (
                <Button variant="ghost" size="lg" block onClick={() => ganti("masuk")}>
                  {tc("close")}
                </Button>
              )}
            </form>
          )}
        </Card>

        <p className="type-body-md pt-6 text-center text-muted">
          {t("try_demo_title")}{" "}
          <Link
            href="/demo"
            className="focus-ring rounded-xs font-bold text-brand hover:underline"
          >
            {t("open_demo")}
          </Link>
        </p>
      </div>
    </main>
  );
}
