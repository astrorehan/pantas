"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui";
import { ChatWindow } from "./chat-window";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import type { Penawaran } from "@/lib/types";

/**
 * Obrolan yang menempel pada satu penawaran (F-33).
 *
 * Sengaja tidak ada chat bebas: percakapan hanya hidup di dalam penawaran atau
 * pesanan yang nyata, sehingga lawan bicara selalu punya konteks dan ruang
 * penyalahgunaannya sempit. Panelnya tertutup secara bawaan karena satu layar
 * bisa memuat banyak penawaran sekaligus — membuka semuanya berarti sekian
 * langganan Realtime untuk percakapan yang tidak sedang dibaca siapa pun.
 */
export function PenawaranChat({
  penawaran,
  lawanNama,
  namaLot,
}: {
  penawaran: Penawaran;
  /** Nama pihak seberang, dipakai di kepala panel dan pesan WhatsApp. */
  lawanNama: string;
  /** Nama lot yang sedang ditawar — konteks di baris pembuka WhatsApp. */
  namaLot: string;
}) {
  const store = useStore();
  const t = useTranslations("penawaran");
  const [terbuka, setTerbuka] = useState(false);

  const uid = store.sesi?.userId ?? "";
  const sebagaiPetani = uid === penawaran.petani_id;
  const lawanId = sebagaiPetani ? penawaran.pembeli_id : penawaran.petani_id;

  const wa = `https://wa.me/?text=${encodeURIComponent(
    t("chat_wa_text", {
      lawan: lawanNama,
      lot: namaLot,
      kg: penawaran.kuantitas_kg,
    }),
  )}`;

  return (
    <div className="mt-3 border-t border-line pt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTerbuka((v) => !v)}
        aria-expanded={terbuka}
        className="gap-2"
      >
        <MessageSquare aria-hidden className="size-4" />
        {terbuka ? t("chat_close") : t("chat_with", { name: lawanNama })}
      </Button>

      {terbuka && (
        <div className="pt-3">
          <ChatWindow
            penawaranId={penawaran.id}
            currentUserId={uid}
            currentUserName={store.sesi?.nama ?? t("chat_you")}
            recipientId={lawanId}
            recipientName={lawanNama}
            title={t("chat_title")}
            waHref={wa}
          />
        </div>
      )}
    </div>
  );
}
