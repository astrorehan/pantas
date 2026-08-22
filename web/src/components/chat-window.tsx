"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send, CheckCheck, Loader2, WifiOff } from "lucide-react";
import { Button, ButtonLink, Card, Input } from "@/components/ui";
import {
  getPesanList,
  kirimPesan,
  subscribePesan,
  tandaiPesanDibaca,
} from "@/lib/data";
import { useStore } from "@/lib/store";
import { toast } from "@/components/ui/toast";
import { useTranslations } from "@/lib/i18n";
import type { Pesan } from "@/lib/types";

interface ChatWindowProps {
  orderId?: string;
  penawaranId?: string;
  currentUserId: string;
  currentUserName: string;
  recipientId: string;
  recipientName: string;
  title?: string;
  /**
   * Tautan wa.me cadangan (F-33). Chat dalam aplikasi menggantikan deep-link
   * WhatsApp, tetapi tidak menghapusnya: kalau Realtime tidak sampai atau lawan
   * bicara belum membuka aplikasi, kedua pihak tetap punya jalur yang dikenal.
   */
  waHref?: string;
}

export function ChatWindow({
  orderId,
  penawaranId,
  currentUserId,
  currentUserName,
  recipientId,
  recipientName,
  title,
  waHref,
}: ChatWindowProps) {
  const t = useTranslations("chat");
  const tc = useTranslations("common");
  const displayTitle = title ?? t("title");
  const store = useStore();
  const refreshBadge = store.refreshPesanBelumDibaca;
  const [pesanList, setPesanList] = useState<Pesan[]>([]);
  const [inputTeks, setInputTeks] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  /**
   * Riwayat yang gagal dimuat harus dibedakan dari percakapan yang memang masih
   * kosong: keduanya menampilkan daftar kosong, tetapi hanya satu yang berarti
   * "jangan percaya apa yang kamu lihat di sini".
   */
  const [gagalMuat, setGagalMuat] = useState(false);
  const [percobaan, setPercobaan] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Tanpa uuid kedua pihak, insert `pesan` tidak pernah lolos RLS
   * (`auth.uid() = pengirim_id`). Lebih baik menyatakannya daripada memberi
   * kotak ketik yang setiap kirimannya ditolak diam-diam.
   */
  const siap = Boolean(currentUserId && recipientId);

  /**
   * Riwayat yang gagal dimuat juga menutup kotak ketik. Kiriman baru tetap akan
   * tersimpan, tapi ia akan muncul sendirian di atas percakapan yang tidak
   * terbaca — mudah dikira lawan bicara belum pernah membalas apa pun.
   */
  const bolehKirim = siap && !gagalMuat;

  /** Tandai pesan masuk percakapan ini terbaca, lalu segarkan badge navigasi. */
  const tandaiTerbaca = useCallback(async () => {
    if (!currentUserId) return;
    const n = await tandaiPesanDibaca(
      { order_id: orderId, penawaran_id: penawaranId },
      currentUserId,
    );
    if (n > 0) await refreshBadge();
  }, [currentUserId, orderId, penawaranId, refreshBadge]);

  useEffect(() => {
    let ignore = false;
    getPesanList({ order_id: orderId, penawaran_id: penawaranId })
      .then((list) => {
        if (ignore) return;
        setPesanList(list);
        setLoading(false);
        void tandaiTerbaca();
      })
      .catch(() => {
        if (ignore) return;
        setLoading(false);
        setGagalMuat(true);
      });

    const unsubscribe = subscribePesan(
      { order_id: orderId, penawaran_id: penawaranId },
      (newMsg) => {
        setPesanList((prev) =>
          prev.some((p) => p.id === newMsg.id) ? prev : [...prev, newMsg],
        );
        // Percakapan sedang terbuka, jadi pesan yang baru masuk langsung
        // terbaca — badge di navigasi tidak boleh ikut naik karenanya.
        if (newMsg.penerima_id === currentUserId) void tandaiTerbaca();
      },
    );

    return () => {
      ignore = true;
      unsubscribe();
    };
  }, [orderId, penawaranId, currentUserId, tandaiTerbaca, percobaan]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [pesanList]);

  const handleKirim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTeks.trim() || sending || !bolehKirim) return;

    const text = inputTeks.trim();
    setInputTeks("");
    setSending(true);

    try {
      const result = await kirimPesan({
        order_id: orderId,
        penawaran_id: penawaranId,
        pengirim_id: currentUserId,
        penerima_id: recipientId,
        isi: text,
      });

      if (result) {
        // Fallback update local state bila offline/demo
        setPesanList((prev) => {
          if (prev.some((p) => p.id === result.id)) return prev;
          return [...prev, { ...result, pengirim_nama: currentUserName }];
        });
      } else {
        // Kembalikan teksnya ke kotak ketik: kalimat yang hilang tanpa jejak
        // lebih buruk daripada kirim ulang manual.
        setInputTeks(text);
        toast.galat(t("send_failed"));
      }
    } catch {
      setInputTeks(text);
      toast.galat(t("send_failed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card variant="glass" className="flex flex-col h-[450px] overflow-hidden border-brand/20">
      {/* Header Chat */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface/50 backdrop-blur-md border-b border-line/60">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand font-bold">
            <MessageSquare className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="type-label font-bold text-ink">{displayTitle}</h3>
            <p className="type-body-sm truncate text-muted">
              {t("recipient")}: {recipientName}
            </p>
          </div>
        </div>
        {waHref && (
          <ButtonLink
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            size="sm"
            className="shrink-0"
          >
            {t("wa_fallback")}
          </ButtonLink>
        )}
      </div>

      {/* Bubble Chat Area */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label={`Riwayat pesan dengan ${recipientName}`}
        className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-surface"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted gap-2">
            <Loader2 className="size-5 animate-spin text-brand" />
            <span className="type-body-sm">{t("loading_history")}</span>
          </div>
        ) : gagalMuat ? (
          <div
            role="alert"
            className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted"
          >
            <WifiOff aria-hidden className="size-8 text-line" />
            <p className="type-body-sm font-medium text-ink">{t("load_failed_title")}</p>
            <p className="type-body-sm max-w-xs">{t("load_failed_desc")}</p>
            <Button
              variant="outline"
              size="sm"
              /* Reset di penangan klik, bukan di badan effect: `useEffect` yang
                 memanggil setState secara sinkron ditolak React Compiler. */
              onClick={() => {
                setGagalMuat(false);
                setLoading(true);
                setPercobaan((n) => n + 1);
              }}
            >
              {t("retry")}
            </Button>
          </div>
        ) : pesanList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted gap-1">
            <MessageSquare className="size-8 text-line" />
            <p className="type-body-sm font-medium">{t("empty_title")}</p>
            <p className="type-body-sm text-muted">{t("empty_desc")}</p>
          </div>
        ) : (
          pesanList.map((p) => {
            const isMe = p.pengirim_id === currentUserId;
            const timeStr = new Date(p.created_at).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={p.id}
                className={`flex flex-col max-w-[80%] ${
                  isMe ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <span className="type-body-sm text-muted px-1 mb-0.5">
                  {isMe ? tc("you") : p.pengirim_nama || recipientName}
                </span>
                <div
                  className={`rounded-2xl px-4 py-2.5 shadow-xs ${
                    isMe
                      ? "bg-brand text-white rounded-br-none"
                      : "bg-sunken text-ink border border-line rounded-bl-none"
                  }`}
                >
                  <p className="type-body-sm whitespace-pre-wrap leading-relaxed">{p.isi}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? "text-white/80" : "text-muted"
                    }`}
                  >
                    <span>{timeStr}</span>
                    {isMe && (
                      <CheckCheck
                        aria-label={p.dibaca ? t("read") : t("sent")}
                        className={p.dibaca ? "size-3 text-white" : "size-3 text-white/50"}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleKirim} className="flex items-center gap-2 p-3 bg-surface border-t border-line">
        <Input
          value={inputTeks}
          onChange={(e) => setInputTeks(e.target.value)}
          aria-label={`Tulis pesan untuk ${recipientName}`}
          placeholder={
            gagalMuat
              ? t("placeholder_offline")
              : siap
                ? t("placeholder_ready", { name: recipientName })
                : t("placeholder_not_ready")
          }
          className="flex-1"
          disabled={sending || !bolehKirim}
        />
        <Button type="submit" variant="primary" disabled={sending || !bolehKirim || !inputTeks.trim()}>
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </Card>
  );
}
