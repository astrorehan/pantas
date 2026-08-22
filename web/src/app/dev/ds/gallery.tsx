"use client";

import { useState } from "react";
import {
  Bell,
  Camera,
  CheckCircle2,
  CloudOff,
  Inbox,
  Leaf,
  Pause,
  ScanLine,
  Search,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  cx,
  Dialog,
  EmptyState,
  GradeBadge,
  GradeBar,
  GradeMark,
  IconButton,
  Input,
  Radio,
  SectionLabel,
  Select,
  Sheet,
  Skeleton,
  SkeletonCard,
  SkeletonText,
  Stat,
  Stepper,
  Switch,
  TabPanel,
  Table,
  Tabs,
  Textarea,
  ThemeToggle,
  Timeline,
  toast,
  type ButtonSize,
  type ButtonVariant,
  type Column,
  PANTAS_ICON_CATALOG,
} from "@/components/ui";
import { FilterSheet } from "@/components/ui/filter-sheet";
import { HeroCard } from "@/components/ui/hero-card";
import { Menu } from "@/components/ui/menu";
import { RingkasBaris } from "@/components/ui/ringkas-baris";
import { Container } from "@/components/container";
import { UnreadBadge } from "@/components/unread-badge";
import type { Grade } from "@/lib/types";

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "contrast",
  "danger",
];
const SIZES: ButtonSize[] = ["sm", "md", "lg", "xl"];
const GRADES: Grade[] = ["A", "B", "C", "REJECT"];

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-line pt-8">
      <h2 className="type-heading-lg text-ink">{title}</h2>
      {hint && <p className="type-body-md pt-1 text-muted">{hint}</p>}
      <div className="pt-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  className,
  children,
}: {
  label: string;
  /** Latar khusus — dipakai varian `contrast`, yang hanya sah di atas brand. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 py-3">
      <SectionLabel>{label}</SectionLabel>
      <div className={cx("flex flex-wrap items-center gap-3", className)}>
        {children}
      </div>
    </div>
  );
}

interface DemoRow {
  id: string;
  komoditas: string;
  grade: Grade;
  berat: number;
  total: number;
}

const ROWS: DemoRow[] = [
  { id: "PNT-101", komoditas: "Tomat Ceri", grade: "A", berat: 120, total: 2_640_000 },
  { id: "PNT-102", komoditas: "Cabai Rawit", grade: "B", berat: 45, total: 1_890_000 },
  { id: "PNT-103", komoditas: "Timun Lokal", grade: "C", berat: 300, total: 1_200_000 },
  { id: "PNT-104", komoditas: "Wortel Impor", grade: "REJECT", berat: 80, total: 240_000 },
];

const COLUMNS: Column<DemoRow>[] = [
  { key: "id", header: "Kode", cell: (r) => <span className="font-mono">{r.id}</span> },
  { key: "komoditas", header: "Komoditas", cell: (r) => r.komoditas, sortable: true },
  { key: "grade", header: "Grade", cell: (r) => <GradeBadge grade={r.grade} size="sm" /> },
  { key: "berat", header: "Berat", cell: (r) => `${r.berat} kg`, align: "end", sortable: true, hideBelow: "sm" },
  {
    key: "total",
    header: "Total",
    cell: (r) => `Rp ${r.total.toLocaleString("id-ID")}`,
    align: "end",
    sortable: true,
  },
];

export default function Gallery() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState("semua");
  const [segment, setSegment] = useState("grid");
  const [komoditas, setKomoditas] = useState("tomato_ceri");
  const [switchOn, setSwitchOn] = useState(true);
  const [dsGrade, setDsGrade] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({
    key: "komoditas",
    dir: "asc",
  });

  return (
    <main id="konten" className="min-h-dvh bg-canvas py-8">
      <Container className="flex flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="type-label text-label">Design System</p>
            <h1 className="type-display-md text-ink">Panen</h1>
            <p className="type-body-md max-w-prose pt-2 text-muted">
              Setiap komponen ditulis sendiri di atas Tailwind primitives,
              tidak ada UI kit pihak ketiga. Ganti tema di kanan untuk memeriksa
              kontras di kedua mode.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Section id="tipografi" title="Tipografi" hint="Skala §7.3. Ukuran desktop aktif dari 768px.">
          <div className="flex flex-col gap-2">
            <p className="type-display-lg text-ink">Display LG: Setiap Panen</p>
            <p className="type-display-md text-ink">Display MD: Pantas Dihargai</p>
            <p className="type-heading-lg text-ink">Heading LG: Hasil AI Grading</p>
            <p className="type-heading-md text-ink">Heading MD: Komposisi Batch</p>
            <p className="type-heading-sm text-ink">Heading SM: Rincian perhitungan</p>
            <p className="type-body-lg text-ink">Body LG: Harga acuan pasar hari ini</p>
            <p className="type-body-md text-ink">Body MD: ukuran minimum teks informatif</p>
            <p className="type-body-sm text-muted">Body SM: metadata dan keterangan</p>
            <p className="type-label text-label">Label: eyebrow</p>
            <p className="type-mono-sm text-muted">
              mono-sm: hash_audit: sha256:9f2c…a41b
            </p>
            <p className="type-mono-md text-muted">
              mono-md: yolo11n-cls-pantas-v1.4
            </p>
          </div>
        </Section>

        <Section
          id="palet"
          title="Palet Panen"
          hint="Tiga ramp: oat (netral), leaf (brand), clay (aksen hangat). Komponen tidak pernah memanggil ini langsung."
        >
          <div className="flex flex-col gap-4">
            {/* Kelas ditulis utuh, bukan `bg-${langkah}`: Tailwind memindai
                kode sumber sebagai teks, jadi nama kelas yang dirakit saat
                runtime tidak pernah menghasilkan CSS. */}
            {(
              [
                [
                  "oat: netral",
                  [
                    ["stone-50", "bg-stone-50"], ["stone-100", "bg-stone-100"],
                    ["stone-200", "bg-stone-200"], ["stone-300", "bg-stone-300"],
                    ["stone-400", "bg-stone-400"], ["stone-500", "bg-stone-500"],
                    ["stone-700", "bg-stone-700"], ["stone-900", "bg-stone-900"],
                  ],
                ],
                [
                  "leaf: brand",
                  [
                    ["green-50", "bg-green-50"], ["green-100", "bg-green-100"],
                    ["green-200", "bg-green-200"], ["green-300", "bg-green-300"],
                    ["green-500", "bg-green-500"], ["green-600", "bg-green-600"],
                    ["green-700", "bg-green-700"], ["green-900", "bg-green-900"],
                  ],
                ],
                [
                  "clay: aksen",
                  [
                    ["clay-50", "bg-clay-50"], ["clay-100", "bg-clay-100"],
                    ["clay-300", "bg-clay-300"], ["clay-500", "bg-clay-500"],
                    ["clay-600", "bg-clay-600"], ["clay-700", "bg-clay-700"],
                    ["clay-900", "bg-clay-900"],
                  ],
                ],
              ] as const
            ).map(([nama, langkah]) => (
              <div key={nama}>
                <p className="type-body-sm pb-1.5 font-mono text-muted">{nama}</p>
                <div className="flex overflow-hidden rounded-sm">
                  {langkah.map(([label, cls]) => (
                    <span key={label} className={`h-10 flex-1 ${cls}`} title={label} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="warna"
          title="Warna semantik"
          hint="Komponen hanya memakai token ini, tidak pernah primitif. Pemisahan kanvas/kartu/cekung yang membuat Card bisa melepas garisnya."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              ["canvas", "bg-canvas"],
              ["surface", "bg-surface"],
              ["sunken", "bg-sunken"],
              ["overlay", "bg-overlay"],
              ["brand", "bg-brand"],
              ["brand-deep", "bg-brand-deep"],
              ["brand-tint", "bg-brand-tint"],
              ["danger", "bg-danger"],
              ["grade-a", "bg-grade-a"],
              ["grade-b", "bg-grade-b"],
              ["grade-c", "bg-grade-c"],
              ["grade-reject", "bg-grade-reject"],
              ["line", "bg-line"],
              ["line-strong", "bg-line-strong"],
              ["field", "bg-field"],
              ["field-active", "bg-field-active"],
            ].map(([name, cls]) => (
              <div key={name} className="rounded-md border border-line p-2">
                <div className={`h-12 rounded-sm ${cls}`} />
                <p className="type-body-sm pt-2 font-mono text-muted">{name}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="ladang"
          title="Bidang chrome"
          hint="Bar, sidebar, dan bottom nav duduk di atas --field-base. Isinya memakai keluarga token sendiri; focus ring pindah ke green-200 karena aksen hijau di atas hijau hanya 1,42:1."
        >
          <div className="on-field flex flex-wrap items-center gap-3 rounded-md bg-field p-4">
            <span className="type-heading-md text-field-ink">PANTAS</span>
            <span className="type-body-md text-field-muted">
              teks sekunder di ladang
            </span>
            <span className="type-body-md rounded-md bg-field-active px-3 py-1.5 font-bold text-on-field-active">
              tab aktif
            </span>
            <button
              type="button"
              className="tap focus-ring type-body-md rounded-md border border-field-line px-3 py-1.5 text-field-muted hover:bg-field-hover hover:text-field-ink"
            >
              tab diam, fokuskan lewat Tab
            </button>
            <UnreadBadge n={3} />
          </div>
        </Section>

        <Section id="tombol" title="Button" hint="6 varian × 4 ukuran × loading / disabled / icon-only. `contrast` dipakai di atas isian brand, baris itu sengaja berlatar hijau.">
          {VARIANTS.map((v) => (
            <Row
              key={v}
              label={v}
              className={v === "contrast" ? "rounded-md bg-brand p-3" : undefined}
            >
              {SIZES.map((s) => (
                <Button key={s} variant={v} size={s}>
                  Terbitkan
                </Button>
              ))}
              <Button variant={v} loading>
                Memproses
              </Button>
              <Button variant={v} disabled>
                Nonaktif
              </Button>
              <IconButton label={`Ikon ${v}`} variant={v}>
                <Camera aria-hidden className="size-4" />
              </IconButton>
            </Row>
          ))}
          <Row label="link + block">
            <ButtonLink href="#tombol" block className="max-w-xs">
              ButtonLink block
            </ButtonLink>
          </Row>
        </Section>

        <Section
          id="grade"
          title="Grade"
          hint="Huruf memikul NFR-24, bukan warna: A/B/C tetap terbaca di cetakan hitam-putih, dan REJECT satu-satunya yang berarsir."
        >
          <Row label="tag: lg">
            {GRADES.map((g) => (
              <GradeBadge key={g} grade={g} size="lg" />
            ))}
          </Row>
          <Row label="tag: md">
            {GRADES.map((g) => (
              <GradeBadge key={g} grade={g} />
            ))}
          </Row>
          <Row label="tag: sm">
            {GRADES.map((g) => (
              <GradeBadge key={g} grade={g} size="sm" />
            ))}
          </Row>
          <Row label="solid: di atas foto">
            {GRADES.map((g) => (
              <GradeBadge key={g} grade={g} variant="solid" />
            ))}
          </Row>
          <Row label="outline">
            {GRADES.map((g) => (
              <GradeBadge key={g} grade={g} variant="outline" />
            ))}
          </Row>
          <Row label="mark: baris padat">
            {GRADES.map((g) => (
              <GradeBadge key={g} grade={g} variant="mark" />
            ))}
          </Row>
          <Row label="greyscale (uji NFR-24)">
            <span className="flex flex-wrap items-center gap-2 grayscale">
              {GRADES.map((g) => (
                <GradeBadge key={g} grade={g} />
              ))}
            </span>
          </Row>
          <Row label="bentuk legenda">
            {GRADES.map((g) => (
              <GradeMark key={g} grade={g} className="size-6" />
            ))}
          </Row>
          <div className="max-w-lg pt-2">
            <SectionLabel>GradeBar</SectionLabel>
            <GradeBar
              className="pt-2"
              komposisi={{ A: 0.14, B: 0.6, C: 0.21, REJECT: 0.05 }}
              height={22}
            />
          </div>
        </Section>

        <Section id="form" title="Form" hint="Label, hint, error, prefix/suffix, counter.">
          <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
            <Input label="Nama listing" placeholder="Tomat Ceri Pakem" />
            <Input
              label="Harga per kg"
              prefix="Rp"
              suffix="/kg"
              inputMode="numeric"
              defaultValue="24.000"
            />
            <Input
              label="Email"
              type="email"
              defaultValue="bukan-email"
              error="Format email tidak valid."
            />
            <Input
              label="Cari"
              type="search"
              placeholder="Cari komoditas…"
              prefix={<Search aria-hidden className="size-4" />}
            />
            <Select
              label="Komoditas"
              value={komoditas}
              onChange={setKomoditas}
              hint="Menentukan ambang batas grading."
              options={[
                { value: "tomato_sayur", label: "Tomat Sayur", group: "Tomat" },
                { value: "tomato_ceri", label: "Tomat Ceri", group: "Tomat" },
                { value: "chili_rawit", label: "Cabai Rawit", group: "Cabai" },
                { value: "chili_hijau", label: "Cabai Hijau Besar", group: "Cabai", disabled: true },
              ]}
            />
            <Textarea
              label="Catatan"
              placeholder="Panen pagi, belum dicuci…"
              counter="0/280"
            />
            <div className="flex flex-col gap-1">
              <SectionLabel>Pilihan</SectionLabel>
              <Checkbox label="Punya laporan AI" hint="Hanya listing dengan hash audit" defaultChecked />
              <Checkbox label="Sebagian terpilih" indeterminate />
              <Checkbox label="Nonaktif" disabled />
              <Radio name="ds-radio" label="Jemput mandiri" defaultChecked />
              <Radio name="ds-radio" label="Konsolidasi rute" />
            </div>
            <div className="flex flex-col gap-1">
              <SectionLabel>Switch</SectionLabel>
              <Switch
                label="Panduan suara"
                hint="Bacakan instruksi di layar pindai"
                checked={switchOn}
                onCheckedChange={setSwitchOn}
              />
              <Switch label="Nonaktif" checked={false} onCheckedChange={() => {}} disabled />
            </div>
          </div>
        </Section>

        <Section id="stat" title="Stat" hint="Setiap angka membawa asal-usulnya (§5.3 aturan 2).">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              size="sm"
              label="Panen terselamatkan"
              value="1.240"
              unit="kg"
              icon={<Leaf aria-hidden className="size-3.5" />}
              delta={{ value: "+12% vs 30 hari", direction: "up" }}
              source="Jumlah berat pesanan berstatus selesai."
            />
            <Stat size="sm" label="CO₂e dicegah" value="0,66" unit="ton" source="Poore & Nemecek (2018)." />
            <Stat size="md" label="Pendapatan" value="Rp 8,4 jt" />
            <Stat
              size="sm"
              label="Susut"
              value="3,1"
              unit="%"
              delta={{ value: "−0,4 pt", direction: "down", good: true }}
            />
          </div>
        </Section>

        <Section id="kartu" title="Card">
          <div className="grid gap-3 lg:grid-cols-3">
            <Card variant="flat">
              <CardHeader title="Flat" hint="Default" />
              <CardBody>
                <p className="type-body-md text-muted">Permukaan dasar.</p>
              </CardBody>
            </Card>
            <Card variant="raised">
              <CardHeader
                title="Raised"
                hint="shadow-e2"
                action={
                  <IconButton label="Hapus" size="sm">
                    <Trash2 aria-hidden className="size-4" />
                  </IconButton>
                }
              />
              <CardBody>
                <p className="type-body-md text-muted">Untuk konten menonjol.</p>
              </CardBody>
              <CardFooter>
                <Button size="sm" variant="ghost">
                  Batal
                </Button>
                <Button size="sm">Simpan</Button>
              </CardFooter>
            </Card>
            <Card variant="interactive" className="p-4">
              <p className="type-heading-sm text-ink">Interactive</p>
              <p className="type-body-md pt-1 text-muted">
                Hover menaikkan border dan bayangan.
              </p>
            </Card>
          </div>
        </Section>

        <Section
          id="layar-kerja"
          title="HeroCard, RingkasBaris, Menu, FilterSheet"
          hint="Perkakas layar kerja harian petani: satu tindakan besar, ringkasan sebagai kalimat, aksi sekunder di balik ⋯."
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <SectionLabel>HeroCard: aksi</SectionLabel>
              <HeroCard
                icon={<ScanLine aria-hidden className="size-6" />}
                eyebrow="Langkah berikutnya"
                title="2 penawaran menunggu jawaban"
                description="Pembeli sudah menyebut harga. Tawaran yang tidak dijawab akan kedaluwarsa dengan sendirinya."
                cta={{ label: "Jawab penawaran", href: "#" }}
              />
              <SectionLabel>HeroCard: menunggu</SectionLabel>
              <HeroCard
                tone="menunggu"
                icon={<CloudOff aria-hidden className="size-6" />}
                eyebrow="Sedang menunggu"
                title="3 pindaian menunggu koneksi"
                description="Tersimpan di perangkat ini dan akan otomatis dinilai begitu sinyal kembali."
                cta={{ label: "Lihat riwayat", href: "#" }}
              />
            </div>

            <Row label="RingkasBaris">
              <RingkasBaris
                items={[
                  { nilai: 4, label: "lot tayang", href: "#", hrefLabel: "4 lot tayang" },
                  { nilai: 2, label: "pesanan jalan", href: "#", hrefLabel: "2 pesanan jalan", sorot: true },
                  { nilai: "128 kg", label: "stok aktif" },
                ]}
              />
            </Row>

            <Row label="Menu: aksi sekunder">
              <Menu
                label="Aksi lain untuk Tomat Ceri"
                actions={[
                  { label: "Jeda listing", icon: <Pause aria-hidden className="size-4" />, onSelect: () => {} },
                  { label: "Tandai terjual", icon: <CheckCircle2 aria-hidden className="size-4" />, onSelect: () => {} },
                  { label: "Hapus lot", icon: <Trash2 aria-hidden className="size-4" />, tone: "danger", onSelect: () => {} },
                ]}
              />
              <Menu
                label="Menu dengan item nonaktif"
                align="start"
                actions={[
                  { label: "Lanjutkan tayang", onSelect: () => {} },
                  { label: "Tandai terjual", onSelect: () => {}, disabled: true },
                ]}
              />
            </Row>

            <Row label="FilterSheet">
              <FilterSheet jumlahAktif={0} onReset={() => setDsGrade("")}>
                <Select
                  id="ds-filter-grade"
                  label="Grade"
                  value={dsGrade}
                  onChange={setDsGrade}
                  options={[
                    { value: "", label: "Semua grade" },
                    ...GRADES.map((g) => ({ value: g, label: `Grade ${g}` })),
                  ]}
                />
              </FilterSheet>
              <FilterSheet
                title="Saring"
                description="Badge menyala saat ada filter aktif."
                jumlahAktif={dsGrade ? 1 : 2}
                onReset={() => setDsGrade("")}
              >
                <Select
                  id="ds-filter-grade-2"
                  label="Grade"
                  value={dsGrade}
                  onChange={setDsGrade}
                  options={[
                    { value: "", label: "Semua grade" },
                    ...GRADES.map((g) => ({ value: g, label: `Grade ${g}` })),
                  ]}
                />
              </FilterSheet>
            </Row>
          </div>
        </Section>

        <Section id="navigasi" title="Tabs, Stepper, Timeline">
          <div className="flex flex-col gap-6">
            <div>
              <Tabs
                label="Filter status pesanan"
                value={tab}
                onChange={setTab}
                items={[
                  { value: "semua", label: "Semua", count: 12 },
                  { value: "aktif", label: "Aktif", count: 4 },
                  { value: "selesai", label: "Selesai", count: 8 },
                  { value: "batal", label: "Dibatalkan", disabled: true },
                ]}
              />
              <TabPanel id="ds-tabs" value={tab} active>
                <p className="type-body-md pt-3 text-muted">
                  Panel aktif: <strong className="text-ink">{tab}</strong>
                </p>
              </TabPanel>
            </div>

            <Tabs
              label="Tampilan"
              variant="segmented"
              value={segment}
              onChange={setSegment}
              className="w-fit"
              items={[
                { value: "grid", label: "Grid" },
                { value: "tabel", label: "Tabel" },
                { value: "peta", label: "Peta" },
              ]}
            />

            <Stepper
              className="max-w-xl"
              current={1}
              steps={[
                { label: "Pindai" },
                { label: "Harga" },
                { label: "Terbitkan" },
              ]}
            />

            <Timeline
              className="max-w-md"
              events={[
                { id: "1", label: "Dipesan", at: "24 Jul 09.12", state: "done" },
                { id: "2", label: "Dikonfirmasi", at: "24 Jul 10.03", state: "done" },
                {
                  id: "3",
                  label: "Dijemput",
                  at: "25 Jul 07.40",
                  state: "current",
                  detail: "Rute #12, 4 titik, lereng Merapi",
                },
                { id: "4", label: "Serah terima", state: "pending" },
              ]}
            />
          </div>
        </Section>

        <Section id="tabel" title="Table" hint="Sticky header, kolom sortir, densitas, scroll horizontal sendiri.">
          <Table
            caption="Contoh daftar pesanan"
            columns={COLUMNS}
            rows={ROWS}
            rowKey={(r) => r.id}
            sort={sort}
            onSortChange={setSort}
          />
        </Section>

        <Section id="overlay" title="Dialog, Sheet, Toast">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setDialogOpen(true)}>Buka Dialog</Button>
            <Button variant="outline" onClick={() => setSheetOpen(true)}>
              Buka Sheet
            </Button>
            <Button variant="ghost" onClick={() => toast.sukses("Listing tayang", "Pembeli industri sudah bisa menemukannya.")}>
              Toast sukses
            </Button>
            <Button variant="ghost" onClick={() => toast.jaringan()}>
              Toast jaringan
            </Button>
          </div>

          <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title="Batalkan pesanan?"
            description="Pembeli akan menerima notifikasi pembatalan."
            footer={
              <>
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Tidak jadi
                </Button>
                <Button variant="danger" onClick={() => setDialogOpen(false)}>
                  Ya, batalkan
                </Button>
              </>
            }
          >
            <p className="type-body-md text-muted">
              Pesanan yang sudah dikonfirmasi memerlukan persetujuan dua pihak.
            </p>
          </Dialog>

          <Sheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title="Atur jumlah"
            description="Tomat Ceri Pakem, stok 300 kg"
            footer={
              <Button block onClick={() => setSheetOpen(false)}>
                Konfirmasi
              </Button>
            }
          >
            <p className="type-body-md text-muted">
              Bottom sheet di ponsel, side drawer di desktop, satu API.
            </p>
          </Sheet>
        </Section>

        <Section id="status" title="Badge, EmptyState, Skeleton">
          <Row label="badge">
            <Badge>Netral</Badge>
            <Badge tone="brand">Dalam rentang wajar</Badge>
            <Badge tone="warn">Di bawah rentang</Badge>
            <Badge tone="danger">Di atas rentang</Badge>
            <Badge tone="info" icon={<Bell aria-hidden className="size-3" />}>
              Baru
            </Badge>
          </Row>

          <div className="grid gap-4 pt-4 lg:grid-cols-2">
            <EmptyState
              icon={<Inbox />}
              title="Belum ada pesanan masuk"
              description="Pesanan dari pembeli industri muncul di sini."
              action={<Button variant="outline">Lihat katalog</Button>}
            />
            <div className="flex flex-col gap-3">
              <SkeletonCard className="max-w-56" />
              <SkeletonText lines={3} />
              <Skeleton className="h-11 w-40" rounded="full" />
            </div>
          </div>
        </Section>

        <Section
          id="f-73-icons"
          title="16. Ikon Domain Kustom PANTAS"
          hint="14 Ikon SVG kustom bertema pertanian (24×24px, stroke 1.75px) sesuai ketentuan aset mandiri lomba"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {PANTAS_ICON_CATALOG.map((item) => {
              const IconComp = item.Icon;
              return (
                <div
                  key={item.id}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border border-line bg-surface p-4 text-center transition-colors hover:border-ink/40"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-surface text-ink">
                    <IconComp className="size-6" />
                  </div>
                  <span className="text-xs font-semibold text-ink">{item.name}</span>
                  <span className="text-[10px] text-muted">{item.category}</span>
                </div>
              );
            })}
          </div>
        </Section>
      </Container>
    </main>
  );
}
