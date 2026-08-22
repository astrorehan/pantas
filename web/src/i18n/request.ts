import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { idMessages } from "@/lib/i18n/messages/id";
import { enMessages } from "@/lib/i18n/messages/en";

/** Sama dengan kunci yang ditulis `LocaleProvider` di peramban. */
export const COOKIE_LOCALE = "pantas-locale";

export async function localeDariCookie(): Promise<"id" | "en"> {
  const nilai = (await cookies()).get(COOKIE_LOCALE)?.value;
  return nilai === "en" ? "en" : "id";
}

/**
 * Bahasa untuk komponen server.
 *
 * Dulu dipaku ke `"id"`. Akibatnya paling kelihatan di `/lacak/[hash]`: badan
 * halaman dirender di server dan tetap Indonesia, sementara header dan footer
 * di halaman yang sama adalah komponen klien yang ikut berganti ke Inggris —
 * satu halaman, dua bahasa. Pilihan bahasa kini ikut disimpan di cookie supaya
 * server bisa membacanya sebelum render.
 */
export default getRequestConfig(async () => {
  const locale = await localeDariCookie();
  return {
    locale,
    messages: locale === "en" ? enMessages : idMessages,
  };
});
