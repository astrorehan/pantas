"use client";

import Image from "next/image";
import Link from "next/link";
import { ClipboardList, Minus, Plus, Trash2 } from "lucide-react";
import { BackBar } from "@/components/chrome";
import { Container } from "@/components/container";
import {
  ButtonLink,
  Button,
  Card,
  EmptyState,
  GradeBadge,
  IconButton,
  SectionLabel,
  Dialog,
  Input,
  Textarea,
} from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { haptic } from "@/lib/haptic";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n";

export default function InquiryPage() {
  const store = useStore();
  const router = useRouter();
  const t = useTranslations("inquiry");
  const tProd = useTranslations("produk");
  const [modalOpen, setModalOpen] = useState(false);
  const [tanggalAmbil, setTanggalAmbil] = useState("");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);

  // Tiap baris membawa salinan listing-nya, jadi lot dari Supabase muncul di
  // sini persis seperti lot demo — dulu keduanya dicari ulang di array demo dan
  // hanya lot demo yang selamat.
  const items = Object.values(store.inquiry);

  const total = items.reduce((s, x) => s + x.qty * x.listing.harga_per_kg, 0);
  const handleKirim = async () => {
    setLoading(true);
    haptic.success();
    await store.buatPenawaran(tanggalAmbil, catatan);
    setLoading(false);
    setModalOpen(false);
    router.push("/pembeli/pesanan");
  };

  return (
    <>
      <BackBar title={t("title")} href="/pembeli" parentLabel={tProd("parent_katalog")} />

      <main className="flex-1 py-4">
        <Container width="narrow">
          {items.length === 0 ? (
            <EmptyState
              icon={<ClipboardList />}
              title={t("empty_title")}
              description={t("empty_desc")}
              action={
                <ButtonLink href="/pembeli" size="lg">
                  {t("btn_browse")}
                </ButtonLink>
              }
            />
          ) : (
            <>
              <SectionLabel>{t("items_count", { count: items.length })}</SectionLabel>

              <ul className="flex flex-col gap-3 pt-3">
                {items.map(({ listing, qty }) => (
                  <li key={listing.id}>
                    <Card className="p-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/pembeli/produk/${listing.id}`}
                          className="tap focus-ring relative size-16 shrink-0 overflow-hidden rounded-md"
                        >
                          <Image
                            src={listing.gambar}
                            alt={listing.nama}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="type-body-md truncate font-bold text-ink">
                            {listing.nama}
                          </p>
                          <p className="type-body-sm pt-0.5 text-muted">
                            {formatRupiah(listing.harga_per_kg)}/kg •{" "}
                            {listing.petani}
                          </p>
                          <div className="pt-1">
                            <GradeBadge grade={listing.grade} size="sm" />
                          </div>
                        </div>
                        <IconButton
                          label={t("remove_item", { name: listing.nama })}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            haptic.light();
                            store.setInquiryQty(listing, 0);
                          }}
                          className="border-transparent bg-transparent text-label hover:text-danger"
                        >
                          <Trash2 aria-hidden className="size-4" />
                        </IconButton>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                        <div className="flex items-center gap-1">
                          <IconButton
                            label={t("reduce_10")}
                            size="sm"
                            onClick={() => {
                              haptic.selection();
                              store.setInquiryQty(listing, qty - 10);
                            }}
                          >
                            <Minus aria-hidden className="size-4" />
                          </IconButton>
                          <span className="type-body-md tnum min-w-16 text-center font-bold text-ink">
                            {qty} {t("kg_unit")}
                          </span>
                          <IconButton
                            label={t("add_10")}
                            size="sm"
                            onClick={() => {
                              haptic.selection();
                              store.setInquiryQty(
                                listing,
                                Math.min(
                                  listing.stok_kg ?? listing.berat_kg,
                                  qty + 10,
                                ),
                              );
                            }}
                          >
                            <Plus aria-hidden className="size-4" />
                          </IconButton>
                        </div>
                        <p className="type-heading-sm tnum text-ink">
                          {formatRupiah(qty * listing.harga_per_kg)}
                        </p>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>

              <Card className="mt-4 flex items-center justify-between p-4">
                <span className="type-heading-sm text-ink">{t("est_total")}</span>
                <span className="type-heading-lg tnum text-brand">
                  {formatRupiah(total)}
                </span>
              </Card>
            </>
          )}
        </Container>
      </main>

      {items.length > 0 && (
        <footer className="sticky bottom-0 border-t border-line bg-surface py-3 z-30">
          <Container width="narrow" className="flex justify-end">
            <Button
              size="lg"
              className="w-full md:w-auto"
              onClick={() => setModalOpen(true)}
            >
              {t("btn_send_offer")}
            </Button>
          </Container>
        </footer>
      )}

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t("modal_title", { count: items.length })}
        description={t("modal_desc")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              {t("btn_cancel")}
            </Button>
            <Button onClick={handleKirim} loading={loading}>
              {t("btn_submit")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label={t("pickup_date_label")}
            type="date"
            value={tanggalAmbil}
            onChange={(e) => setTanggalAmbil(e.target.value)}
          />
          <Textarea
            label={t("note_label")}
            rows={3}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder={t("note_placeholder")}
          />
        </div>
      </Dialog>
    </>
  );
}

