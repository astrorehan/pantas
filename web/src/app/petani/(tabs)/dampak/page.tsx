"use client";

import { useMemo } from "react";
import { Leaf, ScanLine } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { Card, EmptyState, SectionLabel, Stat } from "@/components/ui";
import { formatAngka, formatRupiahRingkas, num } from "@/lib/format";
import { sumberEmisi, tonCo2eDicegah } from "@/lib/emisi";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

/** Area sparkline for kg saved per week. Plain SVG — no chart library needed. */
function TrenMingguan({ data }: { data: { minggu: string; kg: number }[] }) {
  const W = 320;
  const H = 90;
  const max = Math.max(...data.map((d) => d.kg)) * 1.15;
  const step = W / (data.length - 1);

  const pts = data.map((d, i) => [i * step, H - (d.kg / max) * H] as const);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${line} ${W},${H} 0,${H}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-24 w-full overflow-visible"
      role="img"
      aria-label={`Tren kg terselamatkan per minggu, dari ${data[0].kg.toFixed(0)} kg ke ${data.at(-1)!.kg.toFixed(0)} kg`}
    >
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1="0"
          x2={W}
          y1={H * f}
          y2={H * f}
          stroke="var(--border-subtle)"
          strokeWidth="1"
        />
      ))}
      <polygon points={area} fill="var(--accent-primary)" opacity="0.12" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--accent-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={pts.at(-1)![0]}
        cy={pts.at(-1)![1]}
        r="3.5"
        fill="var(--accent-hover)"
      />
    </svg>
  );
}

export default function DampakPage() {
  const store = useStore();
  const t = useTranslations("dampak");

  // Hanya gunakan data nyata dari pesanan yang benar-benar selesai
  const selesai = useMemo(
    () => store.orders.filter((o) => o.status === "selesai"),
    [store.orders],
  );

  // CO₂e dihitung per pesanan, bukan dari total berat: wortel (0,43) dan
  // sayuran lain (0,53) punya faktor berbeda di tabel `emisi_faktor`, jadi
  // satu pengali untuk seluruh keranjang salah begitu petani menjual lebih
  // dari satu komoditas.
  const stats = useMemo(
    () => ({
      kg: selesai.reduce((s, o) => s + o.berat_kg, 0),
      co2: tonCo2eDicegah(selesai, store.faktorEmisi),
      rp: selesai.reduce((s, o) => s + o.total, 0),
      transaksi: selesai.length,
    }),
    [selesai, store.faktorEmisi],
  );

  // Grafik tren: 8 minggu terakhir aktivitas pindai.
  //
  // Bucket dihitung relatif terhadap pindaian terbaru, bukan terhadap
  // `Date.now()`: jam dinding adalah nilai tak murni yang berubah tiap render,
  // sehingga grafik bisa bergeser sendiri saat komponen kebetulan dirender
  // ulang. Bentuk trennya sama, hasilnya deterministik.
  const mingguan = useMemo(() => {
    if (store.scans.length === 0) return null;
    const acuan = Math.max(
      ...store.scans.map((s) => new Date(s.tanggal).getTime()),
    );
    const slots = Array.from({ length: 8 }, (_, i) => ({
      minggu: `M${i + 1}`,
      kg: 0,
    }));
    store.scans.forEach((s) => {
      const hariLalu = (acuan - new Date(s.tanggal).getTime()) / 86400000;
      const slotIdx = Math.min(7, Math.floor(hariLalu / 7));
      const slot = slots[7 - slotIdx];
      if (slot) slot.kg += s.objek * 0.3; // estimasi 0.3 kg/objek
    });
    const hasData = slots.some((s) => s.kg > 0);
    return hasData ? slots : null;
  }, [store.scans]);

  return (
    <>
      {/* Layar ini tidak lagi jadi tujuan nav utama: ia dibuka dari Akun, jadi
          bilahnya harus menawarkan jalan pulang ke sana (F-82) alih-alih
          pintasan ke layar lain yang dulu menggantikan tombol kembali. */}
      <BackBar title={t("title")} href="/petani/akun" parentLabel={t("back_to_akun") as string ?? "Akun"} />


      <main className="flex-1 py-4">
        <Container>
          <h1 className="type-heading-lg max-w-md text-ink">
            {t("heading")}
          </h1>

          <div className="grid grid-cols-2 gap-3 pt-4 lg:grid-cols-4">
            <Stat
              size="sm"
              className="rise"
              label={t("stat_kg_label")}
              value={formatAngka(stats.kg)}
              unit="kg"
              icon={<Leaf aria-hidden className="size-3.5" />}
              source={t("stat_kg_source")}
            />
            <Stat
              size="sm"
              className="rise"
              label={t("stat_co2_label")}
              value={num(stats.co2, 2)}
              unit="ton"
              source={sumberEmisi(store.faktorEmisi)}
            />
            <Stat
              size="sm"
              className="rise"
              label={t("stat_rp_label")}
              value={formatRupiahRingkas(stats.rp)}
              source={t("stat_rp_source")}
            />
            <Stat
              size="sm"
              className="rise"
              label={t("stat_tx_label")}
              value={stats.transaksi}
              source={t("stat_tx_source")}
            />
          </div>

          <div className="grid gap-4 pt-4 lg:grid-cols-2">
            {mingguan ? (
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <SectionLabel>
                    {t("weekly_title")}
                  </SectionLabel>
                  <span className="type-body-sm tnum rounded-xs bg-sunken px-2 py-0.5 font-bold text-ink">
                    {t("weekly_val", { val: mingguan.at(-1)!.kg.toFixed(0) })}
                  </span>
                </div>
                <div className="pt-4">
                  <TrenMingguan data={mingguan} />
                </div>
              </Card>
            ) : (
              <EmptyState
                icon={<ScanLine />}
                title={t("empty_scan_title")}
                description={t("empty_scan_desc")}
              />
            )}

            {stats.transaksi === 0 && (
              <EmptyState
                icon={<Leaf />}
                title={t("empty_tx_title")}
                description={t("empty_tx_desc")}
              />
            )}
          </div>
        </Container>
      </main>
    </>
  );
}
