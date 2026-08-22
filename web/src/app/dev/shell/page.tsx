import { notFound } from "next/navigation";
import { AppShell, BottomNav } from "@/components/app-shell";
import { BrandBar, PageHeader } from "@/components/chrome";
import { Container } from "@/components/container";
import { Card, SectionLabel, Stat, ThemeToggle } from "@/components/ui";

export const metadata = { title: "AppShell: breakpoints" };

/**
 * Workbench for §8.2. The role screens sit behind an auth gate, so this is the
 * surface where the shell's breakpoint behaviour can be checked — and screenshot
 * for regressions — without a session.
 *
 * What to look for while resizing:
 *   < 768px  bottom tab bar, no sidebar
 *   768px    88px icon rail, no bottom bar
 *   1024px+  256px labelled sidebar
 * Exactly one navigation is mounted at any width (F-75).
 */
export default function ShellHarness() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <AppShell role="petani">
      <BrandBar title="Beranda" right={<ThemeToggle compact />} />

      <main className="flex-1 py-4">
        <Container className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <PageHeader
              title="Kolom utama"
              description="Membentang 8 dari 12 kolom pada lg ke atas."
            />
            <Card className="mt-3 p-4">
              <SectionLabel>Kontainer</SectionLabel>
              <p className="type-body-md pt-2 text-muted">
                Lebar maksimum naik bertahap: 768 (md) → 1152 (lg) → 1280 (xl) →
                1440 (2xl). Tidak ada lagi bingkai 430px.
              </p>
            </Card>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:col-span-4 lg:grid-cols-1 lg:content-start lg:pt-9">
            <Stat size="sm" label="Contoh stat" value="12" source="Data contoh." />
            <Stat size="sm" label="Contoh stat" value="4" source="Data contoh." />
          </section>
        </Container>
      </main>

      <BottomNav role="petani" />
    </AppShell>
  );
}
