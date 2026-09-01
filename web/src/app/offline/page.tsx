import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Sedang offline" };
export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-5 py-10 text-ink">
      <section className="w-full max-w-md rounded-xl border border-line bg-surface p-6 text-center shadow-e3 sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Logo%20Pantas_Rounded.png"
          alt=""
          className="mx-auto mb-5 size-16 object-contain"
        />
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-brand-tint text-brand-deep">
          <WifiOff aria-hidden className="size-6" />
        </span>
        <h1 className="type-heading-lg font-display">Koneksi sedang terputus</h1>
        <p className="mt-3 type-body-md text-muted">
          PANTAS belum bisa membuka halaman ini tanpa jaringan. Antrean pindai yang sudah tersimpan
          tetap aman dan akan diproses saat koneksi kembali.
        </p>
        <a
          href=""
          className="focus-ring tap mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-brand px-5 font-bold text-on-brand shadow-e2 hover:bg-brand-deep"
        >
          Coba lagi
        </a>
        <p className="mt-4 type-body-sm text-label">Tidak perlu mengulang foto yang sudah masuk antrean.</p>
      </section>
    </main>
  );
}
