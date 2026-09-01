"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  KeyRound,
  Lock,
  Printer,
  QrCode,
  Star,
  Tag,
  Truck,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import { StatusHero, urutanStatus } from "@/components/order-bits";
import {
  Button,
  ButtonLink,
  Card,
  GradeBadge,
  Input,
  SectionLabel,
} from "@/components/ui";
import { formatRupiah, num } from "@/lib/format";
import { getPengirimanOrder, getUlasanPesanan } from "@/lib/data";
import { checklistUntuk, ringkasChecklist } from "@/lib/rantai-dingin";
import { bolehMenilai, lawanTransaksi } from "@/lib/ulasan";
import { haptic } from "@/lib/haptic";
import type { Pengiriman, StatusPesanan, Ulasan } from "@/lib/types";
import { useStore } from "@/lib/store";
import { ChatWindow } from "@/components/chat-window";
import { RatingModal } from "@/components/rating-modal";
import { TransactionLifecycle } from "@/components/transaction-lifecycle";
import { useTranslations } from "@/lib/i18n";

/*
 * Tiga permukaan di balik tombol, dimuat saat dibuka.
 *
 * Ketiganya menarik `@/lib/qr` dan `PrintModal` ke dalam first-load layar ini,
 * padahal pemindai kode hanya dipakai saat serah terima dan dua modal cetak
 * hanya dibuka kalau petani benar-benar mencetak. Route ini yang paling berat
 * di aplikasi dan sempat melewati anggaran 260 KB gzip karenanya.
 *
 * `ssr: false` aman: ketiganya sudah client component, dan tidak ada satu pun
 * yang menghasilkan tampilan saat tertutup — jadi tidak ada yang hilang dari
 * render pertama. Gerbang `showX &&` di tempat render-nya yang menahan chunk:
 * `dynamic` saja tetap mengunduh begitu komponennya terpasang.
 */
const PemindaiKode = dynamic(
  () => import("@/components/pemindai-kode").then((m) => m.PemindaiKode),
  { ssr: false },
);
const PrintableReceiptModal = dynamic(
  () => import("@/components/printable-receipt-modal").then((m) => m.PrintableReceiptModal),
  { ssr: false },
);
const PrintableCrateLabelsModal = dynamic(
  () =>
    import("@/components/printable-crate-labels-modal").then(
      (m) => m.PrintableCrateLabelsModal,
    ),
  { ssr: false },
);

/** Bandingkan kode serah terima tanpa peduli spasi, tanda hubung, dan huruf besar. */
const bersihkanKode = (x: string) => x.replace(/[\s-]/g, "").toUpperCase();

export default function PesananPetaniDetail() {
  const t = useTranslations("pesanan");
  const tLogistik = useTranslations("logistik");
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const router = useRouter();
  const order = store.orders.find((o) => o.id === id);

  const [kode, setKode] = useState("");
  const [beratAktual, setBeratAktual] = useState("");
  const [gagal, setGagal] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showPemindai, setShowPemindai] = useState(false);
  const [ulasanPesanan, setUlasanPesanan] = useState<Ulasan[]>([]);
  /**
   * Penjemputan milik pesanan ini, bukan "pengiriman pertama yang ada".
   *
   * Tombol jadwalkan dulu melempar ke `/petani/logistik` yang selalu merender
   * baris pertama basis data, jadi petani bisa mencentang checklist rantai
   * dingin muatan orang lain tanpa pernah tahu.
   */
  const [pengiriman, setPengiriman] = useState<Pengiriman | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCrateLabelsModal, setShowCrateLabelsModal] = useState(false);
  const [besok] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));

  const ringkasPenjemputan = pengiriman
    ? ringkasChecklist(
        pengiriman.checklist,
        checklistUntuk(pengiriman.komoditas ?? ""),
      )
    : null;

  const uid = store.sesi?.userId;
  const lawan = order ? lawanTransaksi(order, uid) : null;
  const izin = order
    ? bolehMenilai(order, uid, ulasanPesanan)
    : { boleh: false, alasan: "bukan_pihak" as const };
  const sudahUlas = izin.alasan === "sudah_menilai";

  useEffect(() => {
    if (store.ready && !order) router.replace("/petani/pesanan");
  }, [store.ready, order, router]);

  // Status "sudah menilai" dibaca dari basis data, bukan diingat komponen:
  // memuat ulang halaman dulu memunculkan kembali tombolnya, dan penilaian
  // kedua ditolak constraint unik dengan pesan yang tidak berarti bagi petani.
  useEffect(() => {
    if (!order || order.status !== "selesai") return;
    let batal = false;
    void getUlasanPesanan(order.id).then((d) => {
      if (!batal) setUlasanPesanan(d);
    });
    return () => {
      batal = true;
    };
  }, [order]);

  // Pesanan yang belum dikonfirmasi belum punya muatan, jadi tidak ada yang
  // perlu ditanyakan ke basis data di tahap itu.
  const orderId = order?.id;
  const perluPenjemputan = order
    ? order.status !== "dipesan" && (order.status_kasus ?? "normal") === "normal"
    : false;
  useEffect(() => {
    if (!orderId || !perluPenjemputan) return;
    let batal = false;
    void getPengirimanOrder(orderId).then((p) => {
      if (!batal) setPengiriman(p);
    });
    return () => {
      batal = true;
    };
  }, [orderId, perluPenjemputan]);

  const kodeBenar = order?.kode ?? "";

  /**
   * Hasil pindaian dicocokkan di sini, sebelum diisikan ke kolom.
   *
   * QR pesanan lain akan lolos ke `verifikasiSerahTerima` dan ditolak di sana
   * juga, tetapi dengan pesan "kode tidak cocok" yang membuat petani mengira
   * kode pembelinya salah — padahal ia hanya memindai layar yang keliru.
   */
  const terimaHasilPindai = useCallback(
    (nilai: string) => {
      setShowPemindai(false);
      if (bersihkanKode(nilai) !== bersihkanKode(kodeBenar)) {
        haptic.error();
        toast.galat(t("scan_mismatch"));
        return;
      }
      haptic.success();
      setKode(nilai.toUpperCase());
      setGagal(false);
      toast.sukses(t("scan_filled"));
    },
    [kodeBenar, t, setShowPemindai],
  );

  if (!order) return null;

  const transaksiNormal = (order.status_kasus ?? "normal") === "normal";
  const tahap = urutanStatus(order.status);
  const langkah = (
    {
      dipesan: t("next_dipesan"),
      dikonfirmasi: t("next_dikonfirmasi"),
      serah_terima: t("next_serah_terima"),
      selesai: t("next_selesai"),
    } satisfies Record<StatusPesanan, string>
  )[order.status];

  function verifikasi() {
    if (!order) return;
    // Koma desimal Indonesia diterima apa adanya; petani tidak perlu tahu
    // bahwa parseFloat hanya mengerti titik.
    const berat = Number.parseFloat(beratAktual.replace(",", "."));
    const ok = store.verifikasiSerahTerima(
      order.id,
      kode,
      Number.isFinite(berat) ? berat : undefined,
    );
    setGagal(!ok);
    if (ok) {
      haptic.success();
      setKode("");
      setBeratAktual("");
    } else {
      haptic.error();
    }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(
    t("wa_message", { name: order.pembeli, item: order.nama, id: order.id }),
  )}`;

  return (
    <>
      <BackBar
        title={t("detail_title", { id: order.id })}
        href="/petani/pesanan"
        parentLabel={t("parent_label")}
      />

      <main className="flex-1 py-4">
        <Container className="flex flex-col gap-6">
          <StatusHero
            status={order.status}
            lawanLabel={t("buyer_label", { name: order.pembeli })}
            langkah={langkah}
          />

          <TransactionLifecycle order={order} peran="petani" />

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-6">
              {transaksiNormal && (order.status === "selesai" ? (
                <Card className="flex flex-col items-center p-6 text-center">
                  <CheckCircle2 aria-hidden className="size-8 text-brand" />
                  <p className="type-heading-sm pt-3 text-ink">
                    {t("status_selesai_title")}
                  </p>
                  <p className="type-body-md pt-1 text-muted">
                    {t("status_selesai_desc")}
                  </p>

                  <div className="w-full pt-4">
                    {sudahUlas ? (
                      <p className="type-body-sm flex items-center justify-center gap-1.5 rounded-md bg-sunken py-2 font-bold text-muted">
                        <Star aria-hidden className="size-4 fill-grade-b text-grade-b" />
                        {t("review_sent")}
                      </p>
                    ) : izin.boleh ? (
                      <Button
                        onClick={() => setShowRating(true)}
                        variant="primary"
                        block
                        className="gap-2"
                      >
                        <Star aria-hidden className="size-4" />
                        {t("review_btn", { name: lawan?.nama ?? "pembeli" })}
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ) : order.status === "dipesan" ? (
                /* Tahap ini sebelumnya tidak punya layar sendiri: status
                   "dipesan" langsung menampilkan form verifikasi serah terima,
                   jadi petani bisa menutup transaksi tanpa pesanannya pernah
                   dikonfirmasi maupun dijadwalkan. Dua tahap di rel atas hanya
                   gambar. */
                <Card className="p-5">
                  <SectionLabel>{t("confirm_title")}</SectionLabel>
                  <p className="type-body-md pt-2 text-muted">{t("confirm_desc")}</p>
                  <p className="type-body-sm tnum pt-3 rounded-md bg-sunken p-3 text-muted">
                    {t("confirm_stock", { weight: num(order.berat_kg, 0) })}
                  </p>
                  <div className="pt-4">
                    <Button
                      onClick={() => {
                        haptic.success();
                        store.setOrderStatus(order.id, "dikonfirmasi");
                      }}
                      variant="primary"
                      size="lg"
                      block
                      className="gap-2"
                    >
                      <CheckCircle2 aria-hidden className="size-4" />
                      {t("confirm_btn")}
                    </Button>
                  </div>
                  <p className="type-body-sm pt-3 text-center text-muted">
                    {t("confirm_chat_hint")}
                  </p>
                </Card>
              ) : order.status === "dikonfirmasi" ? (
                <Card className="p-5">
                  <SectionLabel>{t("schedule_title")}</SectionLabel>
                  <p className="type-body-md pt-2 text-muted">{t("schedule_desc")}</p>
                  <div className="flex flex-col gap-3 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="type-label mb-1 block text-label">
                          {t("date_label")}
                        </label>
                        <input
                          type="date"
                          className="type-body-sm w-full rounded-md border border-line bg-surface p-2 text-ink outline-none focus:border-brand"
                          defaultValue={besok}
                        />
                      </div>
                      <div>
                        <label className="type-label mb-1 block text-label">
                          {t("time_label")}
                        </label>
                        <select className="type-body-sm w-full rounded-md border border-line bg-surface p-2 text-ink outline-none focus:border-brand">
                          <option>{t("time_pagi")}</option>
                          <option>{t("time_siang")}</option>
                          <option>{t("time_sore")}</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        haptic.medium();
                        store.setOrderStatus(order.id, "serah_terima");
                        router.push(
                          pengiriman
                            ? `/petani/logistik/${pengiriman.id}`
                            : "/petani/logistik",
                        );
                      }}
                      variant="primary"
                      block
                      className="mt-2 gap-2"
                    >
                      <CalendarClock aria-hidden className="size-4" />
                      {t("schedule_btn")}
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-5">
                  <SectionLabel>{t("verify_title")}</SectionLabel>
                  <p className="type-body-md pt-2 text-muted">{t("verify_desc")}</p>

                  {/* Pindai lebih dulu, ketik sebagai jalan cadangan. QR di layar
                      pembeli selama ini tidak pernah dibaca oleh apa pun. */}
                  <div className="pt-4">
                    <Button
                      onClick={() => setShowPemindai(true)}
                      variant="outline"
                      size="lg"
                      block
                      className="gap-2"
                    >
                      <QrCode aria-hidden className="size-4" />
                      {t("btn_scan")}
                    </Button>
                  </div>

                  <div className="pt-4">
                    <Input
                      value={kode}
                      onChange={(e) => {
                        setKode(e.target.value.toUpperCase());
                        setGagal(false);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && verifikasi()}
                      placeholder={t("code_placeholder")}
                      aria-label={t("code_aria")}
                      error={gagal ? t("code_error") : null}
                      prefix={<KeyRound aria-hidden className="size-4" />}
                      className="font-mono font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:tracking-normal"
                    />
                  </div>

                  {/* Berat timbangan saat serah terima (F-101). Opsional:
                      inilah satu-satunya kebenaran lapangan yang mengkalibrasi
                      faktor densitas estimasi berat, tetapi petani tanpa
                      timbangan tetap harus bisa menyelesaikan pesanan. */}
                  <div className="pt-3">
                    <Input
                      value={beratAktual}
                      onChange={(e) => setBeratAktual(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && verifikasi()}
                      inputMode="decimal"
                      placeholder={String(order.berat_kg)}
                      label={t("weight_label")}
                      suffix="kg"
                      hint={t("weight_hint")}
                      className="tnum"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={verifikasi}
                      size="lg"
                      block
                      disabled={bersihkanKode(kode).length < 6}
                    >
                      {t("verify_btn")}
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Jalan pulang ke muatan pesanan ini. Sesudah menjadwalkan,
                  petani terlempar sekali ke layar logistik dan tidak punya
                  pintu balik selain menggali lewat tab Akun — padahal checklist
                  rantai dingin justru dicentang keesokan paginya. */}
              {transaksiNormal && pengiriman && (
                <Card className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <SectionLabel>{t("pickup_link_title")}</SectionLabel>
                      <p className="type-body-md pt-2 text-muted">
                        {t("pickup_link_desc", {
                          name: pengiriman.komoditas ?? order.nama,
                          weight: num(pengiriman.berat_kg ?? order.berat_kg, 0),
                        })}
                      </p>
                    </div>
                    <Truck aria-hidden className="size-5 shrink-0 text-brand" />
                  </div>

                  <p className="type-body-sm tnum font-bold text-muted">
                    {t("pickup_link_checklist", {
                      done: ringkasPenjemputan?.selesai ?? 0,
                      total: ringkasPenjemputan?.total ?? 0,
                    })}
                    {" · "}
                    {tLogistik(
                      `status_${pengiriman.status}` as Parameters<
                        typeof tLogistik
                      >[0],
                    )}
                  </p>

                  <ButtonLink
                    href={`/petani/logistik/${pengiriman.id}`}
                    variant="outline"
                    block
                    className="gap-2"
                  >
                    <Truck aria-hidden className="size-4" />
                    {t("pickup_link_btn")}
                  </ButtonLink>
                </Card>
              )}

              {/* Tahap yang belum tiba tetap disebut, supaya alurnya bisa
                  dibaca utuh dan tidak terasa seperti layar yang kehilangan
                  tombolnya. */}
              {transaksiNormal && tahap < urutanStatus("serah_terima") && (
                <div className="flex gap-3 rounded-xl border border-dashed border-line p-4">
                  <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-label" />
                  <div>
                    <p className="type-body-sm font-bold text-ink">
                      {t("verify_locked_title")}
                    </p>
                    <p className="type-body-sm pt-0.5 text-muted">
                      {t("verify_locked_desc")}
                    </p>
                  </div>
                </div>
              )}

              {/* Order summary */}
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-heading-sm text-ink">{order.nama}</p>
                    <div className="flex items-center gap-2 pt-1.5">
                      <GradeBadge grade={order.grade} size="sm" />
                      <span className="type-body-sm tnum text-muted">
                        • {order.berat_kg} kg
                      </span>
                    </div>
                    {order.berat_aktual_kg != null && (
                      <p className="type-body-sm tnum pt-1 text-muted">
                        {t("actual_weight", { val: num(order.berat_aktual_kg, 2) })}
                      </p>
                    )}
                  </div>
                  <div className="text-end">
                    <SectionLabel>{t("price_label")}</SectionLabel>
                    <p className="type-body-md tnum pt-0.5 font-bold text-ink">
                      {formatRupiah(order.harga_per_kg)}/kg
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="type-heading-sm text-ink">{t("total_label")}</span>
                  <span className="type-heading-lg tnum text-brand">
                    {formatRupiah(order.total)}
                  </span>
                </div>
              </Card>
            </div>

            {/* Chat Dalam Aplikasi (F-33) */}
            <div className="flex flex-col gap-2">
              <ChatWindow
                orderId={order.id}
                currentUserId={store.sesi?.userId ?? ""}
                currentUserName={store.sesi?.nama ?? order.petani}
                recipientId={order.pembeli_id ?? ""}
                recipientName={order.pembeli}
                title={t("chat_title")}
              />
            </div>
          </div>
        </Container>
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-surface py-3">
        <Container className="flex flex-wrap items-center justify-end gap-3">
          <Button
            onClick={() => setShowCrateLabelsModal(true)}
            variant="outline"
            size="lg"
            className="w-full gap-2 md:w-auto"
          >
            <Tag className="size-4" /> {t("btn_print_crate")}
          </Button>
          <Button
            onClick={() => setShowReceiptModal(true)}
            variant="primary"
            size="lg"
            className="w-full gap-2 md:w-auto"
          >
            <Printer className="size-4" /> {t("btn_print_receipt")}
          </Button>
          <ButtonLink
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="lg"
            className="w-full md:w-auto"
          >
            {t("btn_wa")}
          </ButtonLink>
        </Container>
      </footer>

      {showPemindai && (
        <PemindaiKode
          isOpen
          onClose={() => setShowPemindai(false)}
          onKode={terimaHasilPindai}
        />
      )}

      {/* Ulasan pasca transaksi (F-42) */}
      {lawan && (
        <RatingModal
          isOpen={showRating}
          onClose={() => setShowRating(false)}
          orderId={order.id}
          penilaiId={uid ?? ""}
          dinilaiId={lawan.id}
          dinilaiNama={lawan.nama}
          // Dibaca ulang dari basis data, bukan ditebak: ulasan yang gagal
          // tersimpan tidak boleh membuat tombolnya hilang.
          onSuccess={() => void getUlasanPesanan(order.id).then(setUlasanPesanan)}
        />
      )}

      {/* Modal Cetak Tanda Terima Digital PDF (F-41) */}
      {showReceiptModal && (
        <PrintableReceiptModal
          order={order}
          isOpen
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Modal Cetak Label Peti A4 (F-61) */}
      {showCrateLabelsModal && (
        <PrintableCrateLabelsModal
          nama={order.nama}
          komoditas={order.nama.split(" ")[0] || "Cabai"}
          grade={order.grade}
          hashAudit={order.kode}
          beratKg={Math.round(order.berat_kg / 4) || 25}
          isOpen
          onClose={() => setShowCrateLabelsModal(false)}
        />
      )}
    </>
  );
}
