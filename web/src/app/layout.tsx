import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Poppins } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { LocaleProvider } from "@/lib/i18n";
import { SkipLink } from "@/components/skip-link";
import { Toaster } from "@/components/ui";
import { TITLE_TEMPLATE } from "@/lib/metadata";
import { LOCALE_SCRIPT, THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";


/**
 * Tiga wajah huruf §7.3, tapi hanya satu yang boleh berebut bandwidth di muat
 * pertama (NFR-01/NFR-02).
 *
 * Elemen LCP hampir setiap layar adalah teks isi, dan teks itu dicat dua kali:
 * sekali dengan fallback saat FCP, sekali lagi saat webfont tiba — cat kedua
 * itulah yang tercatat sebagai LCP. Dengan ketiga font dipreload (163 KB), cat
 * kedua jatuh di ~3,5 s pada 4G lambat tersimulasi. Hanya Inter yang dipreload
 * sekarang; dua sisanya menyusul lewat penemuan CSS biasa, setelah teks isi
 * sudah mapan.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Display face (§7.3). Poppins font for headings and titles.
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "optional",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pantas.id"),
  title: {
    default: "PANTAS: Setiap Panen Pantas Dihargai",
    // Every route sets its own title; judges keep many tabs open (F-83).
    template: TITLE_TEMPLATE,
  },
  description:
    "Grading panen dengan AI, harga wajar, dan pembeli industri terdekat.",
  applicationName: "PANTAS",
};

export const viewport: Viewport = {
  themeColor: [
    /* Sewarna dengan bar aplikasi, bukan dengan brand mark: chrome browser
       menyambung ke chrome kita, jadi keduanya harus `--field-base`. */
    { media: "(prefers-color-scheme: light)", color: "#1a4d26" },
    { media: "(prefers-color-scheme: dark)", color: "#07120a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Sengaja tidak membaca cookie di sini.
 *
 * `cookies()` di root layout menarik *seluruh* route ke render dinamis —
 * `/`, `/demo`, dan `/tentang` kehilangan status statisnya hanya untuk satu
 * atribut `lang`. Pilihan bahasa dipulihkan oleh `LOCALE_SCRIPT` sebelum cat
 * pertama, dan komponen server yang benar-benar butuh bahasa (`/lacak/[hash]`,
 * yang memang sudah dinamis) membaca cookie-nya sendiri.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable} ${jetbrains.variable} h-full overflow-x-clip max-w-full`}
    >
      <head>
        {/* Applies a pinned theme before first paint — see lib/theme.ts. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* Memindahkan pilihan bahasa lama ke cookie — juga di lib/theme.ts. */}
        <script dangerouslySetInnerHTML={{ __html: LOCALE_SCRIPT }} />
      </head>
      {/* `overflow-x-clip`, bukan `-hidden`: alasannya ada di catatan panjang
          pada blok `@layer base` di globals.css — `hidden` mematikan setiap
          bilah `sticky` di aplikasi ini. */}
      <body className="min-h-full bg-canvas font-sans text-ink antialiased overflow-x-clip max-w-full w-full relative">
        <LocaleProvider>
          {/* Keyboard users land here first and can jump the nav (NFR-22). */}
          <SkipLink />
          <StoreProvider>
            {children}
            <Toaster />
          </StoreProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
