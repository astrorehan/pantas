import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      /**
       * F-76 — the app used to live inside a 430px frame centred on a grey
       * field. Removing it once is easy; keeping it removed is the hard part,
       * so a reintroduction fails CI instead of shipping (R-05).
       */
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/max-w-\\[43[0-9]px\\]/]",
          message:
            "Jangan kunci lebar ke frame ponsel. Pakai <Container> dari @/components/container (§8.2).",
        },
        {
          selector: "TemplateElement[value.raw=/max-w-\\[43[0-9]px\\]/]",
          message:
            "Jangan kunci lebar ke frame ponsel. Pakai <Container> dari @/components/container (§8.2).",
        },
      ],
    },
  },

  {
    /**
     * §7.1 — palet "Panen" berasal dari tanah, daun, dan hasil panen. Kartu
     * bergradien emerald/blue/amber/purple adalah dashboard SaaS generik yang
     * dilarang PRD, dan sekali satu layar memakainya layar sebelahnya ikut.
     * Skala milik proyek sendiri (`green`, `stone`, `clay`) tidak dilarang di
     * sini karena `@theme` memang mendefinisikannya, tapi komponen tetap
     * diharapkan memanggil alias semantiknya.
     *
     */
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/app/petani/**/*.{ts,tsx}",
      "src/app/pembeli/**/*.{ts,tsx}",
    ],
    ignores: [
      // Keluaran cetak tidak ikut tema — kertas selalu putih, jadi warnanya
      // memang harus literal dan tidak boleh mengikuti token gelap/terang.
      "src/components/printable-*.tsx",
      // Permukaan pemasaran punya bahasa visual sendiri (§ landing).
      "src/components/marketing/**",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/\\b(slate|gray|zinc|neutral|red|orange|amber|yellow|lime|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)\\b/]",
          message:
            "Palet Tailwind mentah dilarang di komponen. Pakai token semantik: brand, grade-a..reject, danger, ink, muted, line, surface, sunken (§7.1/§7.2).",
        },
        {
          selector:
            "TemplateElement[value.raw=/\\b(slate|gray|zinc|neutral|red|orange|amber|yellow|lime|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)\\b/]",
          message:
            "Palet Tailwind mentah dilarang di komponen. Pakai token semantik: brand, grade-a..reject, danger, ink, muted, line, surface, sunken (§7.1/§7.2).",
        },
      ],

      /**
       * §12.3 — every read goes through lib/data.ts and every write through
       * lib/store.tsx. Components reaching for the Supabase client directly is
       * how a seam turns into a sieve.
       */
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/lib/supabase", "@/lib/supabase"],
              message:
                "Komponen tidak memanggil Supabase langsung. Baca lewat @/lib/data, tulis lewat @/lib/store (§12.3).",
            },
          ],
        },
      ],
    },
  },

  {
    // The seams themselves, plus route handlers that legitimately need the
    // server-side client, are exempt.
    files: ["src/lib/**/*.{ts,tsx}", "src/app/api/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" },
  },
]);

export default eslintConfig;
