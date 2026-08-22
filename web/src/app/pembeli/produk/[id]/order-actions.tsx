"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle, Minus, Plus, ShoppingCart } from "lucide-react";
import {
  Button,
  ButtonLink,
  IconButton,
  Sheet,
  toast,
} from "@/components/ui";
import { Container } from "@/components/container";
import { formatRupiah } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { useTranslations } from "@/lib/i18n";

/** Footer actions + the quantity sheet that actually creates the order. */
export default function OrderActions({ listing }: { listing: Listing }) {
  const router = useRouter();
  const store = useStore();
  const t = useTranslations("produk");
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(Math.min(listing.berat_kg, 50));
  const maxQty = listing.stok_kg ?? listing.berat_kg;

  const wa = `https://wa.me/?text=${encodeURIComponent(
    t("wa_message", {
      name: listing.petani,
      item: listing.nama,
      grade: listing.grade,
    }),
  )}`;

  function konfirmasi() {
    const order = store.createOrder(listing, qty);
    toast.sukses(t("toast_order_created"));
    router.push(`/pembeli/pesanan/${order.id}`);
  }

  return (
    <>
      <footer className="sticky bottom-0 z-10 border-t border-line bg-surface py-3">
        <Container className="flex gap-3 md:justify-end">
          <ButtonLink
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="lg"
            className="shrink-0"
          >
            <MessageCircle aria-hidden className="size-4 shrink-0" />
            {t("contact_farmer")}
          </ButtonLink>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setOpen(true)}
            className="flex-1 md:flex-none"
          >
            <ShoppingCart aria-hidden className="size-4" />
            {t("order_button")}
          </Button>
        </Container>
      </footer>

      {/* Quantity sheet — bottom sheet on a phone, side drawer on a laptop. */}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={listing.nama}
        description={t("sheet_desc", {
          price: formatRupiah(listing.harga_per_kg),
          stock: maxQty,
        })}
        footer={
          <div className="w-full">
            <Button size="xl" block onClick={konfirmasi}>
              {t("confirm_order")}
            </Button>
            <p className="type-body-sm pt-3 text-center text-muted">
              {t("payment_note")}
            </p>
          </div>
        }
      >
        <div className="flex items-center justify-center gap-4 pt-2">
          <IconButton
            label={t("minus_10_aria")}
            size="lg"
            onClick={() => setQty((q) => Math.max(10, q - 10))}
          >
            <Minus aria-hidden className="size-5" />
          </IconButton>
          <div className="min-w-28 text-center">
            <p className="type-display-md tnum text-ink">{qty}</p>
            <p className="type-body-sm text-muted">{t("unit_kg")}</p>
          </div>
          <IconButton
            label={t("plus_10_aria")}
            size="lg"
            onClick={() => setQty((q) => Math.min(maxQty, q + 10))}
          >
            <Plus aria-hidden className="size-5" />
          </IconButton>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-md bg-sunken p-3">
          <span className="type-body-md text-muted">{t("estimated_total")}</span>
          <span className="type-heading-md tnum text-brand">
            {formatRupiah(qty * listing.harga_per_kg)}
          </span>
        </div>
      </Sheet>
    </>
  );
}
